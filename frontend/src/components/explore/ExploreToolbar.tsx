"use client";

import React, { useRef, useEffect } from "react";

interface ExploreToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  campusName?: string;
  isDemoData?: boolean;
}

export function ExploreToolbar({
  searchQuery,
  onSearchChange,
  campusName = "Carleton University",
  isDemoData = true,
}: ExploreToolbarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: '/' focuses the search input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <section className="relative w-full h-[88px] px-4 sm:px-6 lg:px-8 bg-[#F7F3EC] flex items-center justify-between gap-4 border-b border-[#111111]/12 select-none overflow-hidden shrink-0 z-10">
      {/* Decorative Warm Sun Disc Behind Right End (Hidden on narrow / short viewports) */}
      <div
        className="hidden xl:block absolute -right-6 -bottom-10 w-32 h-32 rounded-full bg-gradient-to-tr from-[#E8542F] to-[#F2793A] opacity-20 pointer-events-none -z-0"
        aria-hidden="true"
      >
        <div className="absolute -inset-3 rounded-full border border-[#E8542F]/30" />
      </div>

      {/* Left: Editorial Headline & Mono Label */}
      <div className="flex flex-col justify-center min-w-0 pr-2">
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-[#5B5750]">
          <span className="font-bold text-[#E8542F]">CAMPUS ATLAS</span>
          <span className="text-[#111111]/30">/</span>
          <span>LIVE GRAPH</span>
          <span className="w-8 sm:w-12 h-px bg-[#111111]/20 inline-block" />
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-[38px] font-black uppercase tracking-tight text-[#111111] leading-none mt-0.5 truncate">
          Explore Your <span className="italic text-[#E8542F] font-serif font-normal normal-case">Campus.</span>
        </h1>
      </div>

      {/* Center: Global Search Pill */}
      <div className="hidden md:flex flex-1 max-w-md mx-4 items-center relative">
        <div className="w-full relative flex items-center">
          <div className="absolute left-3.5 text-[#5B5750] pointer-events-none">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search buildings, rooms, landmarks…"
            className="w-full h-11 pl-10 pr-10 rounded-full bg-[#FBF8F2] border border-[#111111]/15 text-xs text-[#111111] placeholder:text-[#5B5750]/60 focus:outline-none focus:border-[#E8542F] focus:ring-2 focus:ring-[#E8542F]/20 shadow-sm transition-all"
            aria-label="Search campus buildings and landmarks"
          />

          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 w-5 h-5 rounded-full bg-[#111111]/10 hover:bg-[#111111]/20 text-[#111111] flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              &times;
            </button>
          ) : (
            <div className="absolute right-3.5 flex items-center pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-[#5B5750] bg-[#111111]/[0.05] border border-[#111111]/15 rounded shadow-2xs">
                /
              </kbd>
            </div>
          )}
        </div>
      </div>

      {/* Right: University Chip */}
      <div className="flex items-center gap-3 shrink-0 relative z-10">
        <div className="flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-[#FBF8F2] border border-[#111111]/12 shadow-xs">
          {/* University Crest Icon */}
          <div className="w-8 h-8 rounded-xl bg-[#E8542F]/10 border border-[#E8542F]/30 flex items-center justify-center text-[#E8542F] shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#111111] leading-tight">
                {campusName}
              </span>
              {isDemoData && (
                <span className="px-1.5 py-0.2 rounded-full border border-[#E8542F] text-[9px] font-mono font-bold text-[#E8542F] uppercase tracking-wider">
                  DEMO DATA
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono text-[#5B5750] uppercase tracking-widest leading-none mt-0.5">
              Live Graph &bull; 48 Nodes
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}