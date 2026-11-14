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
    description: "Look up any campus hall, lecture theater, elevator, or quadrangle by official code or alias.",
    chips: ["+ 48 BUILDINGS", "+ COORDINATE MAPPED"],
    image: "/images/274ded96b5ab24b17eba47db4e7c69dd.jpg",
  },
  {
    num: "02",
    title: "ROUTE",
    description: "Sub-2ms graph traversal analyzes 1,957 walking edges to generate optimal paths.",
    chips: ["+ DIJKSTRA SOLVER", "+ A* HEURISTIC"],
    image: "/images/arch-navigate.jpg",
  },
  {
    num: "03",
    title: "WALK",
    description: "Live turn-by-turn guidance with ramp accessibility, level grade entries, and distance tags.",
    chips: ["+ ACCESSIBLE", "+ STEP-FREE"],
    image: "/images/arch-real_campus.jpg",
  },
  {
    num: "04",
    title: "SAVE",
    description: "Bookmark frequent classrooms and workspaces to your browser atlas with zero sign-in barrier.",
    chips: ["+ ZERO LOGIN", "+ OFFLINE ATLAS"],
    image: "/images/arch-save.jpg",
  },
];

export function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null);
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
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="section-04"
      ref={containerRef}
      className="relative w-full bg-[#F7F3EC] text-[#111111] pt-20 lg:pt-28 pb-[12vh] overflow-hidden select-none border-b border-[#111111]/12"
      aria-label="How CampusWay Works"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 section-gutter mb-8">
        <div className="flex items-center justify-between pb-4 border-b border-[#111111]/12">
          <div className="flex items-center gap-3 text-xs font-mono font-bold tracking-widest uppercase text-[#111111]">
            <span className="text-[#E8542F]">04 /</span>
            <span>HOW IT WORKS &bull; FOUR STEPS</span>
          </div>
          <span className="text-[11px] font-mono tracking-widest text-[#5B5750] uppercase">
            PINNED TIMELINE NAVIGATION
          </span>
        </div>
      </div>

      {/* Pinned Horizontal Track (Desktop) / Fluid Row (Mobile) */}
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
                className={`relative shrink-0 w-full lg:w-[480px] p-6 sm:p-8 rounded-3xl border transition-all duration-300 ${
                  isActive
                    ? "bg-white border-[#111111] shadow-2xl"
                    : "bg-[#FAF6F0] border-[#111111]/12 opacity-90 hover:opacity-100"
                }`}
              >
                {/* Step Numeral & Arrow */}
                <div className="flex items-center justify-between mb-4 border-b border-[#111111]/10 pb-3">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#E8542F]">
                    <span>STEP {step.num}</span>
                    <span>✦</span>
                  </div>
                  <span className="text-xs font-mono text-[#5B5750] font-bold">
                    0{idx + 1} &rarr; 0{STEPS.length}
                  </span>
                </div>

                {/* Giant Step Heading */}
                <h3
                  className={`text-4xl sm:text-5xl font-black uppercase tracking-tight mb-3 transition-colors ${
                    isActive ? "text-[#111111]" : "text-[#111111]/75"
                  }`}
                >
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-[#5B5750] leading-relaxed mb-6">
                  {step.description}
                </p>

                {/* Real Architectural Photograph */}
                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-[#111111]/10 mb-6 border border-[#111111]/10">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    unoptimized
                    loading="eager"
                    sizes="(max-width: 1024px) 100vw, 480px"
                    className="object-cover object-center grayscale hover:grayscale-0 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/40 via-transparent to-transparent" />
                </div>

                {/* Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#111111]/08">
                  {step.chips.map((chip, cIdx) => (
                    <span
                      key={cIdx}
                      className="px-3 py-1 rounded-full bg-[#111111]/06 text-[10px] font-mono tracking-wider text-[#111111] uppercase font-semibold"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function clampNumber(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}
