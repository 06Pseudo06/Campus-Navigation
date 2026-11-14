"use client";

import React, { useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isReducedMotion } from "@/lib/motion";
import { useSection } from "@/context/SectionContext";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

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
  { id: "section-05", label: "05", name: "GALLERY", isDark: false },
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

    // 2. ScrollTrigger Per Section Tracking
    const ctx = gsap.context(() => {
      SECTIONS.forEach((sec) => {
        const el = document.getElementById(sec.id);
        if (!el) return;

        ScrollTrigger.create({
          trigger: el,
          start: "top 50%",
          end: "bottom 50%",
          invalidateOnRefresh: true,
          onEnter: () => {
            setActiveLabel(sec.label);
            setActiveSection(sec.label);
            setIsDarkSection(!!sec.isDark);
          },
          onEnterBack: () => {
            setActiveLabel(sec.label);
            setActiveSection(sec.label);
            setIsDarkSection(!!sec.isDark);
          },
        });
      });
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      ctx.revert();
    };
  }, [setActiveSection, setIsDarkSection]);

  const scrollToSection = (sec: SectionDef) => {
    const el = document.getElementById(sec.id);
    if (!el) return;

    const lenis = (window as unknown as { __lenis?: { scrollTo: (target: HTMLElement | string, options?: object) => void } }).__lenis;

    if (lenis && !isReducedMotion()) {
      lenis.scrollTo(el, {
        duration: 1.4,
        easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
        offset: -80,
      });
    } else {
      el.scrollIntoView({ behavior: "smooth" });
    }

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
          className="h-full bg-gradient-to-r from-[#F2793A] via-[#E8542F] to-[#C9411F] transition-all duration-75 ease-out"
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
              isDarkActive ? "bg-white/20" : "bg-[#111111]/15"
            }`}
          />

          {/* Dynamic Fill Growing along the line with scroll progress */}
          <div
            className="absolute left-[5px] top-1.5 w-[1.5px] bg-[#E8542F] rounded-full pointer-events-none transition-all duration-100 ease-out"
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
                className="group relative flex items-center gap-3 cursor-pointer py-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8542F] rounded-md transition-all duration-200"
              >
                {/* Active Orange Pip / Tick */}
                <span
                  className={`relative z-10 w-3 h-3 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? "bg-[#E8542F] scale-110 shadow-md shadow-[#E8542F]/40"
                      : isDarkActive
                      ? "bg-white/20 group-hover:bg-white/50"
                      : "bg-[#111111]/25 group-hover:bg-[#111111]/60"
                  }`}
                >
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>

                {/* Section Numeral (01-06) */}
                <span
                  className={`font-mono transition-all duration-200 ${
                    isActive
                      ? "text-[#E8542F] font-black text-sm"
                      : isDarkActive
                      ? "text-white/45 group-hover:text-white text-xs font-semibold"
                      : "text-[#5B5750]/55 group-hover:text-[#111111] text-xs font-semibold"
                  }`}
                >
                  {sec.label}
                </span>

                {/* Slide-out Section Name on Hover or Active */}
                <span
                  className={`absolute left-10 whitespace-nowrap text-[11px] font-mono tracking-widest uppercase transition-all duration-300 pointer-events-none px-2 py-0.5 rounded ${
                    isHovered
                      ? isDarkActive
                        ? "opacity-100 translate-x-1 bg-[#161922] text-[#F7F3EC] border border-white/20 shadow-md"
                        : "opacity-100 translate-x-1 bg-white text-[#111111] border border-[#111111]/15 shadow-md"
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
