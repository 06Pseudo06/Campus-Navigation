"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export function ClosingCtaSection() {
  return (
    <section
      className="relative w-full min-h-[500px] lg:min-h-[560px] bg-[#111317] text-white flex items-center justify-center overflow-hidden py-24 sm:py-32"
      aria-label="Start Exploring"
    >
      {/* Background Architectural Dusk Photography */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <Image
          src="/images/closing-architecture.jpg"
          alt="Monumental modern university concrete colonnade at dusk with glowing warm interior lighting"
          fill
          sizes="100vw"
          className="object-cover object-center opacity-35"
        />
        {/* Deep Charcoal & Burnt Orange Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111317] via-[#111317]/80 to-[#111317]/90" />
      </div>

      {/* Center Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 text-center space-y-8">
        {/* Section Tag: + 04 / START EXPLORING */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/05 border border-white/10 text-xs font-mono tracking-widest uppercase text-white/80">
          <span className="text-[#E6532E] font-bold">+</span>
          <span>04 /</span>
          <span>START EXPLORING</span>
        </div>

        {/* Large Bold Headline:
            EVERY PLACE HAS A WAY.
            FIND YOURS TODAY.
        */}
        <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight uppercase leading-[0.96]">
          <span>EVERY PLACE HAS A WAY.</span> <br />
          <span className="text-[#E6532E]">FIND YOURS TODAY.</span>
        </h2>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-white/70 font-normal leading-relaxed max-w-2xl mx-auto">
          Navigate university buildings, calculate live walking routes, and
          experience your campus with confidence &mdash; zero login required.
        </p>

        {/* Primary CTA: EXPLORE CAMPUS ↗ (Burnt Orange Pill) */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/explore"
            className="px-8 sm:px-10 py-4 sm:py-4.5 rounded-full bg-[#E6532E] hover:bg-[#D44723] active:bg-[#C03E1D] text-white text-xs sm:text-sm font-bold tracking-widest uppercase transition-all shadow-xl hover:shadow-[#E6532E]/30 flex items-center gap-3 group cursor-pointer"
          >
            <span>EXPLORE CAMPUS</span>
            <span className="text-white font-bold text-sm transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
              ↗
            </span>
          </Link>

          <Link
            href="/about"
            className="px-7 py-4 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs sm:text-sm font-bold tracking-widest uppercase transition-all cursor-pointer"
          >
            <span>ABOUT ARCHITECTURE</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
