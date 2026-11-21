"use client";

import React, { useState } from "react";
import Image from "next/image";

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
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section
      id="section-04"
      className="relative z-[1] w-full bg-[#F7F3EC] dark:bg-[#070B14] text-[#0E1118] dark:text-zinc-100 pt-20 lg:pt-28 pb-28 sm:pb-36 lg:pb-44 overflow-hidden select-none transition-colors duration-200"
      aria-label="How CampusWay Works"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E1DDD3] dark:border-zinc-800">
          <div className="flex items-center gap-3 text-xs font-mono font-bold tracking-widest uppercase text-[#0E1118] dark:text-zinc-200">
            <span className="text-[#DE4B31]">04 /</span>
            <span>HOW IT WORKS &bull; FOUR STEPS</span>
          </div>
          <span className="text-[11px] font-mono tracking-widest text-[#6B665C] dark:text-zinc-400 uppercase">
            END-TO-END WAYFINDING ARCHITECTURE
          </span>
        </div>

        {/* 4-Column Timeline Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
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
                className={`relative p-6 sm:p-7 rounded-3xl border transition-all duration-300 flex flex-col justify-between cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DE4B31] ${
                  isActive
                    ? "bg-white dark:bg-[#0E1422] border-[#0E1118] dark:border-[#DE4B31] shadow-xl scale-[1.02]"
                    : "bg-[#FAF8F5] dark:bg-[#0E1422]/70 border-[#E1DDD3] dark:border-zinc-800 opacity-90 hover:opacity-100"
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

                  {/* Heading */}
                  <h3 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-2 text-[#0E1118] dark:text-white">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-[#6B665C] dark:text-zinc-300 leading-relaxed mb-5">
                    {step.description}
                  </p>
                </div>

                <div>
                  {/* Real Architectural Photograph */}
                  <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-200 dark:bg-zinc-800 mb-4 border border-[#E1DDD3] dark:border-zinc-800">
                    <Image
                      src={step.image}
                      alt={step.title}
                      fill
                      unoptimized
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                      className="object-cover object-center grayscale hover:grayscale-0 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  </div>

                  {/* Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E1DDD3] dark:border-zinc-800">
                    {step.chips.map((chip, cIdx) => (
                      <span
                        key={cIdx}
                        className="px-2.5 py-0.5 rounded-full bg-[#0E1118]/06 dark:bg-white/10 text-[9px] font-mono tracking-wider text-[#0E1118] dark:text-zinc-200 uppercase font-semibold"
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
    </section>
  );
}
