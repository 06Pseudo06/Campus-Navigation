"use client";

import React from "react";

/**
 * CampusMapSkeleton — Architectural loading state for CampusWay interactive map.
 * Preserves viewport layout, displays a blueprint grid, animated reticle, and mono metadata.
 */
export function CampusMapSkeleton() {
  return (
    <div
      data-testid="campus-map-skeleton"
      role="status"
      aria-label="Loading interactive campus map"
      className="w-full h-full relative overflow-hidden bg-[#0a0f1d] flex items-center justify-center select-none"
    >
      {/* 1. Subtle Blueprint Vector Grid Background */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern id="skeleton-grid-sm" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.75" />
          </pattern>
          <pattern id="skeleton-grid-lg" width="120" height="120" patternUnits="userSpaceOnUse">
            <rect width="120" height="120" fill="url(#skeleton-grid-sm)" />
            <path d="M 120 0 L 0 0 0 120" fill="none" stroke="rgba(232,69,44,0.18)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#skeleton-grid-lg)" />
      </svg>

      {/* 2. Ambient Shimmer Glow */}
      <div className="absolute inset-0 bg-radial from-[#DE4B31]/10 via-transparent to-transparent animate-pulse pointer-events-none" />

      {/* 3. Central Reticle & Status Indicator */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Reticle Target */}
        <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-white/10 animate-ping opacity-25" />
          <div className="w-16 h-16 rounded-full border border-white/20 border-dashed animate-spin [animation-duration:12s] flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border border-[#DE4B31]/60 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-[#DE4B31] animate-pulse" />
            </div>
          </div>
          {/* Crosshairs */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-white/20" />
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-white/20" />
        </div>

        {/* Technical Mono Typography */}
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-white/[0.04] border border-white/10 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DE4B31] animate-ping" />
          <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-zinc-300">
            ENGINE INITIALIZING
          </span>
        </div>

        <h3 className="text-sm font-semibold tracking-wide text-zinc-200 uppercase font-mono">
          Loading Campus Spatial Engine
        </h3>
        <p className="text-xs text-zinc-500 font-mono mt-1 tracking-wider">
          MAPBOX GL · DATASET C · SURVEYED ANCHORS
        </p>
      </div>

      {/* 4. Corner Coordinate Readouts (Architectural Framing) */}
      <div className="absolute top-4 left-4 font-mono text-[10px] text-zinc-600 tracking-widest hidden sm:block">
        31°15′38.0″N 75°42′24.5″E
      </div>
      <div className="absolute top-4 right-4 font-mono text-[10px] text-zinc-600 tracking-widest hidden sm:block">
        ELEV 235M · EPSG:4326
      </div>
      <div className="absolute bottom-4 left-4 font-mono text-[10px] text-zinc-600 tracking-widest hidden sm:block">
        CAMPUSWAY MAP RUNTIME
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[10px] text-zinc-600 tracking-widest hidden sm:block">
        TILES STREAMING...
      </div>
    </div>
  );
}
