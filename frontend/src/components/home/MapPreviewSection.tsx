"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { isReducedMotion } from "@/lib/motion";

interface DemoRoute {
  id: string;
  chipLabel: string;
  name: string;
  fromName: string;
  fromCode: string;
  toName: string;
  toCode: string;
  duration: string;
  distance: string;
  svgPath: string;
  fromPos: { x: number; y: number };
  toPos: { x: number; y: number };
  steps: { text: string; dist: string }[];
}

const DEMO_ROUTES: DemoRoute[] = [
  {
    id: "route-1",
    chipLabel: "ML→PA",
    name: "MacOdrum Library to Paterson Hall",
    fromName: "MacOdrum Library",
    fromCode: "ML",
    toName: "Paterson Hall",
    toCode: "PA",
    duration: "1.7 min",
    distance: "133.9 m",
    svgPath: "M 130 145 L 210 145 L 210 215 L 340 215",
    fromPos: { x: 130, y: 145 },
    toPos: { x: 340, y: 215 },
    steps: [
      { text: "Depart MacOdrum Library main entrance heading East", dist: "0.0 m" },
      { text: "Follow central quad concourse footpath", dist: "48.0 m" },
      { text: "Arrive at Paterson Hall ground-level entrance", dist: "85.9 m" },
    ],
  },
  {
    id: "route-2",
    chipLabel: "AR→AH",
    name: "ARISE Building to Alumni Hall",
    fromName: "ARISE Building",
    fromCode: "AR",
    toName: "Alumni Hall",
    toCode: "AH",
    duration: "20.3 min",
    distance: "1,581.7 m",
    svgPath: "M 100 80 L 190 80 L 190 190 L 370 190 L 370 240",
    fromPos: { x: 100, y: 80 },
    toPos: { x: 370, y: 240 },
    steps: [
      { text: "Exit ARISE Building via campus perimeter walkway", dist: "0.0 m" },
      { text: "Traverse central pedestrian concourse past CTTC", dist: "420.0 m" },
      { text: "Follow athletic boulevard south to Alumni Hall", dist: "680.0 m" },
      { text: "Arrive at Alumni Hall main foyer entrance", dist: "481.7 m" },
    ],
  },
  {
    id: "route-3",
    chipLabel: "ME→RB",
    name: "Mackenzie Building to Richcraft Hall",
    fromName: "Mackenzie Building",
    fromCode: "ME",
    toName: "Richcraft Hall",
    toCode: "RB",
    duration: "5.0 min",
    distance: "387.4 m",
    svgPath: "M 140 230 L 140 130 L 290 130 L 290 90",
    fromPos: { x: 140, y: 230 },
    toPos: { x: 290, y: 90 },
    steps: [
      { text: "Exit Mackenzie engineering foyer onto Campus Avenue", dist: "0.0 m" },
      { text: "Follow ramp walkway past River Building perimeter", dist: "190.0 m" },
      { text: "Arrive at Richcraft Hall glass atrium entrance", dist: "197.4 m" },
    ],
  },
];

