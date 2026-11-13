"use client";

import React, { useState } from "react";
import Link from "next/link";

interface DemoRoute {
  id: string;
  name: string;
  origin: string;
  originCode: string;
  destination: string;
  destCode: string;
  distance: string;
  duration: string;
  algorithm: string;
  description: string;
  steps: string[];
}

const DEMO_ROUTES: DemoRoute[] = [
  {
    id: "route-1",
    name: "MacOdrum Library → Paterson Hall",
    origin: "MacOdrum Library",
    originCode: "ML",
    destination: "Paterson Hall",
    destCode: "PA",
    distance: "133.9 m",
    duration: "1.7 min",
    algorithm: "Dijkstra Optimal",
    description: "Central Quad pedestrian corridor connecting humanities faculty to campus library.",
    steps: [
      "Depart MacOdrum Library main entrance heading East",
      "Follow quad concourse footpath for 48.0 meters",
      "Arrive at Paterson Hall ground-level entrance (85.9 meters)",
    ],
  },
  {
    id: "route-2",
    name: "ARISE Building → Alumni Hall",
    origin: "ARISE Building",
    originCode: "AR",
    destination: "Alumni Hall",
    destCode: "AH",
    distance: "1,581.7 m",
    duration: "20.3 min",
    algorithm: "A* Heuristic",
    description: "Long-distance campus transit traversing science research centers and athletics quads.",
    steps: [
      "Exit ARISE Building via campus perimeter walkway",
      "Head south towards university transit hub (420.0 meters)",
      "Traverse central pedestrian boulevard past CTTC (680.0 meters)",
      "Arrive at Alumni Hall main foyer entrance (481.7 meters)",
    ],
  },
  {
    id: "route-3",
    name: "Mackenzie Building → Richcraft Hall",
    origin: "Mackenzie Building",
    originCode: "ME",
    destination: "Richcraft Hall",
    destCode: "RB",
    distance: "387.4 m",
    duration: "5.0 min",
    algorithm: "Dijkstra Optimal",
    description: "Engineering quadrangle connection with ramp accessibility and level grade entries.",
    steps: [
      "Exit Mackenzie Engineering foyer onto Campus Avenue",
      "Follow sidewalk past River Building perimeter (190.0 meters)",
      "Arrive at Richcraft Hall atrium and journalism wing (197.4 meters)",
    ],
  },
];

