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
    <div
      className="w-full h-11 px-4 sm:px-6 bg-gradient-to-b from-[#151B28] to-[#0F141F] text-[#F4F1EA] border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_16px_rgba(15,20,31,0.25)] rounded-[18px] flex items-center justify-between text-xs font-mono select-none mt-3 shrink-0"
      aria-label="Campus Graph Telemetry"
    >
      {/* 1. Buildings */}
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#E8542F]" />
        <span className="text-[#B4BCCB] text-[10px] uppercase tracking-wider">
          BUILDINGS:
        </span>
        <span className="font-bold text-white tabular-nums">
          {bldgVal || buildingCount}
        </span>
      </div>

      <div className="h-4 w-px bg-white/10" aria-hidden="true" />

      {/* 2. Vertices */}
      <div className="flex items-center gap-2">
        <span className="text-[#E8542F] text-xs">&bull;</span>
        <span className="text-[#B4BCCB] text-[10px] uppercase tracking-wider">
          GRAPH NODES:
        </span>
        <span className="font-bold text-white tabular-nums">
          {(vertexVal || vertexCount).toLocaleString()}
        </span>
      </div>

      <div className="hidden xl:block h-4 w-px bg-white/10" aria-hidden="true" />

      {/* 3. Walkways */}
      <div className="hidden xl:flex items-center gap-2">
        <span className="text-[#E8542F] text-xs">&bull;</span>
        <span className="text-[#B4BCCB] text-[10px] uppercase tracking-wider">
          SURVEYED EDGES:
        </span>
        <span className="font-bold text-white tabular-nums">
          {walkwayCount}+
        </span>
      </div>

      <div className="h-4 w-px bg-white/10" aria-hidden="true" />

      {/* 4. Latency + Engine */}
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[#B4BCCB] text-[10px] uppercase tracking-wider">
          LATENCY:
        </span>
        <span className="font-bold text-white tabular-nums">
          {latencyMs.toFixed(1)}ms
        </span>
        <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-[#E8542F]/20 border border-[#E8542F]/40 text-[9px] font-bold text-[#E8542F] uppercase">
          {algorithm === "dijkstra" ? "DIJKSTRA" : "A*"}
        </span>
      </div>
    </div>
  );
}
