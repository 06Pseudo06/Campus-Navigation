"use client";

import React, { useState, useMemo, useCallback } from "react";
import { CampusLocation, CampusRoute } from "@/types/campus";
import {
  ZoomInIcon,
  ZoomOutIcon,
  CompassIcon,
  WalkingIcon,
} from "./DashboardIcons";

interface CarletonDemoMapProps {
  locations: CampusLocation[];
  selectedLocation: CampusLocation | null;
  originLocation: CampusLocation | null;
  onSelectLocation: (location: CampusLocation) => void;
  activeRoute: CampusRoute | null;
  showRoute: boolean;
}

export function CarletonDemoMap({
  locations,
  selectedLocation,
  originLocation,
  onSelectLocation,
  activeRoute,
  showRoute,
}: CarletonDemoMapProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [hoveredLocation, setHoveredLocation] = useState<CampusLocation | null>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetView = () => setZoom(1);

  // Compute adaptive bounding box from actual building coordinates
  const bounds = useMemo(() => {
    const lats = locations
      .map((l) => l.latitude)
      .filter((l): l is number => typeof l === "number" && !isNaN(l));
    const lons = locations
      .map((l) => l.longitude)
      .filter((l): l is number => typeof l === "number" && !isNaN(l));

    const minLat = lats.length ? Math.min(...lats) - 0.0012 : 45.380;
    const maxLat = lats.length ? Math.max(...lats) + 0.0012 : 45.389;
    const minLon = lons.length ? Math.min(...lons) - 0.0015 : -75.703;
    const maxLon = lons.length ? Math.max(...lons) + 0.0015 : -75.692;

    return { minLat, maxLat, minLon, maxLon };
  }, [locations]);

  // Coordinate projection: WGS84 GPS -> SVG ViewBox (1000 x 700)
  const paddingX = 60;
  const paddingY = 60;
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
      // Latitude decreases as Y increases in SVG coordinates
      const ratio = (bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat);
      return Math.max(paddingY, Math.min(svgHeight - paddingY, paddingY + ratio * (svgHeight - 2 * paddingY)));
    },
    [bounds]
  );

  // Build SVG path for active route using real GPS waypoints if available
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

    // Direct line fallback if waypoint coordinates are still resolving
    if (originLocation?.longitude && originLocation?.latitude && selectedLocation?.longitude && selectedLocation?.latitude) {
      const x1 = toSvgX(originLocation.longitude);
      const y1 = toSvgY(originLocation.latitude);
      const x2 = toSvgX(selectedLocation.longitude);
      const y2 = toSvgY(selectedLocation.latitude);
      return `M ${x1.toFixed(1)},${y1.toFixed(1)} L ${x2.toFixed(1)},${y2.toFixed(1)}`;
    }

    return null;
  }, [showRoute, activeRoute, originLocation, selectedLocation, toSvgX, toSvgY]);

  return (
    <div className="relative w-full h-full bg-[#070b14] overflow-hidden select-none flex flex-col justify-between">
      {/* 1. Header Demonstration Badge */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2 bg-[#0f172a]/95 backdrop-blur-md border border-[#DE4B31]/60 px-3.5 py-2 rounded-xl shadow-2xl pointer-events-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-[#DE4B31] animate-ping" />
          <div className="leading-tight">
            <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>Carleton University Live Demonstration Map</span>
            </span>
            <p className="text-[10px] text-zinc-400">
              Real GPS Projection &bull; 48 Buildings &bull; Active Dijkstra & A* Graph
            </p>
          </div>
        </div>

        {/* Route status pill */}
        {showRoute && activeRoute && (
          <div className="mt-1 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 p-2.5 rounded-xl text-xs flex items-center justify-between gap-4 pointer-events-auto max-w-sm">
            <div className="flex items-center gap-2">
              <WalkingIcon className="w-4 h-4 text-[#DE4B31] shrink-0" />
              <div className="truncate">
                <span className="text-zinc-200 font-semibold">{activeRoute.fromName}</span>
                <span className="text-zinc-500 mx-1">→</span>
                <span className="text-white font-semibold">{activeRoute.toName}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-white font-bold">{activeRoute.distanceMeters}m</span>
              <span className="text-[10px] text-zinc-400 ml-1">(~{activeRoute.estimatedWalkingMinutes} min)</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Map Control Toolbar (Top-Right) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-10 h-10 rounded-xl bg-[#111827]/90 hover:bg-[#1f2937] active:bg-zinc-700 text-zinc-200 border border-zinc-700/80 shadow-lg backdrop-blur-md flex items-center justify-center transition-all cursor-pointer"
          title="Zoom In"
        >
          <ZoomInIcon className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-10 h-10 rounded-xl bg-[#111827]/90 hover:bg-[#1f2937] active:bg-zinc-700 text-zinc-200 border border-zinc-700/80 shadow-lg backdrop-blur-md flex items-center justify-center transition-all cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOutIcon className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={handleResetView}
          className="w-10 h-10 rounded-xl bg-[#111827]/90 hover:bg-[#1f2937] active:bg-zinc-700 text-zinc-200 border border-zinc-700/80 shadow-lg backdrop-blur-md flex items-center justify-center transition-all cursor-pointer"
          title="Reset View"
        >
          <CompassIcon className="w-5 h-5 text-[#DE4B31]" />
        </button>
      </div>

      {/* 3. Bottom-Left Topology & Pathway Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-[#0f172a]/90 backdrop-blur-md border border-zinc-800 p-2.5 rounded-xl text-[10px] text-zinc-400 space-y-1.5 pointer-events-none">
        <div className="font-bold text-zinc-300 uppercase tracking-wider text-[9px]">
          Walkway Connectivity Legend
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-[#DE4B31] inline-block rounded" />
          <span>Physical Walkway (OSM Footpath)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-amber-400 inline-block rounded border-b border-dashed border-amber-400" />
          <span>Inferred Building Access (Synthetic)</span>
        </div>
        <div className="flex items-center gap-3 pt-0.5 text-zinc-300">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Origin (A)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#DE4B31]" /> Destination (B)
          </span>
        </div>
      </div>

      {/* 4. Interactive SVG Projection Canvas */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div
          className="w-full h-full transition-transform duration-300 ease-out origin-center flex items-center justify-center"
          style={{ transform: `scale(${zoom})` }}
        >
          <svg
            viewBox="0 0 1000 700"
            className="w-full h-full max-h-[85vh] object-contain drop-shadow-2xl"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Background gradient */}
              <radialGradient id="carletonGroundGrad" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="#0b1324" />
                <stop offset="100%" stopColor="#040812" />
              </radialGradient>

              {/* River water gradient */}
              <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0369a1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
              </linearGradient>

              {/* Subtle architectural coordinate grid */}
              <pattern id="demoGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.3" />
              </pattern>

              {/* Glowing active route filter */}
              <filter id="demoRouteGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Base Canvas Rectangles */}
            <rect width="1000" height="700" fill="url(#carletonGroundGrad)" />
            <rect width="1000" height="700" fill="url(#demoGrid)" />

            {/* Geographic Context: Stylized Rideau River & Canal Flanks */}
            <path
              d="M 960 50 C 850 180, 880 380, 780 500 C 720 580, 600 650, 480 690 L 1000 700 L 1000 50 Z"
              fill="url(#riverGrad)"
              stroke="#0ea5e9"
              strokeWidth="1"
              strokeOpacity="0.2"
            />

            {/* Campus Perimeter Boundary */}
            <rect
              x={paddingX - 20}
              y={paddingY - 20}
              width={svgWidth - 2 * paddingX + 40}
              height={svgHeight - 2 * paddingY + 40}
              rx="24"
              fill="none"
              stroke="#334155"
              strokeWidth="1.5"
              strokeDasharray="6,6"
              strokeOpacity="0.4"
            />

            {/* Render Active Walking Route Path */}
            {routePathData && (
              <g>
                {/* Glow underlay */}
                <path
                  d={routePathData}
                  fill="none"
                  stroke="#DE4B31"
                  strokeWidth="8"
                  strokeOpacity="0.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#demoRouteGlow)"
                />
                {/* Main animated path */}
                <path
                  d={routePathData}
                  fill="none"
                  stroke="#DE4B31"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="8,6"
                  className="animate-pulse"
                />
              </g>
            )}

            {/* Render Campus Buildings as Interactive Projected Architectural Blocks */}
            {locations.map((loc) => {
              if (!loc.longitude || !loc.latitude) return null;

              const cx = toSvgX(loc.longitude);
              const cy = toSvgY(loc.latitude);

              const isSelected = selectedLocation?.id === loc.id;
              const isOrigin = originLocation?.id === loc.id;
              const isHovered = hoveredLocation?.id === loc.id;
              const isRoutable = loc.hasRouteTopology !== false;

              // Building block dimensions
              const bWidth = 44;
              const bHeight = 28;

              return (
                <g
                  key={loc.id}
                  transform={`translate(${cx}, ${cy})`}
                  className="cursor-pointer transition-all duration-150"
                  onClick={() => onSelectLocation(loc)}
                  onMouseEnter={() => setHoveredLocation(loc)}
                  onMouseLeave={() => setHoveredLocation(null)}
                >
                  {/* Selected / Origin Ring Indicator */}
                  {isSelected && (
                    <circle
                      r="26"
                      fill="none"
                      stroke="#DE4B31"
                      strokeWidth="2"
                      strokeDasharray="4,3"
                      className="animate-spin-slow origin-center"
                    />
                  )}
                  {isOrigin && !isSelected && (
                    <circle
                      r="26"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeDasharray="4,3"
                      className="animate-spin-slow origin-center"
                    />
                  )}

                  {/* Building Polygon/Rect Representation */}
                  <rect
                    x={-bWidth / 2}
                    y={-bHeight / 2}
                    width={bWidth}
                    height={bHeight}
                    rx="6"
                    fill={
                      isSelected
                        ? "#992E1B"
                        : isOrigin
                        ? "#064e3b"
                        : isRoutable
                        ? "#1e293b"
                        : "#27272a"
                    }
                    stroke={
                      isSelected
                        ? "#DE4B31"
                        : isOrigin
                        ? "#10b981"
                        : isHovered
                        ? "#60a5fa"
                        : isRoutable
                        ? "#475569"
                        : "#71717a"
                    }
                    strokeWidth={isSelected || isOrigin || isHovered ? 2 : 1}
                    className="transition-colors duration-150"
                  />

                  {/* Building Code Label */}
                  <text
                    y="3"
                    textAnchor="middle"
                    fill={isSelected || isOrigin ? "#ffffff" : isRoutable ? "#e2e8f0" : "#a1a1aa"}
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                    className="pointer-events-none select-none"
                  >
                    {loc.code || loc.name.slice(0, 3).toUpperCase()}
                  </text>

                  {/* Pin badge for Origin (A) or Destination (B) */}
                  {isOrigin && (
                    <g transform="translate(18, -12)">
                      <circle r="7" fill="#10b981" />
                      <text y="3" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
                        A
                      </text>
                    </g>
                  )}
                  {isSelected && (
                    <g transform="translate(18, -12)">
                      <circle r="7" fill="#DE4B31" />
                      <text y="3" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
                        B
                      </text>
                    </g>
                  )}

                  {/* Warning icon for unroutable building */}
                  {!isRoutable && (
                    <g transform="translate(-18, -10)">
                      <circle r="6" fill="#f59e0b" />
                      <text y="3" textAnchor="middle" fill="#000000" fontSize="8" fontWeight="bold">
                        !
                      </text>
                    </g>
                  )}

                  {/* Tooltip on Hover */}
                  {isHovered && (
                    <g transform="translate(0, -28)" className="pointer-events-none z-50">
                      <rect
                        x="-70"
                        y="-16"
                        width="140"
                        height="20"
                        rx="4"
                        fill="#0f172a"
                        stroke="#64748b"
                        strokeWidth="1"
                        className="shadow-xl"
                      />
                      <text
                        y="-3"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9.5"
                        fontWeight="600"
                      >
                        {loc.name.length > 20 ? `${loc.name.slice(0, 18)}...` : loc.name}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
