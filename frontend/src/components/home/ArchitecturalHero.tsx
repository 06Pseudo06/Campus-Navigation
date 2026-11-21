"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { isReducedMotion } from "@/lib/motion";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { RotatingTextBadge } from "@/components/motion/RotatingTextBadge";

export function ArchitecturalHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const buildingLayerRef = useRef<HTMLDivElement>(null);
  const sunDiscRef = useRef<HTMLDivElement>(null);
  const leavesTopLeftRef = useRef<HTMLDivElement>(null);

  // Overview Modal State
  const [modalOpen, setModalOpen] = useState(false);

  // Mouse Parallax (subtle, native React)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReducedMotion() || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;

    if (buildingLayerRef.current) {
      buildingLayerRef.current.style.transform = `translate3d(${-normX * 16}px, ${-normY * 12}px, 0)`;
    }
    if (sunDiscRef.current) {
      sunDiscRef.current.style.transform = `translate3d(${-normX * 8}px, ${-normY * 6}px, 0)`;
    }
    if (leavesTopLeftRef.current) {
      leavesTopLeftRef.current.style.transform = `translate3d(${normX * 14}px, ${normY * 10}px, 0)`;
    }
  };

  return (
    <section
      id="section-01"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full min-h-[92svh] lg:min-h-[96svh] bg-[#F7F3EC] dark:bg-[#070B14] text-[#0E1118] dark:text-zinc-100 overflow-hidden flex flex-col justify-between pt-12 sm:pt-16 pb-8 lg:pb-12 select-none transition-colors duration-200"
      aria-label="Campus Wayfinding Reimagined"
    >
      {/* 1. TOP-LEFT SOFT FOLIAGE OVERLAY */}
      <div
        ref={leavesTopLeftRef}
        className="absolute -top-[3vw] -left-[3vw] w-[clamp(240px,28vw,440px)] pointer-events-none z-[2] select-none transition-transform duration-300"
        style={{
          mixBlendMode: "multiply",
          opacity: 0.55,
          WebkitMaskImage: "radial-gradient(ellipse at top left, #000 25%, transparent 72%)",
          maskImage: "radial-gradient(ellipse at top left, #000 25%, transparent 72%)",
        }}
        aria-hidden="true"
      >
        <Image
          src="/images/hero-foliage-top-left.png"
          alt=""
          width={300}
          height={380}
          priority
          unoptimized
          className="w-full h-auto object-contain object-top-left"
        />
      </div>

      {/* 2. BACKGROUND ARCHITECTURAL BLUEPRINT GRID */}
      <div className="absolute inset-0 blueprint-grid pointer-events-none z-0" aria-hidden="true" />

      {/* 3. SUN DISC & CONCENTRIC OUTLINE ARC (Behind Building) */}
      <div
        ref={sunDiscRef}
        className="hidden lg:block absolute right-[4vw] top-[14%] w-[clamp(440px,50vw,720px)] aspect-square pointer-events-none z-[1] transition-transform duration-300"
        aria-hidden="true"
      >
        <svg className="w-full h-full" viewBox="0 0 600 600" fill="none">
          <defs>
            <radialGradient id="heroSunGrad" cx="50%" cy="45%" r="50%" fx="45%" fy="40%">
              <stop offset="0%" stopColor="#F2793A" />
              <stop offset="60%" stopColor="#DE4B31" />
              <stop offset="100%" stopColor="#B23E27" />
            </radialGradient>
          </defs>

          {/* Thin Outer Concentric Arc */}
          <circle cx="300" cy="300" r="285" stroke="currentColor" className="text-black/10 dark:text-white/10" strokeWidth="1.2" />

          {/* Luminous Orange Sun Disc */}
          <circle cx="300" cy="300" r="235" fill="url(#heroSunGrad)" opacity="0.95" />

          {/* Crosshair Sparkle */}
          <line x1="300" y1="215" x2="300" y2="385" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.2" />
          <line x1="215" y1="300" x2="385" y2="300" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.2" />
          <circle cx="300" cy="300" r="2.5" fill="#FFFFFF" />
        </svg>
      </div>

      {/* 4. MONUMENTAL FULL-BLEED CURVED UNIVERSITY BUILDING */}
      <div
        ref={buildingLayerRef}
        className="absolute right-[-3vw] bottom-0 w-[clamp(500px,60vw,1080px)] h-[clamp(420px,82svh,880px)] pointer-events-none z-[2] select-none flex items-end justify-end overflow-visible transition-transform duration-300"
      >
        <Image
          src="/images/hero-curved-fullbleed.webp"
          alt="Monumental curved campus architecture with sunset disc"
          width={1671}
          height={941}
          priority
          unoptimized
          className="w-full h-full object-contain object-bottom-right drop-shadow-[0_24px_48px_rgba(17,17,17,0.14)] dark:drop-shadow-[0_24px_48px_rgba(0,0,0,0.6)]"
        />

        {/* Elevation Tag at Right Edge */}
        <div className="absolute bottom-3 right-8 text-[10px] font-mono tracking-widest text-[#5B5750] dark:text-zinc-500 uppercase hidden sm:block">
          LPU CAMPUS &bull; DATASET C VERIFIED
        </div>
      </div>

      {/* Top Right Architectural Callout */}
      <div className="hidden lg:flex flex-col items-end gap-1 absolute top-12 right-12 z-20 pointer-events-none text-right">
        <div className="flex flex-col text-[9px] font-mono font-medium tracking-widest text-[#5B5750] dark:text-zinc-400 uppercase leading-tight">
          <span>CAMPUS</span>
          <span>MAP</span>
          <span>ROUTES</span>
          <span>SPACES</span>
        </div>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="stroke-[#0E1118]/25 dark:stroke-white/20 mt-1">
          <line x1="0" y1="36" x2="36" y2="0" strokeWidth="1" />
        </svg>
      </div>

      {/* 5. MAIN HERO CONTENT COLUMN */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-12 flex flex-col justify-center my-auto pt-6 lg:pt-0">
        <div className="max-w-xl lg:max-w-2xl flex flex-col space-y-5 lg:space-y-6">
          {/* Section Kicker */}
          <div className="flex items-center gap-2.5 text-xs font-mono font-bold tracking-widest uppercase text-[#0E1118] dark:text-zinc-200">
            <span className="text-[#DE4B31]">01 /</span>
            <span className="tracking-wider">CAMPUS WAYFINDING, REIMAGINED</span>
            <span className="w-12 sm:w-24 h-px bg-[#0E1118]/25 dark:bg-white/20" aria-hidden="true" />
          </div>

          {/* EXACT HEADLINE */}
          <h1 className="fluid-hero-headline font-black tracking-tight uppercase text-[#0E1118] dark:text-white">
            <span className="block">FIND YOUR</span>
            <span className="block">PLACE.</span>
            <span className="block text-[#DE4B31] italic tracking-tight">NAVIGATE</span>
            <span className="block text-[#DE4B31] italic tracking-tight">FURTHER.</span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-[#5B5750] dark:text-zinc-300 font-normal leading-relaxed max-w-lg">
            Discover destinations, plan smarter routes, and experience Lovely Professional University with architectural clarity and step-by-step guidance.
          </p>

          {/* CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6">
            <MagneticButton
              href="/explore"
              variant="primary"
              cursorLabel="EXPLORE"
              className="px-8 py-4 text-xs sm:text-sm shadow-md hover:shadow-xl"
            >
              <span>EXPLORE CAMPUS</span>
              <span className="text-[#DE4B31] font-bold text-sm">↗</span>
            </MagneticButton>

            {/* Circular Play Button + WATCH OVERVIEW */}
            <button
              type="button"
              data-cursor="PLAY"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
              aria-label="View system overview"
            >
              <div className="w-12 h-12 rounded-full border border-[#0E1118]/30 dark:border-white/20 group-hover:border-[#DE4B31] bg-white/70 dark:bg-zinc-800/80 flex items-center justify-center transition-all group-hover:scale-105 shadow-sm">
                <svg
                  className="w-4 h-4 text-[#0E1118] dark:text-white group-hover:text-[#DE4B31] ml-0.5 transition-colors"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div className="flex flex-col text-[11px] font-mono font-bold tracking-widest uppercase text-[#0E1118] dark:text-zinc-200 leading-tight group-hover:text-[#DE4B31] transition-colors">
                <span>SYSTEM</span>
                <span>OVERVIEW</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 6. BOTTOM BAR: SCROLL INDICATOR & STATS ROW */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-12 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono text-[#5B5750] dark:text-zinc-400 pt-6">
        <div className="flex flex-wrap items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-3">
            <div className="w-4 h-7 rounded-full border border-[#0E1118]/40 dark:border-white/30 flex items-start justify-center p-1">
              <span className="w-1 h-1.5 bg-[#DE4B31] rounded-full animate-bounce" />
            </div>
            <span className="tracking-widest uppercase text-[11px] font-semibold text-[#5B5750] dark:text-zinc-400">
              SCROLL TO EXPLORE &mdash;
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono tracking-wider uppercase text-[#5B5750] dark:text-zinc-400">
            <span>38+ ACADEMIC BLOCKS</span>
            <span className="opacity-40">&bull;</span>
            <span>27 SURVEYED NODES</span>
            <span className="opacity-40">&bull;</span>
            <span className="text-[#DE4B31] font-semibold">DATASET C VERIFIED</span>
          </div>
        </div>
      </div>

      {/* 7. ROTATING CIRCULAR SCROLL BADGE */}
      <div className="hidden md:block fixed lg:absolute right-[clamp(24px,4vw,64px)] bottom-[clamp(88px,12svh,140px)] z-20 pointer-events-auto">
        <RotatingTextBadge
          size={92}
          onClick={() => {
            const el = document.getElementById("section-02");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />
      </div>

      {/* System Overview Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-[#0E1422] rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#E1DDD3] dark:border-zinc-800 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E1DDD3] dark:border-zinc-800">
              <span className="font-mono text-xs font-bold text-[#DE4B31] uppercase tracking-wider">
                CAMPUSWAY // ARCHITECTURAL SPECIFICATION
              </span>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-black dark:hover:text-white flex items-center justify-center text-sm font-bold"
              >
                &times;
              </button>
            </div>
            <h3 className="text-xl font-bold text-[#0E1118] dark:text-white">
              CampusWay for Lovely Professional University
            </h3>
            <p className="text-sm text-[#5B5750] dark:text-zinc-300 leading-relaxed">
              CampusWay is an intelligent wayfinding system powered by verified ground-truth topological graphs (Dataset C), featuring 3D building visualization, step-free accessible route planning, and real-time navigation across LPU&apos;s 600+ acre campus.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-zinc-900 border border-[#E1DDD3] dark:border-zinc-800">
                <span className="text-[10px] text-slate-400 block">TOPOLOGY</span>
                <span className="font-bold text-[#0E1118] dark:text-white">Dataset C Verified</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-zinc-900 border border-[#E1DDD3] dark:border-zinc-800">
                <span className="text-[10px] text-slate-400 block">MAP ENGINE</span>
                <span className="font-bold text-[#0E1118] dark:text-white">Mapbox GL 3D</span>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Link
                href="/explore"
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 rounded-full bg-[#0E1118] dark:bg-white text-white dark:text-[#0E1118] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#DE4B31] dark:hover:bg-[#DE4B31] dark:hover:text-white transition"
              >
                Launch Map &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
