"use client";

import React from "react";
import Image from "next/image";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { RotatingTextBadge } from "@/components/motion/RotatingTextBadge";

export function ClosingCtaSection() {
  return (
    <section
      id="section-06"
      className="relative w-full min-h-[540px] lg:min-h-[620px] bg-[#0E1118] text-white flex items-center justify-center overflow-hidden py-24 sm:py-32 select-none"
      aria-label="Start Exploring CampusWay"
    >
      {/* Background Architectural Photo */}
      <div className="absolute inset-0 pointer-events-none z-0 scale-105">
        <Image
          src="/images/closing-architecture.jpg"
          alt="Illuminated university campus architecture at dusk"
          fill
          unoptimized
          sizes="100vw"
          className="object-cover object-center opacity-25"
        />
        {/* Deep Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E1118] via-[#0E1118]/85 to-[#0E1118]/90" />
      </div>

      {/* Decorative Rotating Circular Text Badge */}
      <div className="absolute right-4 sm:right-8 lg:right-16 bottom-6 sm:bottom-10 pointer-events-none z-[2] opacity-40 hover:opacity-75 transition-opacity">
        <RotatingTextBadge
          size={150}
          dark
          text="CAMPUSWAY ✦ EVERY PLACE HAS A WAY ✦ "
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 text-center space-y-8">
        {/* Section Tag */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-mono tracking-widest uppercase text-white/90">
          <span className="text-[#DE4B31] font-bold">✦</span>
          <span>06 /</span>
          <span>START EXPLORING</span>
        </div>

        {/* Large Bold Headline */}
        <h2 className="fluid-section-headline font-black tracking-tight uppercase leading-[0.94] text-white">
          <span className="block">EVERY PLACE HAS A WAY.</span>
          <span className="block text-[#DE4B31]">FIND YOURS TODAY.</span>
        </h2>

        {/* Supporting Copy */}
        <p className="text-base sm:text-lg text-white/70 font-normal leading-relaxed max-w-2xl mx-auto">
          Navigate 38+ campus blocks, compute verified pedestrian walking routes with sub-meter Dataset C graph precision, and experience Lovely Professional University with confidence &mdash; zero login required.
        </p>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-5">
          <MagneticButton
            href="/explore"
            variant="orange"
            cursorLabel="EXPLORE"
            className="px-8 sm:px-10 py-4 sm:py-4.5 text-xs sm:text-sm shadow-xl"
          >
            <span>EXPLORE CAMPUS</span>
            <span className="text-white font-bold text-sm">↗</span>
          </MagneticButton>

          <MagneticButton
            href="/about"
            variant="secondary"
            cursorLabel="ABOUT"
            className="px-7 py-4 text-xs sm:text-sm text-white border-white/20 hover:border-white"
          >
            <span>ABOUT ARCHITECTURE</span>
          </MagneticButton>
        </div>

        {/* Coordinate Stamp */}
        <div className="pt-6 text-[11px] font-mono text-white/40 tracking-widest uppercase">
          LOVELY PROFESSIONAL UNIVERSITY &bull; LAT 31.2605° N, LON 75.7068° E &bull; DATASET C VERIFIED
        </div>
      </div>
    </section>
  );
}
