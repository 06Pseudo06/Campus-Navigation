"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Map, {
  Marker,
  Source,
  Layer,
  Popup,
  type MapRef,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { CampusLocation, CampusRoute, MapLayerMode } from "@/types/campus";
import {
  ZoomInIcon,
  ZoomOutIcon,
  CompassIcon,
  CompassNeedleIcon,
  MaximizeIcon,
  LayersIcon,
  WalkingIcon,
} from "./DashboardIcons";
import {
  projectGpsToSvg,
  VERIFIED_DATASET_C_NODES,
  VERIFIED_DATASET_C_SEGMENTS,
} from "@/data/campusData";
import {
  DATASET_C_INITIAL_CENTER,
  DEFAULT_ZOOM,
  LPU_CAMPUS_BOUNDS,
  LPU_MIN_ZOOM,
  LPU_MAX_ZOOM,
  getStoredViewport,
  saveStoredViewport,
  clearStoredViewport,
  getResponsiveMapPadding,
  calculateRouteBounds,
  getRouteFitBoundsZoomCap,
  MapViewportState,
} from "@/lib/mapViewport";
import {
  formatDistance,
  formatSteps,
  getAccessibilityBadge,
} from "@/lib/routeFormatting";
import { Icon } from "@/components/ui/Icon";
import { getCategoryConfig, CATEGORY_COLOR_MAP } from "@/lib/categories";
import { LocateButton } from "./LocateButton";
import { MockLocationDrawer } from "./MockLocationPanel";
import { FEATURE_GPS, IS_DEV } from "@/lib/featureFlags";
import type { GeoCoordinates, GeolocationStatus, GeolocationPermission } from "@/hooks/useGeolocation";
import { useTheme } from "@/context/ThemeContext";

// Mapbox style presets
const MAP_STYLES: Record<MapLayerMode, string> = {
  dark: "mapbox://styles/mapbox/dark-v11",
  streets: "mapbox://styles/mapbox/streets-v12",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  blueprint: "mapbox://styles/mapbox/navigation-night-v1",
  standard: "mapbox://styles/mapbox/navigation-night-v1",
};

