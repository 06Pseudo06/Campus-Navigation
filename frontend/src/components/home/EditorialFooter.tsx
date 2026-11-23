"use client";

import React from "react";
import Link from "next/link";
import { HairlineDivider } from "@/components/motion/HairlineDivider";
import { CampusWayLogo } from "@/components/icons/Icons";

export function EditorialFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative w-full bg-[#FAF8F5] dark:bg-[#070A10] text-[#0E1118] dark:text-zinc-100 pt-16 pb-8 overflow-hidden select-none border-t border-[#E1DDD3] dark:border-white/10 transition-colors duration-200">
      {/* Top Marker Line */}
      <HairlineDivider markerCount={1} className="mb-12" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start justify-between">
          {/* Brand Column & Dispatch Input */}
          <div className="md:col-span-5 space-y-5">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <CampusWayLogo className="w-8 h-8 text-[#DE4B31] shrink-0" />
              <span className="text-xl font-bold tracking-tight text-[#0E1118] dark:text-white">
                CampusWay<sup className="text-[10px] font-normal ml-0.5 text-[#DE4B31]">™</sup>
              </span>
            </Link>

            <p className="text-xs text-[#6B665C] dark:text-zinc-400 leading-relaxed max-w-sm">
              An intelligent university campus navigation platform built with architectural
              rigor, dual Dijkstra &amp; A* graph solvers, and zero-login client state for Lovely Professional University.
            </p>

            {/* Newsletter Dispatch Input */}
            <div className="pt-2 space-y-2">
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#6B665C] dark:text-zinc-400 block font-semibold">
                CAMPUSWAY DISPATCH // UPDATES
              </span>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Thank you for subscribing to CampusWay updates.");
                }}
                className="flex items-center max-w-sm rounded-full border border-[#E1DDD3] dark:border-zinc-700 p-1 bg-white dark:bg-[#0E1422] focus-within:border-[#DE4B31] transition-colors"
              >
                <input
                  type="email"
                  required
                  placeholder="student@lpu.in"
                  className="w-full px-4 py-2 text-xs font-mono bg-transparent text-[#0E1118] dark:text-white focus:outline-none placeholder:text-slate-400"
                  aria-label="Email address for updates"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-[#0E1118] dark:bg-white hover:bg-[#DE4B31] dark:hover:bg-[#DE4B31] text-white dark:text-[#0E1118] dark:hover:text-white text-[10px] font-mono font-bold uppercase transition-colors shrink-0 cursor-pointer"
                >
                  JOIN ↗
                </button>
              </form>
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs font-mono uppercase tracking-wider">
            {/* Column 1: Navigation */}
            <div className="space-y-3">
              <span className="font-bold text-[#0E1118] dark:text-white block">NAVIGATION</span>
              <ul className="space-y-2 text-[#6B665C] dark:text-zinc-400">
                <li>
                  <Link href="/explore" className="hover:text-[#DE4B31] transition-colors">
                    Explore Map
                  </Link>
                </li>
                <li>
                  <Link href="/explore?tab=routes" className="hover:text-[#DE4B31] transition-colors">
                    Predefined Routes
                  </Link>
                </li>
                <li>
                  <Link href="/explore?tab=saved" className="hover:text-[#DE4B31] transition-colors">
                    Saved Places
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Platform */}
            <div className="space-y-3">
              <span className="font-bold text-[#0E1118] dark:text-white block">PLATFORM</span>
              <ul className="space-y-2 text-[#6B665C] dark:text-zinc-400">
                <li>
                  <Link href="/about" className="hover:text-[#DE4B31] transition-colors">
                    About Project
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-[#DE4B31] transition-colors">
                    Help &amp; FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-[#DE4B31] transition-colors">
                    Sign In / Guest
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Specification */}
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <span className="font-bold text-[#0E1118] dark:text-white block">SPECIFICATION</span>
              <ul className="space-y-2 text-[#6B665C] dark:text-zinc-400 text-[11px]">
                <li>38+ Blocks Indexed</li>
                <li>27 Surveyed Nodes</li>
                <li>29 Pedestrian Edges</li>
                <li>Dataset C Ground Truth</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Utility Bar + Back to Top */}
        <div className="pt-8 border-t border-[#E1DDD3] dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-[#6B665C] dark:text-zinc-400">
          <div>
            &copy; {new Date().getFullYear()} CampusWay. University Navigation System.
          </div>

          <div className="flex items-center gap-6">
            <span className="hidden sm:inline">WARM PAPER #F7F3EC &bull; SUNSET #DE4B31</span>
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-1.5 text-[#0E1118] dark:text-zinc-200 hover:text-[#DE4B31] font-bold uppercase transition-colors cursor-pointer"
            >
              <span>BACK TO TOP</span>
              <span>&uarr;</span>
            </button>
          </div>
        </div>

        {/* Edge-to-Edge SVG Watermark */}
        <div className="w-full overflow-hidden pointer-events-none select-none pt-4 sm:pt-6">
          <svg
            viewBox="0 0 1400 170"
            className="w-full h-auto text-[#0E1118]/[0.05] dark:text-white/[0.04] block"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            <text
              x="50%"
              y="140"
              textAnchor="middle"
              fill="currentColor"
              className="font-black"
              style={{
                fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                fontWeight: 900,
                fontSize: "172px",
                letterSpacing: "-0.04em",
              }}
            >
              CAMPUSWAY
            </text>
          </svg>
        </div>
      </div>
    </footer>
  );
}
