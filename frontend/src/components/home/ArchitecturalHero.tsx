"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function ArchitecturalHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineLine1Ref = useRef<HTMLSpanElement>(null);
  const headlineLine2Ref = useRef<HTMLSpanElement>(null);
  const headlineLine3Ref = useRef<HTMLSpanElement>(null);
  const supportingCopyRef = useRef<HTMLParagraphElement>(null);
  const ctaGroupRef = useRef<HTMLDivElement>(null);
  const buildingRef = useRef<HTMLDivElement>(null);
  const gridOverlayRef = useRef<HTMLDivElement>(null);
  const annotationPinsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Respect reduced-motion preferences
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      // Set default visible states without animation
      return;
    }

    const ctx = gsap.context(() => {
      // 1. Master Timeline: Orchestrated Entrance
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Initial state setup
      gsap.set(
        [
          headlineLine1Ref.current,
          headlineLine2Ref.current,
          headlineLine3Ref.current,
        ],
        { y: 50, opacity: 0 }
      );
      gsap.set(supportingCopyRef.current, { y: 25, opacity: 0 });
      gsap.set(ctaGroupRef.current, { y: 20, opacity: 0 });
      gsap.set(buildingRef.current, {
        y: 80,
        scale: 0.92,
        opacity: 0,
      });
      gsap.set(gridOverlayRef.current, { opacity: 0 });
      gsap.set(annotationPinsRef.current, { opacity: 0, scale: 0.9 });

      // Orchestrated sequence
      tl.to(gridOverlayRef.current, {
        opacity: 1,
        duration: 0.9,
      })
        .to(
          buildingRef.current,
          {
            y: 0,
            scale: 1,
            opacity: 1,
            duration: 1.4,
            ease: "power2.out",
          },
          "-=0.6"
        )
        .to(
          [
            headlineLine1Ref.current,
            headlineLine2Ref.current,
            headlineLine3Ref.current,
          ],
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.15,
          },
          "-=1.1"
        )
        .to(
          supportingCopyRef.current,
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
          },
          "-=0.6"
        )
        .to(
          ctaGroupRef.current,
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
          },
          "-=0.5"
        )
        .to(
          annotationPinsRef.current,
          {
            opacity: 1,
            scale: 1,
            duration: 0.7,
          },
          "-=0.4"
        );

      // 2. ScrollTrigger Parallax & Camera-Like Scaling
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1.2,
        animation: gsap
          .timeline()
          .to(buildingRef.current, {
            y: 140,
            scale: 1.05,
            ease: "none",
          })
          .to(
            headlineLine1Ref.current?.parentElement || {},
            {
              y: -50,
              opacity: 0.65,
              ease: "none",
            },
            0
          )
          .to(
            gridOverlayRef.current,
            {
              y: -30,
              opacity: 0.4,
              ease: "none",
            },
            0
          ),
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full min-h-[92vh] lg:min-h-screen bg-[#FBF9F5] text-[#111111] overflow-hidden flex flex-col justify-center pt-28 pb-16 lg:pt-32 lg:pb-24 border-b border-[#1A1A1A]/10"
      aria-label="CampusWay Architectural Hero"
    >
      {/* LAYER 1 & 2: Architectural Hairline Grid & Background Atmosphere */}
      <div
        ref={gridOverlayRef}
        className="absolute inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        {/* Fine Architectural Grid Lines */}
        <div
          className="absolute inset-0 opacity-45"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(26, 26, 26, 0.06) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(26, 26, 26, 0.06) 1px, transparent 1px)
            `,
            backgroundSize: "72px 72px",
          }}
        />

        {/* Subtle Warm Terracotta Ambient Glow behind building */}
        <div className="absolute right-[-10%] top-[15%] w-[600px] lg:w-[850px] h-[600px] lg:h-[850px] rounded-full bg-gradient-to-br from-[#D9532F]/12 via-[#E07A5F]/05 to-transparent blur-3xl" />

        {/* Technical Coordinate & Survey Annotations */}
        <div className="hidden sm:flex absolute top-28 left-8 lg:left-12 flex-col gap-1 text-[10px] font-mono tracking-widest text-[#88847C] uppercase select-none">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9532F]" />
            <span>CAMPUSWAY ARCHITECTURAL CORE {"//"} SYSTEM V1</span>
          </div>
          <span className="text-[#B5B0A6]">LAT 45.3850° N &bull; LON 75.6947° W</span>
          <span className="text-[#B5B0A6]">ELEVATION +84.20M &bull; SCALE 1:500</span>
        </div>

        {/* Corner Crosshair Marks */}
        <div className="absolute top-24 right-8 lg:right-12 text-[#1A1A1A]/30 font-mono text-xs select-none">
          + &nbsp; GRID AXIS 01-A
        </div>
        <div className="absolute bottom-8 left-8 lg:left-12 text-[#1A1A1A]/30 font-mono text-xs select-none">
          + &nbsp; DATUM LEVEL 00
        </div>
      </div>

      {/* Main Content & Building Grid */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
        {/* Left Column (Hero Typography & CTAs) */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center space-y-6 lg:space-y-8 z-20">
          {/* Small Architectural Metadata Tag */}
          <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-[#1A1A1A]/05 border border-[#1A1A1A]/10 text-[11px] font-mono tracking-wider uppercase text-[#5A5854] w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9532F]" />
            <span>Live Campus Route Intelligence</span>
          </div>

          {/* EXACT HEADLINE */}
          <h1 className="text-5xl sm:text-7xl lg:text-[5.2rem] xl:text-[6.1rem] font-black tracking-tight text-[#111111] leading-[0.96] uppercase">
            <span ref={headlineLine1Ref} className="block overflow-hidden">
              EVERY PLACE
            </span>
            <span ref={headlineLine2Ref} className="block overflow-hidden">
              HAS A WAY.
            </span>
            <span
              ref={headlineLine3Ref}
              className="block overflow-hidden text-[#D9532F]"
            >
              FIND YOURS.
            </span>
          </h1>

          {/* Supporting Text */}
          <p
            ref={supportingCopyRef}
            className="text-base sm:text-lg lg:text-xl text-[#5A5854] font-normal leading-relaxed max-w-xl"
          >
            A smarter way to discover spaces, navigate destinations and
            experience your campus.
          </p>

          {/* Call to Action Controls */}
          <div
            ref={ctaGroupRef}
            className="pt-2 flex flex-wrap items-center gap-4"
          >
            {/* Primary CTA */}
            <Link
              href="/explore"
              className="px-8 py-4 rounded-full bg-[#D9532F] hover:bg-[#C44524] active:bg-[#B33B1D] text-white text-xs sm:text-sm font-bold tracking-widest uppercase transition-all shadow-md hover:shadow-xl hover:shadow-[#D9532F]/25 flex items-center gap-3 group cursor-pointer"
            >
              <span>EXPLORE CAMPUS</span>
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>

            {/* Secondary CTA */}
            <Link
              href="#routes"
              className="px-7 py-4 rounded-full bg-transparent hover:bg-[#1A1A1A]/05 active:bg-[#1A1A1A]/10 text-[#111111] border border-[#1A1A1A]/20 hover:border-[#1A1A1A]/40 text-xs sm:text-sm font-bold tracking-widest uppercase transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>DISCOVER ROUTES</span>
              <span className="text-xs text-[#88847C]">&darr;</span>
            </Link>
          </div>

          {/* Key Architectural Specs Indicator */}
          <div className="pt-4 flex items-center gap-6 text-[11px] font-mono tracking-wider text-[#88847C] uppercase border-t border-[#1A1A1A]/10 max-w-md">
            <div>
              <span className="text-[#111111] font-semibold">48</span> Buildings
            </div>
            <div className="w-1 h-1 rounded-full bg-[#1A1A1A]/30" />
            <div>
              <span className="text-[#111111] font-semibold">1,957</span> Vertices
            </div>
            <div className="w-1 h-1 rounded-full bg-[#1A1A1A]/30" />
            <div>
              <span className="text-emerald-600 font-semibold">&lt; 2ms</span> Dijkstra
            </div>
          </div>
        </div>

        {/* Right Column: ARCHITECTURAL BUILDING VISUAL (Independent Layer) */}
        <div className="lg:col-span-5 xl:col-span-5 relative h-[360px] sm:h-[480px] lg:h-[620px] w-full flex items-center justify-center lg:justify-end">
          {/* The Building Visual Cutout Layer - extending beyond right and bottom edges */}
          <div
            ref={buildingRef}
            className="relative w-[115%] sm:w-[125%] lg:w-[145%] max-w-none h-full flex items-center justify-center pointer-events-none transform lg:translate-x-12 xl:translate-x-16"
          >
            <Image
              src="/images/architectural-building.png"
              alt="Isolated modern university architectural research pavilion with precast concrete and glass curtain wall"
              width={1200}
              height={896}
              priority
              className="w-full h-auto object-contain object-bottom drop-shadow-[0_30px_50px_rgba(26,26,26,0.18)] select-none"
            />
          </div>

          {/* LAYER 5: Fine Annotation Lines & Terracotta Architectural Callouts */}
          <div
            ref={annotationPinsRef}
            className="absolute inset-0 pointer-events-none select-none z-30"
          >
            {/* Top-Right Building Coordinate Tag */}
            <div className="hidden sm:block absolute top-[12%] right-[4%] bg-[#FAF8F5]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#1A1A1A]/15 text-[10px] font-mono tracking-wider text-[#111111] shadow-sm">
              <div className="flex items-center gap-1.5 text-[#D9532F] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D9532F] animate-ping" />
                <span>QUAD_NODE {"//"} 01</span>
              </div>
              <p className="text-[9px] text-[#88847C] mt-0.5">
                CANTILEVER WING &bull; ELEV. 84.2M
              </p>
            </div>

            {/* Middle Elevation Dimension Line */}
            <div className="hidden lg:flex absolute bottom-[28%] left-[-4%] items-center gap-2 bg-[#FAF8F5]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#1A1A1A]/15 text-[10px] font-mono tracking-wider text-[#111111] shadow-sm">
              <span className="text-[#D9532F] font-bold">&bull;</span>
              <span>PEDESTRIAN CONCOURSE {"//"} 0.9M TOLERANCE</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
