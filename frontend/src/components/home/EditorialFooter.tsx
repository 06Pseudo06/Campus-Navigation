"use client";

import React from "react";
import Link from "next/link";
import { HairlineDivider } from "@/components/motion/HairlineDivider";

export function EditorialFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative w-full bg-[#FAF8F5] text-[#111111] pt-16 pb-8 overflow-hidden select-none border-t border-[#111111]/12">
      {/* ✦ Top Marker Line */}
      <HairlineDivider markerCount={1} className="mb-12" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start justify-between">
          {/* Brand Column & Newsletter Input (Video 2 reference) */}
          <div className="md:col-span-5 space-y-5">
            <Link href="/" className="inline-flex items-center gap-2.5 text-[#111111]">
              <div className="w-8 h-8 rounded-t-full border-[2.5px] border-[#E8542F] border-b-0 flex items-end justify-center pb-0.5">
                <div className="w-3 h-4 rounded-t-full border-[2px] border-[#E8542F] border-b-0" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#111111]">
                CampusWay<sup className="text-[10px] font-normal ml-0.5">™</sup>
              </span>
            </Link>

            <p className="text-xs text-[#5B5750] leading-relaxed max-w-sm">
              An intelligent university campus navigation platform built with architectural
              rigor, dual Dijkstra &amp; A* graph solvers, and zero-login client state.
            </p>

            {/* Newsletter-style Input */}
            <div className="pt-2 space-y-2">
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#5B5750] block">
                CAMPUSWAY DISPATCH // UPDATES
              </span>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Subscribed to CampusWay topological updates.");
                }}
                className="flex items-center max-w-sm rounded-full border border-[#111111]/20 p-1 bg-white focus-within:border-[#E8542F]"
              >
                <input
                  type="email"
                  required
                  placeholder="name@university.edu"
                  className="w-full px-4 py-2 text-xs font-mono bg-transparent text-[#111111] focus:outline-none placeholder:text-[#5B5750]/50"
                  aria-label="Email address for updates"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-[#111111] hover:bg-[#E8542F] text-white text-[10px] font-mono font-bold uppercase transition-colors shrink-0 cursor-pointer"
                >
                  JOIN ↗
                </button>
              </form>
            </div>
          </div>

          {/* Nav Columns: Navigation, Platform, Specification */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs font-mono uppercase tracking-wider">
            {/* Column 1: Navigation */}
            <div className="space-y-3">
              <span className="font-bold text-[#111111] block">NAVIGATION</span>
              <ul className="space-y-2 text-[#5B5750]">
                <li>
                  <Link href="/explore" className="hover:text-[#E8542F] transition-colors">
                    Explore Map
                  </Link>
                </li>
                <li>
                  <Link href="/explore?tab=routes" className="hover:text-[#E8542F] transition-colors">
                    Predefined Routes
                  </Link>
                </li>
                <li>
                  <Link href="/explore?tab=saved" className="hover:text-[#E8542F] transition-colors">
                    Saved Places
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Platform */}
            <div className="space-y-3">
              <span className="font-bold text-[#111111] block">PLATFORM</span>
              <ul className="space-y-2 text-[#5B5750]">
                <li>
                  <Link href="/about" className="hover:text-[#E8542F] transition-colors">
                    About Project
                  </Link>
                </li>
                <li>
                  <Link href="/explore?tab=help" className="hover:text-[#E8542F] transition-colors">
                    Visitor Support
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-[#E8542F] transition-colors">
                    Sign In / Guest
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Specification */}
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <span className="font-bold text-[#111111] block">SPECIFICATION</span>
              <ul className="space-y-2 text-[#5B5750] text-[11px]">
                <li>48 Buildings Indexed</li>
                <li>1,957 Graph Nodes</li>
                <li>Dijkstra + A* Solvers</li>
                <li>Zero-Login Client Atlas</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Utility Bar + Back to Top */}
        <div className="pt-8 border-t border-[#111111]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-[#5B5750]">
          <div>
            &copy; {new Date().getFullYear()} CampusWay. University Navigation System.
          </div>

          <div className="flex items-center gap-6">
            <span>WARM PAPER #F7F3EC &bull; SUNSET #E8542F</span>
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-1.5 text-[#111111] hover:text-[#E8542F] font-bold uppercase transition-colors cursor-pointer"
            >
              <span>BACK TO TOP</span>
              <span>&uarr;</span>
            </button>
          </div>
        </div>

        {/* Huge Cropped Wordmark Rising Into View at Bottom */}
        <div className="pt-6 overflow-hidden pointer-events-none select-none opacity-10">
          <span className="block text-[14vw] font-black leading-none tracking-tighter text-[#111111] text-center -mb-8 sm:-mb-14">
            CAMPUSWAY
          </span>
        </div>
      </div>
    </footer>
  );
}
