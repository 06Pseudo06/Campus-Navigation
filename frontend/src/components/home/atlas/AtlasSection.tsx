"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, useScroll, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  EASE_OUT_EXPO,
  GSAP_EASE_EXPO,
  DURATIONS,
  STAGGER,
  MOTION_THEME,
  useReducedMotionGuard,
  isReducedMotion,
} from "@/lib/motion";
import { ATLAS_PLATES, AtlasPlate } from "@/data/gallery";
import { AtlasCard } from "./AtlasCard";
import { StepIndicator } from "./StepIndicator";
import { AtlasCursor } from "./AtlasCursor";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * AtlasSection
 * 
 * "Monuments & Quadrangles – Campus Architectural Atlas"
 * Powered by shared motion configuration from @/lib/motion.
 */
export function AtlasSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const motionGuard = useReducedMotionGuard();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  const selectedPlate: AtlasPlate | null =
    selectedIndex !== null ? ATLAS_PLATES[selectedIndex] : null;

  // Track scroll progression through the section for the Side Step Indicator
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start center", "end center"],
  });

  // Update active step indicator based on scroll progress through the 6 plates
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      // Map progress 0.0 - 1.0 into 6 distinct plate indices (0 to 5)
      const step = Math.min(5, Math.max(0, Math.floor(latest * 6)));
      setActiveStepIndex(step);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Smooth scroll handler for side step indicator
  const handleScrollToPlate = useCallback((index: number) => {
    const plate = ATLAS_PLATES[index];
    if (!plate) return;
    const el = document.getElementById(plate.id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setActiveStepIndex(index);
  }, []);

  // Modal navigation controls
  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) =>
      prev === null ? null : (prev - 1 + ATLAS_PLATES.length) % ATLAS_PLATES.length
    );
  }, []);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) =>
      prev === null ? null : (prev + 1) % ATLAS_PLATES.length
    );
  }, []);

  // Lightbox keyboard shortcuts (Escape, ArrowLeft, ArrowRight)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "Escape") setSelectedIndex(null);
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    if (selectedIndex !== null) {
      window.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedIndex, handlePrev, handleNext]);

  // Section 4 -> Section 5 Scroll Choreography (Preserved from Stage 2.3)
  useEffect(() => {
    if (!sectionRef.current || isReducedMotion()) return;

    const ctx = gsap.context(() => {
      const isDesktop = window.innerWidth >= 1024;
      gsap.fromTo(
        sectionRef.current,
        {
          y: isDesktop ? 90 : 40,
        },
        {
          y: isDesktop ? -80 : -30,
          ease: "power1.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "top 30%",
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="section-05"
      ref={sectionRef}
      aria-label="Campus Architectural Photography Atlas"
      className="relative z-[20] -mt-12 sm:-mt-16 lg:-mt-20 w-full bg-[#070B14] text-[#F4F6FA] rounded-t-[48px] border-t border-white/[0.08] shadow-[0_-30px_70px_rgba(0,0,0,0.65)] py-24 md:py-32 overflow-hidden select-none border-b border-white/[0.08] transition-colors duration-200 will-change-transform"
      style={{
        marginBottom: "-80px",
        // Theme token: Deep navy #070B14 with subtle radial glow
        background:
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(232, 69, 44, 0.08), transparent 70%), radial-gradient(ellipse 60% 60% at 50% 110%, rgba(13, 19, 34, 0.9), transparent 80%), #070B14",
      }}
    >
      {/* 3% Film-Grain Noise Overlay (SVG Turbulence Data URI) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-screen bg-repeat z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Soft Vignettes at Section Edges for Seamless Section Blending */}
      <div
        aria-hidden="true"
        className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#070B14] to-transparent pointer-events-none z-10"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#070B14] to-transparent pointer-events-none z-10"
      />

      {/* 72px Glassy Custom "VIEW" Cursor with Spring Physics */}
      <AtlasCursor />

      {/* Section Content Wrapper with Left Gutter allowance for Step Indicator */}
      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:pl-20 xl:pr-8 z-10">
        {/* Sticky Side Step Indicator (Desktop >= 1280px only, placed in gutter) */}
        <aside
          aria-label="Plates Navigation Rail"
          className="hidden xl:block absolute left-4 xl:left-6 top-40 h-[calc(100%-200px)] pointer-events-none z-30"
        >
          <div className="sticky top-1/2 -translate-y-1/2 pointer-events-auto">
            <StepIndicator
              plates={ATLAS_PLATES}
              activeIndex={activeStepIndex}
              scrollProgress={scrollYProgress}
              onSelectPlate={handleScrollToPlate}
            />
          </div>
        </aside>

        {/* Inner 1280px Bento Grid & Header Container */}
        <div className="max-w-[1280px] mx-auto">
          {/* 1. SECTION HEADER */}
          <div className="flex flex-col space-y-4 pb-2">
          {/* Eyebrow Line & Animated Rule */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#F4F6FA]/60">
              <span className="text-[#E8452C] font-bold">05 /</span> CAMPUS ARCHITECTURAL ATLAS
            </span>
            {/* Animated rule draws from 0 to full width using shared base duration */}
            <motion.span
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: motionGuard.duration(DURATIONS.base),
                ease: EASE_OUT_EXPO,
              }}
              className="h-[1px] bg-[#E8452C]/50 w-16 sm:w-24 origin-left inline-block"
              aria-hidden="true"
            />
          </div>

          {/* Title & Desktop Subtitle */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            {/* Title reveals line by line with clip/translate mask using shared EASE_OUT_EXPO */}
            <h2 className="font-display font-black uppercase text-[#F4F6FA] tracking-[-0.02em] leading-[0.95] text-[clamp(2.5rem,5vw,4.5rem)]">
              {motionGuard.skipTextSplitting ? (
                <span>Monuments &amp; Quadrangles</span>
              ) : (
                <>
                  <span className="block overflow-hidden">
                    <motion.span
                      initial={{ y: "100%" }}
                      whileInView={{ y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: motionGuard.duration(0.7),
                        ease: EASE_OUT_EXPO,
                      }}
                      className="block"
                    >
                      Monuments &amp;
                    </motion.span>
                  </span>
                  <span className="block overflow-hidden">
                    <motion.span
                      initial={{ y: "100%" }}
                      whileInView={{ y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: motionGuard.duration(0.7),
                        delay: motionGuard.delay(STAGGER.text),
                        ease: EASE_OUT_EXPO,
                      }}
                      className="block"
                    >
                      Quadrangles
                    </motion.span>
                  </span>
                </>
              )}
            </h2>

            {/* Desktop Right Muted Subheader */}
            <div className="hidden lg:block font-mono text-xs uppercase tracking-[0.12em] text-[#F4F6FA]/50 pb-2 self-end">
              SERIES 2026 · 06 PLATES · LPU CAMPUS
            </div>
          </div>

          {/* 1px Divider with Left Accent Vermilion Segment */}
          <div className="relative w-full h-px bg-white/[0.08] mt-6 mb-10 md:mb-12">
            <span
              className="absolute left-0 top-0 h-px w-24 bg-[#E8452C]"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* 2. 12-COLUMN BENTO GRID */}
        <div ref={gridContainerRef} className="space-y-5">
          {/* ROW 1: Featured Anchor (7 Cols) + Stacked Duo (5 Cols) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left Column: Plate 01 spans 7 cols on desktop, tall aspect ~4/3 (540px) */}
            <div className="sm:col-span-2 lg:col-span-7">
              <AtlasCard
                plate={ATLAS_PLATES[0]}
                index={0}
                isFeatured={true}
                heightClass="h-[360px] sm:h-[440px] lg:h-[540px]"
                onSelect={setSelectedIndex}
              />
            </div>

            {/* Right Column: Plates 02 & 03 stack in 5 cols (260px each + 20px gap = 540px exact match) */}
            <div className="sm:col-span-2 lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-5 justify-between">
              <div className="w-full">
                <AtlasCard
                  plate={ATLAS_PLATES[1]}
                  index={1}
                  heightClass="h-[240px] sm:h-[260px] lg:h-[260px]"
                  onSelect={setSelectedIndex}
                />
              </div>
              <div className="w-full">
                <AtlasCard
                  plate={ATLAS_PLATES[2]}
                  index={2}
                  heightClass="h-[240px] sm:h-[260px] lg:h-[260px]"
                  onSelect={setSelectedIndex}
                />
              </div>
            </div>
          </div>

          {/* ROW 2: Equal Height Trio (Plates 04, 05, 06) spanning 4 cols each */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="w-full">
              <AtlasCard
                plate={ATLAS_PLATES[3]}
                index={3}
                heightClass="h-[280px] sm:h-[320px] lg:h-[340px]"
                onSelect={setSelectedIndex}
              />
            </div>
            <div className="w-full">
              <AtlasCard
                plate={ATLAS_PLATES[4]}
                index={4}
                heightClass="h-[280px] sm:h-[320px] lg:h-[340px]"
                onSelect={setSelectedIndex}
              />
            </div>
            <div className="w-full sm:col-span-2 lg:col-span-1">
              <AtlasCard
                plate={ATLAS_PLATES[5]}
                index={5}
                heightClass="h-[280px] sm:h-[320px] lg:h-[340px]"
                onSelect={setSelectedIndex}
              />
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* 3. LIGHTBOX MODAL WITH FRAMER MOTION TRANSITION */}
      <AnimatePresence>
        {selectedPlate && selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[200] bg-black/92 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 lg:p-8"
            onClick={() => setSelectedIndex(null)}
            role="dialog"
            aria-modal="true"
            aria-label={selectedPlate.title}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-5xl w-full bg-[#0D1322] rounded-3xl overflow-hidden border border-white/15 shadow-2xl flex flex-col max-h-[92vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#070B14]/80 text-[#F4F6FA] font-mono text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-[#E8452C] font-bold tracking-[0.12em]">
                    [PLATE {selectedPlate.num} / 06]
                  </span>
                  <span className="text-white/60 tracking-[0.12em] uppercase hidden sm:inline">
                    {selectedPlate.category}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E8452C]"
                    aria-label="Previous image"
                  >
                    &larr;
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E8452C]"
                    aria-label="Next image"
                  >
                    &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIndex(null)}
                    className="w-9 h-9 rounded-full bg-white/15 hover:bg-[#E8452C] flex items-center justify-center text-white text-base font-bold transition-colors ml-2 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E8452C]"
                    aria-label="Close modal"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Modal Image Display */}
              <div className="relative flex-1 min-h-[320px] sm:min-h-[480px] bg-black flex items-center justify-center overflow-hidden">
                <Image
                  src={selectedPlate.image}
                  alt={selectedPlate.alt}
                  fill
                  unoptimized
                  sizes="95vw"
                  className="object-contain object-center"
                  priority
                />
              </div>

              {/* Modal Bottom Metadata */}
              <div className="px-6 py-4 border-t border-white/10 bg-[#070B14] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[#F4F6FA]">
                <div>
                  <h3 className="text-lg font-bold font-display uppercase tracking-tight text-[#F4F6FA]">
                    {selectedPlate.title}
                  </h3>
                  <p className="text-xs text-[#F4F6FA]/60 font-mono tracking-[0.12em] mt-0.5">
                    {selectedPlate.eyebrow}
                  </p>
                </div>
                <div className="text-right sm:self-center">
                  <span className="text-xs font-mono text-[#E8452C] font-bold tracking-[0.12em]">
                    ERA {selectedPlate.era}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
