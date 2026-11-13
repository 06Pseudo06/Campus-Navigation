"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function ArchitecturalHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaGroupRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const sideNavRef = useRef<HTMLDivElement>(null);
  const heroVisualRef = useRef<HTMLDivElement>(null);

  const [videoModalOpen, setVideoModalOpen] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // 1. Entrance Master Timeline
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Initial positions
      gsap.set(tagRef.current, { opacity: 0, x: -20 });
      gsap.set(headlineRef.current?.children || [], { opacity: 0, y: 35 });
      gsap.set(subtitleRef.current, { opacity: 0, y: 20 });
      gsap.set(ctaGroupRef.current, { opacity: 0, y: 15 });
      gsap.set(scrollIndicatorRef.current, { opacity: 0 });
      gsap.set(sideNavRef.current, { opacity: 0, x: -10 });
      gsap.set(heroVisualRef.current, { opacity: 0, scale: 0.96, y: 30 });

      // Orchestrated Entrance
      tl.to(heroVisualRef.current, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 1.2,
        ease: "power2.out",
      })
        .to(
          tagRef.current,
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
          },
          "-=0.9"
        )
        .to(
          headlineRef.current?.children || [],
          {
            opacity: 1,
            y: 0,
            stagger: 0.1,
            duration: 0.8,
          },
          "-=0.7"
        )
        .to(
          subtitleRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
          },
          "-=0.5"
        )
        .to(
          ctaGroupRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
          },
          "-=0.5"
        )
        .to(
          [scrollIndicatorRef.current, sideNavRef.current],
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
          },
          "-=0.4"
        );

      // 2. Ambient Slow Breathing on the Visual Composition
      gsap.to(heroVisualRef.current, {
        scale: 1.015,
        duration: 5.0,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1.2,
      });

      // 3. Parallax Scrolling via ScrollTrigger
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1.2,
        animation: gsap
          .timeline()
          .to(heroVisualRef.current, {
            y: 60,
            scale: 1.03,
            ease: "none",
          })
          .to(
            headlineRef.current,
            {
              y: -30,
              opacity: 0.75,
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
      className="relative w-full min-h-[92vh] lg:min-h-screen bg-[#F7F3ED] text-[#151515] overflow-hidden flex flex-col justify-between pt-24 sm:pt-28 pb-8 lg:pb-12 border-b border-[#151515]/10 select-none"
      aria-label="CampusWay Wayfinding Reimagined"
    >
      {/* 1. TOP-LEFT SOFT FOLIAGE SHADOW OVERLAY */}
      <div
        className="absolute top-0 left-0 w-20 sm:w-28 lg:w-36 h-auto pointer-events-none z-30 opacity-80 select-none"
        aria-hidden="true"
      >
        <Image
          src="/images/hero-foliage-top-left.png"
          alt=""
          width={75}
          height={95}
          priority
          className="w-full h-auto object-contain object-top-left pointer-events-none"
        />
      </div>

      {/* 2. BACKGROUND ARCHITECTURAL GRID ACCENT */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(21, 21, 21, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(21, 21, 21, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
        aria-hidden="true"
      />

      {/* 3. MAIN HERO GRID */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-4 items-center my-auto">
        {/* LEFT COLUMN: Section Counter + Tag + Headline + Subtitle + CTAs */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center space-y-5 lg:space-y-6 z-20 pt-4 lg:pt-0">
          {/* Vertical Counter (| 01, 02, 03) & Section Header Tag */}
          <div className="flex items-center gap-5 sm:gap-6">
            {/* Left Margin Section Counter */}
            <div
              ref={sideNavRef}
              className="hidden sm:flex flex-col text-[11px] font-mono tracking-widest text-[#8B8780] leading-snug select-none"
            >
              <div className="flex items-center gap-1.5 text-[#151515] font-bold">
                <span className="w-1 h-3 bg-[#E6532E] rounded-full" />
                <span>01</span>
              </div>
              <span className="pl-2.5 hover:text-[#151515] transition-colors cursor-pointer">
                02
              </span>
              <span className="pl-2.5 hover:text-[#151515] transition-colors cursor-pointer">
                03
              </span>
            </div>

            {/* Tag: 01 / CAMPUS WAYFINDING, REIMAGINED ————— */}
            <div
              ref={tagRef}
              className="flex items-center gap-2.5 text-xs font-mono font-bold tracking-widest uppercase text-[#151515]"
            >
              <span className="text-[#E6532E]">01 /</span>
              <span className="tracking-wider">CAMPUS WAYFINDING, REIMAGINED</span>
              <span className="w-12 sm:w-20 h-px bg-[#151515]/25" aria-hidden="true" />
            </div>
          </div>

          {/* EXACT HEADLINE:
              FIND YOUR
              PLACE.
              NAVIGATE
              FURTHER.
          */}
          <h1
            ref={headlineRef}
            className="text-5xl sm:text-7xl lg:text-[5.4rem] xl:text-[6.0rem] font-black tracking-tight leading-[0.93] uppercase text-[#151515]"
          >
            <span className="block">FIND YOUR</span>
            <span className="block">PLACE.</span>
            <span className="block italic text-[#E6532E] tracking-tight">
              NAVIGATE
            </span>
            <span className="block italic text-[#E6532E] tracking-tight">
              FURTHER.
            </span>
          </h1>

          {/* Subheading */}
          <p
            ref={subtitleRef}
            className="text-base sm:text-lg text-[#5A5854] font-normal leading-relaxed max-w-lg"
          >
            Discover destinations, plan smarter routes, and experience your
            campus with confidence.
          </p>

          {/* CTAs: Primary Pill + Circular Play Button */}
          <div
            ref={ctaGroupRef}
            className="pt-2 flex flex-wrap items-center gap-5 sm:gap-6"
          >
            {/* Primary Action Button: EXPLORE CAMPUS ↗ (Deep Charcoal Pill) */}
            <Link
              href="/explore"
              className="px-7 sm:px-8 py-3.5 sm:py-4 rounded-full bg-[#151515] hover:bg-[#282828] active:bg-[#000000] text-white text-xs sm:text-sm font-bold tracking-widest uppercase transition-all shadow-md hover:shadow-xl flex items-center gap-2.5 group cursor-pointer"
            >
              <span>EXPLORE CAMPUS</span>
              <span className="text-[#E6532E] font-bold text-sm transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
                ↗
              </span>
            </Link>

            {/* Secondary Action: Circular Play Button + WATCH / OVERVIEW */}
            <button
              type="button"
              onClick={() => setVideoModalOpen(true)}
              className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
              aria-label="Watch video overview"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-[#151515]/30 group-hover:border-[#E6532E] bg-white/60 flex items-center justify-center transition-all group-hover:scale-105 shadow-sm">
                <svg
                  className="w-4 h-4 text-[#151515] group-hover:text-[#E6532E] ml-0.5 transition-colors"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div className="flex flex-col text-[11px] font-bold tracking-widest uppercase text-[#151515] leading-tight group-hover:text-[#E6532E] transition-colors">
                <span>WATCH</span>
                <span>OVERVIEW</span>
              </div>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: MONUMENTAL ARCHITECTURAL VISUAL COMPOSITION */}
        <div className="lg:col-span-6 xl:col-span-6 relative w-full h-[380px] sm:h-[480px] lg:h-[600px] flex items-center justify-center lg:justify-end overflow-visible">
          <div
            ref={heroVisualRef}
            className="relative w-[115%] sm:w-[125%] lg:w-[135%] h-full flex items-center justify-center pointer-events-none z-10 transform translate-x-2 sm:translate-x-6 lg:translate-x-8"
          >
            <Image
              src="/images/hero-curved-composite.png"
              alt="Curved brutalist concrete university building with tall glass windows reflecting warm sunset and burnt orange sun arc"
              width={599}
              height={436}
              priority
              unoptimized
              className="w-full h-auto object-contain object-bottom-right drop-shadow-[0_24px_48px_rgba(21,21,21,0.12)] select-none pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* 4. BOTTOM-LEFT SCROLL INDICATOR */}
      <div
        ref={scrollIndicatorRef}
        className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between text-xs font-mono text-[#8B8780] pt-4"
      >
        <div className="flex items-center gap-3">
          {/* Minimal Mouse Scroll Icon */}
          <div className="w-4 h-7 rounded-full border border-[#151515]/40 flex items-start justify-center p-1">
            <span className="w-1 h-1.5 bg-[#E6532E] rounded-full animate-bounce" />
          </div>
          <span className="tracking-widest uppercase text-[#5A5854] text-[11px] font-semibold">
            SCROLL TO EXPLORE &mdash;&mdash;&mdash;
          </span>
        </div>

        {/* Small Data Specs */}
        <div className="hidden md:flex items-center gap-4 text-[10px] tracking-wider uppercase text-[#8B8780]">
          <span>48 CAMPUS BUILDINGS</span>
          <span>&bull;</span>
          <span>1,957 VERTICES</span>
          <span>&bull;</span>
          <span className="text-[#E6532E] font-semibold">ZERO LOGIN REQUIRED</span>
        </div>
      </div>

      {/* 5. MODAL: WATCH OVERVIEW / CAMPUSWAY INTRODUCTION */}
      {videoModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#151515]/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setVideoModalOpen(false)}
        >
          <div
            className="relative max-w-2xl w-full bg-[#F7F3ED] rounded-3xl p-6 sm:p-8 border border-[#151515]/15 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#151515]/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E6532E]" />
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#151515]">
                  CAMPUSWAY ARCHITECTURAL TOUR
                </span>
              </div>
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#151515]/05 hover:bg-[#151515]/10 flex items-center justify-center text-[#151515] font-bold text-sm"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl font-black uppercase text-[#151515] leading-tight">
                EVERY PLACE HAS A WAY. <br />
                <span className="text-[#E6532E]">HOW CAMPUSWAY WORKS.</span>
              </h3>
              <p className="text-sm text-[#5A5854] leading-relaxed">
                CampusWay indexes all 48 university landmarks with centimeter coordinate
                precision and 1,957 topological vertices. Whether you are seeking lecture
                auditoriums, accessible elevators, or quick study spaces in MacOdrum Library,
                our solver delivers instant step-by-step navigation directly in your browser.
              </p>

              <div className="grid grid-cols-3 gap-3 pt-2 text-center font-mono text-xs">
                <div className="p-3 rounded-xl bg-white border border-[#151515]/10">
                  <span className="block text-lg font-bold text-[#E6532E]">48</span>
                  <span className="text-[10px] text-[#8B8780] uppercase">Buildings</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#151515]/10">
                  <span className="block text-lg font-bold text-[#151515]">1,957</span>
                  <span className="text-[10px] text-[#8B8780] uppercase">Vertices</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#151515]/10">
                  <span className="block text-lg font-bold text-emerald-600">&lt; 2ms</span>
                  <span className="text-[10px] text-[#8B8780] uppercase">Dijkstra</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Link
                href="/explore"
                onClick={() => setVideoModalOpen(false)}
                className="px-6 py-3 rounded-full bg-[#151515] hover:bg-[#282828] text-white text-xs font-bold tracking-widest uppercase flex items-center gap-2"
              >
                <span>ENTER THE CAMPUS MAP</span>
                <span className="text-[#E6532E]">↗</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
