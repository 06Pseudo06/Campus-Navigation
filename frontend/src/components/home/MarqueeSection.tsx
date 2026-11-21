"use client";

import React, { useEffect, useRef, useState } from "react";
import { HairlineDivider } from "@/components/motion/HairlineDivider";
import { isReducedMotion } from "@/lib/motion";

const STATS = [
  { value: 38, suffix: "+", label: "BLOCKS INDEXED", sub: "Academic, Hostel & Lab Zones" },
  { value: 27, suffix: "", label: "SURVEYED NODES", sub: "Ground-Truth Graph Network" },
  { value: 29, suffix: "", label: "PEDESTRIAN EDGES", sub: "Walkways & Concourse Paths" },
  { value: 100, suffix: "%", label: "ACCESSIBLE", sub: "Step-Free Ramp Planning" },
];

export function MarqueeSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!containerRef.current || hasAnimated || isReducedMotion()) {
      if (isReducedMotion()) {
        setCounts(STATS.map((s) => s.value));
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasAnimated(true);

          const startTime = performance.now();
          const duration = 1600;

          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);

            setCounts(
              STATS.map((stat) => Math.round(stat.value * ease))
            );

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [hasAnimated]);

  const marqueeText = "DISCOVER ✦ NAVIGATE ✦ SAVE ✦ ARRIVE ✦ WAYFINDING ✦ CAMPUS ✦ ";

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-[#F7F3EC] dark:bg-[#070B14] text-[#0E1118] dark:text-zinc-100 py-8 sm:py-12 overflow-hidden select-none transition-colors duration-200"
      aria-label="Campus Statistics & Wayfinding Capabilities"
    >
      <HairlineDivider markerCount={2} className="mb-6 sm:mb-8" />

      {/* 1. INFINITE RUNNING MARQUEE */}
      <div className="relative w-full overflow-hidden py-[clamp(14px,2vw,28px)] border-y border-[#E1DDD3] dark:border-white/10">
        <div
          className="flex items-center whitespace-nowrap will-change-transform font-black uppercase tracking-tight text-[#0E1118] dark:text-white animate-marquee"
          style={{ fontSize: "clamp(1.75rem, 3.4vw, 3.25rem)", lineHeight: 1 }}
        >
          <span className="mr-6">{marqueeText}</span>
          <span
            className="mr-6 text-transparent"
            style={{ WebkitTextStroke: "1.2px #DE4B31" }}
          >
            {marqueeText}
          </span>
          <span className="mr-6">{marqueeText}</span>
          <span
            className="mr-6 text-transparent"
            style={{ WebkitTextStroke: "1.2px currentColor" }}
          >
            {marqueeText}
          </span>
          <span className="mr-6">{marqueeText}</span>
          <span
            className="mr-6 text-transparent"
            style={{ WebkitTextStroke: "1.2px #DE4B31" }}
          >
            {marqueeText}
          </span>
        </div>
      </div>

      <HairlineDivider markerCount={1} className="my-6 sm:my-8" />

      {/* 2. CENTERED 4-COLUMN STATS GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#E1DDD3] dark:divide-zinc-800 border-y md:border border-[#E1DDD3] dark:border-zinc-800 bg-[#FAF8F5] dark:bg-[#0E1422] rounded-2xl md:rounded-3xl overflow-hidden shadow-xs">
          {STATS.map((stat, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center text-center p-6 sm:p-8 space-y-2 hover:bg-[#F2ECE1]/50 dark:hover:bg-zinc-800/40 transition-colors"
            >
              <div className="flex items-baseline justify-center gap-1 min-w-[120px]">
                <span
                  className="font-mono font-black tracking-tight text-[#0E1118] dark:text-white tabular-nums"
                  style={{
                    fontSize: "clamp(2rem, 3.8vw, 3.6rem)",
                    lineHeight: 1,
                  }}
                >
                  {counts[idx]}
                </span>
                {stat.suffix && (
                  <span className="text-lg sm:text-xl font-mono font-bold text-[#DE4B31]">
                    {stat.suffix}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#0E1118] dark:text-zinc-200 block">
                {stat.label}
              </span>
              <span className="text-[11px] text-[#6B665C] dark:text-zinc-400 leading-snug block max-w-[180px]">
                {stat.sub}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
