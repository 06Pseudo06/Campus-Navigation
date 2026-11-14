"use client";

import React, { useRef, useEffect } from "react";
import { SidebarTab } from "@/types/campus";

interface ExploreToolbarProps {
  currentTab?: SidebarTab;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  campusName?: string;
  isDemoData?: boolean;
}

export function ExploreToolbar({
  currentTab = "explore",
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

  // Contextual titles per view
  const titles: Record<SidebarTab, { prefix: string; accent: string; kicker: string }> = {
    explore: { prefix: "Explore Your", accent: "Campus.", kicker: "CAMPUS ATLAS / LIVE GRAPH" },
    routes: { prefix: "Curated", accent: "Corridors.", kicker: "PREDEFINED CORRIDORS / PATHS" },
    saved: { prefix: "Your", accent: "Places.", kicker: "SAVED ATLAS / BOOKMARKS" },
    help: { prefix: "Here to", accent: "Help.", kicker: "VISITOR ASSISTANCE / SUPPORT" },
  };

  const currentTitle = titles[currentTab] || titles.explore;

  return (
    <section className="relative w-full h-[88px] px-4 sm:px-6 lg:px-8 bg-[#F2F0EB] flex items-center justify-between gap-4 border-b border-[#E1DDD3] select-none overflow-hidden shrink-0 z-10">
      {/* Decorative Warm Sun Disc (130px circle cropped ~35% at top-right card edge, behind university chip) */}
      <div
        className="hidden xl:block absolute -top-8 -right-8 w-[130px] h-[130px] rounded-full bg-gradient-to-br from-[#F2793A] to-[#E8542F] pointer-events-none z-0 shadow-md opacity-90"
        aria-hidden="true"
      >
        <div className="absolute -inset-2 rounded-full border border-[#E8542F]/30 pointer-events-none" />
      </div>

      {/* Left: Contextual Editorial Headline with Mask-Up Animation */}
      <div className="flex flex-col justify-center min-w-0 pr-2">
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-[#6B665C]">
          <span className="text-[#E8542F] font-bold">&mdash;</span>
          <span>{currentTitle.kicker}</span>
          <span className="w-8 sm:w-12 h-px bg-[#E1DDD3] inline-block" />
        </div>

        <h1
          key={currentTab}
          className="text-base sm:text-2xl lg:text-[32px] font-black uppercase tracking-tight text-[#0E1118] leading-none mt-1 truncate font-display animate-fadeIn"
        >
          {currentTitle.prefix}{" "}
          <span className="font-display font-black italic text-[#E8542F]">
            {currentTitle.accent}
          </span>
        </h1>
      </div>

      {/* Center: Global Search Pill (White card with single clean focus glow) */}
      <div className="hidden md:flex flex-1 max-w-md mx-4 items-center relative z-10">
        <div className="w-full relative flex items-center">
          <div className="absolute left-3.5 text-[#6B665C] pointer-events-none">
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
            className="w-full h-11 pl-10 pr-10 rounded-full bg-white border border-[#E1DDD3] text-xs font-sans text-[#0E1118] placeholder:text-[#6B665C]/70 shadow-xs focus-ring-orange transition-all"
            aria-label="Search campus buildings and landmarks"
          />

          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 w-5 h-5 rounded-full bg-[#0E1118]/10 hover:bg-[#0E1118]/20 text-[#0E1118] flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              &times;
            </button>
          ) : (
            <div className="absolute right-3.5 flex items-center pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-[#6B665C] bg-[#F7F5F0] border border-[#E1DDD3] rounded shadow-2xs">
                /
              </kbd>
            </div>
          )}
        </div>
      </div>

      {/* Right: University Chip (White card with crisp borders) */}
      <div className="flex items-center gap-3 shrink-0 relative z-10">
        <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-[16px] bg-white border border-[#E1DDD3] shadow-xs">
          {/* University Crest Icon */}
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#E8542F]/10 border border-[#E8542F]/30 flex items-center justify-center text-[#E8542F] shrink-0">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>

          <div className="flex flex-col font-sans">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs font-bold text-[#0E1118] leading-tight">
                {campusName}
              </span>

              {isDemoData && (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-white border border-[#E8542F] text-[9px] font-mono text-[#E8542F] font-bold uppercase tracking-wider">
                  DEMO DATA
                </span>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-[#6B665C] leading-none mt-0.5">
              <span className="text-[#0F6E73] font-semibold">&bull; LIVE GRAPH</span>
              <span>&bull;</span>
              <span>48 NODES</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
