"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isReducedMotion } from "@/lib/motion";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { RotatingTextBadge } from "@/components/motion/RotatingTextBadge";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function ClosingCtaSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgImageRef = useRef<HTMLDivElement>(null);
  const headlineLine1Ref = useRef<HTMLSpanElement>(null);
  const headlineLine2Ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current || isReducedMotion()) return;

    const ctx = gsap.context(() => {
      // Background slow parallax
      gsap.to(bgImageRef.current, {
        y: 60,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
          invalidateOnRefresh: true,
        },
      });

      // Headline char/line reveal on enter
      gsap.fromTo(
        [headlineLine1Ref.current, headlineLine2Ref.current],
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
            invalidateOnRefresh: true,
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="section-06"
      ref={containerRef}
      className="relative w-full min-h-[580px] lg:min-h-[660px] bg-[#0E1118] text-white flex items-center justify-center overflow-hidden py-24 sm:py-36 select-none section-gutter"
      aria-label="Start Exploring CampusWay"
    >
      {/* Layer 0: Dimmed Architectural Photo with Slow Parallax */}
      <div
        ref={bgImageRef}
        className="absolute inset-0 pointer-events-none z-0 will-change-transform scale-110"
      >
        <Image
          src="/images/closing-architecture.jpg"
          alt="Illuminated university colonnade at dusk"
          fill
          unoptimized
          sizes="100vw"
          className="object-cover object-center opacity-30"
        />
        {/* Layer 1: Deep Charcoal Vignette & Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E1118] via-[#0E1118]/80 to-[#0E1118]/90" />
      </div>

      {/* Layer 2: Decorative Rotating Circular Text Badge in Bottom-Right Corner (Non-colliding) */}
      <div className="absolute right-4 sm:right-8 lg:right-16 bottom-6 sm:bottom-10 pointer-events-none z-[2] opacity-40 hover:opacity-75 transition-opacity">
        <RotatingTextBadge
          size={160}
          dark
          text="CAMPUSWAY ✦ EVERY PLACE HAS A WAY ✦ "
        />
      </div>

      {/* Layer 10: Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 text-center space-y-8">
        {/* Section Tag: 06 / START EXPLORING */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-mono tracking-widest uppercase text-white/90">
          <span className="text-[#E8542F] font-bold">✦</span>
          <span>06 /</span>
          <span>START EXPLORING</span>
        </div>

        {/* Large Bold Headline */}
        <h2 className="fluid-section-headline font-black tracking-tight uppercase leading-[0.94] text-white">
          <span ref={headlineLine1Ref} className="block">
            EVERY PLACE HAS A WAY.
          </span>
          <span ref={headlineLine2Ref} className="block text-[#E8542F]">
            FIND YOURS TODAY.
          </span>
        </h2>

        {/* Supporting Copy */}
        <p className="text-base sm:text-lg text-white/70 font-normal leading-relaxed max-w-2xl mx-auto">
          Navigate 48 university landmarks, compute live walking routes with instant
          sub-2ms Dijkstra graph precision, and experience your campus with confidence &mdash; zero login required.
        </p>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-5">
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
        <div className="pt-8 text-[11px] font-mono text-white/40 tracking-widest uppercase">
          CARLETON DEMO QUAD &bull; LAT 45.3850° N, LON 75.6947° W &bull; GRAPH VERIFIED
        </div>
      </div>
    </section>
  );
}