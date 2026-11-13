"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  const sideNavRef = useRef<HTMLDivElement>(null);

  // Parallax layers
  const buildingLayerRef = useRef<HTMLDivElement>(null);
  const leavesForegroundRef = useRef<HTMLDivElement>(null);
  const sparkleRef = useRef<SVGSVGElement>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(0);

  // Mouse Parallax
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReducedMotion() || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;

    if (buildingLayerRef.current) {
      buildingLayerRef.current.style.transform = `translate3d(${-normX * 24}px, ${-normY * 20}px, 0)`;
    }
    if (leavesForegroundRef.current) {
      leavesForegroundRef.current.style.transform = `translate3d(${-normX * 36}px, ${-normY * 30}px, 0)`;
    }
    if (sparkleRef.current) {
      sparkleRef.current.style.transform = `translate3d(${-normX * 8}px, ${-normY * 8}px, 0)`;
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
      gsap.set(sideNavRef.current, { opacity: 0 });
      gsap.set(buildingLayerRef.current, { scale: 0.95, y: 40, opacity: 0 });

      // Orchestrated Reveal
      tl.to(
        buildingLayerRef.current,
        {
          scale: 1,
          y: 0,
          opacity: 1,
          duration: 1.4,
          ease: "expo.out",
        }
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
        )
        .to(sideNavRef.current, { opacity: 1, duration: 0.5 }, "-=0.3");

      // 2. Scroll Parallax Timeline
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1.2,
        animation: gsap
          .timeline()
          .to(buildingLayerRef.current, { y: 130, scale: 1.03, ease: "none" })
          .to(leavesForegroundRef.current, { y: 180, ease: "none" }, 0)
          // Headline lines drift horizontally apart while fading
          .to(headlineLine1Ref.current, { x: -40, opacity: 0.5, ease: "none" }, 0)
          .to(headlineLine2Ref.current, { x: -20, opacity: 0.5, ease: "none" }, 0)
          .to(headlineLine3Ref.current, { x: 30, opacity: 0.5, ease: "none" }, 0)
          .to(headlineLine4Ref.current, { x: 50, opacity: 0.5, ease: "none" }, 0),
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
      id="hero"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full min-h-[96vh] lg:min-h-screen bg-[#F7F3EC] text-[#111111] overflow-hidden flex flex-col justify-between pt-24 sm:pt-28 pb-6 lg:pb-10 border-b border-[#111111]/12 select-none"
      aria-label="Campus Wayfinding Reimagined"
    >
      {/* 1. TOP-LEFT SOFT FOLIAGE OVERLAY */}
      <div
        className="absolute top-0 left-0 w-24 sm:w-32 lg:w-40 h-auto pointer-events-none z-30 opacity-70 select-none"
        aria-hidden="true"
      >
        <Image
          src="/images/hero-foliage-top-left.png"
          alt=""
          width={75}
          height={95}
          priority
          className="w-full h-auto object-contain object-top-left"
        />
      </div>

      {/* 2. BACKGROUND BLUEPRINT GRID OVERLAY (~4% opacity) */}
      <div className="absolute inset-0 blueprint-grid pointer-events-none z-0" aria-hidden="true" />

      {/* 3. MAIN HERO GRID */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-4 items-center my-auto">
        {/* LEFT COLUMN: Section Counter + Tag + Headline + Subtitle + CTAs */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center space-y-5 lg:space-y-6 z-20 pt-4 lg:pt-0">
          {/* Vertical Counter (| 01, 02, 03) & Section Header Tag */}
          <div className="flex items-center gap-5 sm:gap-6">
            {/* Left Margin Section Counter */}
            <div
              ref={sideNavRef}
              className="hidden sm:flex flex-col text-[11px] font-mono tracking-widest text-[#5B5750] leading-snug select-none"
            >
              <div className="flex items-center gap-1.5 text-[#111111] font-bold">
                <span className="w-1 h-3 bg-[#E8542F] rounded-full" />
                <span>01</span>
              </div>
              <span className="pl-2.5 opacity-60">02</span>
              <span className="pl-2.5 opacity-60">03</span>
            </div>

            {/* Tag: 01 / CAMPUS WAYFINDING, REIMAGINED ————— */}
            <div
              ref={tagRef}
              className="flex items-center gap-2.5 text-xs font-mono font-bold tracking-widest uppercase text-[#111111]"
            >
              <span className="text-[#E8542F]">01 /</span>
              <span className="tracking-wider">CAMPUS WAYFINDING, REIMAGINED</span>
              <span className="w-12 sm:w-24 h-px bg-[#111111]/25" aria-hidden="true" />
            </div>
          </div>

          {/* EXACT HEADLINE (Masked reveal line by line) */}
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

            {/* Circular Play Button + WATCH / OVERVIEW */}
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

        {/* RIGHT COLUMN: FULL-BLEED MONUMENTAL HERO VISUAL */}
        <div className="lg:col-span-6 xl:col-span-6 relative w-full h-[460px] sm:h-[560px] lg:h-[680px] xl:h-[720px] flex items-center justify-center lg:justify-end overflow-visible">
          {/* Top Right Architectural Annotation (Reference: CAMPUS MAP ROUTES SPACES) */}
          <div className="hidden lg:flex flex-col items-end gap-1 absolute top-2 right-4 z-20 pointer-events-none text-right">
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

          {/* MONUMENTAL FULL-BLEED CURVED CONCRETE UNIVERSITY BUILDING & GLOWING SUN DISC */}
          <div
            ref={buildingLayerRef}
            className="relative w-[115%] sm:w-[125%] lg:w-[138%] xl:w-[145%] max-w-none h-full flex items-end justify-end pointer-events-none z-10 transform translate-x-2 sm:translate-x-6 lg:translate-x-8 translate-y-2 lg:translate-y-4 select-none"
          >
            <Image
              src="/images/hero-curved-fullbleed.webp"
              alt="Monumental curved brutalist concrete university building with sunset disc and glowing glass curtain wall"
              width={1671}
              height={941}
              priority
              unoptimized
              className="w-full h-auto object-contain object-bottom-right drop-shadow-[0_24px_48px_rgba(17,17,17,0.14)]"
            />
          </div>

          {/* FOREGROUND ELEVATION LABEL AT RIGHT EDGE */}
          <div
            ref={leavesForegroundRef}
            className="absolute bottom-2 right-0 w-auto h-auto pointer-events-none z-20 select-none"
            aria-hidden="true"
          >
            <span className="text-[10px] font-mono tracking-widest text-[#5B5750]/70 uppercase hidden sm:block">
              ELEV. +84.2M &bull; QUAD
            </span>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM BAR: SCROLL INDICATOR + ROTATING SCROLL BADGE + STATS */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between text-xs font-mono text-[#5B5750] pt-4">
        {/* Bottom Left Mouse Scroll Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-4 h-7 rounded-full border border-[#111111]/40 flex items-start justify-center p-1">
            <span className="w-1 h-1.5 bg-[#E8542F] rounded-full animate-bounce" />
          </div>
          <span className="tracking-widest uppercase text-[#5B5750] text-[11px] font-semibold">
            SCROLL TO EXPLORE &mdash;&mdash;&mdash;
          </span>
        </div>

        {/* Center / Right: Pulsing Rotating Circular Scroll CTA */}
        <div className="flex items-center gap-6">
          <RotatingTextBadge
            size={90}
            onClick={() => {
              const el = document.getElementById("features");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          />

          {/* Key Specs Pill */}
          <div className="hidden md:flex items-center gap-4 text-[10px] tracking-wider uppercase text-[#5B5750]">
            <span>48 CAMPUS BUILDINGS</span>
            <span>&bull;</span>
            <span>1,957 VERTICES</span>
            <span>&bull;</span>
            <span className="text-[#E8542F] font-semibold">ZERO LOGIN REQUIRED</span>
          </div>
        </div>
      </div>

      {/* 5. FULL-SCREEN ACCESSIBLE WATCH OVERVIEW MODAL */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] bg-[#0E1118]/80 backdrop-blur-md flex items-center justify-center p-4"
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
                    Next Step &rarr;
                  </button>
                ) : (
                  <Link
                    href="/explore"
                    onClick={() => setModalOpen(false)}
                    className="px-6 py-2.5 rounded-full bg-[#E8542F] hover:bg-[#C9411F] text-white font-mono text-xs font-bold uppercase transition-colors cursor-pointer"
                  >
                    Launch Live Map ↗
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
