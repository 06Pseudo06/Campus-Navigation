"use client";

import React, { useEffect, useState } from "react";
import { isReducedMotion } from "@/lib/motion";

interface ExploreStatsStripProps {
  buildingCount: number;
  vertexCount?: number;
  walkwayCount?: number;
  latencyMs?: number;
  algorithm?: "dijkstra" | "astar";
}

export function ExploreStatsStrip({
  buildingCount,
  vertexCount = 1957,
  walkwayCount = 124,
  latencyMs = 1.8,
  algorithm = "dijkstra",
}: ExploreStatsStripProps) {
  const [bldgVal, setBldgVal] = useState(0);
  const [vertexVal, setVertexVal] = useState(0);

  useEffect(() => {
    if (isReducedMotion()) {
      return;
    }

    const duration = 1200;
    const start = performance.now();

    const animate = (time: number) => {
      const elapsed = time - start;
      const progress = Math.min(1, elapsed / duration);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setBldgVal(Math.round(buildingCount * ease));
      setVertexVal(Math.round(vertexCount * ease));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, [buildingCount, vertexCount]);

  return (
    <div className="w-full h-11 px-4 sm:px-6 bg-[#FBF8F2] border border-[#111111]/12 rounded-2xl flex items-center justify-between text-xs font-mono select-none shadow-xs mt-3 shrink-0">
      {/* 1. Buildings */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#E8542F]" />
        <span className="text-[#5B5750] text-[10px] uppercase tracking-wider">
          BUILDINGS:
        </span>
        <span className="font-bold text-[#111111] tabular-nums">
          {bldgVal || buildingCount}
        </span>
      </div>

      <div className="h-4 w-px bg-[#111111]/12" aria-hidden="true" />

      {/* 2. Vertices */}
      <div className="flex items-center gap-2">
        <span className="text-[#E8542F] text-xs">⌁</span>
        <span className="text-[#5B5750] text-[10px] uppercase tracking-wider">
          GRAPH NODES:
        </span>
        <span className="font-bold text-[#111111] tabular-nums">
          {(vertexVal || vertexCount).toLocaleString()}
        </span>
      </div>

      <div className="hidden xl:block h-4 w-px bg-[#111111]/12" aria-hidden="true" />

      {/* 3. Walkways (hidden on 1024-1279px) */}
      <div className="hidden xl:flex items-center gap-2">
        <span className="text-[#E8542F] text-xs">◫</span>
        <span className="text-[#5B5750] text-[10px] uppercase tracking-wider">
          SURVEYED EDGES:
        </span>
        <span className="font-bold text-[#111111] tabular-nums">
          {walkwayCount}+
        </span>
      </div>

      <div className="h-4 w-px bg-[#111111]/12" aria-hidden="true" />

      {/* 4. Latency + Engine */}
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[#5B5750] text-[10px] uppercase tracking-wider">
          LATENCY:
        </span>
        <span className="font-bold text-[#111111] tabular-nums">
          {latencyMs.toFixed(1)}ms
        </span>
        <span className="hidden sm:inline px-1.5 py-0.2 rounded bg-[#111111]/[0.06] text-[9px] font-bold text-[#E8542F] uppercase">
          {algorithm === "dijkstra" ? "DIJKSTRA" : "A* HEURISTIC"}
        </span>
      </div>
    </div>
  );
}