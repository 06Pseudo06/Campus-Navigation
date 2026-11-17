"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Map, {
  Marker,
  NavigationControl,
  GeolocateControl,
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
  LayersIcon,
  WalkingIcon,
  AccessibilityIcon,
} from "./DashboardIcons";
import {
  projectGpsToSvg,
  VERIFIED_DATASET_C_NODES,
  VERIFIED_DATASET_C_SEGMENTS,
} from "@/data/campusData";

// Initial camera center: LPU Gate 1 (Dataset C surveyed anchor)
const DATASET_C_INITIAL_CENTER = { latitude: 31.260565, longitude: 75.706815 };
const DEFAULT_ZOOM = 16.5;

// Mapbox style presets
const MAP_STYLES: Record<MapLayerMode, string> = {
  dark: "mapbox://styles/mapbox/dark-v11",
  standard: "mapbox://styles/mapbox/navigation-night-v1",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  streets: "mapbox://styles/mapbox/streets-v12",
  blueprint: "mapbox://styles/mapbox/dark-v11",
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
}: CampusMapProps) {
  // Map engine state: "mapbox" or "vector" (fallback)
  const [engine, setEngine] = useState<"mapbox" | "vector">(
    IS_MAPBOX_TOKEN_VALID ? "mapbox" : "vector"
  );
  const [mapboxFailed, setMapboxFailed] = useState<boolean>(false);

  // Mapbox map reference
  const mapRef = useRef<MapRef | null>(null);
  const [layer, setLayer] = useState<MapLayerMode>("dark");
  const [layerMenuOpen, setLayerMenuOpen] = useState<boolean>(false);
  const [popupLocation, setPopupLocation] = useState<CampusLocation | null>(null);

  // Vector fallback zoom state
  const [vectorZoom, setVectorZoom] = useState<number>(1);
  const [hoveredLocation, setHoveredLocation] = useState<CampusLocation | null>(null);

  // Auto-switch to vector map if Mapbox experiences a runtime initialization error
  const handleMapboxError = useCallback((err: any) => {
    console.warn("[CampusMap] Mapbox initialization failed, switching to vector canvas fallback:", err);
    setMapboxFailed(true);
    setEngine("vector");
  }, []);

  // Fly to selected destination in Mapbox mode
  useEffect(() => {
    if (
      engine === "mapbox" &&
      selectedLocation &&
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
  }, [selectedLocation, engine]);

  // GeoJSON LineString for active route in Mapbox
  const routeGeoJSON = useMemo(() => {
    if (!showRoute || !activeRoute?.waypoints?.length) return null;
    const coords = activeRoute.waypoints
      .filter((wp) => Number.isFinite(wp.lng) && Number.isFinite(wp.lat))
      .map((wp) => [wp.lng!, wp.lat!]);
    if (coords.length < 2) return null;
    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: coords,
      },
    };
  }, [showRoute, activeRoute]);

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

  // Vector fallback route SVG path
  const vectorRoutePathD = useMemo(() => {
    if (!showRoute || !activeRoute?.waypoints?.length) return "";
    return activeRoute.waypoints.reduce((acc, pt, i) => {
      const coords =
        pt.x !== undefined && pt.y !== undefined
          ? { x: pt.x, y: pt.y }
          : pt.lat !== undefined && pt.lng !== undefined
          ? projectGpsToSvg(pt.lat, pt.lng)
          : { x: 500, y: 350 };
      return i === 0 ? `M ${coords.x} ${coords.y}` : `${acc} L ${coords.x} ${coords.y}`;
    }, "");
  }, [showRoute, activeRoute]);

  const handleMarkerClick = useCallback(
    (loc: CampusLocation) => {
      onSelectLocation(loc);
      setPopupLocation(loc);
    },
    [onSelectLocation]
  );

  return (
    <div className="relative w-full h-full bg-[#0a0f1d] overflow-hidden select-none flex flex-col justify-between">
      {/* ──── Top Control Toolbar ──── */}
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
        {/* Engine Switcher Toggle (Mapbox 3D vs Vector Canvas) */}
        {IS_MAPBOX_TOKEN_VALID && !mapboxFailed && (
          <button
            type="button"
            onClick={() => setEngine(engine === "mapbox" ? "vector" : "mapbox")}
            className="h-10 px-3 rounded-xl bg-[#111827]/95 hover:bg-[#1f2937] active:bg-zinc-700 text-zinc-200 border border-zinc-700 shadow-xl backdrop-blur-md flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer"
            title={`Switch to ${engine === "mapbox" ? "Vector Canvas" : "Mapbox 3D"}`}
            aria-label="Switch Map Engine"
          >
            <span>{engine === "mapbox" ? "🗺️ 3D Map" : "📐 Vector"}</span>
          </button>
        )}

        {/* Vector Zoom Controls (only shown in Vector mode) */}
        {engine === "vector" && (
          <>
            <button
              type="button"
              onClick={() => setVectorZoom((prev) => Math.min(prev + 0.25, 2.5))}
              className="w-10 h-10 rounded-xl bg-[#111827]/90 hover:bg-[#1f2937] active:bg-zinc-700 text-zinc-200 border border-zinc-700/80 shadow-lg backdrop-blur-md flex items-center justify-center transition-all cursor-pointer"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomInIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setVectorZoom((prev) => Math.max(prev - 0.25, 0.75))}
              className="w-10 h-10 rounded-xl bg-[#111827]/90 hover:bg-[#1f2937] active:bg-zinc-700 text-zinc-200 border border-zinc-700/80 shadow-lg backdrop-blur-md flex items-center justify-center transition-all cursor-pointer"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOutIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setVectorZoom(1)}
              className="w-10 h-10 rounded-xl bg-[#111827]/90 hover:bg-[#1f2937] active:bg-zinc-700 text-zinc-200 border border-zinc-700/80 shadow-lg backdrop-blur-md flex items-center justify-center transition-all cursor-pointer"
              title="Reset View"
              aria-label="Reset View"
            >
              <CompassIcon className="w-5 h-5 text-[#DE4B31]" />
            </button>
          </>
        )}

        {/* Layer Switcher (Dark, Standard, Satellite, Streets) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLayerMenuOpen(!layerMenuOpen)}
            className={`w-10 h-10 rounded-xl border shadow-lg backdrop-blur-md flex items-center justify-center transition-all cursor-pointer ${
              layerMenuOpen || layer !== "dark"
                ? "bg-[#DE4B31] text-white border-[#DE4B31]"
                : "bg-[#111827]/90 hover:bg-[#1f2937] text-zinc-200 border-zinc-700/80"
            }`}
            title="Map Layer"
            aria-label="Map Layer"
          >
            <LayersIcon className="w-5 h-5" />
          </button>

          {layerMenuOpen && (
            <div className="absolute top-0 right-12 w-44 rounded-2xl bg-[#111827]/95 border border-zinc-700 shadow-2xl backdrop-blur-xl p-2 z-40 flex flex-col gap-1 animate-in fade-in zoom-in-95">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 py-1">
                Map Theme
              </span>
              {(
                [
                  { id: "dark", label: "Dark Architectural" },
                  { id: "standard", label: "Navigation Night" },
                  { id: "satellite", label: "Satellite Hybrid" },
                  { id: "streets", label: "Clean Streets" },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    setLayer(mode.id);
                    setLayerMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    layer === mode.id
                      ? "bg-[#DE4B31] text-white font-semibold"
                      : "text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  <span>{mode.label}</span>
                  {layer === mode.id && <span className="text-[10px]">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ──── Active Route Top-Left HUD Card ──── */}
      {showRoute && activeRoute && (
        <div className="absolute top-4 left-4 z-20 max-w-xs sm:max-w-sm rounded-2xl bg-[#111827]/90 border border-zinc-800 shadow-2xl backdrop-blur-xl p-3.5 animate-in fade-in slide-in-from-top-4">
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
              <p className="text-[10px] text-zinc-400">
                {activeRoute.distanceMeters} m
              </p>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <AccessibilityIcon className="w-3 h-3" /> Pedestrian Pathway
            </span>
            <span className="font-mono text-zinc-500">
              {engine === "mapbox" ? "Mapbox 3D" : "Vector Fallback"}
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
            initialViewState={{
              longitude: DATASET_C_INITIAL_CENTER.longitude,
              latitude: DATASET_C_INITIAL_CENTER.latitude,
              zoom: DEFAULT_ZOOM,
              pitch: 40,
              bearing: 0,
            }}
            mapStyle={MAP_STYLES[layer] || MAP_STYLES.dark}
            style={{ width: "100%", height: "100%" }}
            attributionControl={false}
            onError={handleMapboxError}
          >
            <NavigationControl position="bottom-right" showCompass showZoom />
            <GeolocateControl position="bottom-right" trackUserLocation />

            {/* 1. Complete Surveyed Walking Path Segments (29 edges) */}
            {surveyedSpineGeoJSON && (
              <Source id="surveyed-walkways" type="geojson" data={surveyedSpineGeoJSON}>
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
              <Source id="active-route" type="geojson" data={routeGeoJSON}>
                <Layer
                  id="route-casing"
                  type="line"
                  paint={{
                    "line-color": "#000000",
                    "line-width": 9,
                    "line-opacity": 0.8,
                  }}
                />
                <Layer
                  id="route-glow"
                  type="line"
                  paint={{
                    "line-color": "#DE4B31",
                    "line-width": 6,
                    "line-blur": 2,
                    "line-opacity": 0.5,
                  }}
                />
                <Layer
                  id="route-line"
                  type="line"
                  paint={{
                    "line-color": "#DE4B31",
                    "line-width": 4.5,
                    "line-opacity": 1,
                  }}
                />
              </Source>
            )}

            {/* 3. 12 Junction Nodes (Subtle Navigational Vertices) */}
            {junctionNodes.map((j) => (
              <Marker
                key={j.id}
                latitude={j.latitude}
                longitude={j.longitude}
                anchor="center"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full bg-zinc-600 border border-zinc-400 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                  title={`${j.survey_id}: Junction Vertex`}
                />
              </Marker>
            ))}

            {/* 4. 15 Destination Location Pins */}
            {locations.map((loc) => {
              if (!Number.isFinite(loc.coordinates.lat) || !Number.isFinite(loc.coordinates.lng)) {
                return null;
              }

              const isOrigin = originLocation?.id === loc.id;
              const isDestination = selectedLocation?.id === loc.id;
              const pinColor = isOrigin
                ? "#10b981"
                : isDestination
                ? "#DE4B31"
                : CATEGORY_COLORS[loc.category] || "#6366F1";

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
                      <span className="text-[10px] text-white font-bold">
                        {loc.category === "gate"
                          ? "🚪"
                          : loc.category === "hostel"
                          ? "🏠"
                          : loc.category === "service"
                          ? "🍴"
                          : loc.category === "landmark"
                          ? "📍"
                          : "🏛️"}
                      </span>
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
                        ? `START • ${loc.code || loc.name}`
                        : isDestination
                        ? `DEST • ${loc.code || loc.name}`
                        : loc.code || loc.name}
                    </div>
                  </div>
                </Marker>
              );
            })}

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
                          className="flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>📍 Start Here</span>
                        </button>
                      )}
                      {onSetDestination && (
                        <button
                          type="button"
                          onClick={() => {
                            onSetDestination(popupLocation);
                            setPopupLocation(null);
                          }}
                          className="flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold bg-[#DE4B31] hover:bg-[#b83821] text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>🏁 Go Here</span>
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
                  <path
                    d={vectorRoutePathD}
                    fill="none"
                    stroke="#DE4B31"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={vectorRoutePathD}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeDasharray="8,8"
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
            </svg>
          </div>
        </div>
      )}

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
