"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { isReducedMotion } from "@/lib/motion";

interface RealRoute {
  id: string;
  chipLabel: string;
  name: string;
  fromName: string;
  fromCode: string;
  toName: string;
  toCode: string;
  duration: string;
  distance: string;
  steps: { text: string; dist: string }[];
  svgPath: string;
  nodes: { x: number; y: number; label: string }[];
}

const REAL_LPU_ROUTES: RealRoute[] = [
  {
    id: "route-g1-aud",
    chipLabel: "G1→AUD",
    name: "Gate 1 to Shri Baldev Raj Mittal Auditorium",
    fromName: "Gate 1 (Main Gate)",
    fromCode: "G1-ENTRY",
    toName: "Baldev Raj Mittal Auditorium",
    toCode: "AUDITORIUM",
    duration: "4.2 min",
    distance: "336 m",
    svgPath: "M 100 80 L 170 140 L 260 210 L 370 230",
    nodes: [
      { x: 100, y: 80, label: "G1-ENTRY" },
      { x: 170, y: 140, label: "Junction 1" },
      { x: 260, y: 210, label: "Junction 3" },
      { x: 370, y: 230, label: "Auditorium" },
    ],
    steps: [
      { text: "Depart Gate 1 (Main Gate) entering campus avenue", dist: "0.0 m" },
      { text: "Continue through Junction 1 past Baldev Raj Mittal Park", dist: "123.0 m" },
      { text: "Follow central concourse south to Junction 3", dist: "94.4 m" },
      { text: "Arrive at Shri Baldev Raj Mittal Auditorium entrance", dist: "118.6 m" },
    ],
  },
  {
    id: "route-park-hosp",
    chipLabel: "PARK→HOSP",
    name: "Main Parking to University Hospital",
    fromName: "LPU Main Gate Parking",
    fromCode: "PARKING",
    toName: "University Hospital",
    toCode: "HOSPITAL",
    duration: "2.7 min",
    distance: "215 m",
    svgPath: "M 80 180 L 170 140 L 260 210 L 320 280",
    nodes: [
      { x: 80, y: 180, label: "PARKING" },
      { x: 170, y: 140, label: "Junction 1" },
      { x: 260, y: 210, label: "Junction 3" },
      { x: 320, y: 280, label: "Hospital" },
    ],
    steps: [
      { text: "Depart Main Gate Parking facility heading east", dist: "0.0 m" },
      { text: "Traverse Junction 1 pedestrian concourse", dist: "73.3 m" },
      { text: "Follow walkway towards Hospital wing at Junction 3", dist: "94.4 m" },
      { text: "Arrive at University Hospital outpatient entrance", dist: "47.7 m" },
    ],
  },
  {
    id: "route-g1-blk1",
    chipLabel: "G1→BLK1",
    name: "Gate 1 to Block 1 (Fashion Design)",
    fromName: "Gate 1 (Main Gate)",
    fromCode: "G1-ENTRY",
    toName: "Block 1 (Fashion Design)",
    toCode: "BLOCK-1",
    duration: "5.1 min",
    distance: "410 m",
    svgPath: "M 100 80 L 170 140 L 290 170 L 410 160",
    nodes: [
      { x: 100, y: 80, label: "G1-ENTRY" },
      { x: 170, y: 140, label: "Junction 1" },
      { x: 290, y: 170, label: "Junction 4" },
      { x: 410, y: 160, label: "Block 1" },
    ],
    steps: [
      { text: "Enter through Gate 1 pedestrian walkway", dist: "0.0 m" },
      { text: "Traverse past Baldev Raj Mittal Park to eastern artery", dist: "178.0 m" },
      { text: "Follow tree-lined arcade past Auditorium concourse", dist: "132.0 m" },
      { text: "Arrive at Block 1 (Fashion Design) main entrance", dist: "100.0 m" },
    ],
  },
];

