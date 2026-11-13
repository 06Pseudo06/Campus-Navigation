"use client";

import React from "react";
import Link from "next/link";

export function EditorialStorytelling() {
  return (
    <section className="relative w-full bg-[#FBF9F5] text-[#111111] py-24 lg:py-36 border-b border-[#1A1A1A]/10 overflow-hidden">
      {/* Background Architectural Grid Lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(26, 26, 26, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(26, 26, 26, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-28 lg:space-y-40">
        {/* STORY 01: DISCOVER SPACES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left Column: Editorial Content */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-3 text-xs font-mono tracking-widest text-[#D9532F] uppercase">
              <span className="text-2xl sm:text-3xl font-black font-mono">01</span>
              <span>/ SPATIAL DISCOVERY</span>
            </div>

            <h3 className="text-3xl sm:text-5xl font-black tracking-tight text-[#111111] leading-[1.08] uppercase">
              UNCOVER EVERY BUILDING, QUAD & AUDITORIUM.
            </h3>

            <p className="text-base sm:text-lg text-[#5A5854] font-normal leading-relaxed">
              Find specific campus destinations by academic code, faculty department, or popular alias.
              Whether arriving for a lecture in Dunton Tower, research in the ARISE Building, or quiet study
              in MacOdrum Library, CampusWay indexes all 48 university landmarks with coordinate precision.
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono text-[#5A5854]">
              <span className="px-3 py-1 rounded-full bg-[#1A1A1A]/05 border border-[#1A1A1A]/10">
                MacOdrum Library (ML)
              </span>
              <span className="px-3 py-1 rounded-full bg-[#1A1A1A]/05 border border-[#1A1A1A]/10">
                Paterson Hall (PA)
              </span>
              <span className="px-3 py-1 rounded-full bg-[#1A1A1A]/05 border border-[#1A1A1A]/10">
                ARISE Building (AR)
              </span>
              <span className="px-3 py-1 rounded-full bg-[#1A1A1A]/05 border border-[#1A1A1A]/10">
                Alumni Hall (AH)
              </span>
            </div>

            <div className="pt-4">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-[#D9532F] hover:text-[#B33B1D] transition-colors group"
              >
                <span>Browse Campus Directory</span>
                <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Architectural Spatial Graphic */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl bg-white border border-[#1A1A1A]/15 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between text-xs font-mono text-[#88847C] pb-3 border-b border-[#1A1A1A]/10">
                <span>INDEXED TAXONOMY</span>
                <span className="text-[#D9532F]">48 DEMO QUADRANGLES</span>
              </div>

              {/* Visual category cards */}
              <div className="space-y-3 font-mono text-xs">
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#1A1A1A]/10 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-[#111111]">ACADEMIC HALLS & LABS</span>
                    <p className="text-[11px] text-[#88847C]">35 Core Faculty Complexes</p>
                  </div>
                  <span className="text-[#D9532F] font-bold">73%</span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#1A1A1A]/10 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-[#111111]">LANDMARKS & PLAZAS</span>
                    <p className="text-[11px] text-[#88847C]">11 Architectural Focal Points</p>
                  </div>
                  <span className="text-[#D9532F] font-bold">23%</span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#1A1A1A]/10 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-[#111111]">ACCESSIBILITY GATES</span>
                    <p className="text-[11px] text-[#88847C]">Level-Grade Transit Portals</p>
                  </div>
                  <span className="text-emerald-600 font-bold">ACTIVE</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-[10px] font-mono text-[#88847C]">
                <span>CARLETON UNIVERSITY DATASET</span>
                <span>STATUS: VERIFIED</span>
              </div>
            </div>
          </div>
        </div>

        {/* STORY 02: NAVIGATE WITH PRECISION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left Column: Live Pathfinding Graphic */}
          <div className="lg:col-span-6 order-2 lg:order-1 relative">
            <div className="relative rounded-3xl bg-white border border-[#1A1A1A]/15 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between text-xs font-mono text-[#88847C] pb-3 border-b border-[#1A1A1A]/10">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>DIJKSTRA / A* ENGINE</span>
                </span>
                <span className="text-[#D9532F]">SUB-2MS LATENCY</span>
              </div>

              {/* Simulated Pathway Calculation Block */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#1A1A1A]/10 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#88847C]">ORIGIN:</span>
                  <span className="font-semibold text-[#111111]">MacOdrum Library (ML)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#88847C]">DESTINATION:</span>
                  <span className="font-semibold text-[#111111]">Paterson Hall (PA)</span>
                </div>
                <div className="h-px w-full bg-[#1A1A1A]/10 my-2" />
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2 rounded-lg bg-white border border-[#1A1A1A]/05">
                    <span className="block text-[#88847C] text-[10px]">DISTANCE</span>
                    <span className="font-bold text-[#111111]">133.9 m</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#1A1A1A]/05">
                    <span className="block text-[#88847C] text-[10px]">DURATION</span>
                    <span className="font-bold text-[#D9532F]">1.7 min</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#1A1A1A]/05">
                    <span className="block text-[#88847C] text-[10px]">RAMP ACCESS</span>
                    <span className="font-bold text-emerald-600">100%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-[11px] font-mono text-[#5A5854]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9532F]" />
                  <span>Step 1: Head east through main quad concourse (48m)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9532F]" />
                  <span>Step 2: Enter Paterson Hall ground-level entrance (85.9m)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Copy */}
          <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
            <div className="flex items-center gap-3 text-xs font-mono tracking-widest text-[#D9532F] uppercase">
              <span className="text-2xl sm:text-3xl font-black font-mono">02</span>
              <span>/ ALGORITHMIC PRECISION</span>
            </div>

            <h3 className="text-3xl sm:text-5xl font-black tracking-tight text-[#111111] leading-[1.08] uppercase">
              PREDICTABLE PATHWAYS, ZERO GUESSWORK.
            </h3>

            <p className="text-base sm:text-lg text-[#5A5854] font-normal leading-relaxed">
              Generic map tools fail on university campuses because footpaths, tunnel links, and building
              passageways do not follow public roadways. CampusWay operates on a connected graph of 1,957
              pedestrian edges with built-in accessibility filters and accurate walking durations.
            </p>

            <div className="pt-4">
              <Link
                href="/explore?tab=routes"
                className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-[#D9532F] hover:text-[#B33B1D] transition-colors group"
              >
                <span>Test Live Routing Engine</span>
                <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        {/* STORY 03: REMEMBER & ASSIST */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left Column: Editorial Copy */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-3 text-xs font-mono tracking-widest text-[#D9532F] uppercase">
              <span className="text-2xl sm:text-3xl font-black font-mono">03</span>
              <span>/ REMEMBER &amp; ASSIST</span>
            </div>

            <h3 className="text-3xl sm:text-5xl font-black tracking-tight text-[#111111] leading-[1.08] uppercase">
              YOUR PERSONAL ATLAS &amp; VISITOR SUPPORT.
            </h3>

            <p className="text-base sm:text-lg text-[#5A5854] font-normal leading-relaxed">
              Save your daily lecture halls and study spaces directly into browser storage without the hassle
              of passwords or account creation. When you need on-the-ground support, submit instant assistance
              tickets and access verified university help desk locations.
            </p>

            <div className="pt-2 flex flex-col gap-2 font-mono text-xs text-[#5A5854]">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">&check;</span>
                <span>Robertson Hall Visitor Welcome Desk</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">&check;</span>
                <span>CTTC Information &amp; Transit Hub</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">&check;</span>
                <span>Yellow Emergency Call Box Direct Navigation</span>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/explore?tab=saved"
                className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-[#D9532F] hover:text-[#B33B1D] transition-colors group"
              >
                <span>View Saved Places Feature</span>
                <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Assistance & Bookmarks Preview */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl bg-white border border-[#1A1A1A]/15 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-[#88847C] pb-3 border-b border-[#1A1A1A]/10">
                <span>GUEST BOOKMARKING &bull; LOCAL STORAGE</span>
                <span className="text-emerald-600 font-bold">100% PRIVATE</span>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#1A1A1A]/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D9532F]/10 text-[#D9532F] flex items-center justify-center font-bold text-xs">
                    ML
                  </div>
                  <div>
                    <span className="font-semibold text-xs font-mono text-[#111111]">MacOdrum Library</span>
                    <p className="text-[11px] text-[#88847C] font-mono">Saved in browser session</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#D9532F]">&starf; BOOKMARKED</span>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#1A1A1A]/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D9532F]/10 text-[#D9532F] flex items-center justify-center font-bold text-xs">
                    PA
                  </div>
                  <div>
                    <span className="font-semibold text-xs font-mono text-[#111111]">Paterson Hall</span>
                    <p className="text-[11px] text-[#88847C] font-mono">Saved in browser session</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#D9532F]">&starf; BOOKMARKED</span>
              </div>

              <p className="text-[11px] font-mono text-[#88847C] pt-2">
                Bookmarks survive tab closure and page refresh automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
