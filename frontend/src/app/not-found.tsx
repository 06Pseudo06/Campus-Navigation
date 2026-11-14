"use client";

import React from "react";
import Link from "next/link";
import { EditorialNavbar } from "@/components/home/EditorialNavbar";
import { EditorialFooter } from "@/components/home/EditorialFooter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F7F3EC] text-[#111111] selection:bg-[#E8542F] selection:text-white flex flex-col justify-between font-sans">
      <EditorialNavbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center justify-center text-center space-y-8">
        {/* Architectural 404 Graphic */}
        <div className="relative w-48 h-48 sm:w-60 sm:h-60 flex items-center justify-center">
          {/* Concentric Arcs */}
          <div className="absolute inset-0 rounded-full border border-[#111111]/10 border-dashed animate-spin-slow" />
          <div className="absolute inset-4 rounded-full border border-[#E8542F]/30" />
          <div className="absolute inset-10 rounded-full bg-gradient-to-br from-[#F2793A]/20 to-[#E8542F]/10 flex items-center justify-center">
            <span className="font-display font-black text-6xl sm:text-7xl text-[#111111] tracking-tighter">
              4<span className="italic text-[#E8542F]">0</span>4
            </span>
          </div>

          {/* Broken Node Indicator */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-[#111111] text-white text-[9px] font-mono tracking-widest uppercase">
            DEAD-END CORRIDOR
          </div>
        </div>

        {/* Text Block */}
        <div className="space-y-3 max-w-md mx-auto">
          <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold tracking-widest text-[#E8542F] uppercase">
            <span>✦</span>
            <span>UNMAPPED COORDINATES</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#111111] font-display">
            Off-Campus <span className="italic text-[#E8542F]">Boundary</span>
          </h1>

          <p className="text-sm text-[#5B5750] font-sans leading-relaxed">
            The destination node, room code, or URL you requested does not exist in the current university wayfinding graph.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <Link
            href="/explore"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#111111] hover:bg-[#E8542F] text-white text-xs font-mono font-bold tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
          >
            <span>RETURN TO MAP</span>
            <span>&rarr;</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white hover:bg-[#F2ECE1] border border-[#D5D0C5] text-[#111111] text-xs font-mono font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-2"
          >
            <span>HOMEPAGE ELEVATION</span>
          </Link>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}

