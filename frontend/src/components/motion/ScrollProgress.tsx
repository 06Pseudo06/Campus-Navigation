"use client";

import React, { useEffect, useState } from "react";

const SECTIONS = [
  { id: "hero", label: "01", name: "WAYFINDING" },
  { id: "features", label: "02", name: "CAPABILITIES" },
  { id: "routes", label: "03", name: "LIVE MAP" },
  { id: "how-it-works", label: "04", name: "PROCESS" },
  { id: "cta", label: "05", name: "EXPLORE" },
];

export function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("01");

  useEffect(() => {
    function onScroll() {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setScrollProgress(progress);
      }

      // Check active section
      const sectionElements = SECTIONS.map((sec) => document.getElementById(sec.id)).filter(Boolean);
      const scrollPos = window.scrollY + window.innerHeight * 0.35;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(SECTIONS[i].label);
          break;
        }
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* 1. Thin Top Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-transparent z-[60] pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="h-full bg-gradient-to-r from-[#F2793A] via-[#E8542F] to-[#C9411F] transition-all duration-75 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* 2. Left Vertical Progress Index */}
      <nav
        className="hidden xl:flex fixed left-6 top-1/2 -translate-y-1/2 z-40 flex-col items-start gap-4 select-none pointer-events-auto"
        aria-label="Section Navigation"
      >
        <div className="relative flex flex-col items-start gap-5 text-[10px] font-mono tracking-widest text-[#5B5750]">
          {/* Vertical progress track */}
          <div className="absolute left-[3px] top-1 bottom-1 w-[1.5px] bg-[#111111]/12 rounded-full" />

          {SECTIONS.slice(0, 3).map((sec) => {
            const isActive = activeSection === sec.label;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToSection(sec.id)}
                className="group relative flex items-center gap-3 cursor-pointer py-0.5 text-left focus:outline-none"
                aria-label={`Scroll to ${sec.name}`}
              >
                {/* Active Indicator Orange Bar */}
                <span
                  className={`w-[2.5px] h-4 rounded-full transition-all duration-300 ${
                    isActive
                      ? "bg-[#E8542F] scale-y-125 opacity-100"
                      : "bg-transparent opacity-0 group-hover:bg-[#111111]/30 group-hover:opacity-100"
                  }`}
                />

                {/* Section Numeral */}
                <span
                  className={`font-semibold transition-colors duration-200 ${
                    isActive
                      ? "text-[#E8542F] font-bold"
                      : "text-[#5B5750]/70 group-hover:text-[#111111]"
                  }`}
                >
                  {sec.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
