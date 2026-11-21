"use client";

import React from "react";
import { motion, MotionValue, useTransform } from "framer-motion";
import { AtlasPlate } from "@/data/gallery";

interface StepIndicatorProps {
  plates: AtlasPlate[];
  activeIndex: number;
  scrollProgress: MotionValue<number>;
  onSelectPlate: (index: number) => void;
}

/**
 * StepIndicator
 * 
 * Sticky side navigation gutter indicator (desktop ≥1280px only).
 * Features a 1px vertical track filled with accent color based on section scroll progress,
 * and 6 interactive step targets with active state typography and smooth scroll.
 */
export function StepIndicator({
  plates,
  activeIndex,
  scrollProgress,
  onSelectPlate,
}: StepIndicatorProps) {
  // Map scroll progress (0 to 1) to track fill percentage (0% to 100%)
  const fillHeight = useTransform(scrollProgress, [0, 1], ["0%", "100%"]);

  return (
    <nav
      aria-label="Campus Atlas Plates Navigation"
      className="hidden xl:flex flex-col items-center select-none"
    >
      <div className="relative flex flex-col items-center justify-between h-64">
        {/* Background 1px vertical guide track */}
        <div className="absolute top-2 bottom-2 w-px bg-white/10 -z-10" />

        {/* Dynamic accent fill bar driven by scroll progress */}
        <motion.div
          style={{ height: fillHeight }}
          className="absolute top-2 w-px bg-[#E8452C] origin-top -z-10 shadow-[0_0_8px_rgba(232,69,44,0.6)]"
        />

        {/* 6 Step Navigation Nodes */}
        {plates.map((plate, index) => {
          const isActive = activeIndex === index;

          return (
            <button
              key={plate.id}
              type="button"
              onClick={() => onSelectPlate(index)}
              className="group relative flex items-center gap-3 py-1 px-1 rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E8452C] transition-all cursor-pointer"
              aria-label={`Jump to Plate ${plate.num}: ${plate.title}`}
              aria-current={isActive ? "true" : undefined}
            >
              {/* Dot indicator */}
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-[#E8452C] ring-4 ring-[#E8452C]/20 scale-125"
                    : "bg-white/25 group-hover:bg-white/60 group-hover:scale-110"
                }`}
              />

              {/* Number Label */}
              <span
                className={`font-mono text-[11px] tracking-[0.12em] transition-all duration-300 ${
                  isActive
                    ? "text-[#E8452C] font-bold scale-110 opacity-100"
                    : "text-[#F4F6FA]/40 font-medium group-hover:text-[#F4F6FA]/80 group-hover:opacity-80"
                }`}
              >
                {plate.num}
              </span>

              {/* Hover Tooltip showing category */}
              <span className="absolute left-full ml-2 px-2 py-0.5 rounded bg-[#0D1322] border border-white/10 text-[9px] font-mono tracking-widest text-[#F4F6FA] uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-md">
                {plate.category}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
