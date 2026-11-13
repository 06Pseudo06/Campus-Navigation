"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface RouteOption {
  id: string;
  name: string;
  fromName: string;
  fromCode: string;
  toName: string;
  toCode: string;
  duration: string;
  distance: string;
  isAccessible: boolean;
  svgPath: string;
  fromPos: { x: number; y: number };
  toPos: { x: number; y: number };
}

const ROUTE_OPTIONS: RouteOption[] = [
  {
    id: "route-1",
    name: "MacOdrum Library to Paterson Hall",
    fromName: "MacOdrum Library",
    fromCode: "ML",
    toName: "Paterson Hall",
    toCode: "PA",
    duration: "1.7 min",
    distance: "133.9 m",
    isAccessible: true,
    svgPath: "M 130 145 L 210 145 L 210 215 L 340 215",
    fromPos: { x: 130, y: 145 },
    toPos: { x: 340, y: 215 },
  },
  {
    id: "route-2",
    name: "ARISE Building to Alumni Hall",
    fromName: "ARISE Building",
    fromCode: "AR",
    toName: "Alumni Hall",
    toCode: "AH",
    duration: "20.3 min",
    distance: "1,581.7 m",
    isAccessible: true,
    svgPath: "M 100 80 L 190 80 L 190 190 L 370 190 L 370 240",
    fromPos: { x: 100, y: 80 },
    toPos: { x: 370, y: 240 },
  },
  {
    id: "route-3",
    name: "Mackenzie Building to Richcraft Hall",
    fromName: "Mackenzie Building",
    fromCode: "ME",
    toName: "Richcraft Hall",
    toCode: "RB",
    duration: "5.0 min",
    distance: "387.4 m",
    isAccessible: true,
    svgPath: "M 140 230 L 140 130 L 290 130 L 290 90",
    fromPos: { x: 140, y: 230 },
    toPos: { x: 290, y: 90 },
  },
];

