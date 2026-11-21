"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { AtlasPlate } from "@/data/gallery";

interface AtlasCardProps {
  plate: AtlasPlate;
  index: number;
  heightClass: string;
  isFeatured?: boolean;
  onSelect: (index: number) => void;
}

/**
 * AtlasCard
 * 
 * Bento architectural plate card.
 * Integrates:
 * - Parallax scroll (±20px Y-axis)
 * - Inset clip-path card entrance animation
 * - Smooth desktop hover lift (-6px) & soft accent glow
 * - 0.9s ease-out image zoom to 1.06
 * - 2px growing accent underline under title
 * - Rotating 45° glass arrow button
 * - Full WCAG AA contrast with layered gradients
 */
export function AtlasCard({
  plate,
  index,
  heightClass,
  isFeatured = false,
  onSelect,
}: AtlasCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Subtle scroll parallax: image moves ±20px on Y axis
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });

  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [0, 0] : [-20, 20]
  );

  return (
    <motion.article
      id={plate.id}
      ref={cardRef}
      data-atlas-card="true"
      data-cursor="none"
      role="button"
      tabIndex={0}
      aria-label={`View Plate ${plate.num}: ${plate.title}`}
      onClick={() => onSelect(index)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(index);
        }
      }}
      // Entrance animation: staggered fade-up (0.8s, stagger 0.12s, amount 0.2)
      // with clip-path inset reveal from inset(8% round 24px) to inset(0 round 24px)
      initial={{
        opacity: 0,
        y: shouldReduceMotion ? 0 : 40,
        clipPath: shouldReduceMotion
          ? "inset(0% round 24px)"
          : "inset(8% round 24px)",
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        clipPath: "inset(0% round 24px)",
      }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.8,
        delay: shouldReduceMotion ? 0 : index * 0.12,
        ease: [0.22, 1, 0.36, 1],
      }}
      // Desktop hover lift: lifts -6px with soft accent glow and 1px accent border
      whileHover={shouldReduceMotion ? undefined : { y: -6 }}
      className={`group relative ${heightClass} w-full rounded-3xl overflow-hidden bg-[#0D1322] border border-white/[0.08] hover:border-[#E8452C]/60 hover:shadow-[0_20px_60px_-20px_rgba(232,69,44,0.35)] transition-all duration-400 cursor-pointer select-none flex flex-col justify-between p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8452C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070B14]`}
    >
      {/* Parallax Image Viewport with Overflow Hidden and 1.12 scale margin */}
      <div className="absolute -inset-x-0 -top-6 -bottom-6 overflow-hidden pointer-events-none -z-10">
        <motion.div
          style={{ y: parallaxY }}
          className="relative w-full h-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.06] will-change-transform"
        >
          <Image
            src={plate.image}
            alt={plate.alt}
            fill
            unoptimized
            loading={index < 2 ? "eager" : "lazy"}
            sizes={
              isFeatured
                ? "(max-width: 1024px) 100vw, 760px"
                : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 440px"
            }
            className="object-cover object-center filter grayscale-[12%] group-hover:grayscale-0 transition-all duration-700"
          />
        </motion.div>
      </div>

      {/* Layered Lighting Overlays for Guaranteed WCAG Contrast */}
      {/* 1. Faint top gradient behind chips */}
      <div
        aria-hidden="true"
        className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#070B14]/80 via-[#070B14]/30 to-transparent pointer-events-none z-1"
      />

      {/* 2. Bottom gradient: transparent -> rgba(7,11,20,0.92) at the bottom 55% */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#070B14]/95 via-[#070B14]/85 to-transparent opacity-85 group-hover:opacity-95 transition-opacity duration-500 pointer-events-none z-1"
        style={{
          background:
            "linear-gradient(to top, rgba(7, 11, 20, 0.95) 0%, rgba(7, 11, 20, 0.82) 45%, rgba(7, 11, 20, 0.35) 75%, transparent 100%)",
        }}
      />

      {/* TOP HEADER: Glassmorphic Category Chip + Mono Plate Number */}
      <div className="relative z-10 flex items-center justify-between pointer-events-none">
        {/* Top-left Glassmorphic Pill Chip */}
        <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#F4F6FA] font-mono text-xs font-medium tracking-[0.12em] uppercase border border-white/15 shadow-sm">
          {plate.category}
        </span>

        {/* Top-right Mono Plate Identifier */}
        <span className="text-xs font-mono font-semibold tracking-[0.12em] text-[#F4F6FA]/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          PLATE {plate.num}
        </span>
      </div>

      {/* BOTTOM CONTENT: Eyebrow + Era Tag + White Title with Growing Accent Underline + Circular Arrow */}
      <div className="relative z-10 flex flex-col justify-end pt-6 pointer-events-none">
        {/* Eyebrow Line & Era Tag */}
        <div className="flex items-center justify-between text-xs font-mono tracking-[0.12em] uppercase mb-2">
          <span className="text-[#F4F6FA]/60">{plate.eyebrow}</span>
          <span className="text-[#E8452C] font-bold">ERA {plate.era}</span>
        </div>

        {/* Title & 40px Circular Arrow Button */}
        <div className="flex items-end justify-between gap-4">
          <h3 className="text-[clamp(1.1rem,1.6vw,1.6rem)] font-display font-bold uppercase text-[#F4F6FA] tracking-[-0.02em] leading-snug line-clamp-2">
            <span className="relative inline-block pb-0.5">
              {plate.title}
              {/* 2px accent underline that grows from the left on hover */}
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E8452C] scale-x-0 origin-left transition-transform duration-500 ease-out group-hover:scale-x-100"
              />
            </span>
          </h3>

          {/* 40px Circular Glass Arrow Button (fills with #E8452C on hover, rotates 45°) */}
          <div
            aria-hidden="true"
            className="w-10 h-10 rounded-full border border-white/15 bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 transition-all duration-300 group-hover:bg-[#E8452C] group-hover:border-[#E8452C] shadow-sm"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 text-[#F4F6FA] transition-transform duration-300 group-hover:rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            >
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