export function MapPreviewSection() {
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [accessibleOnly, setAccessibleOnly] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  const route = REAL_LPU_ROUTES[selectedRouteIndex];

  // 3D Card Tilt with Mouse
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReducedMotion() || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = x / rect.width - 0.5;
    const normY = y / rect.height - 0.5;

    const rotateX = -normY * 3.5;
    const rotateY = normX * 3.5;

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleCardMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    cardRef.current.style.transition = "transform 0.5s ease-out";
    setTimeout(() => {
      if (cardRef.current) cardRef.current.style.transition = "";
    }, 500);
  };

  return (
    <section
      id="section-03"
      className="relative w-full bg-[#F7F3EC] dark:bg-[#070B14] text-[#0E1118] dark:text-zinc-100 py-20 lg:py-28 border-b border-[#E1DDD3] dark:border-white/10 select-none overflow-hidden transition-colors duration-200"
      aria-label="Real Routes Across Campus"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#E1DDD3] dark:border-zinc-800">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-xs font-mono font-bold tracking-widest uppercase text-[#0E1118] dark:text-zinc-200">
              <span className="text-[#DE4B31]">03 /</span>
              <span>REAL ROUTES &bull; REAL CAMPUS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-[#0E1118] dark:text-white">
              Verified Dataset C Navigation
            </h2>
          </div>
          <span className="text-[11px] font-mono tracking-widest text-[#6B665C] dark:text-zinc-400 uppercase">
            GROUND-SURVEYED TOPOLOGY &bull; SUB-METER ACCURACY
          </span>
        </div>

        {/* Interactive 3D Map Card */}
        <div
          ref={cardRef}
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
          className="relative w-full rounded-3xl bg-white dark:bg-[#0E1422] border border-[#E1DDD3] dark:border-zinc-800 p-6 sm:p-8 lg:p-10 shadow-xl transition-all duration-300"
        >
          {/* Top Controls: Route Selector Chips + Accessibility Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E1DDD3] dark:border-zinc-800">
            {/* Route Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-[#6B665C] dark:text-zinc-400 font-semibold mr-1">
                SAMPLE ROUTES:
              </span>
              {REAL_LPU_ROUTES.map((r, idx) => (
                <button
                  key={r.id}
                  type="button"
                  data-cursor="ROUTE"
                  onClick={() => setSelectedRouteIndex(idx)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    selectedRouteIndex === idx
                      ? "bg-[#DE4B31] text-white shadow-sm"
                      : "bg-[#FAF8F5] dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-[#F2ECE1] dark:hover:bg-zinc-700 border border-[#E1DDD3] dark:border-zinc-700"
                  }`}
                >
                  {r.chipLabel}
                </button>
              ))}
            </div>

            {/* Accessibility Filter Toggle */}
            <button
              type="button"
              data-cursor="ui"
              onClick={() => setAccessibleOnly(!accessibleOnly)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF8F5] dark:bg-zinc-800 border border-[#E1DDD3] dark:border-zinc-700 text-xs font-mono font-semibold text-slate-700 dark:text-zinc-300 cursor-pointer self-start sm:self-auto"
            >
              <span
                className={`w-2 h-2 rounded-full transition-colors ${
                  accessibleOnly ? "bg-emerald-500" : "bg-slate-300 dark:bg-zinc-600"
                }`}
              />
              <span>{accessibleOnly ? "STEP-FREE: ENABLED" : "STEP-FREE: OFF"}</span>
            </button>
          </div>

          {/* Card Body: Map Viewport (Left) + Route Details (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
            {/* Left: SVG Topological Campus Map Viewport */}
            <div
              data-cursor="map"
              className="lg:col-span-7 relative min-h-[300px] sm:min-h-[360px] rounded-2xl bg-[#F4F1EA] dark:bg-[#070B14] border border-[#E1DDD3] dark:border-zinc-800/80 overflow-hidden p-6 flex flex-col justify-between cursor-crosshair"
            >
              {/* Map Background Grid */}
              <div className="absolute inset-0 blueprint-grid opacity-60" aria-hidden="true" />

              {/* Header Coordinates */}
              <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-[#6B665C] dark:text-zinc-400">
                <span>LPU TOPOLOGICAL GRAPH // DATASET C</span>
                <span>LAT 31.2605° N &bull; LON 75.7068° E</span>
              </div>

              {/* Center: Interactive SVG Route Graph */}
              <div className="relative z-10 my-auto w-full max-w-md mx-auto aspect-[16/10]">
                <svg className="w-full h-full" viewBox="0 0 500 320" fill="none">
                  {/* Subtle Campus Buildings Outlines */}
                  <rect x="60" y="50" width="80" height="50" rx="6" fill="currentColor" className="text-black/5 dark:text-white/5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.1" />
                  <text x="100" y="80" textAnchor="middle" fill="currentColor" className="text-black/40 dark:text-white/40" fontSize="8" fontFamily="monospace">GATE 1</text>

                  <rect x="330" y="200" width="100" height="60" rx="6" fill="currentColor" className="text-black/5 dark:text-white/5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.1" />
                  <text x="380" y="235" textAnchor="middle" fill="currentColor" className="text-black/40 dark:text-white/40" fontSize="8" fontFamily="monospace">AUDITORIUM</text>

                  <rect x="280" y="250" width="80" height="50" rx="6" fill="currentColor" className="text-black/5 dark:text-white/5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.1" />
                  <text x="320" y="280" textAnchor="middle" fill="currentColor" className="text-black/40 dark:text-white/40" fontSize="8" fontFamily="monospace">HOSPITAL</text>

                  <rect x="370" y="130" width="80" height="50" rx="6" fill="currentColor" className="text-black/5 dark:text-white/5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.1" />
                  <text x="410" y="160" textAnchor="middle" fill="currentColor" className="text-black/40 dark:text-white/40" fontSize="8" fontFamily="monospace">BLOCK 1</text>

                  {/* Route Polyline */}
                  <path
                    d={route.svgPath}
                    stroke="#DE4B31"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-md"
                  />
                  {/* Animated Dash */}
                  <path
                    d={route.svgPath}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="6 6"
                    className="animate-pulse"
                  />

                  {/* Node Waypoint Circles */}
                  {route.nodes.map((node, nIdx) => {
                    const isStart = nIdx === 0;
                    const isEnd = nIdx === route.nodes.length - 1;
                    return (
                      <g key={nIdx}>
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isStart || isEnd ? "8" : "5"}
                          fill={isStart ? "#10B981" : isEnd ? "#DE4B31" : "#1E293B"}
                          stroke="#FFFFFF"
                          strokeWidth="2"
                        />
                        <text
                          x={node.x}
                          y={node.y - 12}
                          textAnchor="middle"
                          fill="currentColor"
                          className="text-[#0E1118] dark:text-zinc-200"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Bottom Metrics Bar */}
              <div className="relative z-10 flex items-center justify-between text-xs font-mono font-bold text-[#0E1118] dark:text-zinc-200 pt-2 border-t border-[#E1DDD3] dark:border-white/10">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>LIVE TRAVERSAL: {route.duration}</span>
                </span>
                <span>TOTAL DISTANCE: {route.distance}</span>
              </div>
            </div>

            {/* Right: Turn-by-Turn Guidance & Explorer Action */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#DE4B31]">
                    ROUTE CALCULATION // A* SHORTEST PATH
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#0E1118] dark:text-white">
                    {route.name}
                  </h3>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-zinc-900 border border-[#E1DDD3] dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#6B665C] dark:text-zinc-400">ORIGIN:</span>
                    <span className="font-bold text-[#0E1118] dark:text-white">{route.fromName}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#6B665C] dark:text-zinc-400">DESTINATION:</span>
                    <span className="font-bold text-[#DE4B31]">{route.toName}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-[#E1DDD3] dark:border-zinc-800">
                    <span className="text-[#6B665C] dark:text-zinc-400">ESTIMATED WALK:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{route.duration} ({route.distance})</span>
                  </div>
                </div>

                {/* Steps List */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#6B665C] dark:text-zinc-400 tracking-wider">
                    WAYPOINT DIRECTIONS
                  </span>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {route.steps.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800 text-xs"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#DE4B31]/10 text-[#DE4B31] font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                          {sIdx + 1}
                        </span>
                        <div className="flex-1 flex items-center justify-between gap-2">
                          <span className="text-[#0E1118] dark:text-zinc-300 font-medium">
                            {step.text}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 shrink-0">
                            +{step.dist}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href="/explore?tab=routes"
                data-cursor="EXPLORE"
                className="w-full py-4 rounded-2xl bg-[#0E1118] dark:bg-white hover:bg-[#DE4B31] dark:hover:bg-[#DE4B31] text-white dark:text-[#0E1118] dark:hover:text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <span>OPEN LIVE ROUTE IN EXPLORER</span>
                <span>↗</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
