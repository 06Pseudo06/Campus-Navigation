"use client";

import React, { useEffect, useState } from "react";
import { isReducedMotion } from "@/lib/motion";
import { useSection } from "@/context/SectionContext";

export interface SectionDef {
  id: string;
  label: string;
  name: string;
  isDark?: boolean;
}

export const SECTIONS: SectionDef[] = [
  { id: "section-01", label: "01", name: "HERO", isDark: false },
  { id: "section-02", label: "02", name: "CAPABILITIES", isDark: false },
  { id: "section-03", label: "03", name: "LIVE ROUTES", isDark: false },
  { id: "section-04", label: "04", name: "HOW IT WORKS", isDark: false },
  { id: "section-05", label: "05", name: "ATLAS", isDark: false },
  { id: "section-06", label: "06", name: "START", isDark: true },
];

export function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeLabel, setActiveLabel] = useState("01");
  const { setActiveSection, setIsDarkSection } = useSection();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Overall Page Scroll Progress Tracking
    const onScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const p = Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100));
        setScrollProgress(p);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // 2. Pure IntersectionObserver for Accurate Section Tracking
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const matchedSec = SECTIONS.find((sec) => sec.id === entry.target.id);
            if (matchedSec) {
              setActiveLabel(matchedSec.label);
              setActiveSection(matchedSec.label);
              setIsDarkSection(!!matchedSec.isDark);
            }
          }
        });
      },
      {
        rootMargin: "-20% 0px -40% 0px",
        threshold: [0, 0.2, 0.5],
      }
    );

    SECTIONS.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [setActiveSection, setIsDarkSection]);

  const scrollToSection = (sec: SectionDef) => {
    const el = document.getElementById(sec.id);
    if (!el) return;

    el.scrollIntoView({ behavior: isReducedMotion() ? "auto" : "smooth" });

    try {
      history.pushState(null, "", `#${sec.id}`);
    } catch {
      // safe fallback
    }
  };

  const isDarkActive = activeLabel === "06";

  return (
    <>
      {/* 1. Global Top Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-transparent z-[70] pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="h-full bg-gradient-to-r from-[#F2793A] via-[#DE4B31] to-[#B23E27] transition-all duration-75 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* 2. Single Global Left Vertical Progress Index (>= 1024px) */}
      <nav
        className="hidden lg:flex fixed left-[clamp(16px,2.2vw,40px)] top-1/2 -translate-y-1/2 z-40 flex-col items-start select-none pointer-events-auto"
        aria-label="Section navigation"
      >
        <div className="relative flex flex-col items-start gap-5 text-xs font-mono tracking-widest">
          {/* Vertical Track Line */}
          <div
            className={`absolute left-[5px] top-1.5 bottom-1.5 w-[1.5px] rounded-full pointer-events-none transition-colors duration-300 ${
              isDarkActive ? "bg-white/20" : "bg-[#0E1118]/15 dark:bg-white/20"
            }`}
          />

          {/* Dynamic Fill Growing along the line with scroll progress */}
          <div
            className="absolute left-[5px] top-1.5 w-[1.5px] bg-[#DE4B31] rounded-full pointer-events-none transition-all duration-100 ease-out"
            style={{ height: `${Math.min(100, Math.max(0, scrollProgress))}%` }}
          />

          {/* 6 Section Items: 01 - 06 */}
          {SECTIONS.map((sec, idx) => {
            const isActive = activeLabel === sec.label;
            const isHovered = hoveredIdx === idx;

            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToSection(sec)}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                aria-current={isActive ? "true" : undefined}
                aria-label={`Scroll to ${sec.name}`}
                className="group relative flex items-center gap-3 cursor-pointer py-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DE4B31] rounded-md transition-all duration-200"
              >
                {/* Active Orange Pip / Tick */}
                <span
                  className={`relative z-10 w-3 h-3 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? "bg-[#DE4B31] scale-110 shadow-md shadow-[#DE4B31]/40"
                      : isDarkActive
                      ? "bg-white/20 group-hover:bg-white/50"
                      : "bg-[#0E1118]/25 dark:bg-white/20 group-hover:bg-[#0E1118]/60 dark:group-hover:bg-white/60"
                  }`}
                >
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>

                {/* Section Numeral (01-06) */}
                <span
                  className={`font-mono transition-all duration-200 ${
                    isActive
                      ? "text-[#DE4B31] font-black text-sm"
                      : isDarkActive
                      ? "text-white/45 group-hover:text-white text-xs font-semibold"
                      : "text-[#5B5750]/55 dark:text-zinc-400 group-hover:text-[#0E1118] dark:group-hover:text-white text-xs font-semibold"
                  }`}
                >
                  {sec.label}
                </span>

                {/* Slide-out Section Name on Hover */}
                <span
                  className={`absolute left-10 whitespace-nowrap text-[11px] font-mono tracking-widest uppercase transition-all duration-300 pointer-events-none px-2 py-0.5 rounded ${
                    isHovered
                      ? isDarkActive
                        ? "opacity-100 translate-x-1 bg-[#161922] text-[#F7F3EC] border border-white/20 shadow-md"
                        : "opacity-100 translate-x-1 bg-white dark:bg-[#161922] text-[#0E1118] dark:text-[#F7F3EC] border border-[#0E1118]/15 dark:border-white/20 shadow-md"
                      : "opacity-0 -translate-x-2"
                  }`}
                >
                  {sec.name}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
