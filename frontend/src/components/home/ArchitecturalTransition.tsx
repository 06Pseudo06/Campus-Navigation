"use client";

import React from "react";
import Image from "next/image";

export function ArchitecturalTransition() {
  return (
    <section className="relative w-full bg-[#FAF8F5] text-[#111111] py-20 lg:py-32 border-b border-[#1A1A1A]/10 overflow-hidden">
      {/* Background CAD grid accent */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(26, 26, 26, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(26, 26, 26, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Section Header & Architectural Code */}
        <div className="flex items-center justify-between border-b border-[#1A1A1A]/15 pb-4 mb-12 sm:mb-16">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold tracking-widest text-[#D9532F] uppercase">
              {"//"} 01 &bull; ARCHITECTURAL THESIS
            </span>
            <div className="h-3 w-px bg-[#1A1A1A]/20" />
            <span className="text-xs font-mono tracking-wider text-[#88847C] uppercase hidden sm:inline">
              SPATIAL TOPOLOGY &bull; CAMPUS WAYFINDING
            </span>
          </div>
          <span className="text-xs font-mono text-[#88847C]">GRID REF. CW-01</span>
        </div>

        {/* Large Editorial Statement */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-8 space-y-6">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111111] leading-[1.15]">
              Universities are vast, intricate labyrinths of knowledge, culture, and architecture.{" "}
              <span className="text-[#D9532F]">
                CampusWay transforms spatial complexity into effortless, human navigation.
              </span>
            </h2>
            <p className="text-base sm:text-lg text-[#5A5854] font-normal leading-relaxed max-w-2xl">
              Every building represents decades of structural history, internal corridors, and varied elevations.
              Our algorithmic routing engine solves paths in under two milliseconds, guiding visitors, researchers,
              and students with exact topological certainty.
            </p>
          </div>

          {/* Architectural Elevation Blueprint Callout */}
          <div className="lg:col-span-4 relative rounded-2xl bg-white border border-[#1A1A1A]/15 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#88847C] pb-2 border-b border-[#1A1A1A]/10">
              <span className="font-semibold text-[#111111]">STUDY 1:200</span>
              <span className="text-[#D9532F]">ELEVATION 01</span>
            </div>
            <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-[#F3EFE6] border border-[#1A1A1A]/10">
              <Image
                src="/images/architectural-elevation.jpg"
                alt="Precision architectural elevation drafting study of university research center hall"
                fill
                sizes="(max-width: 768px) 100vw, 380px"
                className="object-cover object-center grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <p className="text-[11px] font-mono text-[#88847C] leading-snug">
              Precast concrete cladding &bull; Curtain glass mullions &bull; Coordinate verified
            </p>
          </div>
        </div>

        {/* Architectural Metrics Bar */}
        <div className="mt-16 sm:mt-24 pt-8 border-t border-[#1A1A1A]/15 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#111111] font-mono tracking-tight">
              48
            </span>
            <p className="text-xs font-mono uppercase tracking-widest text-[#5A5854]">
              Campus Buildings
            </p>
            <p className="text-[11px] text-[#88847C] hidden sm:block">
              Mapped classrooms, halls, and quads
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#D9532F] font-mono tracking-tight">
              1,957
            </span>
            <p className="text-xs font-mono uppercase tracking-widest text-[#5A5854]">
              Graph Vertices
            </p>
            <p className="text-[11px] text-[#88847C] hidden sm:block">
              Live pedestrian navigation topology
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#111111] font-mono tracking-tight">
              &lt; 2ms
            </span>
            <p className="text-xs font-mono uppercase tracking-widest text-[#5A5854]">
              Solver Latency
            </p>
            <p className="text-[11px] text-[#88847C] hidden sm:block">
              Instant Dijkstra & A* path calculations
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-600 font-mono tracking-tight">
              100%
            </span>
            <p className="text-xs font-mono uppercase tracking-widest text-[#5A5854]">
              Accessible Paths
            </p>
            <p className="text-[11px] text-[#88847C] hidden sm:block">
              Zero-barrier wheelchair pathways
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
