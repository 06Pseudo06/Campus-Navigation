"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { CampusLocation, CampusRoute } from "@/types/campus";
import { isReducedMotion } from "@/lib/motion";

interface ExploreMapCardProps {
  locations: CampusLocation[];
  selectedLocation: CampusLocation | null;
  originLocation: CampusLocation | null;
  onSelectLocation: (loc: CampusLocation) => void;
  onSelectOriginLocation?: (loc: CampusLocation) => void;
  activeRoute: CampusRoute | null;
  showRoute: boolean;
  hoveredStepIndex?: number | null;
}

export function ExploreMapCard({
  locations,
  selectedLocation,
  originLocation,
  onSelectLocation,
  onSelectOriginLocation,
  activeRoute,
  showRoute,
  hoveredStepIndex = null,
}: ExploreMapCardProps) {
  // Zoom & Pan transformation states
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Drag deadzone & pointer tracking refs
  const isPointerDownRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);

  // Floating Popovers & Layer Toggles (Default legend to collapsed pill)
  const [masterplanOpen, setMasterplanOpen] = useState(false);
  const [legendCollapsed, setLegendCollapsed] = useState(true);

  // Map layer visibility switches
  const [layerBuildings, setLayerBuildings] = useState(true);
  const [layerWalkways, setLayerWalkways] = useState(true);
  const [layerInferred, setLayerInferred] = useState(true);
  const [layerTerrain, setLayerTerrain] = useState(true);

  // Hover state
  const [hoveredLocation, setHoveredLocation] = useState<CampusLocation | null>(null);

  // Map container reference
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.3, 2.6));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.3, 0.7));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Keyboard navigation on map focus
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      handleZoomIn();
    } else if (e.key === "-") {
      e.preventDefault();
      handleZoomOut();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setPan((p) => ({ ...p, y: p.y + 40 }));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setPan((p) => ({ ...p, y: p.y - 40 }));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPan((p) => ({ ...p, x: p.x + 40 }));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setPan((p) => ({ ...p, x: p.x - 40 }));
    } else if (e.key === "0") {
      handleResetView();
    }
  };

  // 4px Drag threshold for panning: simple click never triggers drag
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement)?.closest("button, a, input, select, [role='button'], [data-cursor='ui']")) {
      return;
    }
    isPointerDownRef.current = true;
    hasDraggedRef.current = false;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isPointerDownRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    const dist = Math.hypot(dx, dy);

    if (!hasDraggedRef.current) {
      if (dist < 4) return; // 4px deadzone threshold
      hasDraggedRef.current = true;
      setIsDragging(true);
    }

    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const onMouseUp = () => {
    isPointerDownRef.current = false;
    setIsDragging(false);
    hasDraggedRef.current = false;
  };

  // Wheel zoom (isolated to map surface)
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.14 : -0.14;
    setZoom((z) => Math.min(2.6, Math.max(0.7, z + delta)));
  };

  // Double click zoom
  const onDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement)?.closest("button, a, input, select, [role='button'], [data-cursor='ui']")) {
      return;
    }
    handleZoomIn();
  };

  // Compute adaptive bounding box from real GPS coordinates
  const bounds = useMemo(() => {
    const lats = locations
      .map((l) => l.latitude)
      .filter((l): l is number => typeof l === "number" && !isNaN(l));
    const lons = locations
      .map((l) => l.longitude)
      .filter((l): l is number => typeof l === "number" && !isNaN(l));

    const minLat = lats.length ? Math.min(...lats) - 0.0012 : 45.38;
    const maxLat = lats.length ? Math.max(...lats) + 0.0012 : 45.389;
    const minLon = lons.length ? Math.min(...lons) - 0.0015 : -75.703;
    const maxLon = lons.length ? Math.max(...lons) + 0.0015 : -75.692;

    return { minLat, maxLat, minLon, maxLon };
  }, [locations]);

  // Coordinate projection: WGS84 GPS -> SVG ViewBox (1000 x 700)
  const paddingX = 64;
  const paddingY = 64;
  const svgWidth = 1000;
  const svgHeight = 700;

  const toSvgX = useCallback(
    (lon: number) => {
      const ratio = (lon - bounds.minLon) / (bounds.maxLon - bounds.minLon);
      return Math.max(paddingX, Math.min(svgWidth - paddingX, paddingX + ratio * (svgWidth - 2 * paddingX)));
    },
    [bounds]
  );

  const toSvgY = useCallback(
    (lat: number) => {
      const ratio = (bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat);
      return Math.max(paddingY, Math.min(svgHeight - paddingY, paddingY + ratio * (svgHeight - 2 * paddingY)));
    },
    [bounds]
  );

  // Build SVG path for active route using real GPS waypoints
  const routeWaypointsSvg = useMemo(() => {
    if (!showRoute || !activeRoute) return [];

    if (activeRoute.waypoints && activeRoute.waypoints.length >= 2) {
      return activeRoute.waypoints
        .map((pt) => {
          const lat = pt.lat ?? pt.y;
          const lon = pt.lon ?? pt.x;
          if (typeof lat === "number" && typeof lon === "number") {
            return { x: toSvgX(lon), y: toSvgY(lat) };
          }
          return null;
        })
        .filter((p): p is { x: number; y: number } => p !== null);
    }

    if (
      originLocation?.longitude &&
      originLocation?.latitude &&
      selectedLocation?.longitude &&
      selectedLocation?.latitude
    ) {
      return [
        { x: toSvgX(originLocation.longitude), y: toSvgY(originLocation.latitude) },
        { x: toSvgX(selectedLocation.longitude), y: toSvgY(selectedLocation.latitude) },
      ];
    }

    return [];
  }, [showRoute, activeRoute, originLocation, selectedLocation, toSvgX, toSvgY]);

  const routePathData = useMemo(() => {
    if (routeWaypointsSvg.length < 2) return null;
    const points = routeWaypointsSvg.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    return `M ${points.join(" L ")}`;
  }, [routeWaypointsSvg]);

  // Route Midpoint coordinates for distance / time chip
  const routeMidpoint = useMemo(() => {
    if (routeWaypointsSvg.length < 2) return null;
    const midIdx = Math.floor(routeWaypointsSvg.length / 2);
    return routeWaypointsSvg[midIdx];
  }, [routeWaypointsSvg]);

  // Highlighted segment path when hovering a step in turn guidance
  const hoveredSegmentPath = useMemo(() => {
    if (
      !showRoute ||
      !activeRoute ||
      hoveredStepIndex === null ||
      hoveredStepIndex === undefined ||
      routeWaypointsSvg.length < 2
    ) {
      return null;
    }

    const idx = Math.min(hoveredStepIndex, routeWaypointsSvg.length - 2);
    const p1 = routeWaypointsSvg[idx];
    const p2 = routeWaypointsSvg[idx + 1];
    if (!p1 || !p2) return null;

    return `M ${p1.x.toFixed(1)},${p1.y.toFixed(1)} L ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }, [showRoute, activeRoute, hoveredStepIndex, routeWaypointsSvg]);

  // Network walkway edges between close buildings
  const walkwayEdges = useMemo(() => {
    const edges: { x1: number; y1: number; x2: number; y2: number; isInferred?: boolean }[] = [];
    for (let i = 0; i < locations.length; i++) {
      const locA = locations[i];
      if (!locA.latitude || !locA.longitude) continue;
      const x1 = toSvgX(locA.longitude);
      const y1 = toSvgY(locA.latitude);

      for (let j = i + 1; j < locations.length; j++) {
        const locB = locations[j];
        if (!locB.latitude || !locB.longitude) continue;
        const x2 = toSvgX(locB.longitude);
        const y2 = toSvgY(locB.latitude);

        const dist = Math.hypot(x2 - x1, y2 - y1);
        if (dist > 20 && dist < 110) {
          edges.push({
            x1,
            y1,
            x2,
            y2,
            isInferred: (i + j) % 5 === 0,
          });
        }
      }
    }
    return edges;
  }, [locations, toSvgX, toSvgY]);

  // Frame active route automatically when calculated
  useEffect(() => {
    if (!activeRoute || !showRoute || routeWaypointsSvg.length < 2) return;

    const xs = routeWaypointsSvg.map((c) => c.x);
    const ys = routeWaypointsSvg.map((c) => c.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const spanX = Math.max(160, maxX - minX);
    const spanY = Math.max(160, maxY - minY);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    const targetZoom = Math.min(2.1, Math.max(1.35, 480 / Math.max(spanX, spanY)));
    const targetPanX = (500 - midX) * targetZoom;
    const targetPanY = (350 - midY) * targetZoom;

    const frameId = requestAnimationFrame(() => {
      setZoom(targetZoom);
      setPan({ x: targetPanX, y: targetPanY });
    });
    return () => cancelAnimationFrame(frameId);
  }, [activeRoute, showRoute, routeWaypointsSvg]);

  // Collision avoidance for node chips: prioritize selected, origin, hovered, route midpoint, landmarks
  const visibleChipsMap = useMemo(() => {
    const chipSet = new Set<string>();
    const occupied: { x: number; y: number }[] = [];

    // 0. High priority: Route Midpoint chip (protect area around midpoint pill)
    if (routeMidpoint && activeRoute && showRoute) {
      occupied.push({ x: routeMidpoint.x, y: routeMidpoint.y - 20 / zoom });
    }

    // 1. High priority: Origin, Destination, Hovered
    locations.forEach((loc) => {
      const isPri =
        loc.id === originLocation?.id ||
        loc.id === selectedLocation?.id ||
        loc.id === hoveredLocation?.id;
      if (isPri && loc.longitude && loc.latitude) {
        chipSet.add(loc.id);
        occupied.push({ x: toSvgX(loc.longitude), y: toSvgY(loc.latitude) });
      }
    });

    // 2. High priority: Landmarks & major hubs
    locations.forEach((loc) => {
      const isHub =
        loc.category === "landmark" ||
        ["ML", "PA", "UC", "ME", "AB", "AH", "RB", "LE", "DH", "SA"].includes(loc.code);
      if (isHub && !chipSet.has(loc.id) && loc.longitude && loc.latitude) {
        const x = toSvgX(loc.longitude);
        const y = toSvgY(loc.latitude);
        const collides = occupied.some((occ) => Math.hypot(occ.x - x, occ.y - y) < 44 / Math.max(0.8, zoom * 0.9));
        if (!collides || zoom >= 1.5) {
          chipSet.add(loc.id);
          occupied.push({ x, y });
        }
      }
    });

    // 3. Regular buildings
    locations.forEach((loc) => {
      if (!chipSet.has(loc.id) && loc.longitude && loc.latitude) {
        const x = toSvgX(loc.longitude);
        const y = toSvgY(loc.latitude);
        const collides = occupied.some((occ) => Math.hypot(occ.x - x, occ.y - y) < 48 / Math.max(0.8, zoom * 0.9));
        if (!collides || zoom >= 1.6) {
          chipSet.add(loc.id);
          occupied.push({ x, y });
        }
      }
    });

    return chipSet;
  }, [locations, originLocation, selectedLocation, hoveredLocation, routeMidpoint, activeRoute, showRoute, zoom, toSvgX, toSvgY]);

  // Scaled distance calculation for the bottom scale bar
  const scaleMeters = Math.round(250 / zoom);

  return (
    <div
      id="mapPanSurface"
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onWheel={onWheel}
      onDoubleClick={onDoubleClick}
      data-cursor="map"
      data-dragging={isDragging ? "true" : "false"}
      data-lenis-prevent
      className={`relative w-full h-full rounded-[20px] overflow-hidden bg-white border border-[#E1DDD3] shadow-[0_1px_0_rgba(14,17,24,0.04),0_18px_40px_-18px_rgba(14,17,24,0.28)] select-none flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-[#E8542F]/30 ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      aria-label="Interactive University Campus Map"
    >
      {/* 1. Top-Left Floating Masterplan Layer Popover (Sibling overlay with stopped propagation) */}
      <div
        className="absolute top-4 left-4 z-20 flex flex-col gap-2"
        data-cursor="ui"
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMasterplanOpen(!masterplanOpen);
          }}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-[14px] bg-white hover:bg-[#F7F5F0] text-[#0E1118] border border-[#E1DDD3] shadow-sm backdrop-blur-md transition-all cursor-pointer font-sans text-xs font-semibold"
          aria-expanded={masterplanOpen}
          aria-label="Campus Masterplan layers menu"
        >
          <span className="w-2 h-2 rounded-full bg-[#E8542F] animate-pulse" />
          <span>Campus Masterplan</span>
          <span className="text-[10px] text-[#6B665C] font-mono">&bull; 48 verified</span>
          <svg
            className={`w-3.5 h-3.5 text-[#6B665C] transition-transform ${
              masterplanOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {masterplanOpen && (
          <div className="w-72 p-3.5 rounded-[16px] bg-white border border-[#E1DDD3] shadow-xl text-[#0E1118] space-y-3 animate-fadeIn text-xs font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-[#E1DDD3]">
              <span className="font-bold text-[11px] font-mono uppercase tracking-wider text-[#6B665C]">
                Map Layers
              </span>
              <button
                type="button"
                onClick={() => setMasterplanOpen(false)}
                className="text-xs text-[#6B665C] hover:text-[#0E1118] p-1 cursor-pointer"
                aria-label="Close layers menu"
              >
                &times;
              </button>
            </div>

            {/* Layer Toggles */}
            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer text-xs">
                <span className="text-[#0E1118] font-medium">Buildings &amp; Footprints</span>
                <input
                  type="checkbox"
                  checked={layerBuildings}
                  onChange={(e) => setLayerBuildings(e.target.checked)}
                  className="rounded text-[#E8542F] focus:ring-[#E8542F] accent-[#E8542F] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-xs">
                <span className="text-[#0E1118] font-medium">Surveyed Walkways</span>
                <input
                  type="checkbox"
                  checked={layerWalkways}
                  onChange={(e) => setLayerWalkways(e.target.checked)}
                  className="rounded text-[#E8542F] focus:ring-[#E8542F] accent-[#E8542F] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-xs">
                <span className="text-[#0E1118] font-medium">Inferred Connectors</span>
                <input
                  type="checkbox"
                  checked={layerInferred}
                  onChange={(e) => setLayerInferred(e.target.checked)}
                  className="rounded text-[#E8542F] focus:ring-[#E8542F] accent-[#E8542F] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-xs">
                <span className="text-[#0E1118] font-medium">Terrain &amp; River</span>
                <input
                  type="checkbox"
                  checked={layerTerrain}
                  onChange={(e) => setLayerTerrain(e.target.checked)}
                  className="rounded text-[#E8542F] focus:ring-[#E8542F] accent-[#E8542F] cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 2. Top-Right Floating Controls (Compass + Zoom Stack) */}
      <div
        className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 shadow-sm"
        data-cursor="ui"
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleResetView();
          }}
          className="w-10 h-10 rounded-[12px] bg-white hover:bg-[#F7F5F0] text-[#0E1118] border border-[#E1DDD3] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
          title="Reset View &amp; Center"
          aria-label="Reset View"
        >
          <span className="text-[#E8542F] font-bold text-sm">🧭</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleZoomIn();
          }}
          className="w-10 h-10 rounded-[12px] bg-white hover:bg-[#F7F5F0] text-[#0E1118] border border-[#E1DDD3] flex items-center justify-center transition-all cursor-pointer font-bold text-base shadow-xs active:scale-95"
          title="Zoom In (+)"
          aria-label="Zoom In"
        >
          +
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleZoomOut();
          }}
          className="w-10 h-10 rounded-[12px] bg-white hover:bg-[#F7F5F0] text-[#0E1118] border border-[#E1DDD3] flex items-center justify-center transition-all cursor-pointer font-bold text-base shadow-xs active:scale-95"
          title="Zoom Out (-)"
          aria-label="Zoom Out"
        >
          &minus;
        </button>
      </div>

      {/* 3. Bottom-Left Collapsible Legend (Default: Collapsed Pill) */}
      <div
        className="absolute bottom-4 left-4 z-20 font-mono text-[10px]"
        data-cursor="ui"
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        {legendCollapsed ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLegendCollapsed(false);
            }}
            className="px-3.5 py-1.5 rounded-[14px] bg-white hover:bg-[#F7F5F0] border border-[#E1DDD3] text-[#0E1118] font-bold shadow-xs flex items-center gap-1.5 cursor-pointer font-mono"
            aria-label="Expand map legend"
          >
            <span>Legend</span>
            <span className="text-[#E8542F] font-bold">&rsaquo;</span>
          </button>
        ) : (
          <div className="p-3 rounded-[16px] bg-white/95 backdrop-blur-md border border-[#E1DDD3] shadow-md space-y-2 text-[#6B665C]">
            <div className="flex items-center justify-between gap-3 text-[#0E1118] font-bold uppercase tracking-wider text-[9px]">
              <span>Walkway Connectivity</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLegendCollapsed(true);
                }}
                className="text-[#6B665C] hover:text-[#0E1118] p-1 cursor-pointer"
                aria-label="Collapse legend"
              >
                &minus;
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-1 bg-[#B7AC9B] inline-block rounded-full" />
              <span>Surveyed Walkways</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-1 border-b-2 border-dashed border-[#D9A441] inline-block" />
              <span>Inferred Connectors</span>
            </div>

            <div className="flex items-center gap-3 pt-1 border-t border-[#E1DDD3] text-[9px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#0F6E73]" /> Origin (A)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#E8542F]" /> Dest (B)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom-Right Scale Bar & North Arrow */}
      <div
        className="absolute bottom-4 right-4 z-20 flex items-center gap-3 px-3 py-1.5 rounded-[12px] bg-white/95 backdrop-blur-sm border border-[#E1DDD3] text-[10px] font-mono text-[#6B665C]"
        data-cursor="ui"
      >
        <div className="flex flex-col items-center leading-none">
          <span className="text-[8px] font-bold text-[#E8542F]">&uarr;</span>
          <span className="text-[9px] font-bold text-[#0E1118]">N</span>
        </div>
        <div className="h-3 w-px bg-[#E1DDD3]" />
        <div className="flex flex-col items-center">
          <div className="w-16 h-1 border-b-2 border-l border-r border-[#6B665C]" />
          <span className="text-[9px] mt-0.5 tabular-nums font-semibold">{scaleMeters} m</span>
        </div>
      </div>

      {/* 5. Center SVG Projection Canvas */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-100 ease-out origin-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <svg
            viewBox="0 0 1000 700"
            className="w-full h-full max-h-[85vh] object-contain drop-shadow-md"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Subtle 4% Architectural Blueprint Grid */}
              <pattern id="lightBlueprintGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#0E1118" strokeWidth="0.5" strokeOpacity="0.04" />
              </pattern>

              {/* Water Gradient: Slower, calming teal */}
              <linearGradient id="riverGradR3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8FC0CB" />
                <stop offset="100%" stopColor="#74A9B7" />
              </linearGradient>

              {/* Building Drop Shadow */}
              <filter id="bldgShadowR3" x="-10%" y="-10%" width="125%" height="125%">
                <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#0E1118" floodOpacity="0.14" />
              </filter>
            </defs>

            {/* Base Canvas Ground: Cool Calmed Land */}
            <rect width="1000" height="700" fill="#F3F4F0" />
            <rect width="1000" height="700" fill="url(#lightBlueprintGrid)" />

            {/* Decorative Terrain & Green Space (Organic Parks with Scattered Tree Dots) */}
            {layerTerrain && (
              <g id="terrainLayer">
                {/* West Park */}
                <path
                  d="M 60 110 C 140 80, 240 100, 290 170 C 330 230, 280 320, 210 350 C 130 380, 60 300, 50 200 C 45 150, 55 120, 60 110 Z"
                  fill="#D3DFC3"
                  stroke="#B8CEA4"
                  strokeWidth="1"
                />
                <circle cx="110" cy="150" r="4.5" fill="#A3BA8E" />
                <circle cx="125" cy="145" r="3.5" fill="#A3BA8E" />
                <circle cx="170" cy="210" r="5" fill="#A3BA8E" />
                <circle cx="190" cy="200" r="3.5" fill="#A3BA8E" />
                <circle cx="150" cy="270" r="4" fill="#A3BA8E" />
                <circle cx="220" cy="260" r="4.5" fill="#A3BA8E" />

                {/* Central-East Park */}
                <path
                  d="M 490 280 C 580 260, 660 300, 680 370 C 700 440, 620 500, 540 500 C 470 500, 440 420, 460 350 C 470 310, 480 290, 490 280 Z"
                  fill="#D3DFC3"
                  stroke="#B8CEA4"
                  strokeWidth="1"
                />
                <circle cx="520" cy="330" r="4" fill="#A3BA8E" />
                <circle cx="535" cy="325" r="3" fill="#A3BA8E" />
                <circle cx="580" cy="390" r="4.5" fill="#A3BA8E" />
                <circle cx="600" cy="410" r="3.5" fill="#A3BA8E" />
                <circle cx="510" cy="430" r="4" fill="#A3BA8E" />
              </g>
            )}

            {/* Rideau River: Calm teal with 2px shoreline #6FA3B1 */}
            {layerTerrain && (
              <g id="riverLayer">
                <path
                  d="M 1000 60 C 860 170, 830 320, 760 450 C 680 590, 550 650, 400 700 L 510 700 C 650 660, 760 600, 840 470 C 910 350, 930 210, 1000 120 Z"
                  fill="url(#riverGradR3)"
                />
                <path
                  d="M 1000 60 C 860 170, 830 320, 760 450 C 680 590, 550 650, 400 700"
                  fill="none"
                  stroke="#6FA3B1"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* Campus Perimeter Boundary */}
            <rect
              x={paddingX - 16}
              y={paddingY - 16}
              width={svgWidth - 2 * paddingX + 32}
              height={svgHeight - 2 * paddingY + 32}
              rx="24"
              fill="none"
              stroke="#D9D5CA"
              strokeWidth="1.2"
              strokeDasharray="6,6"
            />

            {/* Render Network Walkway Edges: White roads with casing */}
            {layerWalkways && (
              <g id="walkwayEdgesLayer">
                {walkwayEdges.map((edge, idx) => {
                  const isInferred = edge.isInferred && layerInferred;
                  const edgeOpacity = routePathData ? 0.12 : isInferred ? 0.35 : 0.28;

                  return (
                    <React.Fragment key={idx}>
                      {/* Walkway road casing */}
                      <line
                        x1={edge.x1}
                        y1={edge.y1}
                        x2={edge.x2}
                        y2={edge.y2}
                        stroke={isInferred ? "#D9A441" : "#D9D5CA"}
                        strokeWidth={isInferred ? 1.5 : 2.5}
                        strokeDasharray={isInferred ? "3,3" : undefined}
                        strokeOpacity={edgeOpacity}
                      />
                      {/* Walkway white core */}
                      {!isInferred && (
                        <line
                          x1={edge.x1}
                          y1={edge.y1}
                          x2={edge.x2}
                          y2={edge.y2}
                          stroke="#FFFFFF"
                          strokeWidth="1.2"
                          strokeOpacity={edgeOpacity}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </g>
            )}

            {/* Render Active Calculated Route */}
            {routePathData && (
              <g id="activeRouteLayer">
                {/* 9px White Route Casing */}
                <path
                  d={routePathData}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* 5px Sunset-Orange Active Path with Self-Drawing Stroke */}
                <path
                  d={routePathData}
                  fill="none"
                  stroke="#E8542F"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={isReducedMotion() ? "" : "animate-routeDraw"}
                />

                {/* Highlighted Step Segment on Hover */}
                {hoveredSegmentPath && (
                  <path
                    d={hoveredSegmentPath}
                    fill="none"
                    stroke="#FFBF29"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-pulse"
                  />
                )}
              </g>
            )}

            {/* Render Buildings & Node Chips (Constant Screen Size via 1/zoom scale) */}
            {layerBuildings && (
              <g id="buildingsLayer">
                {locations.map((loc) => {
                  if (!loc.longitude || !loc.latitude) return null;

                  const cx = toSvgX(loc.longitude);
                  const cy = toSvgY(loc.latitude);

                  const isSelected = selectedLocation?.id === loc.id;
                  const isOrigin = originLocation?.id === loc.id;
                  const isHovered = hoveredLocation?.id === loc.id;
                  const shouldShowChip = visibleChipsMap.has(loc.id) || isHovered;

                  const codeStr = loc.code || "BLD";
                  const chipWidth = Math.max(34, codeStr.length * 8 + 16);
                  const chipHeight = 22;

                  return (
                    <g
                      key={loc.id}
                      transform={`translate(${cx}, ${cy})`}
                      data-cursor="node"
                      className="cursor-pointer transition-all duration-150"
                      onClick={(e) => {
                        if (e.shiftKey && onSelectOriginLocation) {
                          onSelectOriginLocation(loc);
                        } else {
                          onSelectLocation(loc);
                        }
                      }}
                      onMouseEnter={() => setHoveredLocation(loc)}
                      onMouseLeave={() => setHoveredLocation(null)}
                      role="button"
                      tabIndex={0}
                      aria-label={`${loc.name} (${codeStr}), building`}
                    >
                      {/* Sub-container scaled by 1/zoom to maintain constant screen size */}
                      <g transform={`scale(${1 / zoom})`}>
                        {/* Origin Halo Pulsing Ring (Teal) */}
                        {isOrigin && (
                          <circle
                            r="20"
                            fill="none"
                            stroke="#0F6E73"
                            strokeWidth="2"
                            strokeDasharray="4,3"
                            className="animate-spin-slow origin-center opacity-85"
                          />
                        )}

                        {/* Destination Halo Pulsing Ring (Orange) */}
                        {isSelected && (
                          <circle
                            r="20"
                            fill="none"
                            stroke="#E8542F"
                            strokeWidth="2"
                            strokeDasharray="4,3"
                            className="animate-spin-slow origin-center opacity-90"
                          />
                        )}

                        {shouldShowChip ? (
                          <>
                            {/* Constant Screen Size Chip: padding 4x8, radius 10px, font 11px sans-semibold */}
                            <rect
                              x={-chipWidth / 2}
                              y={-chipHeight / 2}
                              width={chipWidth}
                              height={chipHeight}
                              rx="10"
                              filter="url(#bldgShadowR3)"
                              fill={
                                isSelected
                                  ? "#E8542F"
                                  : isOrigin
                                  ? "#0F6E73"
                                  : isHovered
                                  ? "#0E1118"
                                  : "#FAF8F3"
                              }
                              stroke={
                                isSelected
                                  ? "#C9411F"
                                  : isOrigin
                                  ? "#0A4E52"
                                  : isHovered
                                  ? "#0E1118"
                                  : "#B8B2A6"
                              }
                              strokeWidth="1.2"
                            />

                            {/* Building Code Label: sans-semibold 11px */}
                            <text
                              x="0"
                              y="3.5"
                              textAnchor="middle"
                              fontFamily="var(--font-display), -apple-system, sans-serif"
                              fontSize="11"
                              fontWeight="600"
                              letterSpacing="0.02em"
                              fill={
                                isSelected || isOrigin || isHovered
                                  ? "#FFFFFF"
                                  : "#0E1118"
                              }
                            >
                              {codeStr}
                            </text>
                          </>
                        ) : (
                          /* Compact Building Node Dot when chips are clustered */
                          <>
                            <circle
                              r="4.5"
                              fill="#FAF8F3"
                              stroke="#B8B2A6"
                              strokeWidth="1.2"
                              filter="url(#bldgShadowR3)"
                            />
                            <circle r="1.8" fill="#6B665C" />
                          </>
                        )}

                        {/* Origin 'A' badge */}
                        {isOrigin && (
                          <g transform={`translate(${chipWidth / 2 + 2}, -7)`}>
                            <circle r="6" fill="#0F6E73" stroke="#FFFFFF" strokeWidth="1.2" />
                            <text
                              x="0"
                              y="2.5"
                              textAnchor="middle"
                              fontFamily="var(--font-mono)"
                              fontSize="7.5"
                              fontWeight="bold"
                              fill="#FFFFFF"
                            >
                              A
                            </text>
                          </g>
                        )}

                        {/* Destination 'B' badge */}
                        {isSelected && (
                          <g transform={`translate(${chipWidth / 2 + 2}, -7)`}>
                            <circle r="6" fill="#E8542F" stroke="#FFFFFF" strokeWidth="1.2" />
                            <text
                              x="0"
                              y="2.5"
                              textAnchor="middle"
                              fontFamily="var(--font-mono)"
                              fontSize="7.5"
                              fontWeight="bold"
                              fill="#FFFFFF"
                            >
                              B
                            </text>
                          </g>
                        )}
                      </g>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Route Midpoint Distance / Time Pill - Drawn ABOVE ALL node chips with constant scale */}
            {routeMidpoint && activeRoute && (
              <g
                id="routeMidpointOverlay"
                transform={`translate(${routeMidpoint.x}, ${routeMidpoint.y - 20 / zoom}) scale(${1 / zoom})`}
                className="pointer-events-none select-none"
              >
                <rect
                  x="-54"
                  y="-12"
                  width="108"
                  height="24"
                  rx="12"
                  fill="#0F141F"
                  stroke="#E8542F"
                  strokeWidth="1.5"
                  filter="url(#bldgShadowR3)"
                />
                <text
                  textAnchor="middle"
                  y="4"
                  fill="#FFFFFF"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  fontWeight="bold"
                >
                  ~{activeRoute.estimatedWalkingMinutes} min &bull; {activeRoute.distanceMeters} m
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
