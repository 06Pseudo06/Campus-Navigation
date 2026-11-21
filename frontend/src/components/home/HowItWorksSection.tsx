"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isReducedMotion } from "@/lib/motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STEPS = [
  {
    num: "01",
    title: "SEARCH",
    description: "Look up any academic block, lecture hall, entrance gate, or campus dining facility by name or code.",
    chips: ["+ 38+ BLOCKS", "+ GPS SURVEYED"],
    image: "/images/274ded96b5ab24b17eba47db4e7c69dd.jpg",
  },
  {
    num: "02",
    title: "ROUTE",
    description: "Sub-second graph traversal analyzes verified pedestrian walking edges to generate optimal paths.",
    chips: ["+ DIJKSTRA SOLVER", "+ A* HEURISTIC"],
    image: "/images/arch-navigate.jpg",
  },
  {
    num: "03",
    title: "WALK",
    description: "Follow turn-by-turn guidance with ramp accessibility tags, grade markers, and real-time distance updates.",
    chips: ["+ ACCESSIBLE", "+ STEP-FREE"],
    image: "/images/arch-real_campus.jpg",
  },
  {
    num: "04",
    title: "SAVE",
    description: "Bookmark your frequent classrooms, auditoriums, and labs to your personal atlas for instant recall.",
    chips: ["+ POSTGRESQL SYNC", "+ INSTANT BOOKMARK"],
    image: "/images/arch-save.jpg",
  },
];

export function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!containerRef.current || !trackRef.current || isReducedMotion()) return;

    const isDesktop = window.innerWidth >= 1024;
    if (!isDesktop) return;

    const ctx = gsap.context(() => {
      const track = trackRef.current;
      if (!track) return;

      const totalScroll = track.scrollWidth - window.innerWidth + clampNumber(window.innerWidth * 0.15, 120, 240);

      // 1. Pinned Horizontal Timeline Scrub across the 4 steps
      gsap.to(track, {
        x: -totalScroll,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          scrub: 1.0,
          start: "top top",
          // Proportional pin duration (~3.8x viewport height for 4 steps)
          end: () => "+=" + Math.round(window.innerHeight * 3.8) + "px",
          snap: {
            snapTo: 1 / (STEPS.length - 1),
            duration: { min: 0.25, max: 0.6 },
            ease: "power1.inOut",
          },
          onUpdate: (self) => {
            const stepIdx = Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length));
            setActiveStep(stepIdx);
          },
        },
      });

      // 2. Cinematic exit depth fade: subtle scale down and dim as Section 5 overlaps
      if (contentRef.current) {
        gsap.to(contentRef.current, {
          scale: 0.97,
          opacity: 0.88,
          ease: "power1.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: () => "+=" + Math.round(window.innerHeight * 3.1) + "px",
            end: () => "+=" + Math.round(window.innerHeight * 3.8) + "px",
            scrub: 0.6,
          },
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="section-04"
      ref={containerRef}
      className="relative z-[10] w-full bg-[#F7F3EC] dark:bg-[#070B14] text-[#0E1118] dark:text-zinc-100 pt-20 lg:pt-28 pb-32 sm:pb-40 lg:pb-52 overflow-hidden select-none border-b border-[#E1DDD3]/60 dark:border-white/10 transition-colors duration-200"
      aria-label="How CampusWay Works"
    >
      <div ref={contentRef} className="w-full will-change-transform">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 section-gutter mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E1DDD3] dark:border-zinc-800">
            <div className="flex items-center gap-3 text-xs font-mono font-bold tracking-widest uppercase text-[#0E1118] dark:text-zinc-200">
              <span className="text-[#DE4B31]">04 /</span>
              <span>HOW IT WORKS &bull; FOUR STEPS</span>
            </div>
            <span className="text-[11px] font-mono tracking-widest text-[#6B665C] dark:text-zinc-400 uppercase">
              PINNED TIMELINE NAVIGATION
            </span>
          </div>
        </div>

        {/* Pinned Horizontal Track (Desktop >= 1024px) / Fluid Column Stack (Mobile < 1024px) */}
        <div className="w-full overflow-hidden">
          <div
            ref={trackRef}
            className="flex flex-col lg:flex-row gap-6 sm:gap-8 px-4 sm:px-6 lg:px-16 section-gutter w-full lg:w-max will-change-transform"
          >
            {STEPS.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <div
                  key={idx}
                  data-cursor="STEP"
                  onMouseEnter={() => setActiveStep(idx)}
                  onClick={() => setActiveStep(idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveStep(idx);
                    }
                  }}
                  className={`relative shrink-0 w-full lg:w-[480px] p-6 sm:p-8 rounded-3xl border transition-all duration-300 flex flex-col justify-between cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DE4B31] ${
                    isActive
                      ? "bg-white dark:bg-[#0E1422] border-[#0E1118] dark:border-[#DE4B31] shadow-2xl scale-[1.02]"
                      : "bg-[#FAF8F5] dark:bg-[#0E1422]/70 border-[#E1DDD3] dark:border-zinc-800 opacity-85 hover:opacity-100"
                  }`}
                >
                  {/* Step Numeral & Arrow */}
                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-[#E1DDD3] dark:border-zinc-800 pb-3">
                      <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#DE4B31]">
                        <span>STEP {step.num}</span>
                        <span>✦</span>
                      </div>
                      <span className="text-xs font-mono text-[#6B665C] dark:text-zinc-400 font-bold">
                        0{idx + 1} &rarr; 0{STEPS.length}
                      </span>
                    </div>

                    {/* Step Title */}
                    <h3
                      className={`text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight mb-3 transition-colors ${
                        isActive ? "text-[#0E1118] dark:text-white" : "text-[#0E1118]/75 dark:text-white/75"
                      }`}
                    >
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-[#6B665C] dark:text-zinc-300 leading-relaxed mb-6">
                      {step.description}
                    </p>
                  </div>

                  <div>
                    {/* Photograph */}
                    <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-200 dark:bg-zinc-800 mb-5 border border-[#E1DDD3] dark:border-zinc-800">
                      <Image
                        src={step.image}
                        alt={step.title}
                        fill
                        unoptimized
                        loading="eager"
                        sizes="(max-width: 1024px) 100vw, 480px"
                        className="object-cover object-center grayscale hover:grayscale-0 transition-all duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                    </div>

                    {/* Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E1DDD3] dark:border-zinc-800">
                      {step.chips.map((chip, cIdx) => (
                        <span
                          key={cIdx}
                          className="px-2.5 py-1 rounded-full bg-[#0E1118]/06 dark:bg-white/10 text-[10px] font-mono tracking-wider text-[#0E1118] dark:text-zinc-200 uppercase font-semibold"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function clampNumber(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}
