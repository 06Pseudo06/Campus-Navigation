"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  isReducedMotion,
  getLenis,
  GSAP_EASE_EXPO,
  MOTION_THEME,
} from "@/lib/motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface StepItem {
  num: string;
  title: string;
  subtitle: string;
  description: string;
  chips: string[];
  image: string;
  alt: string;
}

const STEPS: StepItem[] = [
  {
    num: "01",
    title: "SEARCH",
    subtitle: "DISCOVERY & INDEXING",
    description: "Look up any academic block, lecture hall, entrance gate, or campus dining facility by name or code.",
    chips: ["+ 38+ BLOCKS", "+ GPS SURVEYED"],
    image: "/images/lpu/lpu-step1-block35.webp",
    alt: "LPU Academic Block 35 School of Computer Science & Engineering",
  },
  {
    num: "02",
    title: "ROUTE",
    subtitle: "GRAPH OPTIMIZATION",
    description: "Sub-second graph traversal analyzes verified pedestrian walking edges to generate optimal paths.",
    chips: ["+ DIJKSTRA SOLVER", "+ A* HEURISTIC"],
    image: "/images/lpu/lpu-step2-route.webp",
    alt: "LPU modern academic complex with pedestrian routing pathways",
  },
  {
    num: "03",
    title: "WALK",
    subtitle: "TACTILE WAYFINDING",
    description: "Follow turn-by-turn guidance with ramp accessibility tags, grade markers, and real-time distance updates.",
    chips: ["+ ACCESSIBLE", "+ STEP-FREE"],
    image: "/images/lpu/lpu-step3-walk.webp",
    alt: "LPU accessible pedestrian concourse with level walking paths and ramps",
  },
  {
    num: "04",
    title: "SAVE",
    subtitle: "PERSISTENT ATLAS",
    description: "Bookmark your frequent classrooms, auditoriums, and labs to your personal atlas for instant recall.",
    chips: ["+ POSTGRESQL SYNC", "+ INSTANT BOOKMARK"],
    image: "/images/lpu/lpu-step4-unimall.webp",
    alt: "LPU UniMall student center, dining, and lifestyle bookmark destination",
  },
];