export function MapPreviewSection() {
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const route = ROUTE_OPTIONS[selectedRouteIndex];

  return (
    <section
      id="routes"
      className="relative w-full bg-[#F7F3ED] text-[#151515] py-20 lg:py-32 border-b border-[#151515]/10 overflow-hidden"
      aria-label="Live Routing Preview"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Section Header */}
        <div className="flex items-center gap-3 text-xs font-mono font-bold tracking-widest uppercase text-[#151515] pb-8 border-b border-[#151515]/10 mb-12 sm:mb-16">
          <span className="text-[#E6532E]">03 /</span>
          <span>LIVE ROUTING</span>
        </div>

        {/* 2-Column Split: Editorial Architecture Copy vs Dark Modern Map Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Building Facade Thumbnail + Headline + Copy + Button */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
            {/* Visual Architecture Image (Warm Amber Windows) */}
            <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden bg-[#151515] border border-[#151515]/15 shadow-sm">
              <Image
                src="/images/closing-architecture.jpg"
                alt="University academic hall at dusk with warm glowing interior windows"
                fill
                sizes="(max-width: 1024px) 100vw, 450px"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#151515]/70 via-transparent to-transparent flex items-end p-4">
                <span className="text-[10px] font-mono tracking-widest uppercase text-white/90">
                  CAMPUS_QUAD {"//"} ARCHITECTURAL ELEVATION
                </span>
              </div>
            </div>

            {/* Headline: REAL ROUTES. REAL CAMPUS. */}
            <h2 className="text-4xl sm:text-5xl lg:text-[3.2rem] font-black tracking-tight leading-[0.98] uppercase text-[#151515]">
              <span>REAL ROUTES.</span> <br />
              <span className="text-[#E6532E]">REAL CAMPUS.</span>
            </h2>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-[#5A5854] font-normal leading-relaxed">
              See CampusWay in action with an interactive map and step-by-step
              walking guidance.
            </p>

            {/* CTA: TRY THE LIVE MAP ↗ (Charcoal Pill) */}
            <div className="pt-2">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#151515] hover:bg-[#282828] active:bg-[#000000] text-white text-xs sm:text-sm font-bold tracking-widest uppercase transition-all shadow-md hover:shadow-xl group cursor-pointer"
              >
                <span>TRY THE LIVE MAP</span>
                <span className="text-[#E6532E] font-bold text-sm transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
                  ↗
                </span>
              </Link>
            </div>
          </div>

          {/* Right Column: DARK MODERN INTERACTIVE MAP CARD (#161922) */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl bg-[#161922] border border-[#282D3C] p-6 sm:p-8 shadow-2xl text-white space-y-6">
              {/* Top Controls: Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Origin Dropdown */}
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#1D2230] border border-[#2E364B] text-xs font-mono">
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-white/60">From</span>
                    <span className="text-white font-semibold truncate">
                      {route.fromName} ({route.fromCode})
                    </span>
                  </div>
                  <span className="text-white/40 text-[10px] ml-2">▾</span>
                </div>

                {/* Destination Dropdown */}
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#1D2230] border border-[#2E364B] text-xs font-mono">
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E6532E] shrink-0" />
                    <span className="text-white/60">To</span>
                    <span className="text-white font-semibold truncate">
                      {route.toName} ({route.toCode})
                    </span>
                  </div>
                  <span className="text-white/40 text-[10px] ml-2">▾</span>
                </div>
              </div>

              {/* Metrics Pill & Route Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {/* Route Summary Pill */}
                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#202738] border border-[#313B53] text-xs font-mono text-white/90">
                  <span className="text-sm">♿</span>
                  <span className="font-bold text-[#E6532E]">
                    {route.duration} ({route.distance})
                  </span>
                  <span className="text-white/50">&bull;</span>
                  <span className="text-white/70">Accessible route</span>
                </div>

                {/* Quick Route Selector Buttons */}
                <div className="flex items-center gap-1.5 text-[11px] font-mono">
                  {ROUTE_OPTIONS.map((opt, idx) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedRouteIndex(idx)}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        idx === selectedRouteIndex
                          ? "bg-[#E6532E] text-white font-bold"
                          : "bg-[#1D2230] text-white/60 hover:text-white"
                      }`}
                    >
                      {opt.fromCode}&rarr;{opt.toCode}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3D Quad Map Graphic Area */}
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-2xl bg-[#0F1218] border border-[#242A3A] overflow-hidden flex items-center justify-center">
                {/* Subtle Campus Grid Lines */}
                <div
                  className="absolute inset-0 opacity-15"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: "32px 32px",
                  }}
                />

                {/* Expand / Fullscreen Button in Top Right */}
                <Link
                  href="/explore"
                  className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-lg bg-[#1E2332] hover:bg-[#2A3247] border border-[#333C54] text-white/80 hover:text-white flex items-center justify-center text-xs transition-colors shadow-md"
                  aria-label="Open full map"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                    />
                  </svg>
                </Link>

                {/* SVG Isometric 3D Map Rendering */}
                <svg
                  className="w-full h-full p-6 select-none"
                  viewBox="0 0 460 300"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    {/* Glowing Route Filter */}
                    <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Isometric Building Footprints (Dark Slate with Subtle Bevels) */}
                  {/* Building 1 (Top Left) */}
                  <polygon
                    points="70,60 140,30 200,60 130,90"
                    fill="#1C212E"
                    stroke="#2D3549"
                    strokeWidth="1.5"
                  />
                  <polygon
                    points="70,60 130,90 130,120 70,90"
                    fill="#151924"
                    stroke="#2D3549"
                    strokeWidth="1.5"
                  />
                  <polygon
                    points="130,90 200,60 200,90 130,120"
                    fill="#181D2A"
                    stroke="#2D3549"
                    strokeWidth="1.5"
                  />

                  {/* Building 2 (MacOdrum Library ML - Center Left) */}
                  <polygon
                    points="90,140 160,110 210,135 140,165"
                    fill="#22293A"
                    stroke="#38435E"
                    strokeWidth="1.5"
                  />
                  <polygon
                    points="90,140 140,165 140,200 90,175"
                    fill="#191F2D"
                    stroke="#38435E"
                    strokeWidth="1.5"
                  />
                  <polygon
                    points="140,165 210,135 210,170 140,200"
                    fill="#1C2232"
                    stroke="#38435E"
                    strokeWidth="1.5"
                  />

                  {/* Building 3 (Paterson Hall PA - Bottom Right) */}
                  <polygon
                    points="300,200 370,170 420,195 350,225"
                    fill="#22293A"
                    stroke="#38435E"
                    strokeWidth="1.5"
                  />
                  <polygon
                    points="300,200 350,225 350,260 300,235"
                    fill="#191F2D"
                    stroke="#38435E"
                    strokeWidth="1.5"
                  />
                  <polygon
                    points="350,225 420,195 420,230 350,260"
                    fill="#1C2232"
                    stroke="#38435E"
                    strokeWidth="1.5"
                  />

                  {/* Building 4 (Top Right) */}
                  <polygon
                    points="280,70 350,40 400,65 330,95"
                    fill="#1C212E"
                    stroke="#2D3549"
                    strokeWidth="1.5"
                  />
                  <polygon
                    points="280,70 330,95 330,125 280,100"
                    fill="#151924"
                    stroke="#2D3549"
                    strokeWidth="1.5"
                  />
                  <polygon
                    points="330,95 400,65 400,95 330,125"
                    fill="#181D2A"
                    stroke="#2D3549"
                    strokeWidth="1.5"
                  />

                  {/* Active Walking Route Path with Glowing Orange Line */}
                  <path
                    d={route.svgPath}
                    stroke="#E6532E"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#routeGlow)"
                  />
                  <path
                    d={route.svgPath}
                    stroke="#FFA27E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Animated Route Dot */}
                  <circle
                    cx={route.toPos.x}
                    cy={route.toPos.y}
                    r="5"
                    fill="#FFA27E"
                    className="animate-ping"
                  />

                  {/* Origin Marker Badge (ML) */}
                  <g transform={`translate(${route.fromPos.x - 20}, ${route.fromPos.y - 32})`}>
                    <rect
                      width="40"
                      height="22"
                      rx="11"
                      fill="#FFFFFF"
                      filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
                    />
                    <text
                      x="20"
                      y="15"
                      textAnchor="middle"
                      fill="#151515"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {route.fromCode}
                    </text>
                  </g>

                  {/* Destination Marker Badge (PA) */}
                  <g transform={`translate(${route.toPos.x - 20}, ${route.toPos.y - 32})`}>
                    <rect
                      width="40"
                      height="22"
                      rx="11"
                      fill="#FFFFFF"
                      filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
                    />
                    <text
                      x="20"
                      y="15"
                      textAnchor="middle"
                      fill="#E6532E"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {route.toCode}
                    </text>
                  </g>
                </svg>
              </div>

              {/* Card Footer: Live Dijkstra Engine Status */}
              <div className="flex items-center justify-between text-[11px] font-mono text-white/50 pt-2 border-t border-[#242A3A]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>ALGORITHM: DIJKSTRA OPTIMAL</span>
                </div>
                <span>LATENCY: 1.8MS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
