"use client";

import React, { useState } from "react";
import { CampusLocation, CampusRoute, MapDisplayMode, MapLayerMode } from "@/types/campus";
import { CarletonDemoMap } from "./CarletonDemoMap";
import {
  ZoomInIcon,
  ZoomOutIcon,
  CompassIcon,
  LayersIcon,
  WalkingIcon,
  AccessibilityIcon,
} from "./DashboardIcons";

interface CampusMapProps {
  locations: CampusLocation[];
  selectedLocation: CampusLocation | null;
  originLocation?: CampusLocation | null;
  onSelectLocation: (location: CampusLocation) => void;
  activeRoute: CampusRoute | null;
  showRoute: boolean;
  mapDisplayMode?: MapDisplayMode;
  onToggleMapMode?: (mode: MapDisplayMode) => void;
}

export function CampusMap({
  locations,
  selectedLocation,
  originLocation = null,
  onSelectLocation,
  activeRoute,
  showRoute,
  mapDisplayMode: controlledMode,
  onToggleMapMode,
}: CampusMapProps) {
  const [internalMode, setInternalMode] = useState<MapDisplayMode>("carleton_demo");
  const currentMode = controlledMode ?? internalMode;

  const handleModeChange = (mode: MapDisplayMode) => {
    if (onToggleMapMode) {
      onToggleMapMode(mode);
    } else {
      setInternalMode(mode);
    }
  };

  const [zoom, setZoom] = useState<number>(1);
  const [layer, setLayer] = useState<MapLayerMode>("standard");
  const [layerMenuOpen, setLayerMenuOpen] = useState<boolean>(false);
  const [hoveredLocation, setHoveredLocation] = useState<CampusLocation | null>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetView = () => setZoom(1);

  // SVG coordinate viewBox: 1000 x 700
  const toSvgX = (pct: number) => (pct / 100) * 1000;
  const toSvgY = (pct: number) => (pct / 100) * 700;

  // Build SVG path string for the route
  const routePathD = activeRoute?.waypoints?.length
    ? activeRoute.waypoints.reduce((acc, pt, i) => {
        const x = toSvgX(pt.x);
        const y = toSvgY(pt.y);
        return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
      }, "")
    : "";

  return (
    <div className="relative w-full h-full bg-[#0a0f1d] overflow-hidden select-none flex flex-col justify-between">
      {/* Top Campus View Switcher Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center bg-[#111827]/95 border border-zinc-700/80 p-1 rounded-xl shadow-2xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => handleModeChange("carleton_demo")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            currentMode === "carleton_demo"
              ? "bg-[#DE4B31] text-white shadow-md"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Carleton Live Demo (GPS)
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("lpu_concept")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            currentMode === "lpu_concept"
              ? "bg-[#DE4B31] text-white shadow-md"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          LPU Concept (Blueprint)
        </button>
      </div>

      {/* Render Carleton Live GPS Projection Map */}
      {currentMode === "carleton_demo" ? (
        <CarletonDemoMap
          locations={locations}
          selectedLocation={selectedLocation}
          originLocation={originLocation}
          onSelectLocation={onSelectLocation}
          activeRoute={activeRoute}
          showRoute={showRoute}
        />
      ) : (
        <>
          {/* LPU Blueprint Campus View Mode */}
          <div className="absolute top-16 left-4 z-20 bg-amber-950/80 border border-amber-700/60 text-amber-300 text-[11px] px-3 py-1.5 rounded-xl backdrop-blur-md shadow-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>LPU Campus Concept Blueprint &bull; Switch to Carleton Live Demo for live GPS routing data</span>
          </div>
      {/* Map Control Toolbar (Top-Right) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {/* Zoom In */}
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-10 h-10 rounded-xl bg-[#111827]/90 hover:bg-[#1f2937] active:bg-zinc-700 text-zinc-200 border border-zinc-700/80 shadow-lg backdrop-blur-md flex items-center justify-center transition-all cursor-pointer"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomInIcon className="w-5 h-5" />
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-10 h-10 rounded-xl bg-[#111827]/90 hover:bg-[#1f2937] active:bg-zinc-700 text-zinc-200 border border-zinc-700/80 shadow-lg backdrop-blur-md flex items-center justify-center transition-all cursor-pointer"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOutIcon className="w-5 h-5" />
        </button>

        {/* Compass / Reset View */}
        <button
          type="button"
          onClick={handleResetView}
          className="w-10 h-10 rounded-xl bg-[#111827]/90 hover:bg-[#1f2937] active:bg-zinc-700 text-zinc-200 border border-zinc-700/80 shadow-lg backdrop-blur-md flex items-center justify-center transition-all cursor-pointer"
          title="Reset View & Center"
          aria-label="Reset View"
        >
          <CompassIcon className="w-5 h-5 text-[#DE4B31]" />
        </button>

        {/* Layer Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLayerMenuOpen(!layerMenuOpen)}
            className={`w-10 h-10 rounded-xl border shadow-lg backdrop-blur-md flex items-center justify-center transition-all cursor-pointer ${
              layerMenuOpen || layer !== "standard"
                ? "bg-[#DE4B31] text-white border-[#DE4B31]"
                : "bg-[#111827]/90 hover:bg-[#1f2937] text-zinc-200 border-zinc-700/80"
            }`}
            title="Map Layer"
            aria-label="Map Layer"
          >
            <LayersIcon className="w-5 h-5" />
          </button>

          {/* Layer selection dropdown */}
          {layerMenuOpen && (
            <div className="absolute right-12 top-0 w-44 rounded-xl bg-[#111827] border border-zinc-700 shadow-2xl p-1.5 z-30">
              <span className="block px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Map View Layer
              </span>
              {(
                [
                  { id: "standard", label: "Campus Standard" },
                  { id: "blueprint", label: "CAD Blueprint" },
                  { id: "satellite", label: "Satellite Tint" },
                  { id: "accessibility", label: "Accessibility Ramps" },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    setLayer(mode.id);
                    setLayerMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    layer === mode.id
                      ? "bg-[#DE4B31] text-white"
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

      {/* Floating Route Info Banner (When route active) */}
      {showRoute && activeRoute && (
        <div className="absolute top-4 left-4 z-20 max-w-sm rounded-2xl bg-[#0f172a]/95 backdrop-blur-md border border-[#DE4B31]/60 shadow-2xl p-3.5 text-zinc-100 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#DE4B31]/20 border border-[#DE4B31]/40 flex items-center justify-center text-[#DE4B31]">
                <WalkingIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Route Preview &bull; {activeRoute.toName}
                </p>
                <p className="text-[11px] text-zinc-400">
                  From {activeRoute.fromName}
                </p>
              </div>
            </div>

            <div className="text-right">
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
              <AccessibilityIcon className="w-3 h-3" /> Step-free walkway
            </span>
            <span className="font-mono text-zinc-500">Sample route preview</span>
          </div>
        </div>
      )}

      {/* Campus Map SVG Canvas Area */}
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
              {/* Radial gradient for campus ground */}
              <radialGradient id="campusGroundGrad" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor={layer === "blueprint" ? "#071329" : layer === "satellite" ? "#0b1c14" : "#111b2b"} />
                <stop offset="100%" stopColor={layer === "blueprint" ? "#030814" : layer === "satellite" ? "#060d09" : "#090d18"} />
              </radialGradient>

              {/* Grid pattern for blueprint layer */}
              <pattern id="blueprintGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0ea5e9" strokeWidth="0.5" strokeOpacity="0.15" />
              </pattern>

              {/* Lawn Pattern */}
              <linearGradient id="lawnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={layer === "blueprint" ? "#0e3a53" : "#0f2f21"} />
                <stop offset="100%" stopColor={layer === "blueprint" ? "#062235" : "#0a1f16"} />
              </linearGradient>

              {/* Water feature gradient */}
              <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>

              {/* Glowing Route Filter */}
              <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 1. Base Map Ground Background */}
            <rect width="1000" height="700" fill="url(#campusGroundGrad)" />

            {/* Blueprint Grid Overlay if blueprint layer */}
            {layer === "blueprint" && (
              <rect width="1000" height="700" fill="url(#blueprintGrid)" />
            )}

            {/* 2. Landscaped Lawns and Quads */}
            {/* North Lawn */}
            <rect x="220" y="80" width="560" height="80" rx="16" fill="url(#lawnGrad)" stroke="#1a4731" strokeWidth="1" opacity="0.8" />
            {/* Central Quad Lawn */}
            <rect x="380" y="320" width="240" height="150" rx="20" fill="url(#lawnGrad)" stroke="#1a4731" strokeWidth="1" opacity="0.9" />
            {/* West Lawn */}
            <rect x="80" y="350" width="160" height="240" rx="20" fill="url(#lawnGrad)" stroke="#1a4731" strokeWidth="1" opacity="0.7" />
            {/* East Athletic Field */}
            <rect x="760" y="360" width="180" height="240" rx="24" fill="url(#lawnGrad)" stroke="#1a4731" strokeWidth="1" opacity="0.7" />

            {/* Running Track in Sports Arena (West) */}
            <rect x="90" y="160" width="180" height="130" rx="45" fill="none" stroke="#e11d48" strokeWidth="5" opacity="0.4" strokeDasharray="6,4" />

            {/* 3. Campus Ring Road & Main Avenues */}
            <g stroke={layer === "blueprint" ? "#1e293b" : "#1e293b"} fill="none">
              {/* Outer Perimeter Ring Road */}
              <rect x="40" y="40" width="920" height="620" rx="36" stroke="#2a374a" strokeWidth="16" />
              <rect x="40" y="40" width="920" height="620" rx="36" stroke="#fbbf24" strokeWidth="1" strokeDasharray="12,12" opacity="0.4" />

              {/* Central Pedestrian Boulevard */}
              <path d="M 500 660 L 500 50 L 500 40" stroke="#374151" strokeWidth="22" strokeLinecap="round" />
              <path d="M 500 660 L 500 50" stroke="#e5e7eb" strokeWidth="1.5" strokeDasharray="8,8" opacity="0.3" />

              {/* East-West Central Connector Promenade */}
              <path d="M 50 380 L 950 380" stroke="#374151" strokeWidth="18" strokeLinecap="round" />
              {/* Diagonal Walkway Connections */}
              <path d="M 180 600 L 500 380 L 820 600" stroke="#2d3748" strokeWidth="10" strokeLinecap="round" />
              <path d="M 240 180 L 500 380 L 760 180" stroke="#2d3748" strokeWidth="10" strokeLinecap="round" />
              <path d="M 500 520 L 700 520 L 700 320" stroke="#2d3748" strokeWidth="12" strokeLinecap="round" />
            </g>

            {/* 4. Central Plaza & Fountain (Water Feature) */}
            <circle cx="500" cy="380" r="55" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
            <circle cx="500" cy="380" r="38" fill="url(#waterGrad)" />
            <circle cx="500" cy="380" r="16" fill="#38bdf8" opacity="0.7" />
            <circle cx="500" cy="380" r="6" fill="#ffffff" />

            {/* 5. Building Footprints & Architectural 3D Blocks */}
            {locations.map((loc) => {
              if (!loc.buildingShape) return null;
              const { x, y, width, height, radius = 4, color = "#4b5563" } = loc.buildingShape;
              const svgX = toSvgX(x);
              const svgY = toSvgY(y);
              const svgW = toSvgX(width);
              const svgH = toSvgY(height);

              const isSelected = selectedLocation?.id === loc.id;
              const isHovered = hoveredLocation?.id === loc.id;

              return (
                <g
                  key={loc.id}
                  className="cursor-pointer transition-transform duration-200"
                  onClick={() => onSelectLocation(loc)}
                  onMouseEnter={() => setHoveredLocation(loc)}
                  onMouseLeave={() => setHoveredLocation(null)}
                >
                  {/* Building Drop Shadow */}
                  <rect
                    x={svgX + 4}
                    y={svgY + 6}
                    width={svgW}
                    height={svgH}
                    rx={radius}
                    fill="#000000"
                    opacity="0.6"
                  />

                  {/* Selected building glow effect */}
                  {isSelected && (
                    <rect
                      x={svgX - 5}
                      y={svgY - 5}
                      width={svgW + 10}
                      height={svgH + 10}
                      rx={radius + 3}
                      fill="none"
                      stroke="#DE4B31"
                      strokeWidth="3.5"
                      strokeDasharray="6,4"
                      className="animate-pulse"
                    />
                  )}

                  {/* Building Primary Body */}
                  <rect
                    x={svgX}
                    y={svgY}
                    width={svgW}
                    height={svgH}
                    rx={radius}
                    fill={isSelected ? "#DE4B31" : isHovered ? "#374151" : "#1f293d"}
                    stroke={isSelected ? "#fca5a5" : isHovered ? "#9ca3af" : "#374151"}
                    strokeWidth={isSelected ? "2" : "1"}
                  />

                  {/* Building Accent Top Banner / Roof detail */}
                  <rect
                    x={svgX}
                    y={svgY}
                    width={svgW}
                    height={Math.max(6, svgH * 0.18)}
                    rx={radius}
                    fill={color}
                    opacity="0.85"
                  />

                  {/* Building Code Label */}
                  <text
                    x={svgX + svgW / 2}
                    y={svgY + svgH / 2 + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={svgW > 100 ? "13" : "11"}
                    fontWeight="700"
                    fontFamily="sans-serif"
                    letterSpacing="0.5px"
                  >
                    {loc.code}
                  </text>

                  {/* Building Name Subtitle on larger blocks */}
                  <text
                    x={svgX + svgW / 2}
                    y={svgY + svgH + 16}
                    textAnchor="middle"
                    fill={isSelected ? "#fca5a5" : "#e2e8f0"}
                    fontSize="11"
                    fontWeight={isSelected ? "700" : "600"}
                    fontFamily="sans-serif"
                  >
                    {loc.name}
                  </text>
                </g>
              );
            })}

            {/* 6. Active Animated Route Line (When View Route is Active) */}
            {showRoute && routePathD && (
              <g filter="url(#routeGlow)">
                {/* Background route casing */}
                <path
                  d={routePathD}
                  fill="none"
                  stroke="#111827"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Solid glow stroke */}
                <path
                  d={routePathD}
                  fill="none"
                  stroke="#DE4B31"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Animated dash stroke moving along the path */}
                <path
                  d={routePathD}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeDasharray="8,8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-[dash_1.5s_linear_infinite]"
                  style={{
                    strokeDashoffset: 16,
                  }}
                />

                {/* Start Pin Marker: Main Gate */}
                {activeRoute?.waypoints?.[0] && (
                  <g transform={`translate(${toSvgX(activeRoute.waypoints[0].x)}, ${toSvgY(activeRoute.waypoints[0].y)})`}>
                    <circle r="12" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
                    <circle r="5" fill="#ffffff" />
                    <rect x="-40" y="-36" width="80" height="20" rx="6" fill="#10b981" />
                    <text x="0" y="-22" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                      START: GATE
                    </text>
                  </g>
                )}

                {/* End Pin Marker: Destination */}
                {activeRoute?.waypoints?.[activeRoute.waypoints.length - 1] && (
                  <g
                    transform={`translate(${toSvgX(
                      activeRoute.waypoints[activeRoute.waypoints.length - 1].x
                    )}, ${toSvgY(
                      activeRoute.waypoints[activeRoute.waypoints.length - 1].y
                    )})`}
                  >
                    <circle r="14" fill="#DE4B31" stroke="#ffffff" strokeWidth="2.5" className="animate-ping" opacity="0.3" />
                    <circle r="12" fill="#DE4B31" stroke="#ffffff" strokeWidth="2.5" />
                    <circle r="5" fill="#ffffff" />
                    <rect x="-46" y="-36" width="92" height="20" rx="6" fill="#DE4B31" />
                    <text x="0" y="-22" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                      DESTINATION
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* 7. North Compass Arrow on Map */}
            <g transform="translate(940, 70)">
              <circle r="22" fill="#111827" stroke="#374151" strokeWidth="1.5" />
              <polygon points="0,-16 6,0 0,-4 -6,0" fill="#DE4B31" />
              <polygon points="0,16 6,0 0,4 -6,0" fill="#9ca3af" />
              <text x="0" y="-7" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                N
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Map Footer Bar with Legend & Scale */}
      <div className="h-10 px-4 bg-[#0a0f1d]/90 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#DE4B31]" />
            <span>Academic Buildings</span>
          </div>
          <div className="flex items-center gap-1.5 hidden sm:flex">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" />
            <span>Campus Gates</span>
          </div>
          <div className="flex items-center gap-1.5 hidden sm:flex">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#3b82f6]" />
            <span>Water / Plaza</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-zinc-500">
            Scale: 1:1250 (Interactive Mockup)
          </span>
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>
        </>
      )}
    </div>
  );
}



























