export function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const cardImagesRef = useRef<(HTMLDivElement | null)[]>([]);
  const cardTitlesRef = useRef<(HTMLHeadingElement | null)[]>([]);
  const cardTagsRef = useRef<(HTMLDivElement | null)[]>([]);
  const movingDotRef = useRef<HTMLDivElement>(null);
  const bgNumeralRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);

  const scrollTriggerInstanceRef = useRef<ScrollTrigger | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const activeStepRef = useRef(0);

  // Smooth scroll to a specific step
  const scrollToStep = useCallback((stepIdx: number) => {
    const st = scrollTriggerInstanceRef.current;
    if (!st) return;

    const targetProgress = stepIdx / (STEPS.length - 1);
    const targetY = st.start + targetProgress * (st.end - st.start);

    const lenis = getLenis();
    if (lenis && !isReducedMotion()) {
      lenis.scrollTo(targetY, { duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    } else {
      window.scrollTo({
        top: targetY,
        behavior: isReducedMotion() ? "auto" : "smooth",
      });
    }
  }, []);

  // Update active step focus smoothly with GSAP (no hard toggles)
  const setCardFocus = useCallback((targetIdx: number) => {
    if (targetIdx === activeStepRef.current) return;
    const prevIdx = activeStepRef.current;
    activeStepRef.current = targetIdx;
    setActiveStep(targetIdx);

    // Cross-fade the giant background numeral
    if (bgNumeralRef.current) {
      gsap.to(bgNumeralRef.current, {
        opacity: 0,
        y: -15,
        duration: 0.18,
        ease: "power2.in",
        overwrite: "auto",
        onComplete: () => {
          if (bgNumeralRef.current) {
            bgNumeralRef.current.textContent = STEPS[targetIdx].num;
            gsap.fromTo(
              bgNumeralRef.current,
              { opacity: 0, y: 15 },
              { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", overwrite: "auto" }
            );
          }
        },
      });
    }

    // Animate cards: active vs inactive
    cardsRef.current.forEach((cardEl, idx) => {
      if (!cardEl) return;
      const isActive = idx === targetIdx;

      // Animate card container: scale, opacity, border, glow
      gsap.to(cardEl, {
        scale: isActive ? 1.0 : 0.94,
        opacity: isActive ? 1.0 : 0.45,
        duration: 0.5,
        ease: GSAP_EASE_EXPO,
        overwrite: "auto",
      });

      // Animate card image grayscale
      const imgEl = cardEl.querySelector(".card-img");
      if (imgEl) {
        gsap.to(imgEl, {
          filter: isActive ? "grayscale(0%)" : "grayscale(100%)",
          duration: 0.5,
          ease: "power2.out",
          overwrite: "auto",
        });
      }

      // If becoming active: reveal title mask and stagger tags
      if (isActive && prevIdx !== targetIdx) {
        const titleEl = cardTitlesRef.current[idx];
        if (titleEl) {
          gsap.fromTo(
            titleEl,
            { yPercent: 40, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 0.5, ease: GSAP_EASE_EXPO, overwrite: "auto" }
          );
        }

        const tagsContainer = cardTagsRef.current[idx];
        if (tagsContainer) {
          const pills = tagsContainer.querySelectorAll(".card-tag");
          if (pills.length > 0) {
            gsap.fromTo(
              pills,
              { y: 10, opacity: 0 },
              { y: 0, opacity: 1, stagger: 0.06, duration: 0.4, ease: "power2.out", overwrite: "auto" }
            );
          }
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current || isReducedMotion()) return;

    // Use matchMedia so pinning only runs at >= 1024px (desktop)
    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      const track = trackRef.current;
      const container = containerRef.current;
      const content = contentRef.current;
      if (!track || !container || !content) return;

      // Calculate gutter alignment so Card 1 aligns with header container left edge
      // and Card 4 aligns with header container right edge
      const calculateGutter = () => {
        const w = window.innerWidth;
        const maxContainerWidth = 1280; // max-w-7xl
        const containerPadding = 48; // px-12 on desktop
        if (w > maxContainerWidth + containerPadding * 2) {
          return (w - maxContainerWidth) / 2 + containerPadding;
        }
        return containerPadding;
      };

      const gutter = calculateGutter();
      track.style.paddingLeft = `${gutter}px`;
      track.style.paddingRight = `${gutter}px`;

      // 1. Entry reveal: header and first card fade up before pinning starts
      if (headerRef.current) {
        gsap.from(headerRef.current, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          ease: GSAP_EASE_EXPO,
          scrollTrigger: {
            trigger: container,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });
      }

      if (cardsRef.current[0]) {
        gsap.from(cardsRef.current[0], {
          y: 60,
          opacity: 0,
          duration: 0.8,
          ease: GSAP_EASE_EXPO,
          scrollTrigger: {
            trigger: container,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });
      }

      // Calculate total horizontal scroll needed
      const getTotalScroll = () => {
        return track.scrollWidth - window.innerWidth;
      };

      // 2. Master Horizontal Timeline
      const totalScrollDistance = getTotalScroll();
      const horizontalTl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: container,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          scrub: 1.0,
          start: "top top",
          end: () => "+=" + Math.round(window.innerHeight * 3.8) + "px",
          onToggle: (self) => {
            // FIX 1: Hide global side step indicator while Section 04 is pinned
            if (self.isActive) {
              gsap.to("#scroll-progress-rail", {
                opacity: 0,
                pointerEvents: "none",
                duration: 0.25,
                overwrite: "auto",
              });
            } else {
              gsap.to("#scroll-progress-rail", {
                opacity: 1,
                pointerEvents: "auto",
                duration: 0.25,
                overwrite: "auto",
              });
            }
          },
          onUpdate: (self) => {
            // Section-local progress bar fill
            if (progressFillRef.current) {
              progressFillRef.current.style.transform = `scaleX(${self.progress})`;
            }

            // Parallax translation for background giant numeral
            if (bgNumeralRef.current) {
              gsap.set(bgNumeralRef.current, { x: -self.progress * 100 });
            }

            // Compute active index smoothly: Math.round(progress * 3)
            const targetIdx = Math.min(3, Math.max(0, Math.round(self.progress * 3)));
            setCardFocus(targetIdx);
          },
        },
      });

      scrollTriggerInstanceRef.current = horizontalTl.scrollTrigger || null;

      // Horizontal track translation
      horizontalTl.to(track, {
        x: () => -getTotalScrollDistanceSafe(),
        ease: "none",
        duration: 1,
      }, 0);

      function getTotalScrollDistanceSafe() {
        return track ? track.scrollWidth - window.innerWidth : 0;
      }

      // Parallax Depth: Card inner images move +/-8% relative to the track
      cardImagesRef.current.forEach((imgInner) => {
        if (!imgInner) return;
        horizontalTl.fromTo(
          imgInner,
          { xPercent: -8 },
          { xPercent: 8, ease: "none", duration: 1 },
          0
        );
      });

      // Connecting line dot travels along the line with the progress
      if (movingDotRef.current) {
        horizontalTl.to(
          movingDotRef.current,
          {
            x: () => getTotalScrollDistanceSafe(),
            ease: "none",
            duration: 1,
          },
          0
        );
      }

      // 3. Cinematic Exit Depth Dissolve: scale 0.97, opacity 0.88 over final portion
      gsap.to(content, {
        scale: 0.97,
        opacity: 0.88,
        ease: "power1.out",
        scrollTrigger: {
          trigger: container,
          start: () => "+=" + Math.round(window.innerHeight * 3.1) + "px",
          end: () => "+=" + Math.round(window.innerHeight * 3.8) + "px",
          scrub: 0.6,
        },
      });

      // Refresh ScrollTrigger after layout calculation and image settling
      ScrollTrigger.refresh();
    });

    return () => {
      mm.revert();
      // Ensure global rail is visible when unmounted
      if (typeof document !== "undefined") {
        gsap.set("#scroll-progress-rail", { opacity: 1, pointerEvents: "auto" });
      }
    };
  }, [setCardFocus]);

  return (
    <section
      id="section-04"
      ref={containerRef}
      className="relative z-[10] w-full bg-[#F7F3EC] dark:bg-[#070B14] text-[#0E1118] dark:text-[#F4F6FA] overflow-hidden select-none transition-colors duration-200"
      aria-label="How CampusWay Works"
    >
      {/* Background Giant Watermark Step Numeral with subtle parallax */}
      <div
        ref={bgNumeralRef}
        aria-hidden="true"
        className="hidden lg:block absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(220px,28vw,380px)] font-black tracking-tighter text-[#0E1118]/[0.035] dark:text-white/[0.035] pointer-events-none select-none z-0 font-mono leading-none will-change-transform"
      >
        01
      </div>

      <div
        ref={contentRef}
        className="relative z-10 w-full min-h-screen flex flex-col justify-between py-12 lg:py-16 will-change-transform"
      >
        {/* Section Header (Aligned to max-w-7xl) */}
        <div
          ref={headerRef}
          id="section-04-header"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#0E1118]/15 dark:border-white/10">
            <div className="flex items-center gap-3 text-xs font-mono font-bold tracking-widest uppercase">
              <span className="text-[#E8452C]">04 /</span>
              <span className="text-[#0E1118] dark:text-[#F4F6FA]">
                HOW IT WORKS &bull; FOUR STEPS
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono tracking-widest text-[#5B5750] dark:text-zinc-400 uppercase">
              <span className="hidden sm:inline">CAMPUS WAYFINDING PIPELINE</span>
              <span className="text-[#E8452C] font-semibold">SERIES 2026</span>
            </div>
          </div>
        </div>

        {/* Pinned Horizontal Track (Desktop >= 1024px) / Horizontal Snap Carousel (Mobile < 1024px) */}
        <div className="relative w-full overflow-hidden my-auto py-4">
          {/* Subtle Connecting Line behind cards */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#0E1118]/15 dark:via-white/15 to-transparent pointer-events-none z-0"
          >
            {/* Glowing Traveling Dot synchronized with progress */}
            <div
              ref={movingDotRef}
              className="absolute top-1/2 -translate-y-1/2 left-0 w-3.5 h-3.5 rounded-full bg-[#E8452C] shadow-[0_0_12px_#E8452C] will-change-transform"
            />
          </div>

          {/* Cards Track */}
          <div
            ref={trackRef}
            className="flex flex-row gap-6 sm:gap-8 lg:gap-10 overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none px-4 sm:px-6 lg:px-0 w-full lg:w-max will-change-transform scrollbar-none"
          >
            {STEPS.map((step, idx) => {
              const isInitialActive = idx === 0;
              return (
                <div
                  key={idx}
                  ref={(el) => {
                    cardsRef.current[idx] = el;
                  }}
                  data-cursor="STEP"
                  onClick={() => scrollToStep(idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      scrollToStep(idx);
                    }
                  }}
                  className={`group relative shrink-0 snap-center w-[85vw] max-w-[420px] lg:max-w-none lg:w-[min(560px,80vw)] h-[520px] sm:h-[550px] lg:h-[560px] p-8 rounded-3xl border flex flex-col justify-between cursor-pointer transition-[border-color,box-shadow] duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8452C] select-none overflow-hidden ${
                    isInitialActive
                      ? "bg-white dark:bg-[#0D1322] border-[#E8452C] shadow-[0_0_35px_rgba(232,69,44,0.22),0_20px_40px_-15px_rgba(0,0,0,0.5)]"
                      : "bg-white/80 dark:bg-[#0D1322]/80 border-[#0E1118]/15 dark:border-white/10"
                  }`}
                  style={{
                    transformOrigin: "center center",
                    opacity: isInitialActive ? 1 : 0.45,
                    transform: isInitialActive ? "scale(1)" : "scale(0.94)",
                  }}
                >
                  {/* Card Header & Step Typography */}
                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-[#0E1118]/10 dark:border-white/10 pb-3">
                      <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#E8452C]">
                        <span>STEP {step.num}</span>
                        <span>✦</span>
                      </div>
                      <span className="text-xs font-mono text-[#5B5750] dark:text-zinc-400 font-bold">
                        0{idx + 1} &rarr; 0{STEPS.length}
                      </span>
                    </div>

                    {/* Step Title with Masked Reveal */}
                    <div className="overflow-hidden mb-1">
                      <h3
                        ref={(el) => {
                          cardTitlesRef.current[idx] = el;
                        }}
                        className="card-title text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-[#0E1118] dark:text-[#F4F6FA] transform-gpu will-change-transform"
                      >
                        {step.title}
                      </h3>
                    </div>

                    {/* Subtitle / Architectural Category */}
                    <span className="block text-[10px] font-mono tracking-[0.14em] text-[#E8452C] uppercase font-bold mb-2">
                      {step.subtitle}
                    </span>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-[#5B5750] dark:text-zinc-300 leading-relaxed max-w-md line-clamp-3 mb-4">
                      {step.description}
                    </p>
                  </div>

                  {/* Card Image Container with Parallax & Aspect 16/10 */}
                  <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-900 border border-[#0E1118]/10 dark:border-white/10 my-2">
                    <div
                      ref={(el) => {
                        cardImagesRef.current[idx] = el;
                      }}
                      className="card-image-inner absolute inset-[-8%] w-[116%] h-[116%] will-change-transform"
                    >
                      <Image
                        src={step.image}
                        alt={step.alt}
                        fill
                        unoptimized
                        priority={idx === 0}
                        sizes="(max-width: 1024px) 85vw, 560px"
                        className={`card-img object-cover object-center transition-[filter] duration-500 ${
                          isInitialActive ? "grayscale-0" : "grayscale"
                        }`}
                      />
                    </div>
                    {/* Dark gradient shelf */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Tags Row pinned to the bottom */}
                  <div
                    ref={(el) => {
                      cardTagsRef.current[idx] = el;
                    }}
                    className="mt-auto pt-4 flex flex-wrap items-center gap-2 border-t border-[#0E1118]/10 dark:border-white/10"
                  >
                    {step.chips.map((chip, cIdx) => (
                      <span
                        key={cIdx}
                        className="card-tag px-3 py-1 rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-[10px] font-mono tracking-wider text-[#0E1118] dark:text-zinc-200 uppercase font-semibold transform-gpu will-change-transform"
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

        {/* FIX 1: Section-Local Progress Bar at bottom of pinned area (Desktop & Mobile) */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-4">
          {/* Thin 1.5px Track with Dynamic ScaleX Fill */}
          <div
            className="h-[2px] w-full bg-[#0E1118]/15 dark:bg-white/15 relative rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round((activeStep / 3) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="How it works timeline progress"
          >
            <div
              ref={progressFillRef}
              className="h-full w-full bg-[#E8452C] origin-left will-change-transform"
              style={{ transform: "scaleX(0)" }}
            />
          </div>

          {/* 4 Labelled Ticks (01 SEARCH … 04 SAVE) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3.5">
            {STEPS.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollToStep(idx)}
                  className={`group flex items-center gap-2 text-left transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#E8452C] rounded py-1 px-1.5 ${
                    isActive
                      ? "text-[#E8452C] font-bold"
                      : "text-[#5B5750] dark:text-zinc-500 hover:text-[#0E1118] dark:hover:text-zinc-300"
                  }`}
                  aria-label={`Scroll to Step ${step.num}: ${step.title}`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 shrink-0 ${
                      isActive
                        ? "bg-[#E8452C] scale-125 shadow-[0_0_8px_#E8452C]"
                        : "bg-black/25 dark:bg-white/25 group-hover:bg-[#E8452C]/60"
                    }`}
                  />
                  <span className="font-mono text-xs tracking-wider truncate">
                    {step.num} {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