// Category colors for pins
const CATEGORY_COLORS: Record<string, string> = {
  gate: "#10b981",
  building: "#DE4B31",
  service: "#EC4899",
  landmark: "#F59E0B",
  hostel: "#3B82F6",
  room: "#8B5CF6",
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
const IS_MAPBOX_TOKEN_VALID =
  Boolean(MAPBOX_TOKEN) &&
  MAPBOX_TOKEN !== "YOUR_MAPBOX_TOKEN_HERE" &&
  MAPBOX_TOKEN.length > 20 &&
  MAPBOX_TOKEN.startsWith("pk.");

interface CampusMapProps {
  locations: CampusLocation[];
  originLocation?: CampusLocation | null;
  selectedLocation: CampusLocation | null;
  onSelectLocation: (location: CampusLocation) => void;
  onSetOrigin?: (location: CampusLocation) => void;
  onSetDestination?: (location: CampusLocation) => void;
  activeRoute: CampusRoute | null;
  showRoute: boolean;
  userCoordinates?: GeoCoordinates | null;
  geolocationStatus?: GeolocationStatus;
  geolocationPermission?: GeolocationPermission;
  onLocateUser?: () => void;
  isInsideCampus?: boolean;
  geolocationError?: string | null;
  isMocked?: boolean;
  onSetMockCoordinates?: (coords: Partial<GeoCoordinates> | null) => void;
}

export function CampusMap({
  locations,
  originLocation,
  selectedLocation,
  onSelectLocation,
  onSetOrigin,
  onSetDestination,
  activeRoute,
  showRoute,
  userCoordinates,
  geolocationStatus = "idle",
  geolocationPermission = "prompt",
  onLocateUser,
  isInsideCampus = true,
  geolocationError = null,
  isMocked = false,
  onSetMockCoordinates,
}: CampusMapProps) {
  // Map engine state: "mapbox" or "vector" (fallback)
  const [engine, setEngine] = useState<"mapbox" | "vector">(
    IS_MAPBOX_TOKEN_VALID ? "mapbox" : "vector"
  );
  const [mapboxFailed, setMapboxFailed] = useState<boolean>(false);

  // Mapbox map reference
  const mapRef = useRef<MapRef | null>(null);
  const { resolvedTheme } = useTheme();
  const [styleLoadKey, setStyleLoadKey] = useState<number>(0);

  const [userExplicitLayer, setUserExplicitLayer] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem("campusway-map-style-explicit"));
  });

  const [layer, setLayer] = useState<MapLayerMode>(() => {
    if (typeof window !== "undefined") {
      const explicitFlag = localStorage.getItem("campusway-map-style-explicit");
      const storedStyle = localStorage.getItem("campusway-map-style");
      if (explicitFlag && storedStyle && storedStyle in MAP_STYLES) {
        return storedStyle as MapLayerMode;
      }
    }
    return resolvedTheme === "light" ? "streets" : "dark";
  });

  // Switch default style when theme changes, unless user explicitly selected a layer
  useEffect(() => {
    if (!userExplicitLayer) {
      setLayer(resolvedTheme === "light" ? "streets" : "dark");
    }
  }, [resolvedTheme, userExplicitLayer]);

  const [layerMenuOpen, setLayerMenuOpen] = useState<boolean>(false);

  const handleSelectStyle = useCallback((newLayer: MapLayerMode) => {
    setLayer(newLayer);
    setUserExplicitLayer(true);
    try {
      localStorage.setItem("campusway-map-style", newLayer);
      localStorage.setItem("campusway-map-style-explicit", "true");
    } catch {}
    setLayerMenuOpen(false);
  }, []);

  const handleResetStyle = useCallback(() => {
    setUserExplicitLayer(false);
    try {
      localStorage.removeItem("campusway-map-style");
      localStorage.removeItem("campusway-map-style-explicit");
    } catch {}
    setLayer(resolvedTheme === "light" ? "streets" : "dark");
    setLayerMenuOpen(false);
  }, [resolvedTheme]);

  const handleMapLoad = useCallback((evt: { target: { on?: (event: string, callback: () => void) => void } }) => {
    const map = evt?.target;
    if (map && typeof map.on === "function") {
      map.on("style.load", () => {
        setStyleLoadKey((prev) => prev + 1);
      });
    }
  }, []);

  const [popupLocation, setPopupLocation] = useState<CampusLocation | null>(null);

  // Vector fallback zoom state
  const [vectorZoom, setVectorZoom] = useState<number>(1);
  const [hoveredLocation, setHoveredLocation] = useState<CampusLocation | null>(null);

  // Initial viewport state persisted across sessions via sessionStorage
  const [initialViewport] = useState<MapViewportState>(() => getStoredViewport());

  // Camera state tracking for Compass & Scale Bar
  const [currentBearing, setCurrentBearing] = useState<number>(() => initialViewport.bearing || 0);
  const [currentZoom, setCurrentZoom] = useState<number>(() => initialViewport.zoom || DEFAULT_ZOOM);
  const [currentLatitude, setCurrentLatitude] = useState<number>(
    () => initialViewport.latitude || DATASET_C_INITIAL_CENTER.latitude
  );
  const [mockPanelOpen, setMockPanelOpen] = useState<boolean>(false);

  const isMockDisabled = process.env.NEXT_PUBLIC_ENABLE_MOCK_LOCATION === "false";
  const isMockAllowed =
    !isMockDisabled &&
    Boolean(onSetMockCoordinates) &&
    (IS_DEV || process.env.NEXT_PUBLIC_ENABLE_MOCK_LOCATION === "true");

  // Metric scale calculation (meters per pixel at current latitude & zoom)
  const metersPerPixel = useMemo(() => {
    return (
      (156543.03392 * Math.cos((currentLatitude * Math.PI) / 180)) /
      Math.pow(2, currentZoom)
    );
  }, [currentLatitude, currentZoom]);

  const scaleBar = useMemo(() => {
    const targetPx = 80;
    const rawMeters = targetPx * metersPerPixel;
    const standardScales = [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
    let distance = standardScales[0];
    for (const s of standardScales) {
      if (s <= rawMeters) {
        distance = s;
      } else {
        break;
      }
    }
    const barWidthPx = Math.max(28, Math.min(140, Math.round(distance / metersPerPixel)));
    const label = distance >= 1000 ? `${distance / 1000} km` : `${distance} m`;
    return { barWidthPx, label };
  }, [metersPerPixel]);

  const handleZoomIn = useCallback(() => {
    if (engine === "mapbox" && mapRef.current) {
      mapRef.current.zoomIn({ duration: 300 });
    } else {
      setVectorZoom((prev) => Math.min(prev + 0.25, 2.5));
    }
  }, [engine]);

  const handleZoomOut = useCallback(() => {
    if (engine === "mapbox" && mapRef.current) {
      mapRef.current.zoomOut({ duration: 300 });
    } else {
      setVectorZoom((prev) => Math.max(prev - 0.25, 0.75));
    }
  }, [engine]);

  const handleResetBearing = useCallback(() => {
    if (engine === "mapbox" && mapRef.current) {
      try {
        mapRef.current.rotateTo(0, { duration: 500 });
        mapRef.current.setPitch(40);
      } catch {}
    }
    setCurrentBearing(0);
  }, [engine]);

  // Reset view to default LPU campus bounds
  const handleResetView = useCallback(() => {
    clearStoredViewport();
    if (engine === "mapbox" && mapRef.current) {
      const isMobile = typeof window !== "undefined" ? window.innerWidth < 1024 : false;
      const padding = getResponsiveMapPadding(isMobile, false);
      try {
        mapRef.current.fitBounds(LPU_CAMPUS_BOUNDS, {
          padding,
          pitch: 40,
          bearing: 0,
          duration: 1000,
        });
      } catch {
        mapRef.current.flyTo({
          center: [DATASET_C_INITIAL_CENTER.longitude, DATASET_C_INITIAL_CENTER.latitude],
          zoom: DEFAULT_ZOOM,
          pitch: 40,
          bearing: 0,
          duration: 1000,
        });
      }
    } else if (engine === "vector") {
      setVectorZoom(1);
    }
    setCurrentBearing(0);
  }, [engine]);

  // Persist camera viewport on move end to sessionStorage
  const handleMoveEnd = useCallback((evt: { viewState: MapViewportState }) => {
    saveStoredViewport(evt.viewState);
    if (typeof evt.viewState.bearing === "number") {
      setCurrentBearing(evt.viewState.bearing);
    }
    if (typeof evt.viewState.zoom === "number") {
      setCurrentZoom(evt.viewState.zoom);
    }
    if (typeof evt.viewState.latitude === "number") {
      setCurrentLatitude(evt.viewState.latitude);
    }
  }, []);

  // Auto-switch to vector map if Mapbox experiences a runtime initialization error
  const handleMapboxError = useCallback((err: unknown) => {
    console.warn("[CampusMap] Mapbox initialization failed, switching to vector canvas fallback:", err);
    setMapboxFailed(true);
    setEngine("vector");
  }, []);

  // Fly to selected destination in Mapbox mode when no route is active
  useEffect(() => {
    if (
      engine === "mapbox" &&
      selectedLocation &&
      !activeRoute &&
      Number.isFinite(selectedLocation.coordinates.lat) &&
      Number.isFinite(selectedLocation.coordinates.lng) &&
      mapRef.current
    ) {
      mapRef.current.flyTo({
        center: [selectedLocation.coordinates.lng, selectedLocation.coordinates.lat],
        zoom: 17,
        pitch: 45,
        duration: 1200,
      });
    }
  }, [selectedLocation, activeRoute, engine]);

  // Fly to user coordinates on location update or button tap
  const lastFlyCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (
      engine === "mapbox" &&
      userCoordinates &&
      Number.isFinite(userCoordinates.latitude) &&
      Number.isFinite(userCoordinates.longitude) &&
      mapRef.current &&
      (!lastFlyCoordsRef.current ||
        Math.abs(lastFlyCoordsRef.current.lat - userCoordinates.latitude) > 0.0001 ||
        Math.abs(lastFlyCoordsRef.current.lng - userCoordinates.longitude) > 0.0001)
    ) {
      lastFlyCoordsRef.current = { lat: userCoordinates.latitude, lng: userCoordinates.longitude };
      mapRef.current.flyTo({
        center: [userCoordinates.longitude, userCoordinates.latitude],
        zoom: 17.5,
        pitch: 45,
        duration: 1000,
      });
    }
  }, [userCoordinates, engine]);

  // Auto-fit route bounds with device-aware responsive padding
  useEffect(() => {
    if (
      !showRoute ||
      !activeRoute?.waypoints ||
      activeRoute.waypoints.length < 2 ||
      engine !== "mapbox" ||
      !mapRef.current
    ) {
      return;
    }

    const bounds = calculateRouteBounds(activeRoute.waypoints);
    if (!bounds) return;

    const isMobile =
      typeof window !== "undefined" ? window.innerWidth < 1024 : false;
    const padding = getResponsiveMapPadding(isMobile, true);
    const maxZoom = getRouteFitBoundsZoomCap(bounds);

    try {
      mapRef.current.fitBounds(bounds, {
        padding,
        maxZoom,
        duration: 1000,
      });
    } catch (err) {
      console.warn("[CampusMap] fitBounds error:", err);
    }
  }, [activeRoute?.id, activeRoute?.waypoints, showRoute, engine]);

  // GeoJSON MultiLineString for all 29 surveyed walkable pathway segments
  const surveyedSpineGeoJSON = useMemo(() => {
    const lines: Array<Array<[number, number]>> = [];
    for (const seg of VERIFIED_DATASET_C_SEGMENTS) {
      const src = VERIFIED_DATASET_C_NODES.find((n) => n.survey_id === seg.from);
      const tgt = VERIFIED_DATASET_C_NODES.find((n) => n.survey_id === seg.to);
      if (src && tgt) {
        lines.push([
          [src.longitude, src.latitude],
          [tgt.longitude, tgt.latitude],
        ]);
      }
    }
    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "MultiLineString" as const,
        coordinates: lines,
      },
    };
  }, []);

  // 12 Junction nodes in Mapbox (rendered as subtle navigational vertices)
  const junctionNodes = useMemo(() => {
    return VERIFIED_DATASET_C_NODES.filter((n) => n.node_type === "junction");
  }, []);

  // Smooth path drawing animation via requestAnimationFrame
  const [drawProgress, setDrawProgress] = useState(1);

  useEffect(() => {
    let animId: number;
    if (!activeRoute?.waypoints?.length || !showRoute) {
      queueMicrotask(() => setDrawProgress(1));
      return;
    }

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      queueMicrotask(() => setDrawProgress(1));
      return;
    }

    queueMicrotask(() => setDrawProgress(0));
    const startTime = performance.now();
    const durationMs = 600;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDrawProgress(eased);

      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      }
    };

    animId = requestAnimationFrame(animate);

    return () => {
      if (animId) {
        cancelAnimationFrame(animId);
      }
    };
  }, [activeRoute?.id, activeRoute?.waypoints?.length, showRoute]);

  // GeoJSON LineString for active route in Mapbox (interpolated by drawProgress)
  const routeGeoJSON = useMemo(() => {
    if (!showRoute || !activeRoute?.waypoints?.length) return null;
    const coords = activeRoute.waypoints
      .filter((wp) => Number.isFinite(wp.lng) && Number.isFinite(wp.lat))
      .map((wp) => [wp.lng!, wp.lat!]);
    if (coords.length < 2) return null;

    if (drawProgress < 1) {
      const count = Math.max(2, Math.ceil(coords.length * drawProgress));
      return {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "LineString" as const,
          coordinates: coords.slice(0, count),
        },
      };
    }

    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: coords,
      },
    };
  }, [showRoute, activeRoute, drawProgress]);

  // GeoJSON FeatureCollection for junction vertices (GPU-accelerated rendering)
  const junctionGeoJSON = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: junctionNodes.map((j) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [j.longitude, j.latitude],
        },
        properties: {
          id: j.id,
          title: `${j.survey_id}: Junction Vertex`,
        },
      })),
    };
  }, [junctionNodes]);

  // GeoJSON FeatureCollection for unselected background destination pins
  const backgroundLocationsGeoJSON = useMemo(() => {
    const bgLocs = locations.filter(
      (loc) =>
        loc.id !== originLocation?.id &&
        loc.id !== selectedLocation?.id &&
        Number.isFinite(loc.coordinates.lat) &&
        Number.isFinite(loc.coordinates.lng)
    );
    return {
      type: "FeatureCollection" as const,
      features: bgLocs.map((loc) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [loc.coordinates.lng, loc.coordinates.lat],
        },
        properties: {
          id: loc.id,
          name: loc.name,
          code: loc.code || loc.name,
          category: loc.category,
          color: CATEGORY_COLORS[loc.category] || "#6366F1",
        },
      })),
    };
  }, [locations, originLocation?.id, selectedLocation?.id]);

  // Throttled camera move tracking using requestAnimationFrame
  const cameraRef = useRef({
    longitude: DATASET_C_INITIAL_CENTER.longitude,
    latitude: DATASET_C_INITIAL_CENTER.latitude,
    zoom: DEFAULT_ZOOM,
  });
  const onMoveFrameRef = useRef<number | null>(null);

  const handleMapMove = useCallback(
    (evt: { viewState: { longitude: number; latitude: number; zoom: number; bearing?: number } }) => {
      if (onMoveFrameRef.current) return;
      onMoveFrameRef.current = requestAnimationFrame(() => {
        cameraRef.current = evt.viewState;
        if (typeof evt.viewState.bearing === "number") {
          setCurrentBearing(evt.viewState.bearing);
        }
        if (typeof evt.viewState.zoom === "number") {
          setCurrentZoom(evt.viewState.zoom);
        }
        if (typeof evt.viewState.latitude === "number") {
          setCurrentLatitude(evt.viewState.latitude);
        }
        onMoveFrameRef.current = null;
      });
    },
    []
  );

  // Vector fallback route SVG path
  const vectorRoutePathD = useMemo(() => {
    if (!showRoute || !activeRoute?.waypoints?.length) return "";
    const points = activeRoute.waypoints;
    const count =
      drawProgress < 1
        ? Math.max(2, Math.ceil(points.length * drawProgress))
        : points.length;

    return points.slice(0, count).reduce((acc, pt, i) => {
      const coords =
        pt.x !== undefined && pt.y !== undefined
          ? { x: pt.x, y: pt.y }
          : pt.lat !== undefined && pt.lng !== undefined
          ? projectGpsToSvg(pt.lat, pt.lng)
          : { x: 500, y: 350 };
      return i === 0 ? `M ${coords.x} ${coords.y}` : `${acc} L ${coords.x} ${coords.y}`;
    }, "");
  }, [showRoute, activeRoute, drawProgress]);

  const handleMarkerClick = useCallback(
    (loc: CampusLocation) => {
      onSelectLocation(loc);
      setPopupLocation(loc);
    },
    [onSelectLocation]
  );

  return (
    <div
      className="relative w-full h-full bg-[#0a0f1d] overflow-hidden select-none flex flex-col justify-between"
      data-testid="campus-map"
    >
      {/* ──── Unified Vertical Map Toolbar (Stage 6.3) ──── */}
      <div
        data-testid="unified-map-toolbar"
        className="absolute top-4 right-4 z-30 flex flex-col items-center bg-white/95 dark:bg-[#111827]/95 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl p-1 gap-1 text-slate-700 dark:text-zinc-200"
      >
        {/* Zoom In (+) */}
        <button
          type="button"
          onClick={handleZoomIn}
          data-testid="map-zoom-in"
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 dark:active:bg-zinc-700 transition-colors cursor-pointer"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomInIcon className="w-4 h-4" />
        </button>

        {/* Zoom Out (-) */}
        <button
          type="button"
          onClick={handleZoomOut}
          data-testid="map-zoom-out"
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 dark:active:bg-zinc-700 transition-colors cursor-pointer"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOutIcon className="w-4 h-4" />
        </button>

        <div className="w-6 h-px bg-slate-200 dark:bg-zinc-800 my-0.5" />

        {/* Compass / Reset Bearing */}
        <button
          type="button"
          onClick={handleResetBearing}
          data-testid="map-compass"
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 dark:active:bg-zinc-700 transition-colors cursor-pointer group"
          title="Reset Bearing (Face North)"
          aria-label="Reset Bearing (Face North)"
        >
          <CompassNeedleIcon
            className="w-5 h-5 transition-transform duration-300"
            style={{ transform: `rotate(${-currentBearing}deg)` }}
          />
        </button>

        {/* Layer Switcher (Dark, Streets, Satellite, Blueprint) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLayerMenuOpen(!layerMenuOpen)}
            data-testid="layer-switcher-button"
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              layerMenuOpen || userExplicitLayer
                ? "bg-[#E8452C] text-white"
                : "hover:bg-slate-100 dark:hover:bg-zinc-800"
            }`}
            title="Map Style"
            aria-label="Map Layer"
          >
            <LayersIcon className="w-4 h-4" />
          </button>

          {layerMenuOpen && (
            <div
              data-testid="map-style-menu"
              className="absolute top-0 right-12 w-48 rounded-2xl bg-white/95 dark:bg-[#111827]/95 border border-slate-200 dark:border-zinc-700 shadow-2xl backdrop-blur-xl p-2 z-40 flex flex-col gap-1 animate-in fade-in zoom-in-95"
            >
              <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 dark:border-zinc-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono">
                  Map Style
                </span>
                {userExplicitLayer && (
                  <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                    CUSTOM
                  </span>
                )}
              </div>
              {(
                [
                  { id: "dark" as const, label: "Dark Architectural" },
                  { id: "streets" as const, label: "Clean Streets" },
                  { id: "satellite" as const, label: "Satellite Hybrid" },
                  { id: "blueprint" as const, label: "Blueprint Navigation" },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  data-testid={`layer-option-${mode.id}`}
                  onClick={() => handleSelectStyle(mode.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    layer === mode.id
                      ? "bg-[#E8452C] text-white font-semibold"
                      : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span>{mode.label}</span>
                  {layer === mode.id && <Icon name="check" size={12} className="text-white" />}
                </button>
              ))}

              {userExplicitLayer && (
                <div className="pt-1 mt-1 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    type="button"
                    data-testid="layer-option-reset"
                    onClick={handleResetStyle}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>↺ Reset to Theme Default</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* GPS Locate Me Button */}
        {FEATURE_GPS && onLocateUser && (
          <LocateButton
            status={geolocationStatus}
            permissionState={geolocationPermission}
            onLocate={onLocateUser}
            hasLocation={Boolean(userCoordinates)}
            isInsideCampus={isInsideCampus}
            errorMessage={geolocationError}
            compact={true}
          />
        )}

        {/* Dev GPS Mock Button (Dev Only) */}
        {isMockAllowed && onSetMockCoordinates && (
          <div className="relative">
            <button
              type="button"
              data-testid="mock-location-toggle"
              onClick={() => setMockPanelOpen(!mockPanelOpen)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-mono transition-colors cursor-pointer ${
                isMocked
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/50"
                  : mockPanelOpen
                  ? "bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-white"
                  : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400"
              }`}
              title={isMocked ? "Mock GPS: Active" : "Dev GPS Mock"}
              aria-label="Dev GPS Mock"
            >
              <Icon name="test" size={16} />
            </button>

            {/* Dev GPS Mock Flyout Drawer */}
            {mockPanelOpen && (
              <div className="absolute top-0 right-12 z-40">
                <MockLocationDrawer
                  isMocked={isMocked}
                  currentCoords={userCoordinates || null}
                  onSetMockCoordinates={onSetMockCoordinates}
                  onClose={() => setMockPanelOpen(false)}
                />
              </div>
            )}
          </div>
        )}

        <div className="w-6 h-px bg-slate-200 dark:bg-zinc-800 my-0.5" />

        {/* Reset View Button (Fit Campus Bounds) */}
        <button
          type="button"
          onClick={handleResetView}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 dark:active:bg-zinc-700 text-[#E8452C] transition-colors cursor-pointer group"
          title="Reset Campus View (Fit Bounds)"
          aria-label="Reset campus view"
          data-testid="reset-view-button"
        >
          <MaximizeIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>

        {/* Engine Switcher Toggle (Mapbox 3D vs Vector Canvas) */}
        {IS_MAPBOX_TOKEN_VALID && !mapboxFailed && (
          <button
            type="button"
            onClick={() => setEngine(engine === "mapbox" ? "vector" : "mapbox")}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs transition-colors cursor-pointer"
            title={`Switch to ${engine === "mapbox" ? "Vector Canvas" : "Mapbox 3D"}`}
            aria-label="Switch Map Engine"
          >
            <Icon name={engine === "mapbox" ? "map" : "ruler"} size={16} className="text-slate-600 dark:text-zinc-300" />
          </button>
        )}
      </div>

      {showRoute && activeRoute?.waypoints && activeRoute.waypoints.length >= 2 && (
        <span data-testid="route-polyline" className="sr-only">
          Route polyline rendered
        </span>
      )}

      {/* ──── Active Route Top-Left HUD Card ──── */}
      {showRoute && activeRoute && (
        <div
          data-testid="route-summary-hud"
          className="absolute top-4 left-4 z-20 max-w-xs sm:max-w-sm rounded-2xl bg-[#111827]/90 border border-zinc-800 shadow-2xl backdrop-blur-xl p-3.5 animate-in fade-in slide-in-from-top-4 space-y-2.5"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#DE4B31]/20 border border-[#DE4B31]/50 flex items-center justify-center shrink-0">
                <WalkingIcon className="w-4 h-4 text-[#DE4B31]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {activeRoute.toName}
                </p>
                <p className="text-[10px] text-zinc-400 truncate">
                  From {activeRoute.fromName}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-extrabold text-[#DE4B31]">
                ~{activeRoute.estimatedWalkingMinutes} min
              </span>
              <p className="text-[10px] text-zinc-400 font-mono">
                {formatDistance(activeRoute.distanceMeters)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-zinc-800/80">
            <span className="text-zinc-400 font-mono text-[10px]">
              {formatSteps(activeRoute.distanceMeters)}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                activeRoute.isAccessible
                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
                  : "bg-amber-950/60 text-amber-300 border-amber-800/60"
              }`}
            >
              {getAccessibilityBadge(activeRoute.isAccessible).badgeText}
            </span>
          </div>
        </div>
      )}

      {/* ──── PRIMARY RENDERER: Mapbox GL ──── */}
      {engine === "mapbox" && IS_MAPBOX_TOKEN_VALID && !mapboxFailed ? (
        <div className="relative w-full h-full flex-1 min-h-0">
          <Map
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={initialViewport}
            minZoom={LPU_MIN_ZOOM}
            maxZoom={LPU_MAX_ZOOM}
            maxBounds={LPU_CAMPUS_BOUNDS}
            cooperativeGestures={true}
            touchPitch={true}
            touchZoomRotate={true}
            mapStyle={MAP_STYLES[layer] || MAP_STYLES.dark}
            style={{ width: "100%", height: "100%" }}
            attributionControl={false}
            onLoad={handleMapLoad}
            onError={handleMapboxError}
            onMove={handleMapMove}
            onMoveEnd={handleMoveEnd}
            interactiveLayerIds={["background-locations-circles"]}
            onClick={(e) => {
              const feat = e.features?.[0] as { properties?: { id?: string } } | undefined;
              if (feat?.properties?.id) {
                const loc = locations.find((l) => l.id === feat.properties?.id);
                if (loc) {
                  handleMarkerClick(loc);
                }
              }
            }}
          >
            {/* 1. Complete Surveyed Walking Path Segments (29 edges) */}
            {surveyedSpineGeoJSON && (
              <Source
                key={`surveyed-walkways-${layer}-${styleLoadKey}`}
                id="surveyed-walkways"
                type="geojson"
                data={surveyedSpineGeoJSON}
              >
                <Layer
                  id="walkway-casing"
                  type="line"
                  paint={{
                    "line-color": "#1e293b",
                    "line-width": 6,
                    "line-opacity": 0.7,
                  }}
                />
                <Layer
                  id="walkway-line"
                  type="line"
                  paint={{
                    "line-color": "#64748b",
                    "line-width": 2.5,
                    "line-opacity": 0.85,
                    "line-dasharray": [3, 2],
                  }}
                />
              </Source>
            )}

            {/* 2. Active Shortest Route Overlay */}
            {routeGeoJSON && (
              <Source
                key={`active-route-${layer}-${styleLoadKey}`}
                id="active-route"
                type="geojson"
                data={routeGeoJSON}
              >
                <Layer
                  id="route-casing"
                  type="line"
                  layout={{
                    "line-join": "round",
                    "line-cap": "round",
                  }}
                  paint={{
                    "line-color": "#ffffff",
                    "line-width": 8,
                    "line-opacity": 0.95,
                  }}
                />
                <Layer
                  id="route-glow"
                  type="line"
                  layout={{
                    "line-join": "round",
                    "line-cap": "round",
                  }}
                  paint={{
                    "line-color": "#DE4B31",
                    "line-width": 6,
                    "line-blur": 3,
                    "line-opacity": 0.6,
                  }}
                />
                <Layer
                  id="route-line"
                  type="line"
                  layout={{
                    "line-join": "round",
                    "line-cap": "round",
                  }}
                  paint={{
                    "line-color": "#E8452C",
                    "line-width": 4,
                    "line-opacity": 1,
                  }}
                />
              </Source>
            )}

            {/* 3. 12 Junction Nodes (GPU-accelerated GeoJSON circle layer) */}
            {junctionGeoJSON && (
              <Source
                key={`junction-nodes-${layer}-${styleLoadKey}`}
                id="junction-nodes"
                type="geojson"
                data={junctionGeoJSON}
              >
                <Layer
                  id="junction-circles"
                  type="circle"
                  paint={{
                    "circle-radius": 3.5,
                    "circle-color": "#52525b",
                    "circle-stroke-width": 1.5,
                    "circle-stroke-color": "#a1a1aa",
                    "circle-opacity": 0.75,
                  }}
                />
              </Source>
            )}

            {/* 4. Background Destination Locations (GPU-accelerated GeoJSON circle layer) */}
            {backgroundLocationsGeoJSON && (
              <Source
                key={`background-locations-${layer}-${styleLoadKey}`}
                id="background-locations"
                type="geojson"
                data={backgroundLocationsGeoJSON}
              >
                <Layer
                  id="background-locations-circles"
                  type="circle"
                  paint={{
                    "circle-radius": 6.5,
                    "circle-color": ["get", "color"],
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#090d16",
                    "circle-opacity": 0.9,
                  }}
                />
              </Source>
            )}

            {/* 5. Active Origin & Selected Destination Pins (Max 2 DOM Markers for Peak FPS) */}
            {[originLocation, selectedLocation]
              .filter(
                (loc): loc is CampusLocation =>
                  Boolean(loc && Number.isFinite(loc.coordinates.lat) && Number.isFinite(loc.coordinates.lng))
              )
              .filter((loc, idx, arr) => arr.findIndex((x) => x.id === loc.id) === idx)
              .map((loc) => {
                const isOrigin = originLocation?.id === loc.id;
                const isDestination = selectedLocation?.id === loc.id;
                const catConfig = getCategoryConfig(loc.category);
                const pinColor = isOrigin
                  ? "#10b981"
                  : isDestination
                  ? "#DE4B31"
                  : catConfig.color;

                return (
                  <Marker
                    key={loc.id}
                    latitude={loc.coordinates.lat}
                    longitude={loc.coordinates.lng}
                    anchor="bottom"
                    onClick={(e) => {
                      e.originalEvent.stopPropagation();
                      handleMarkerClick(loc);
                    }}
                  >
                    <div className="relative group cursor-pointer flex flex-col items-center">
                      {/* Pulsing ring on destination */}
                      {isDestination && (
                        <span className="absolute -inset-1 rounded-full bg-[#DE4B31] animate-ping opacity-40 pointer-events-none" />
                      )}

                      {/* Marker Pin Icon */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-200 group-hover:scale-125 border-2 ${
                          isOrigin || isDestination
                            ? "border-white scale-110"
                            : "border-zinc-900 group-hover:border-white"
                        }`}
                        style={{ backgroundColor: pinColor }}
                      >
                        {isOrigin ? (
                          <Icon name="startPin" size={13} className="text-white" />
                        ) : isDestination ? (
                          <Icon name="destPin" size={13} className="text-white" />
                        ) : (
                          <Icon name={catConfig.iconName} size={13} className="text-white" />
                        )}
                      </div>

                      {/* Badge Label */}
                      <div
                        className={`absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md text-[10px] font-bold shadow-lg pointer-events-none transition-all ${
                          isOrigin
                            ? "bg-emerald-600 text-white"
                            : isDestination
                            ? "bg-[#DE4B31] text-white"
                            : "bg-[#111827]/95 text-zinc-200 border border-zinc-700 opacity-90 group-hover:opacity-100"
                        }`}
                      >
                        {isOrigin
                          ? `START · ${loc.code || loc.name.substring(0, 10)}`
                          : isDestination
                          ? `DEST · ${loc.code || loc.name.substring(0, 10)}`
                          : loc.code || loc.name.substring(0, 12)}
                      </div>
                    </div>
                  </Marker>
                );
              })}

            {/* 6. Current User GPS Location Puck (Stage 6.3) */}
            {userCoordinates &&
              Number.isFinite(userCoordinates.latitude) &&
              Number.isFinite(userCoordinates.longitude) && (() => {
                const rawAccuracyPx = (userCoordinates.accuracy / metersPerPixel) * 2;
                const accuracyDiameterPx = Math.max(24, Math.min(160, Math.round(rawAccuracyPx)));
                const isLowAccuracy = userCoordinates.accuracy > 50;
                const hasHeading = userCoordinates.heading !== null && userCoordinates.heading !== undefined;

                return (
                  <Marker
                    latitude={userCoordinates.latitude}
                    longitude={userCoordinates.longitude}
                    anchor="center"
                  >
                    <div
                      className="relative flex items-center justify-center pointer-events-none"
                      data-testid="user-location-marker"
                    >
                      {/* Pulsating Accuracy Circle matching radius */}
                      <div
                        className={`absolute rounded-full transition-all duration-300 pointer-events-none ${
                          isLowAccuracy
                            ? "border-2 border-dashed border-amber-400/70 bg-amber-400/10"
                            : "border border-blue-400/50 bg-blue-500/15 animate-pulse"
                        }`}
                        style={{
                          width: `${accuracyDiameterPx}px`,
                          height: `${accuracyDiameterPx}px`,
                        }}
                      />

                      {/* Outer Pulsing Ping */}
                      <span className="absolute w-8 h-8 rounded-full bg-blue-500 animate-ping opacity-25 pointer-events-none" />

                      {/* Heading Arrow Cone rotating smoothly with heading */}
                      {hasHeading && (
                        <div
                          className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
                          style={{
                            transform: `rotate(${userCoordinates.heading}deg)`,
                          }}
                        >
                          <div className="absolute -top-4 flex flex-col items-center">
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              className="drop-shadow-md"
                            >
                              <path
                                d="M12 2L19 19L12 15L5 19L12 2Z"
                                fill="#2563EB"
                                stroke="#ffffff"
                                strokeWidth="2"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* Blue Dot Core */}
                      <div className="relative w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center z-10">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>

                      {/* Low Accuracy Badge */}
                      {isLowAccuracy && (
                        <div className="absolute -bottom-6 whitespace-nowrap px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-700/80 text-[9px] font-mono shadow-md z-20">
                          Low accuracy (~{Math.round(userCoordinates.accuracy)}m)
                        </div>
                      )}
                    </div>
                  </Marker>
                );
              })()}

            {/* 5. Destination Popup Card */}
            {popupLocation &&
              Number.isFinite(popupLocation.coordinates.lat) &&
              Number.isFinite(popupLocation.coordinates.lng) && (
                <Popup
                  latitude={popupLocation.coordinates.lat}
                  longitude={popupLocation.coordinates.lng}
                  anchor="top"
                  onClose={() => setPopupLocation(null)}
                  closeOnClick={false}
                  className="campus-popup"
                  maxWidth="290px"
                >
                  <div className="p-2 space-y-2 text-zinc-900">
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900 leading-tight">
                        {popupLocation.name}
                      </h3>
                      <p className="text-xs text-zinc-600 mt-1 line-clamp-2">
                        {popupLocation.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white uppercase"
                        style={{
                          backgroundColor:
                            CATEGORY_COLORS[popupLocation.category] || "#6366F1",
                        }}
                      >
                        {popupLocation.category}
                      </span>
                      {popupLocation.floors && (
                        <span className="text-[10px] text-zinc-500">
                          {popupLocation.floors}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-zinc-200 flex items-center gap-2">
                      {onSetOrigin && (
                        <button
                          type="button"
                          onClick={() => {
                            onSetOrigin(popupLocation);
                            setPopupLocation(null);
                          }}
                          className="flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Icon name="startPin" size={13} className="shrink-0 text-white" />
                          <span>Start Here</span>
                        </button>
                      )}
                      {onSetDestination && (
                        <button
                          type="button"
                          onClick={() => {
                            onSetDestination(popupLocation);
                            setPopupLocation(null);
                          }}
                          className="flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold bg-[#DE4B31] hover:bg-[#b83821] text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Icon name="destPin" size={13} className="shrink-0 text-white" />
                          <span>Go Here</span>
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              )}
          </Map>
        </div>
      ) : (
        /* ──── FALLBACK RENDERER: High-Fidelity Vector Canvas Map ──── */
        <div className="relative w-full h-full flex-1 min-h-0 flex items-center justify-center overflow-hidden">
          {/* Mode Notice Pill */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-700 text-[11px] text-zinc-300 shadow-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>
              {mapboxFailed
                ? "Mapbox unavailable • Active Vector Canvas Map"
                : "Vector Canvas Map (Fallback Engine)"}
            </span>
          </div>

          <div
            className="w-full h-full transition-transform duration-300 ease-out origin-center flex items-center justify-center"
            style={{ transform: `scale(${vectorZoom})` }}
          >
            <svg
              viewBox="0 0 1000 700"
              className="w-full h-full max-h-[85vh] object-contain drop-shadow-2xl"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="vectorGroundGrad" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="#111b2b" />
                  <stop offset="100%" stopColor="#090d18" />
                </radialGradient>
                <filter id="routeGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 1. Base Ground */}
              <rect width="1000" height="700" fill="url(#vectorGroundGrad)" />

              {/* Grid guide */}
              <g stroke="#1e293b" strokeWidth="0.5" opacity="0.3">
                {Array.from({ length: 20 }).map((_, i) => (
                  <line key={`x-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="700" />
                ))}
                {Array.from({ length: 14 }).map((_, i) => (
                  <line key={`y-${i}`} x1="0" y1={i * 50} x2="1000" y2={i * 50} />
                ))}
              </g>

              {/* 2. All 29 Surveyed Footpath Segments */}
              <g stroke="#475569" strokeWidth="3" strokeDasharray="6,4" opacity="0.75">
                {VERIFIED_DATASET_C_SEGMENTS.map((seg) => {
                  const src = VERIFIED_DATASET_C_NODES.find((n) => n.survey_id === seg.from);
                  const tgt = VERIFIED_DATASET_C_NODES.find((n) => n.survey_id === seg.to);
                  if (!src || !tgt) return null;
                  const p1 = projectGpsToSvg(src.latitude, src.longitude);
                  const p2 = projectGpsToSvg(tgt.latitude, tgt.longitude);
                  return (
                    <line
                      key={seg.id}
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                    />
                  );
                })}
              </g>

              {/* 3. 12 Navigational Junctions */}
              {junctionNodes.map((j) => {
                const pos = projectGpsToSvg(j.latitude, j.longitude);
                return (
                  <circle
                    key={j.id}
                    cx={pos.x}
                    cy={pos.y}
                    r="4"
                    fill="#64748b"
                    stroke="#1e293b"
                    strokeWidth="1.5"
                    opacity="0.8"
                  />
                );
              })}

              {/* 4. Active Walking Route (Glowing Path) */}
              {showRoute && vectorRoutePathD && (
                <g filter="url(#routeGlowFilter)">
                  <path
                    d={vectorRoutePathD}
                    fill="none"
                    stroke="#111827"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* White casing beneath vermilion line */}
                  <path
                    d={vectorRoutePathD}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="6.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Vermilion route line */}
                  <path
                    d={vectorRoutePathD}
                    fill="none"
                    stroke="#E8452C"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={vectorRoutePathD}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeDasharray="6,6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              )}

              {/* 5. 15 Destination Markers */}
              {locations.map((loc) => {
                const pos =
                  loc.coordinates.x !== undefined && loc.coordinates.y !== undefined
                    ? { x: loc.coordinates.x, y: loc.coordinates.y }
                    : projectGpsToSvg(loc.coordinates.lat, loc.coordinates.lng);

                const isOrigin = originLocation?.id === loc.id;
                const isDest = selectedLocation?.id === loc.id;
                const isHovered = hoveredLocation?.id === loc.id;

                const pinColor = isOrigin
                  ? "#10b981"
                  : isDest
                  ? "#DE4B31"
                  : CATEGORY_COLORS[loc.category] || "#6366F1";

                return (
                  <g
                    key={loc.id}
                    className="cursor-pointer transition-transform duration-200"
                    onClick={() => {
                      onSelectLocation(loc);
                      if (onSetDestination) onSetDestination(loc);
                    }}
                    onMouseEnter={() => setHoveredLocation(loc)}
                    onMouseLeave={() => setHoveredLocation(null)}
                    transform={`translate(${pos.x}, ${pos.y})`}
                  >
                    {/* Active Ping */}
                    {isDest && (
                      <circle
                        r="18"
                        fill="#DE4B31"
                        className="animate-ping"
                        opacity="0.3"
                      />
                    )}

                    {/* Outer Badge Shadow */}
                    <circle r="14" fill="#000000" opacity="0.6" />

                    {/* Pin Circle */}
                    <circle
                      r="12"
                      fill={pinColor}
                      stroke={isDest || isOrigin ? "#ffffff" : "#1e293b"}
                      strokeWidth={isDest || isOrigin ? "2.5" : "1.5"}
                    />

                    {/* Inner Dot */}
                    <circle r="4" fill="#ffffff" />

                    {/* Code Label Pill */}
                    <g transform="translate(0, -22)">
                      <rect
                        x="-38"
                        y="-10"
                        width="76"
                        height="20"
                        rx="6"
                        fill={isDest ? "#DE4B31" : isOrigin ? "#10b981" : "#111827"}
                        stroke={isDest || isOrigin ? "#ffffff" : "#374151"}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        {loc.code || loc.name.substring(0, 8)}
                      </text>
                    </g>

                    {/* Hover Name Tooltip */}
                    {isHovered && (
                      <g transform="translate(0, 24)">
                        <rect
                          x="-60"
                          y="-8"
                          width="120"
                          height="20"
                          rx="6"
                          fill="#0f172a"
                          stroke="#38bdf8"
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="6"
                          textAnchor="middle"
                          fill="#f8fafc"
                          fontSize="10"
                          fontWeight="bold"
                        >
                          {loc.name.substring(0, 18)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* 6. User GPS Location Marker in Vector Map */}
              {userCoordinates &&
                Number.isFinite(userCoordinates.latitude) &&
                Number.isFinite(userCoordinates.longitude) && (() => {
                  const uPos = projectGpsToSvg(userCoordinates.latitude, userCoordinates.longitude);
                  const hasHeading = userCoordinates.heading !== null && userCoordinates.heading !== undefined;
                  return (
                    <g transform={`translate(${uPos.x}, ${uPos.y})`} data-testid="vector-user-location">
                      <circle r="18" fill="#3b82f6" opacity="0.25" className="animate-pulse" />
                      <circle r="8" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                      <circle r="3" fill="#ffffff" />
                      {hasHeading && (
                        <g transform={`rotate(${userCoordinates.heading})`}>
                          <polygon points="0,-16 5,-8 -5,-8" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />
                        </g>
                      )}
                    </g>
                  );
                })()}
            </svg>
          </div>
        </div>
      )}

      {/* ──── Sleek Metric Map Scale Bar (Stage 6.3) ──── */}
      <div
        data-testid="map-scale-bar"
        className="absolute bottom-12 left-4 z-20 pointer-events-none select-none flex flex-col items-start gap-0.5 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-md"
        aria-label={`Map scale: ${scaleBar.label}`}
      >
        <span className="font-mono text-[9px] font-bold text-slate-800 dark:text-zinc-200 leading-none">
          {scaleBar.label}
        </span>
        <div
          className="h-1 border-b-2 border-l-2 border-r-2 border-slate-800 dark:border-zinc-200 transition-all duration-200 mt-0.5"
          style={{ width: `${scaleBar.barWidthPx}px` }}
        />
      </div>

      {/* ──── Map Footer Bar ──── */}
      <div className="h-10 px-4 bg-[#0a0f1d]/90 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#DE4B31]" />
            <span>Academic</span>
          </div>
          <div className="flex items-center gap-1.5 hidden sm:flex">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6]" />
            <span>Hostels</span>
          </div>
          <div className="flex items-center gap-1.5 hidden sm:flex">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" />
            <span>Gates</span>
          </div>
          <div className="flex items-center gap-1.5 hidden sm:flex">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#EC4899]" />
            <span>Food & Services</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-zinc-500">
            LPU Campus (Dataset C &bull; 27 Nodes, 29 Edges)
          </span>
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">
            {engine === "mapbox" ? "Mapbox GL" : "Vector Canvas"}
          </span>
        </div>
      </div>
    </div>
  );
}