export function MapPreviewSection() {
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);
  const activeRoute = DEMO_ROUTES[activeRouteIndex];

  return (
    <section
      id="routes"
      className="relative w-full bg-[#FAF8F5] text-[#111111] py-24 lg:py-36 border-b border-[#1A1A1A]/10 overflow-hidden"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[#1A1A1A]/15 pb-6">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold tracking-widest text-[#D9532F] uppercase">
              {"//"} 02 &bull; TOPOLOGY &amp; LIVE DEMONSTRATION
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#111111] uppercase leading-none">
              REAL ROUTE GRAPH SOLVER.
            </h2>
          </div>
          <p className="text-xs font-mono text-[#88847C] uppercase max-w-xs">
            Test pre-solved pedestrian trajectories computed across 1,957 Carleton quad vertices.
          </p>
        </div>

        {/* Route Selectors (Tabs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {DEMO_ROUTES.map((route, idx) => {
            const isActive = idx === activeRouteIndex;
            return (
              <button
                key={route.id}
                type="button"
                onClick={() => setActiveRouteIndex(idx)}
                className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                  isActive
                    ? "bg-white border-[#D9532F] shadow-sm"
                    : "bg-white/50 hover:bg-white border-[#1A1A1A]/10 text-[#5A5854]"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className={`font-semibold ${isActive ? "text-[#D9532F]" : "text-[#88847C]"}`}>
                    ROUTE 0{idx + 1}
                  </span>
                  <span className="text-[11px] font-bold text-[#111111]">{route.distance}</span>
                </div>
                <h4 className="text-sm font-bold text-[#111111] truncate font-mono">
                  {route.name}
                </h4>
                <p className="text-xs text-[#88847C] font-mono mt-1">
                  Est. {route.duration} &bull; {route.algorithm}
                </p>
              </button>
            );
          })}
        </div>

        {/* Interactive Routing Preview Card */}
        <div className="rounded-3xl bg-white border border-[#1A1A1A]/15 p-6 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Route Metrics & Turn Guidance */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-[#D9532F]/10 text-[#D9532F] text-xs font-mono font-bold uppercase tracking-wider">
                {activeRoute.algorithm}
              </span>
              <span className="text-xs font-mono text-[#88847C]">
                WALKING DURATION: {activeRoute.duration}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold font-mono text-[#111111]">
              {activeRoute.name}
            </h3>

            <p className="text-sm text-[#5A5854] font-normal leading-relaxed">
              {activeRoute.description}
            </p>

            {/* Turn Guidance Sequence */}
            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#88847C]">
                Turn-by-Turn Guidance:
              </span>
              <div className="space-y-2 font-mono text-xs">
                {activeRoute.steps.map((step, sIdx) => (
                  <div
                    key={sIdx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF8F5] border border-[#1A1A1A]/05 text-[#111111]"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#D9532F] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {sIdx + 1}
                    </span>
                    <span className="leading-snug">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Jump to Full Explore CTA */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                href="/explore"
                className="px-7 py-3.5 rounded-full bg-[#111111] hover:bg-[#222222] text-white text-xs font-mono font-bold tracking-widest uppercase transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <span>LAUNCH INTERACTIVE EXPLORE MAP</span>
                <span className="text-[#D9532F]">&rarr;</span>
              </Link>
              <span className="text-xs font-mono text-[#88847C]">
                Full 48-building dataset live
              </span>
            </div>
          </div>

          {/* Right Column: Architectural Schematic Diagram */}
          <div className="lg:col-span-5 relative aspect-square w-full rounded-2xl bg-[#FAF8F5] border border-[#1A1A1A]/10 p-6 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#88847C]">
              <span>CARLETON DEMO QUAD</span>
              <span className="text-[#D9532F]">SCALE 1:500</span>
            </div>

            {/* Architectural SVG Path Wireframe */}
            <div className="relative flex-1 flex items-center justify-center py-4">
              <svg className="w-full h-full max-h-[260px]" viewBox="0 0 280 220" fill="none">
                {/* Subtle Grid Lines */}
                <path d="M20 40H260 M20 110H260 M20 180H260" stroke="#1A1A1A" strokeOpacity="0.08" strokeDasharray="4 4" />
                <path d="M60 20V200 M140 20V200 M220 20V200" stroke="#1A1A1A" strokeOpacity="0.08" strokeDasharray="4 4" />

                {/* Building Footprint Outlines */}
                <rect x="30" y="30" width="60" height="45" rx="4" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="1.5" />
                <text x="60" y="57" textAnchor="middle" fill="#111111" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  {activeRoute.originCode}
                </text>

                <rect x="180" y="140" width="70" height="50" rx="4" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="1.5" />
                <text x="215" y="170" textAnchor="middle" fill="#111111" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  {activeRoute.destCode}
                </text>

                <rect x="160" y="30" width="55" height="40" rx="4" fill="#FFFFFF" stroke="#1A1A1A" strokeOpacity="0.3" />
                <rect x="40" y="145" width="60" height="40" rx="4" fill="#FFFFFF" stroke="#1A1A1A" strokeOpacity="0.3" />

                {/* Active Walking Route Line */}
                <path
                  d="M90 52 C 140 52, 120 165, 180 165"
                  stroke="#D9532F"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="6 4"
                />

                {/* Origin Marker */}
                <circle cx="90" cy="52" r="5" fill="#D9532F" />
                <circle cx="90" cy="52" r="9" stroke="#D9532F" strokeOpacity="0.4" />

                {/* Destination Marker */}
                <circle cx="180" cy="165" r="5" fill="#111111" />
                <circle cx="180" cy="165" r="9" stroke="#111111" strokeOpacity="0.4" />
              </svg>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#88847C] pt-2 border-t border-[#1A1A1A]/10">
              <span>ACTIVE VERTICES: 9</span>
              <span className="text-[#D9532F]">{activeRoute.distance} &bull; {activeRoute.duration}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
