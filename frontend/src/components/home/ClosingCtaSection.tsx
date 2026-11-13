"use client";

import React from "react";
import Link from "next/link";
import { CampusWayLogo } from "@/components/icons/Icons";

export function ClosingCtaSection() {
  return (
    <section className="relative w-full bg-[#111111] text-[#FBF9F5] py-28 lg:py-40 overflow-hidden">
      {/* Background Architectural Grid Lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(251, 249, 245, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(251, 249, 245, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
        aria-hidden="true"
      />

      {/* Terracotta Ambient Glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] lg:w-[900px] h-[400px] rounded-full bg-[#D9532F]/15 blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 text-center space-y-8 z-10">
        {/* Architectural Emblem */}
        <div className="mx-auto w-12 h-12 rounded-2xl bg-[#D9532F] text-white flex items-center justify-center shadow-lg shadow-[#D9532F]/30">
          <CampusWayLogo className="w-7 h-7 text-white" />
        </div>

        {/* Small Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-mono tracking-widest uppercase text-white/70">
          <span>CAMPUSWAY ARCHITECTURAL SYSTEM {"//"} 2026</span>
        </div>

        {/* Big Bold Headline */}
        <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase leading-[0.98]">
          EVERY PLACE HAS A WAY. <br />
          <span className="text-[#D9532F]">START EXPLORING TODAY.</span>
        </h2>

        {/* Supporting Copy */}
        <p className="text-base sm:text-lg text-white/75 font-normal leading-relaxed max-w-2xl mx-auto">
          Navigate 48 university buildings, compute live shortest paths across 1,957 vertices,
          and save favorite destinations to your personal atlas with zero login friction.
        </p>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/explore"
            className="px-8 py-4 rounded-full bg-[#D9532F] hover:bg-[#C44524] active:bg-[#B33B1D] text-white text-xs sm:text-sm font-bold tracking-widest uppercase transition-all shadow-lg hover:shadow-xl hover:shadow-[#D9532F]/30 flex items-center gap-3 cursor-pointer"
          >
            <span>EXPLORE LIVE CAMPUS MAP</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>

          <Link
            href="/about"
            className="px-7 py-4 rounded-full bg-white/10 hover:bg-white/15 active:bg-white/20 text-white border border-white/20 text-xs sm:text-sm font-bold tracking-widest uppercase transition-all cursor-pointer"
          >
            <span>ABOUT ARCHITECTURE</span>
          </Link>
        </div>

        {/* Survey Coordinates Stamp */}
        <div className="pt-8 text-[11px] font-mono text-white/40 tracking-widest uppercase">
          CARLETON DEMO QUAD &bull; 45.3850° N, 75.6947° W &bull; GRAPH VERIFIED
        </div>
      </div>
    </section>
  );
}
