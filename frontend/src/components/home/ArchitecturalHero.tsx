"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isReducedMotion } from "@/lib/motion";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { RotatingTextBadge } from "@/components/motion/RotatingTextBadge";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function ArchitecturalHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineLine1Ref = useRef<HTMLSpanElement>(null);
  const headlineLine2Ref = useRef<HTMLSpanElement>(null);
  const headlineLine3Ref = useRef<HTMLSpanElement>(null);
  const headlineLine4Ref = useRef<HTMLSpanElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaGroupRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);

  // Parallax layers
  const buildingLayerRef = useRef<HTMLDivElement>(null);
  const sunDiscRef = useRef<HTMLDivElement>(null);
  const leavesTopLeftRef = useRef<HTMLDivElement>(null);
  const bottomRowRef = useRef<HTMLDivElement>(null);
  const scrollBadgeRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(0);

  // Mouse Parallax (subtle, restrained)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReducedMotion() || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;

    if (buildingLayerRef.current) {
      buildingLayerRef.current.style.transform = `translate3d(${-normX * 16}px, ${-normY * 12}px, 0)`;
    }
    if (sunDiscRef.current) {
      sunDiscRef.current.style.transform = `translate3d(${-normX * 8}px, ${-normY * 6}px, 0)`;
    }
    if (leavesTopLeftRef.current) {
      leavesTopLeftRef.current.style.transform = `translate3d(${normX * 14}px, ${normY * 10}px, 0)`;
    }
  };

  useEffect(() => {
    if (!containerRef.current || isReducedMotion()) return;

    const ctx = gsap.context(() => {
      // 1. Entrance Master Timeline
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Initial States
      gsap.set(
        [
          headlineLine1Ref.current,
          headlineLine2Ref.current,
          headlineLine3Ref.current,
          headlineLine4Ref.current,
        ],
        { y: "115%", opacity: 0 }
      );
      gsap.set([subtitleRef.current, ctaGroupRef.current], { y: 25, opacity: 0 });
      gsap.set(tagRef.current, { x: -25, opacity: 0 });
      gsap.set(buildingLayerRef.current, { scale: 0.96, y: 35, opacity: 0 });
      gsap.set(sunDiscRef.current, { scale: 0.85, opacity: 0 });

      // Orchestrated Reveal
      tl.to(
        sunDiscRef.current,
        {
          scale: 1,
          opacity: 1,
          duration: 1.2,
          ease: "power2.out",
        }
      )
        .to(
          buildingLayerRef.current,
          {
            scale: 1,
            y: 0,
            opacity: 1,
            duration: 1.4,
            ease: "expo.out",
          },
          "-=0.9"
        )
        .to(
          tagRef.current,
          {
            x: 0,
            opacity: 1,
            duration: 0.6,
          },
          "-=0.9"
        )
        .to(
          [
            headlineLine1Ref.current,
            headlineLine2Ref.current,
            headlineLine3Ref.current,
            headlineLine4Ref.current,
          ],
          {
            y: "0%",
            opacity: 1,
            duration: 0.85,
            stagger: 0.1,
            ease: "power3.out",
          },
          "-=0.7"
        )
        .to(
          [subtitleRef.current, ctaGroupRef.current],
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.12,
          },
          "-=0.5"
        );

      // 2. Slow natural foliage sway
      if (leavesTopLeftRef.current) {
        gsap.to(leavesTopLeftRef.current, {
          rotation: 1.5,
          transformOrigin: "top left",
          duration: 10,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      }

      // 3. Symmetrical scrubbed headline fade-out
      // Progress 0-0.35: 100% opaque, in place. Progress 0.35-1.0: translates up ~8% and fades to 0
      const headlineTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom 35%",
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      headlineTl
        .to({}, { duration: 0.35 })
        .to(
          [
            headlineLine1Ref.current,
            headlineLine2Ref.current,
            headlineLine3Ref.current,
            headlineLine4Ref.current,
          ],
          {
            y: "-8%",
            opacity: 0,
            stagger: 0.08,
            ease: "power2.inOut",
            duration: 0.65,
          }
        );

      // 4. Parallax scroll on building & sun (clamped travel <= 6%)
      gsap.to(buildingLayerRef.current, {
        y: "5%",
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.0,
          invalidateOnRefresh: true,
        },
      });

      gsap.to(sunDiscRef.current, {
        y: "3%",
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.2,
          invalidateOnRefresh: true,
        },
      });

      // 5. Fade out scroll badge and bottom metadata together at 10% scroll
      gsap.to([bottomRowRef.current, scrollBadgeRef.current], {
        opacity: 0,
        y: 12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "top -12%",
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Modal keydown listener (Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    if (modalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen]);

  return (
    <section
      id="section-01"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full min-h-[100svh] bg-[#F7F3EC] text-[#111111] overflow-hidden flex flex-col justify-between pt-24 sm:pt-28 pb-6 lg:pb-8 select-none"
      aria-label="Campus Wayfinding Reimagined"
    >
      {/* 1. TOP-LEFT SOFT FOLIAGE OVERLAY (Feathered, multiplied into paper, no box edges) */}
      <div
        ref={leavesTopLeftRef}
        className="absolute -top-[3vw] -left-[3vw] w-[clamp(240px,28vw,440px)] pointer-events-none z-[2] select-none"
        style={{
          mixBlendMode: "multiply",
          opacity: 0.65,
          WebkitMaskImage: "radial-gradient(ellipse at top left, #000 25%, transparent 72%)",
          maskImage: "radial-gradient(ellipse at top left, #000 25%, transparent 72%)",
        }}
        aria-hidden="true"
      >
        <Image
          src="/images/hero-foliage-top-left.png"
          alt=""
          width={300}
          height={380}
          priority
          unoptimized
          className="w-full h-auto object-contain object-top-left"
        />
      </div>

      {/* 2. BACKGROUND ARCHITECTURAL BLUEPRINT GRID (~4% opacity) */}
      <div className="absolute inset-0 blueprint-grid pointer-events-none z-0" aria-hidden="true" />

      {/* 3. SUN DISC & CONCENTRIC OUTLINE ARC (Behind Building) */}
      <div
        ref={sunDiscRef}
        className="hidden lg:block absolute right-[4vw] top-[14%] w-[clamp(440px,52vw,740px)] aspect-square pointer-events-none z-[1]"
        aria-hidden="true"
      >
        <svg className="w-full h-full" viewBox="0 0 600 600" fill="none">
          <defs>
            <radialGradient id="heroSunGrad" cx="50%" cy="45%" r="50%" fx="45%" fy="40%">
              <stop offset="0%" stopColor="#F2793A" />
              <stop offset="60%" stopColor="#E8542F" />
              <stop offset="100%" stopColor="#C9411F" />
            </radialGradient>
          </defs>

          {/* Thin Outer Concentric Arc (~52vw) */}
          <circle cx="300" cy="300" r="285" stroke="#111111" strokeOpacity="0.12" strokeWidth="1.2" />

          {/* Luminous Orange Sun Disc (~40vw) */}
          <circle cx="300" cy="300" r="235" fill="url(#heroSunGrad)" />

          {/* Subtle Fine Crosshair Sparkle */}
          <line x1="300" y1="215" x2="300" y2="385" stroke="#F7F3EC" strokeOpacity="0.4" strokeWidth="1.2" />
          <line x1="215" y1="300" x2="385" y2="300" stroke="#F7F3EC" strokeOpacity="0.4" strokeWidth="1.2" />
          <circle cx="300" cy="300" r="2.5" fill="#FFFFFF" />
        </svg>
      </div>

      {/* 4. MONUMENTAL FULL-BLEED CURVED UNIVERSITY BUILDING */}
      <div
        ref={buildingLayerRef}
        className="absolute right-[-3vw] bottom-0 w-[clamp(520px,62vw,1100px)] h-[clamp(460px,88svh,920px)] pointer-events-none z-[2] select-none flex items-end justify-end overflow-visible"
      >
        <Image
          src="/images/hero-curved-fullbleed.webp"
          alt="Monumental curved brutalist concrete university building with sunset disc and glowing glass curtain wall"
          width={1671}
          height={941}
          priority
          unoptimized
          className="w-full h-full object-contain object-bottom-right drop-shadow-[0_24px_48px_rgba(17,17,17,0.14)]"
        />

        {/* Elevation Tag at Right Edge */}
        <div className="absolute bottom-3 right-6 text-[10px] font-mono tracking-widest text-[#5B5750]/70 uppercase hidden sm:block">
          ELEV. +84.2M &bull; QUAD
        </div>
      </div>

      {/* Top Right Architectural Callout: CAMPUS MAP ROUTES SPACES */}
      <div className="hidden lg:flex flex-col items-end gap-1 absolute top-20 right-12 z-20 pointer-events-none text-right">
        <div className="flex flex-col text-[9px] font-mono font-medium tracking-widest text-[#5B5750] uppercase leading-tight">
          <span>CAMPUS</span>
          <span>MAP</span>
          <span>ROUTES</span>
          <span>SPACES</span>
        </div>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="stroke-[#111111]/30 mt-1">
          <line x1="0" y1="36" x2="36" y2="0" strokeWidth="1" />
        </svg>
      </div>

      {/* 5. MAIN HERO CONTENT COLUMN (Left Aligned with Safe Gutter) */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-12 section-gutter flex flex-col justify-center my-auto pt-6 lg:pt-0">
        <div className="max-w-xl lg:max-w-2xl flex flex-col space-y-5 lg:space-y-6">
          {/* Section Kicker: 01 / CAMPUS WAYFINDING, REIMAGINED ————— */}
          <div
            ref={tagRef}
            className="flex items-center gap-2.5 text-xs font-mono font-bold tracking-widest uppercase text-[#111111]"
          >
            <span className="text-[#E8542F]">01 /</span>
            <span className="tracking-wider">CAMPUS WAYFINDING, REIMAGINED</span>
            <span className="w-12 sm:w-24 h-px bg-[#111111]/25" aria-hidden="true" />
          </div>

          {/* EXACT HEADLINE */}
          <h1 className="fluid-hero-headline font-black tracking-tight uppercase text-[#111111]">
            <span className="block overflow-hidden">
              <span ref={headlineLine1Ref} className="block">
                FIND YOUR
              </span>
            </span>
            <span className="block overflow-hidden">
              <span ref={headlineLine2Ref} className="block">
                PLACE.
              </span>
            </span>
            <span className="block overflow-hidden text-[#E8542F] italic tracking-tight">
              <span ref={headlineLine3Ref} className="block">
                NAVIGATE
              </span>
            </span>
            <span className="block overflow-hidden text-[#E8542F] italic tracking-tight">
              <span ref={headlineLine4Ref} className="block">
                FURTHER.
              </span>
            </span>
          </h1>

          {/* Subheading */}
          <p
            ref={subtitleRef}
            className="text-base sm:text-lg text-[#5B5750] font-normal leading-relaxed max-w-lg"
          >
            Discover destinations, plan smarter routes, and experience your campus with confidence.
          </p>

          {/* CTAs: Magnetic Primary Pill + Circular Play Button */}
          <div ref={ctaGroupRef} className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6">
            <MagneticButton
              href="/explore"
              variant="primary"
              cursorLabel="EXPLORE"
              className="px-8 py-4 text-xs sm:text-sm shadow-md hover:shadow-xl"
            >
              <span>EXPLORE CAMPUS</span>
              <span className="text-[#E8542F] font-bold text-sm">↗</span>
            </MagneticButton>

            {/* Circular Play Button + WATCH OVERVIEW */}
            <button
              type="button"
              onClick={() => {
                setModalStep(0);
                setModalOpen(true);
              }}
              data-cursor="PLAY"
              className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
              aria-label="Watch video overview"
            >
              <div className="w-12 h-12 rounded-full border border-[#111111]/30 group-hover:border-[#E8542F] bg-white/70 flex items-center justify-center transition-all group-hover:scale-105 shadow-sm">
                <svg
                  className="w-4 h-4 text-[#111111] group-hover:text-[#E8542F] ml-0.5 transition-colors"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div className="flex flex-col text-[11px] font-mono font-bold tracking-widest uppercase text-[#111111] leading-tight group-hover:text-[#E8542F] transition-colors">
                <span>WATCH</span>
                <span>OVERVIEW</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 6. BOTTOM BAR: SCROLL INDICATOR & STATS ROW (Safely separated, zero overlaps) */}
      <div
        ref={bottomRowRef}
        className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-12 section-gutter flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono text-[#5B5750] pt-4"
      >
        <div className="flex flex-wrap items-center gap-4 sm:gap-8">
          {/* Scroll to Explore Mouse Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-4 h-7 rounded-full border border-[#111111]/40 flex items-start justify-center p-1">
              <span className="w-1 h-1.5 bg-[#E8542F] rounded-full animate-bounce" />
            </div>
            <span className="tracking-widest uppercase text-[#5B5750] text-[11px] font-semibold">
              SCROLL TO EXPLORE &mdash;
            </span>
          </div>

          {/* Key Specs Line (Grouped cleanly with scroll line) */}
          <div className="flex items-center gap-3 text-[10px] font-mono tracking-wider uppercase text-[#5B5750]">
            <span>48 CAMPUS BUILDINGS</span>
            <span className="text-[#111111]/30">&bull;</span>
            <span>1,957 VERTICES</span>
            <span className="text-[#111111]/30">&bull;</span>
            <span className="text-[#E8542F] font-semibold">ZERO LOGIN REQUIRED</span>
          </div>
        </div>
      </div>

      {/* 7. ROTATING CIRCULAR SCROLL BADGE (Positioned bottom-right without colliding with stats) */}
      <div
        ref={scrollBadgeRef}
        className="hidden md:block fixed lg:absolute right-[clamp(24px,4vw,64px)] bottom-[clamp(88px,12svh,140px)] z-20 pointer-events-auto"
      >
        <RotatingTextBadge
          size={92}
          onClick={() => {
            const el = document.getElementById("section-02");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />
      </div>

      {/* 8. FULL-SCREEN ACCESSIBLE WATCH OVERVIEW MODAL */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[200] bg-[#0E1118]/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="CampusWay Walkthrough Overview"
        >
          <div
            className="relative max-w-2xl w-full bg-[#F7F3EC] rounded-3xl p-6 sm:p-10 border border-[#111111]/15 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#111111]/10">
              <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest uppercase text-[#111111]">
                <span className="w-2 h-2 rounded-full bg-[#E8542F]" />
                <span>CAMPUSWAY ARCHITECTURAL TOUR</span>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-9 h-9 rounded-full bg-[#111111]/08 hover:bg-[#111111]/15 flex items-center justify-center text-[#111111] font-bold text-base cursor-pointer"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            {/* 3-Step Interactive Walkthrough */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-[#5B5750]">
                <span>STEP 0{modalStep + 1} OF 03</span>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((s) => (
                    <span
                      key={s}
                      className={`w-6 h-1 rounded-full transition-colors ${
                        s === modalStep ? "bg-[#E8542F]" : "bg-[#111111]/15"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {modalStep === 0 && (
                <div className="space-y-3">
                  <h3 className="text-2xl sm:text-3xl font-black uppercase text-[#111111]">
                    01. Instant Spatial Discovery
                  </h3>
                  <p className="text-sm text-[#5B5750] leading-relaxed">
                    Search over 48 indexed university buildings by official faculty codes (e.g. ML, PA,
                    AR), department name, or popular landmark alias. Every landmark is verified
                    with centimeter entrance coordinates.
                  </p>
                </div>
              )}

              {modalStep === 1 && (
                <div className="space-y-3">
                  <h3 className="text-2xl sm:text-3xl font-black uppercase text-[#111111]">
                    02. High-Performance Graph Pathfinding
                  </h3>
                  <p className="text-sm text-[#5B5750] leading-relaxed">
                    Our dual Dijkstra &amp; A* solver evaluates routes across 1,957 pedestrian
                    quadrangle vertices in under 2 milliseconds, guaranteeing the shortest, accessible
                    corridor without stairs or barriers.
                  </p>
                </div>
              )}

              {modalStep === 2 && (
                <div className="space-y-3">
                  <h3 className="text-2xl sm:text-3xl font-black uppercase text-[#111111]">
                    03. Zero-Login Client Atlas
                  </h3>
                  <p className="text-sm text-[#5B5750] leading-relaxed">
                    Save frequent destinations, access step-by-step turn guidance, and bookmark
                    accessible portals instantly. All data persists reliably in your browser with zero
                    mandatory sign-in friction.
                  </p>
                </div>
              )}

              {/* Step Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-[#111111]/10">
                <button
                  type="button"
                  disabled={modalStep === 0}
                  onClick={() => setModalStep((s) => Math.max(0, s - 1))}
                  className="px-4 py-2 rounded-full font-mono text-xs uppercase disabled:opacity-30 cursor-pointer"
                >
                  &larr; Previous
                </button>

                {modalStep < 2 ? (
                  <button
                    type="button"
                    onClick={() => setModalStep((s) => Math.min(2, s + 1))}
                    className="px-6 py-2.5 rounded-full bg-[#111111] hover:bg-[#E8542F] text-white font-mono text-xs font-bold uppercase transition-colors cursor-pointer"
                  >
                    Next &rarr;
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-6 py-2.5 rounded-full bg-[#E8542F] text-white font-mono text-xs font-bold uppercase transition-colors cursor-pointer"
                  >
                    Start Exploring ↗
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
