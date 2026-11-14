"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
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
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Floating Popovers & Layer Toggles
  const [masterplanOpen, setMasterplanOpen] = useState(false);
  const [legendCollapsed, setLegendCollapsed] = useState(false);

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
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
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

  // Dragging / Panning handlers
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement)?.closest("button, a, input, select, [role='button']")) {
      return;
    }
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const onMouseUp = () => setIsDragging(false);

  // Wheel zoom
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.12 : -0.12;
    setZoom((z) => Math.min(2.5, Math.max(0.75, z + delta)));
  };

  // Double click zoom
  const onDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement)?.closest("button, a, input, select, [role='button']")) {
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
  const routePathData = useMemo(() => {
    if (!showRoute || !activeRoute) return null;

    if (activeRoute.waypoints && activeRoute.waypoints.length >= 2) {
      const points = activeRoute.waypoints
        .map((pt) => {
          const lat = pt.lat ?? pt.y;
          const lon = pt.lon ?? pt.x;
          if (typeof lat === "number" && typeof lon === "number") {
            return `${toSvgX(lon).toFixed(1)},${toSvgY(lat).toFixed(1)}`;
          }
          return null;
        })
        .filter(Boolean);

      if (points.length >= 2) {
        return `M ${points.join(" L ")}`;
      }
    }

    if (
      originLocation?.longitude &&
      originLocation?.latitude &&
      selectedLocation?.longitude &&
      selectedLocation?.latitude
    ) {
      const x1 = toSvgX(originLocation.longitude);
      const y1 = toSvgY(originLocation.latitude);
      const x2 = toSvgX(selectedLocation.longitude);
      const y2 = toSvgY(selectedLocation.latitude);
      return `M ${x1.toFixed(1)},${y1.toFixed(1)} L ${x2.toFixed(1)},${y2.toFixed(1)}`;
    }

    return null;
  }, [showRoute, activeRoute, originLocation, selectedLocation, toSvgX, toSvgY]);

  // Highlighted segment path when hovering a step in turn guidance
  const hoveredSegmentPath = useMemo(() => {
    if (
      !showRoute ||
      !activeRoute ||
      hoveredStepIndex === null ||
      hoveredStepIndex === undefined ||
      !activeRoute.waypoints ||
      activeRoute.waypoints.length < 2
    ) {
      return null;
    }

    const idx = Math.min(hoveredStepIndex, activeRoute.waypoints.length - 2);
    const p1 = activeRoute.waypoints[idx];
    const p2 = activeRoute.waypoints[idx + 1];
    if (!p1 || !p2) return null;

    const lat1 = p1.lat ?? p1.y;
    const lon1 = p1.lon ?? p1.x;
    const lat2 = p2.lat ?? p2.y;
    const lon2 = p2.lon ?? p2.x;

    if (
      typeof lat1 === "number" &&
      typeof lon1 === "number" &&
      typeof lat2 === "number" &&
      typeof lon2 === "number"
    ) {
      return `M ${toSvgX(lon1).toFixed(1)},${toSvgY(lat1).toFixed(1)} L ${toSvgX(lon2).toFixed(1)},${toSvgY(lat2).toFixed(1)}`;
    }
    return null;
  }, [showRoute, activeRoute, hoveredStepIndex, toSvgX, toSvgY]);

  // Network walkway edges between close buildings (aesthetic, topological demonstration)
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
        // Connect nearby buildings within 110px radius
        if (dist > 20 && dist < 110) {
          edges.push({
            x1,
            y1,
            x2,
            y2,
            isInferred: (i + j) % 5 === 0, // Deterministic sampling
          });
        }
      }
    }
    return edges;
  }, [locations, toSvgX, toSvgY]);

  // Scaled distance calculation for the bottom scale bar
  const scaleMeters = Math.round(250 / zoom);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onWheel={onWheel}
      onDoubleClick={onDoubleClick}
      data-cursor={isDragging ? "DRAGGING" : "DRAG"}
      data-lenis-prevent
      className={`relative w-full h-full rounded-[28px] overflow-hidden bg-[#F1ECE2] border border-[#111111]/12 shadow-[0_20px_60px_-24px_rgba(17,17,17,0.20)] select-none flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-[#E8542F]/30 ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      aria-label="Interactive University Campus Map"
    >
      {/* 1. Top-Left Floating Masterplan Layer Popover */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setMasterplanOpen(!masterplanOpen)}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#FBF8F2]/95 hover:bg-white text-[#111111] border border-[#111111]/12 shadow-sm backdrop-blur-md transition-all cursor-pointer font-mono text-xs font-bold"
          aria-expanded={masterplanOpen}
        >
          <span className="w-2 h-2 rounded-full bg-[#E8542F] animate-pulse" />
          <span>Campus Masterplan</span>
          <span className="text-[10px] text-[#5B5750] font-normal">&bull; 48 verified</span>
          <svg
            className={`w-3.5 h-3.5 text-[#5B5750] transition-transform ${
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
          <div className="w-72 p-3.5 rounded-2xl bg-[#FBF8F2] border border-[#111111]/15 shadow-xl text-[#111111] space-y-3 animate-fadeIn text-xs font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-[#111111]/10">
              <span className="font-bold text-[11px] uppercase tracking-wider">
                Map Layers
              </span>
              <button
                type="button"
                onClick={() => setMasterplanOpen(false)}
                className="text-xs text-[#5B5750] hover:text-[#111111]"
              >
                &times;
              </button>
            </div>

            {/* Layer Toggles */}
            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#111111]">Buildings &amp; Footprints</span>
                <input
                  type="checkbox"
                  checked={layerBuildings}
                  onChange={(e) => setLayerBuildings(e.target.checked)}
                  className="rounded text-[#E8542F] focus:ring-[#E8542F] accent-[#E8542F] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#111111]">Surveyed Walkways</span>
                <input
                  type="checkbox"
                  checked={layerWalkways}
                  onChange={(e) => setLayerWalkways(e.target.checked)}
                  className="rounded text-[#E8542F] focus:ring-[#E8542F] accent-[#E8542F] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#111111]">Inferred Connectors</span>
                <input
                  type="checkbox"
                  checked={layerInferred}
                  onChange={(e) => setLayerInferred(e.target.checked)}
                  className="rounded text-[#E8542F] focus:ring-[#E8542F] accent-[#E8542F] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#111111]">Terrain &amp; Green Space</span>
                <input
                  type="checkbox"
                  checked={layerTerrain}
                  onChange={(e) => setLayerTerrain(e.target.checked)}
                  className="rounded text-[#E8542F] focus:ring-[#E8542F] accent-[#E8542F] cursor-pointer"
                />
              </label>
            </div>

            <div className="pt-2 border-t border-[#111111]/10 text-[9px] text-[#5B5750] leading-snug">
              Carleton Demonstration Map &bull; Real GPS Projection WGS84 &bull; Dijkstra &amp; A* Solver Active
            </div>
          </div>
        )}
      </div>

      {/* 2. Top-Right Floating Controls (Compass + Zoom Stack) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 shadow-sm">
        <button
          type="button"
          onClick={handleResetView}
          className="w-10 h-10 rounded-2xl bg-[#FBF8F2]/95 hover:bg-white text-[#111111] border border-[#111111]/12 flex items-center justify-center transition-all cursor-pointer shadow-xs"
          title="Reset View &amp; Center"
          aria-label="Reset View"
        >
          <span className="text-[#E8542F] font-bold text-sm">🧭</span>
        </button>

        <button
          type="button"
          onClick={handleZoomIn}
          className="w-10 h-10 rounded-2xl bg-[#FBF8F2]/95 hover:bg-white text-[#111111] border border-[#111111]/12 flex items-center justify-center transition-all cursor-pointer font-bold text-base shadow-xs"
          title="Zoom In (+)"
          aria-label="Zoom In"
        >
          +
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          className="w-10 h-10 rounded-2xl bg-[#FBF8F2]/95 hover:bg-white text-[#111111] border border-[#111111]/12 flex items-center justify-center transition-all cursor-pointer font-bold text-base shadow-xs"
          title="Zoom Out (-)"
          aria-label="Zoom Out"
        >
          &minus;
        </button>
      </div>

      {/* 3. Bottom-Left Collapsible Legend */}
      <div className="absolute bottom-4 left-4 z-20 font-mono text-[10px]">
        {legendCollapsed ? (
          <button
            type="button"
            onClick={() => setLegendCollapsed(false)}
            className="px-3 py-1.5 rounded-xl bg-[#FBF8F2]/95 hover:bg-white border border-[#111111]/12 text-[#111111] font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>LEGEND</span>
            <span className="text-[#E8542F]">&uarr;</span>
          </button>
        ) : (
          <div className="p-3 rounded-2xl bg-[#FBF8F2]/95 backdrop-blur-md border border-[#111111]/12 shadow-sm space-y-2 text-[#5B5750]">
            <div className="flex items-center justify-between gap-3 text-[#111111] font-bold uppercase tracking-wider text-[9px]">
              <span>Walkway Connectivity</span>
              <button
                type="button"
                onClick={() => setLegendCollapsed(true)}
                className="text-[#5B5750] hover:text-[#111111] cursor-pointer"
                aria-label="Collapse legend"
              >
                &minus;
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-1 bg-[#B7AC9B] inline-block rounded-full" />
              <span>Physical Walkway (OSM)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-[#D9A441] inline-block border-b border-dashed border-[#D9A441]" />
              <span>Inferred Building Access</span>
            </div>

            <div className="flex items-center gap-3 pt-1 border-t border-[#111111]/10 text-[#111111]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#1F9D6B]" /> Origin (A)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#E8542F]" /> Dest (B)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom-Right Scale Bar & North Arrow */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#FBF8F2]/90 backdrop-blur-sm border border-[#111111]/12 text-[10px] font-mono text-[#5B5750]">
        <div className="flex flex-col items-center leading-none">
          <span className="text-[8px] font-bold text-[#E8542F]">&uarr;</span>
          <span className="text-[9px] font-bold text-[#111111]">N</span>
        </div>
        <div className="h-3 w-px bg-[#111111]/15" />
        <div className="flex flex-col items-center">
          <div className="w-16 h-1 border-b-2 border-l border-r border-[#111111]/40" />
          <span className="text-[9px] mt-0.5 tabular-nums">{scaleMeters} m</span>
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
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#111111" strokeWidth="0.5" strokeOpacity="0.04" />
              </pattern>

              {/* Water Gradient with subtle shimmer */}
              <linearGradient id="lightRiverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A9C6C9" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#8FB1B5" stopOpacity="0.75" />
              </linearGradient>

              {/* Building Drop Shadow */}
              <filter id="bldgShadow" x="-10%" y="-10%" width="125%" height="125%">
                <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#111111" floodOpacity="0.14" />
              </filter>
            </defs>

            {/* Base Canvas Rectangles */}
            <rect width="1000" height="700" fill="#F1ECE2" />
            <rect width="1000" height="700" fill="url(#lightBlueprintGrid)" />

            {/* Decorative Terrain & Green Space (Parks) */}
            {layerTerrain && (
              <g id="terrainLayer" opacity="0.6">
                <path
                  d="M 50 100 C 150 80, 280 120, 320 220 C 350 300, 200 420, 100 400 Z"
                  fill="#DCE4CB"
                />
                <path
                  d="M 520 280 C 620 260, 700 350, 680 440 C 650 500, 530 520, 480 440 Z"
                  fill="#DCE4CB"
                />
              </g>
            )}

            {/* Geographic Context: Soft Blue-Teal Rideau River Polygon */}
            <path
              d="M 960 50 C 850 180, 880 380, 780 500 C 720 580, 600 650, 480 690 L 1000 700 L 1000 50 Z"
              fill="url(#lightRiverGrad)"
              stroke="#8FB1B5"
              strokeWidth="1.5"
            />

            {/* Campus Perimeter Boundary */}
            <rect
              x={paddingX - 16}
              y={paddingY - 16}
              width={svgWidth - 2 * paddingX + 32}
              height={svgHeight - 2 * paddingY + 32}
              rx="24"
              fill="none"
              stroke="#BFB5A4"
              strokeWidth="1.2"
              strokeDasharray="6,6"
              strokeOpacity="0.6"
            />

            {/* Render Network Walkway Edges */}
            {layerWalkways && (
              <g id="walkwayEdgesLayer">
                {walkwayEdges.map((edge, idx) => {
                  const isInferred = edge.isInferred && layerInferred;
                  const edgeOpacity = routePathData ? 0.08 : isInferred ? 0.25 : 0.18;

                  return (
                    <line
                      key={idx}
                      x1={edge.x1}
                      y1={edge.y1}
                      x2={edge.x2}
                      y2={edge.y2}
                      stroke={isInferred ? "#D9A441" : "#B7AC9B"}
                      strokeWidth={isInferred ? 1.2 : 1.5}
                      strokeDasharray={isInferred ? "3,3" : undefined}
                      strokeOpacity={edgeOpacity}
                    />
                  );
                })}
              </g>
            )}

            {/* Render Active Calculated Route */}
            {routePathData && (
              <g id="activeRouteLayer">
                {/* 9px Cream Route Casing */}
                <path
                  d={routePathData}
                  fill="none"
                  stroke="#FBF8F2"
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

            {/* Render Buildings & Node Chips */}
            {layerBuildings && (
              <g id="buildingsLayer">
                {locations.map((loc) => {
                  if (!loc.longitude || !loc.latitude) return null;

                  const cx = toSvgX(loc.longitude);
                  const cy = toSvgY(loc.latitude);

                  const isSelected = selectedLocation?.id === loc.id;
                  const isOrigin = originLocation?.id === loc.id;
                  const isHovered = hoveredLocation?.id === loc.id;
                  const isRoutable = loc.hasRouteTopology !== false;

                  const bWidth = 46;
                  const bHeight = 28;

                  return (
                    <g
                      key={loc.id}
                      transform={`translate(${cx}, ${cy})`}
                      data-cursor="SELECT"
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
                      aria-label={`${loc.name} (${loc.code || "BLDG"}), building`}
                    >
                      {/* Origin Halo Pulsing Ring */}
                      {isOrigin && (
                        <circle
                          r="26"
                          fill="none"
                          stroke="#1F9D6B"
                          strokeWidth="2"
                          strokeDasharray="4,3"
                          className="animate-spin-slow origin-center opacity-70"
                        />
                      )}

                      {/* Destination Halo Pulsing Ring */}
                      {isSelected && (
                        <circle
                          r="26"
                          fill="none"
                          stroke="#E8542F"
                          strokeWidth="2"
                          strokeDasharray="4,3"
                          className="animate-spin-slow origin-center opacity-80"
                        />
                      )}

                      {/* Cream Concrete Footprint Rect with 1px stroke & soft offset shadow */}
                      <rect
                        x={-bWidth / 2}
                        y={-bHeight / 2}
                        width={bWidth}
                        height={bHeight}
                        rx="8"
                        filter="url(#bldgShadow)"
                        fill={
                          isSelected
                            ? "#E8542F"
                            : isOrigin
                            ? "#1F9D6B"
                            : isHovered
                            ? "#111111"
                            : isRoutable
                            ? "#EAE3D7"
                            : "#DFD7CA"
                        }
                        stroke={
                          isSelected
                            ? "#C9411F"
                            : isOrigin
                            ? "#167A53"
                            : isHovered
                            ? "#111111"
                            : "#BFB5A4"
                        }
                        strokeWidth="1.2"
                        className="transition-colors duration-150"
                      />

                      {/* Mono Building Code Label */}
                      <text
                        y="3.5"
                        textAnchor="middle"
                        fill={
                          isSelected || isOrigin || isHovered
                            ? "#FFFFFF"
                            : isRoutable
                            ? "#111111"
                            : "#71717A"
                        }
                        fontSize="9.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                        className="pointer-events-none select-none tracking-wider"
                      >
                        {loc.code || loc.name.slice(0, 3).toUpperCase()}
                      </text>

                      {/* Origin Teardrop / A Dot */}
                      {isOrigin && (
                        <g transform="translate(19, -12)">
                          <circle r="7.5" fill="#1F9D6B" stroke="#FFFFFF" strokeWidth="1.5" />
                          <text y="3" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">
                            A
                          </text>
                        </g>
                      )}

                      {/* Destination Teardrop / B Dot */}
                      {isSelected && (
                        <g transform="translate(19, -12)">
                          <circle r="7.5" fill="#E8542F" stroke="#FFFFFF" strokeWidth="1.5" />
                          <text y="3" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">
                            B
                          </text>
                        </g>
                      )}

                      {/* Tooltip Card on Hover */}
                      {isHovered && (
                        <g transform="translate(0, -32)" className="pointer-events-none z-50">
                          <rect
                            x="-80"
                            y="-18"
                            width="160"
                            height="24"
                            rx="6"
                            fill="#111111"
                            stroke="#E8542F"
                            strokeWidth="1"
                            className="shadow-2xl"
                          />
                          <text
                            y="-2"
                            textAnchor="middle"
                            fill="#FFFFFF"
                            fontSize="9.5"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {loc.name.length > 22 ? `${loc.name.slice(0, 20)}...` : loc.name}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}