export function MapPreviewSection() {
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [accessibleOnly, setAccessibleOnly] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const [mouseGlow, setMouseGlow] = useState({ x: 0, y: 0, opacity: 0 });

  const route = DEMO_ROUTES[selectedRouteIndex];

  // 3D Card Tilt with Mouse (max 4°)
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReducedMotion() || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = x / rect.width - 0.5;
    const normY = y / rect.height - 0.5;

    const rotateX = -normY * 4.5;
    const rotateY = normX * 4.5;

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    setMouseGlow({ x, y, opacity: 1 });
  };

  const handleCardMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    cardRef.current.style.transition = "transform 0.5s ease-out";
    setMouseGlow((prev) => ({ ...prev, opacity: 0 }));
    setTimeout(() => {
      if (cardRef.current) cardRef.current.style.transition = "";
    }, 500);
  };

  return (
    <section
      id="section-03"
      className="relative w-full bg-[#F7F3EC] text-[#111111] py-20 sm:py-28 overflow-hidden select-none border-b border-[#111111]/12"
      aria-label="Live Routing Map"
    >
      {/* Background architectural grid */}
      <div className="absolute inset-0 blueprint-grid pointer-events-none opacity-40" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 section-gutter space-y-10 z-10">
        {/* Section Header: 03 / REAL ROUTES / LIVE MAP */}
        <div className="flex items-center gap-3 text-xs font-mono font-bold tracking-widest uppercase text-[#111111] pb-4 border-b border-[#111111]/12">
          <span className="text-[#E8542F]">03 /</span>
          <span>REAL ROUTES &bull; LIVE MAP</span>
          <span className="w-12 h-px bg-[#111111]/20 inline-block" />
        </div>

        {/* 2-Column Split: Editorial Copy vs Interactive Dark Map Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Framed Photo + Headline + Copy + Button */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
            {/* Architectural Photo Directly Above Heading with Mono Caption */}
            <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden bg-[#161922] border border-[#111111]/15 shadow-md group">
              <Image
                src="/images/arch-real_campus.jpg"
                alt="Carleton university academic concourse and quadrangle elevation"
                fill
                sizes="(max-width: 1024px) 100vw, 480px"
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/70 via-transparent to-transparent flex items-end p-4">
                <span className="text-[10px] font-mono tracking-widest uppercase text-white/90">
                  CAMPUS_QUAD // ARCHITECTURAL ELEVATION &bull; LAT 45.3850° N
                </span>
              </div>
            </div>

            {/* Heading: REAL ROUTES. / REAL CAMPUS. */}
            <h2 className="fluid-section-headline font-black tracking-tight uppercase leading-[0.94] text-[#111111]">
              <span>REAL ROUTES.</span> <br />
              <span className="text-[#E8542F]">REAL CAMPUS.</span>
            </h2>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-[#5B5750] font-normal leading-relaxed max-w-md">
              See CampusWay in action with an interactive map and step-by-step walking guidance.
            </p>

            {/* Primary Action Button */}
            <div className="pt-2">
              <Link
                href="/explore"
                data-cursor="EXPLORE"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#111111] hover:bg-[#E8542F] text-white text-xs sm:text-sm font-bold tracking-widest uppercase transition-all shadow-xl group cursor-pointer"
              >
                <span>TRY THE LIVE MAP</span>
                <span className="text-[#E8542F] group-hover:text-white transition-colors font-bold text-sm">
                  ↗
                </span>
              </Link>
            </div>
          </div>

          {/* Right Column: DARK MODERN MAP CARD (#161922) */}
          <div className="lg:col-span-7">
            <div
              ref={cardRef}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              className={`relative rounded-3xl bg-[#161922] border border-[#282D3C] p-6 sm:p-8 shadow-2xl transition-all duration-300 ${
                isFullscreen ? "fixed inset-4 z-50 overflow-y-auto" : ""
              }`}
            >
              {/* Cursor-Following Orange Glow Edge */}
              <div
                className="absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-300"
                style={{
                  opacity: mouseGlow.opacity,
                  background: `radial-gradient(400px circle at ${mouseGlow.x}px ${mouseGlow.y}px, rgba(232, 84, 47, 0.12), transparent 80%)`,
                }}
                aria-hidden="true"
              />

              {/* Card Controls Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {/* Origin Dropdown Field */}
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#1D2230] border border-[#2E364B] text-xs font-mono">
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-white/60">From</span>
                    <span className="text-white font-semibold truncate">
                      {route.fromName} ({route.fromCode})
                    </span>
                  </div>
                  <span className="text-white/40 text-[10px]">▾</span>
                </div>

                {/* Destination Dropdown Field */}
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#1D2230] border border-[#2E364B] text-xs font-mono">
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E8542F] shrink-0" />
                    <span className="text-white/60">To</span>
                    <span className="text-white font-semibold truncate">
                      {route.toName} ({route.toCode})
                    </span>
                  </div>
                  <span className="text-white/40 text-[10px]">▾</span>
                </div>
              </div>

              {/* Metrics Pill + Interactive Route Chips */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
                {/* Duration & Distance Pill */}
                <button
                  type="button"
                  onClick={() => setAccessibleOnly(!accessibleOnly)}
                  className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#202738] hover:bg-[#2A344C] border border-[#313B53] text-xs font-mono transition-colors cursor-pointer"
                  title="Toggle accessible route preference"
                >
                  <span className="text-sm">♿</span>
                  <span className="font-bold text-[#E8542F]">
                    {route.duration} ({route.distance})
                  </span>
                  <span className="text-white/40">&bull;</span>
                  <span className="text-white/70">
                    {accessibleOnly ? "Accessible Route" : "Standard Route"}
                  </span>
                </button>

                {/* Interactive Route Chips: ML→PA, AR→AH, ME→RB */}
                <div className="flex items-center gap-2 text-xs font-mono">
                  {DEMO_ROUTES.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedRouteIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                        idx === selectedRouteIndex
                          ? "bg-[#E8542F] text-white border-[#E8542F] shadow-md shadow-[#E8542F]/30"
                          : "bg-[#1D2230] text-white/70 border-[#2E364B] hover:text-white hover:border-white/30"
                      }`}
                    >
                      {item.chipLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3D Quad Map Graphic Area */}
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-2xl bg-[#0F1218] border border-[#242A3A] overflow-hidden flex items-center justify-center">
                {/* Fullscreen Expand / Collapse Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-lg bg-[#1E2332] hover:bg-[#2A3247] border border-[#333C54] text-white/80 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                  aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen map"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isFullscreen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                      />
                    )}
                  </svg>
                </button>

                {/* Building Tooltip */}
                {hoveredBuilding && (
                  <div className="absolute top-3.5 left-3.5 z-20 px-3 py-1 rounded-md bg-[#1E2332]/90 border border-white/20 text-[10px] font-mono text-white pointer-events-none">
                    {hoveredBuilding}
                  </div>
                )}

                {/* SVG Isometric Quad Map */}
                <svg
                  className="w-full h-full p-4 sm:p-6 select-none"
                  viewBox="0 0 460 300"
                  fill="none"
                >
                  <defs>
                    <filter id="routeGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Isometric Building 1 (North Hall) */}
                  <g
                    className="cursor-pointer transition-transform hover:-translate-y-1"
                    onMouseEnter={() => setHoveredBuilding("Patterson Wing (North Quad)")}
                    onMouseLeave={() => setHoveredBuilding(null)}
                  >
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
                  </g>

                  {/* Isometric Building 2 (MacOdrum Library ML) */}
                  <g
                    className="cursor-pointer transition-transform hover:-translate-y-1"
                    onMouseEnter={() => setHoveredBuilding("MacOdrum Library (ML)")}
                    onMouseLeave={() => setHoveredBuilding(null)}
                  >
                    <polygon
                      points="90,140 160,110 210,135 140,165"
                      fill="#242C3E"
                      stroke="#3B4662"
                      strokeWidth="1.5"
                    />
                    <polygon
                      points="90,140 140,165 140,200 90,175"
                      fill="#1A202E"
                      stroke="#3B4662"
                      strokeWidth="1.5"
                    />
                    <polygon
                      points="140,165 210,135 210,170 140,200"
                      fill="#1D2434"
                      stroke="#3B4662"
                      strokeWidth="1.5"
                    />
                  </g>

                  {/* Isometric Building 3 (Paterson Hall PA) */}
                  <g
                    className="cursor-pointer transition-transform hover:-translate-y-1"
                    onMouseEnter={() => setHoveredBuilding("Paterson Hall (PA)")}
                    onMouseLeave={() => setHoveredBuilding(null)}
                  >
                    <polygon
                      points="300,200 370,170 420,195 350,225"
                      fill="#242C3E"
                      stroke="#3B4662"
                      strokeWidth="1.5"
                    />
                    <polygon
                      points="300,200 350,225 350,260 300,235"
                      fill="#1A202E"
                      stroke="#3B4662"
                      strokeWidth="1.5"
                    />
                    <polygon
                      points="350,225 420,195 420,230 350,260"
                      fill="#1D2434"
                      stroke="#3B4662"
                      strokeWidth="1.5"
                    />
                  </g>

                  {/* Glowing Animated Route Path */}
                  <path
                    d={route.svgPath}
                    stroke="#E8542F"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#routeGlowFilter)"
                    className="transition-all duration-500"
                  />
                  <path
                    d={route.svgPath}
                    stroke="#FFA27E"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Continuous Traveling Dot Along Route */}
                  <circle r="4" fill="#FFFFFF">
                    <animateMotion
                      path={route.svgPath}
                      dur="3s"
                      repeatCount="indefinite"
                      rotate="auto"
                    />
                  </circle>

                  {/* Origin Marker Badge */}
                  <g transform={`translate(${route.fromPos.x - 20}, ${route.fromPos.y - 32})`}>
                    <rect width="40" height="22" rx="11" fill="#FFFFFF" />
                    <text
                      x="20"
                      y="15"
                      textAnchor="middle"
                      fill="#111111"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {route.fromCode}
                    </text>
                  </g>

                  {/* Destination Marker Badge */}
                  <g transform={`translate(${route.toPos.x - 20}, ${route.toPos.y - 32})`}>
                    <rect width="40" height="22" rx="11" fill="#FFFFFF" />
                    <text
                      x="20"
                      y="15"
                      textAnchor="middle"
                      fill="#E8542F"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {route.toCode}
                    </text>
                  </g>
                </svg>
              </div>

              {/* Vertical Step-by-Step Directions Sequence */}
              <div className="pt-4 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-white/50 pb-1 border-b border-[#242A3A]">
                  <span>STEP-BY-STEP WALKING GUIDANCE:</span>
                  <span className="text-[#E8542F]">DIJKSTRA SOLVER</span>
                </div>
                <div className="space-y-2">
                  {route.steps.map((st, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#1D2230]/70 border border-[#2B3346] text-xs font-mono text-white/90"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#E8542F] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          {sIdx + 1}
                        </span>
                        <span>{st.text}</span>
                      </div>
                      <span className="text-white/40 text-[10px] ml-4 shrink-0 font-bold">
                        +{st.dist}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
