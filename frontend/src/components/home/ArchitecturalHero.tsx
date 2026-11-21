"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
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

/**
 * ArchitecturalHero
 * 
 * Cinematic architectural entrance sequence for CampusWay.
 * Controlled by a single unified GSAP timeline:
 * - STAGE 0: Full-screen #070B14 Preloader with SVG logo stroke draw, counter 000 -> 100, and split-curtain exit.
 * - STAGE 1: Orange sun disc scale/blur reveal, orbit ring stroke draw, sparkle pop, and building clip-path wipe.
 * - STAGE 2: Line-by-line masked headline reveal, kinetic italic accent slide, and typed eyebrow.
 * - STAGE 3: Supporting UI fade-up, play button pulse, meta row reveal, navbar drop, and rotating badge entrance.
 * - AFTER INTRO: Idle mouse parallax (quickTo), slow breathing scale, and scroll-out scrub.
 * 
 * Includes sessionStorage persistence (plays once per session) and full skippability on click/keypress.
 */
export function ArchitecturalHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Preloader refs
  const topCurtainRef = useRef<HTMLDivElement>(null);
  const bottomCurtainRef = useRef<HTMLDivElement>(null);
  const preloaderContentRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const logoOuterRef = useRef<SVGPathElement>(null);
  const logoInnerRef = useRef<SVGPathElement>(null);

  // Stage 1: Background refs
  const sunDiscRef = useRef<HTMLDivElement>(null);
  const orbitRingRef = useRef<SVGCircleElement>(null);
  const sparkleRef = useRef<SVGGElement>(null);
  const buildingLayerRef = useRef<HTMLDivElement>(null);
  const buildingImgRef = useRef<HTMLDivElement>(null);
  const leavesTopLeftRef = useRef<HTMLDivElement>(null);

  // Stage 2: Headline refs
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const eyebrowTextRef = useRef<HTMLDivElement>(null);
  const eyebrowLineRef = useRef<HTMLSpanElement>(null);

  // Stage 3: Supporting UI refs
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const playBtnRef = useRef<HTMLButtonElement>(null);
  const metaRowRef = useRef<HTMLDivElement>(null);
  const calloutRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  // State: preloader defaults to true on first load to prevent any content flash
  const [isIntroActive, setIsIntroActive] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Quick skip function
  const skipIntro = useCallback(() => {
    console.log("[INTRO] skipIntro triggered");
    if (timelineRef.current) {
      timelineRef.current.progress(1);
      timelineRef.current.kill();
    }
    try {
      sessionStorage.setItem("campusway_intro_played", "true");
    } catch {}
    setIsIntroActive(false);
    if (typeof document !== "undefined") {
      document.getElementById("hero-preloader-anti-flash")?.remove();
    }
  }, []);

  // Idle effects: mouse parallax, breathing scale, and scroll-out
  const initIdleEffects = useCallback(() => {
    if (isReducedMotion() || !containerRef.current) return;

    // 1. Mouse Parallax (Sphere ±15px, Building ±8px with duration 0.8 quickTo)
    const xSphereTo = gsap.quickTo(sunDiscRef.current, "x", { duration: 0.8, ease: "power2.out" });
    const ySphereTo = gsap.quickTo(sunDiscRef.current, "y", { duration: 0.8, ease: "power2.out" });
    const xBldgTo = gsap.quickTo(buildingLayerRef.current, "x", { duration: 0.8, ease: "power2.out" });
    const yBldgTo = gsap.quickTo(buildingLayerRef.current, "y", { duration: 0.8, ease: "power2.out" });

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width - 0.5;
      const normY = (e.clientY - rect.top) / rect.height - 0.5;

      xSphereTo(normX * 30);  // ±15px
      ySphereTo(normY * 30);
      xBldgTo(-normX * 16);  // ±8px
      yBldgTo(-normY * 16);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // 2. Slow breathing scale on orange sphere (1 <-> 1.03, 6s, yoyo)
    const breathingAnim = gsap.to(sunDiscRef.current, {
      scale: 1.03,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    // 3. Scroll-out scrub (headline 0.6x speed, building 0.9x speed, sphere scale 1.1)
    const scrollOutCtx = gsap.context(() => {
      if (headlineRef.current) {
        gsap.to(headlineRef.current, {
          yPercent: -35,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      if (buildingLayerRef.current) {
        gsap.to(buildingLayerRef.current, {
          yPercent: -15,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      if (sunDiscRef.current) {
        gsap.to(sunDiscRef.current, {
          scale: 1.1,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }
    }, containerRef);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      breathingAnim.kill();
      scrollOutCtx.revert();
    };
  }, []);

  // Main cinematic entrance sequence
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if intro has already run in this session or if reduced motion is requested
    let alreadyPlayed = false;
    try {
      alreadyPlayed = sessionStorage.getItem("campusway_intro_played") === "true";
    } catch {}

    const reduced = isReducedMotion();

    if (alreadyPlayed || reduced) {
      setIsIntroActive(false);
      if (typeof document !== "undefined") {
        document.getElementById("hero-preloader-anti-flash")?.remove();
      }
      initIdleEffects();
      return;
    }

    setIsIntroActive(true);

    // Keyboard listener to skip intro (Escape, Space, Enter)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        skipIntro();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    // Single unified GSAP master timeline
    const tl = gsap.timeline({
      defaults: { ease: "expo.out" },
      onComplete: () => {
        setIsIntroActive(false);
        try {
          sessionStorage.setItem("campusway_intro_played", "true");
        } catch {}
        if (typeof document !== "undefined") {
          document.getElementById("hero-preloader-anti-flash")?.remove();
        }
        initIdleEffects();
      },
    });

    timelineRef.current = tl;

    // =========================================================================
    // STAGE 0: PRELOADER (0 – 1.2s)
    // =========================================================================
    // SVG stroke-dashoffset draw for CampusWay "∩" logo (0.8s)
    if (logoOuterRef.current && logoInnerRef.current) {
      const outerLen = logoOuterRef.current.getTotalLength() || 68;
      const innerLen = logoInnerRef.current.getTotalLength() || 47;
      gsap.set(logoOuterRef.current, { strokeDasharray: outerLen, strokeDashoffset: outerLen });
      gsap.set(logoInnerRef.current, { strokeDasharray: innerLen, strokeDashoffset: innerLen });

      tl.to([logoOuterRef.current, logoInnerRef.current], {
        strokeDashoffset: 0,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.08,
      }, 0.1);
    }

    // Monospace numeric counter "000 -> 100"
    const counterObj = { val: 0 };
    tl.to(counterObj, {
      val: 100,
      duration: 0.8,
      ease: "power2.inOut",
      onUpdate: () => {
        if (counterRef.current) {
          counterRef.current.textContent = String(Math.round(counterObj.val)).padStart(3, "0");
        }
      },
    }, 0.1);

    // Exit: overlay content fades out and curtains split up/down (yPercent ±100, 0.9s, power4.inOut)
    tl.to(preloaderContentRef.current, {
      opacity: 0,
      duration: 0.3,
      ease: "power2.out",
    }, 0.8);

    tl.to(topCurtainRef.current, {
      yPercent: -100,
      duration: 0.9,
      ease: "power4.inOut",
    }, 0.9);

    tl.to(bottomCurtainRef.current, {
      yPercent: 100,
      duration: 0.9,
      ease: "power4.inOut",
    }, 0.9);

    // =========================================================================
    // STAGE 1: BACKGROUND (starts at 0.9s)
    // =========================================================================
    // Orange sphere: scales from 0.6 -> 1 and fades in with soft blur 20px -> 0 (1.4s)
    if (sunDiscRef.current) {
      tl.fromTo(sunDiscRef.current, {
        scale: 0.6,
        opacity: 0,
        filter: "blur(20px)",
      }, {
        scale: 1,
        opacity: 0.95,
        filter: "blur(0px)",
        duration: 1.4,
        ease: "expo.out",
      }, 0.9);
    }

    // Thin orbit ring: draws itself with stroke-dashoffset (1.6s)
    if (orbitRingRef.current) {
      const ringLen = 2 * Math.PI * 285; // ~1791px
      gsap.set(orbitRingRef.current, { strokeDasharray: ringLen, strokeDashoffset: ringLen });
      tl.to(orbitRingRef.current, {
        strokeDashoffset: 0,
        duration: 1.6,
        ease: "expo.out",
      }, 0.9);
    }

    // Sparkle/crosshair marker pops in last with back.out(2)
    if (sparkleRef.current) {
      tl.fromTo(sparkleRef.current, {
        scale: 0,
        opacity: 0,
        transformOrigin: "300px 300px",
      }, {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: "back.out(2)",
      }, 1.7);
    }

    // Monumental building image: clip-path wipe from bottom-left (1.2s) & subtle scale 1.15 -> 1
    if (buildingImgRef.current) {
      tl.fromTo(buildingImgRef.current, {
        clipPath: "polygon(0 100%, 0 100%, 0 100%)",
        scale: 1.15,
      }, {
        clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
        scale: 1,
        duration: 1.2,
        ease: "expo.out",
      }, 0.9);
    }

    // =========================================================================
    // STAGE 2: HEADLINE (starts at 1.1s)
    // =========================================================================
    // Split lines animate yPercent: 110 -> 0, rotate: 3 -> 0 (1.0s, stagger 0.12)
    tl.fromTo(".hero-headline-line", {
      yPercent: 110,
      rotate: 3,
    }, {
      yPercent: 0,
      rotate: 0,
      duration: 1.0,
      stagger: 0.12,
      ease: "expo.out",
    }, 1.1);

    // Italic accent words ("NAVIGATE FURTHER.") slide in from x: -40 with skewX: -12 -> 0
    tl.fromTo(".hero-headline-accent", {
      x: -40,
      skewX: -12,
    }, {
      x: 0,
      skewX: 0,
      duration: 1.0,
      ease: "expo.out",
    }, 1.2);

    // Eyebrow "01 / CAMPUS WAYFINDING, REIMAGINED" types in via width clip, line draws 0 -> 96px
    if (eyebrowTextRef.current) {
      tl.fromTo(eyebrowTextRef.current, {
        clipPath: "inset(0 100% 0 0)",
      }, {
        clipPath: "inset(0 0% 0 0)",
        duration: 0.8,
        ease: "expo.out",
      }, 1.1);
    }

    if (eyebrowLineRef.current) {
      tl.fromTo(eyebrowLineRef.current, {
        width: 0,
      }, {
        width: "6rem", // 96px
        duration: 0.8,
        ease: "expo.out",
      }, 1.1);
    }

    // =========================================================================
    // STAGE 3: SUPPORTING UI (starts at 1.8s, stagger 0.1)
    // =========================================================================
    // Paragraph fades up
    if (paragraphRef.current) {
      tl.fromTo(paragraphRef.current, {
        y: 20,
        opacity: 0,
      }, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "expo.out",
      }, 1.8);
    }

    // CTA buttons slide up with slight scale
    if (ctaRef.current) {
      tl.fromTo(ctaRef.current, {
        y: 20,
        scale: 0.95,
        opacity: 0,
      }, {
        y: 0,
        scale: 1,
        opacity: 1,
        duration: 0.8,
        ease: "expo.out",
      }, 1.9);
    }

    // "SYSTEM OVERVIEW" Play Button pulses once
    if (playBtnRef.current) {
      tl.to(playBtnRef.current, {
        scale: 1.18,
        duration: 0.25,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
      }, 2.3);
    }

    // Bottom meta row fades in left to right
    if (metaRowRef.current) {
      tl.fromTo(metaRowRef.current, {
        clipPath: "inset(0 100% 0 0)",
        opacity: 0,
      }, {
        clipPath: "inset(0 0% 0 0)",
        opacity: 1,
        duration: 0.8,
        ease: "expo.out",
      }, 2.0);
    }

    // Main Navbar drops from y: -100% to 0
    tl.fromTo("#main-navbar", {
      yPercent: -100,
    }, {
      yPercent: 0,
      duration: 0.8,
      ease: "expo.out",
    }, 1.8);

    // Side step indicator (01-06) and "CAMPUS / MAP / ROUTES / SPACES" label fade in last
    tl.fromTo(["#scroll-progress-rail", calloutRef.current], {
      opacity: 0,
      y: -10,
    }, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "expo.out",
      stagger: 0.1,
    }, 2.0);

    // Rotating circular badge scales in with 360 spin
    if (badgeRef.current) {
      tl.fromTo(badgeRef.current, {
        scale: 0,
        rotation: 0,
      }, {
        scale: 1,
        rotation: 360,
        duration: 1.0,
        ease: "back.out(1.5)",
      }, 2.0);
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      tl.kill();
    };
  }, [skipIntro, initIdleEffects]);

  return (
    <section
      id="section-01"
      ref={containerRef}
      className="relative w-full min-h-[92svh] lg:min-h-[96svh] bg-[#F7F3EC] dark:bg-[#070B14] text-[#0E1118] dark:text-zinc-100 overflow-hidden flex flex-col justify-between pt-12 sm:pt-16 pb-8 lg:pb-12 select-none transition-colors duration-200"
      aria-label="Campus Wayfinding Reimagined"
    >
      {/* =================================================================== */}
      {/* STAGE 0: PRELOADER OVERLAY (0 – 1.2s)                                */}
      {/* =================================================================== */}
      {isIntroActive && (
        <div
          id="hero-preloader"
          suppressHydrationWarning
          onClick={skipIntro}
          className="fixed inset-0 z-[100] pointer-events-auto select-none cursor-pointer"
          aria-label="CampusWay Loading Screen — Click or press any key to skip"
          role="presentation"
        >
          {/* Immediate anti-flash style injection for subsequent visits (avoids direct attribute mutation during hydration) */}
          <script
            dangerouslySetInnerHTML={{
              __html: `try{if(sessionStorage.getItem('campusway_intro_played')==='true'||window.matchMedia('(prefers-reduced-motion: reduce)').matches){var s=document.createElement('style');s.id='hero-preloader-anti-flash';s.textContent='#hero-preloader{display:none!important;}';document.head.appendChild(s);}}catch(e){}`,
            }}
          />
          {/* Split Curtains (Top & Bottom halves slide yPercent ±100, 0.9s, power4.inOut) */}
          <div
            ref={topCurtainRef}
            id="preloader-curtain-top"
            className="absolute top-0 inset-x-0 h-1/2 bg-[#070B14] border-b border-white/[0.08] overflow-hidden will-change-transform"
          />
          <div
            ref={bottomCurtainRef}
            id="preloader-curtain-bottom"
            className="absolute bottom-0 inset-x-0 h-1/2 bg-[#070B14] border-t border-white/[0.08] overflow-hidden will-change-transform"
          />

          {/* Centered Arch Logo + Counter + LPU Navigation System */}
          <div
            ref={preloaderContentRef}
            id="preloader-content"
            className="absolute inset-0 flex flex-col justify-between p-6 sm:p-12 pointer-events-none z-10"
          >
            {/* Top Right: Subtle Skip Prompt */}
            <div className="flex justify-end">
              <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#F4F6FA]/50 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                CLICK OR PRESS ESC TO SKIP
              </span>
            </div>

            {/* Center: CampusWay "∩" Logo Mark */}
            <div className="flex flex-col items-center justify-center my-auto">
              <svg
                className="w-16 h-20 sm:w-20 sm:h-24 text-[#E8452C]"
                viewBox="0 0 28 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  ref={logoOuterRef}
                  d="M4 30V12C4 6.47715 8.47715 2 14 2C19.5228 2 24 6.47715 24 12V30"
                  stroke="currentColor"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                />
                <path
                  ref={logoInnerRef}
                  d="M10 30V13C10 10.7909 11.7909 9 14 9C16.2091 9 18 10.7909 18 13V30"
                  stroke="currentColor"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                />
              </svg>
              <span className="mt-4 font-mono text-xs font-bold tracking-[0.2em] text-[#F4F6FA] uppercase">
                CAMPUSWAY
              </span>
            </div>

            {/* Bottom Row: Counter (000 -> 100) and Subtitle */}
            <div className="flex items-end justify-between font-mono text-xs text-[#F4F6FA]/70">
              <div className="flex items-baseline gap-1">
                <span
                  ref={counterRef}
                  className="font-mono text-2xl sm:text-3xl font-bold text-[#E8452C] tracking-widest"
                >
                  000
                </span>
                <span className="text-[11px] text-[#F4F6FA]/40 uppercase tracking-widest">%</span>
              </div>

              <div className="text-right">
                <span className="font-mono text-xs font-semibold tracking-[0.14em] uppercase text-[#F4F6FA]/70">
                  LPU NAVIGATION SYSTEM
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. TOP-LEFT SOFT FOLIAGE OVERLAY */}
      <div
        ref={leavesTopLeftRef}
        className="absolute -top-[3vw] -left-[3vw] w-[clamp(240px,28vw,440px)] pointer-events-none z-[2] select-none transition-transform duration-300 animate-hero-foliage"
        style={{
          mixBlendMode: "multiply",
          opacity: 0.55,
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

      {/* 2. BACKGROUND ARCHITECTURAL BLUEPRINT GRID */}
      <div className="absolute inset-0 blueprint-grid pointer-events-none z-0" aria-hidden="true" />

      {/* 3. SUN DISC & CONCENTRIC OUTLINE ARC (Behind Building) */}
      <div
        ref={sunDiscRef}
        id="hero-sun-disc"
        className="hidden lg:block absolute right-[4vw] top-[14%] w-[clamp(440px,50vw,720px)] aspect-square pointer-events-none z-[1] will-change-transform"
        aria-hidden="true"
      >
        <svg className="w-full h-full" viewBox="0 0 600 600" fill="none">
          <defs>
            <radialGradient id="heroSunGrad" cx="50%" cy="45%" r="50%" fx="45%" fy="40%">
              <stop offset="0%" stopColor="#F2793A" />
              <stop offset="60%" stopColor="#DE4B31" />
              <stop offset="100%" stopColor="#B23E27" />
            </radialGradient>
          </defs>

          {/* Thin Outer Concentric Arc (Orbit Ring) */}
          <circle
            ref={orbitRingRef}
            id="hero-orbit-ring"
            cx="300"
            cy="300"
            r="285"
            stroke="currentColor"
            className="text-black/10 dark:text-white/10"
            strokeWidth="1.2"
          />

          {/* Luminous Orange Sun Disc */}
          <circle cx="300" cy="300" r="235" fill="url(#heroSunGrad)" opacity="0.95" />

          {/* Crosshair Sparkle Marker */}
          <g ref={sparkleRef} id="hero-sun-crosshair">
            <line x1="300" y1="215" x2="300" y2="385" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.2" />
            <line x1="215" y1="300" x2="385" y2="300" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.2" />
            <circle cx="300" cy="300" r="2.5" fill="#FFFFFF" />
          </g>
        </svg>
      </div>

      {/* 4. MONUMENTAL FULL-BLEED CURVED UNIVERSITY BUILDING */}
      <div
        ref={buildingLayerRef}
        id="hero-building-layer"
        className="absolute right-[-3vw] bottom-0 w-[clamp(500px,60vw,1080px)] h-[clamp(420px,82svh,880px)] pointer-events-none z-[2] select-none flex items-end justify-end overflow-visible will-change-transform"
      >
        <div ref={buildingImgRef} id="hero-building-img" className="w-full h-full relative">
          <Image
            src="/images/hero-curved-fullbleed.webp"
            alt="Monumental curved campus architecture with sunset disc"
            width={1671}
            height={941}
            priority
            unoptimized
            className="w-full h-full object-contain object-bottom-right drop-shadow-[0_24px_48px_rgba(17,17,17,0.14)] dark:drop-shadow-[0_24px_48px_rgba(0,0,0,0.6)]"
          />
        </div>

        {/* Elevation Tag at Right Edge */}
        <div className="absolute bottom-3 right-8 text-[10px] font-mono tracking-widest text-[#5B5750] dark:text-zinc-500 uppercase hidden sm:block">
          LPU CAMPUS &bull; DATASET C VERIFIED
        </div>
      </div>

      {/* Top Right Architectural Callout */}
      <div
        ref={calloutRef}
        id="hero-callout-top-right"
        className="hidden lg:flex flex-col items-end gap-1 absolute top-12 right-12 z-20 pointer-events-none text-right"
      >
        <div className="flex flex-col text-[9px] font-mono font-medium tracking-widest text-[#5B5750] dark:text-zinc-400 uppercase leading-tight">
          <span>CAMPUS</span>
          <span>MAP</span>
          <span>ROUTES</span>
          <span>SPACES</span>
        </div>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="stroke-[#0E1118]/25 dark:stroke-white/20 mt-1">
          <line x1="0" y1="36" x2="36" y2="0" strokeWidth="1" />
        </svg>
      </div>

      {/* 5. MAIN HERO CONTENT COLUMN */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-12 flex flex-col justify-center my-auto pt-6 lg:pt-0">
        <div className="max-w-xl lg:max-w-2xl flex flex-col space-y-5 lg:space-y-6">
          {/* Section Kicker */}
          <div className="flex items-center gap-2.5 text-xs font-mono font-bold tracking-widest uppercase text-[#0E1118] dark:text-zinc-200">
            <span className="text-[#DE4B31]">01 /</span>
            <div ref={eyebrowTextRef} className="overflow-hidden inline-block">
              <span className="tracking-wider">CAMPUS WAYFINDING, REIMAGINED</span>
            </div>
            <span
              ref={eyebrowLineRef}
              className="h-px bg-[#0E1118]/25 dark:bg-white/20 inline-block w-12 sm:w-24"
              aria-hidden="true"
            />
          </div>

          {/* EXACT HEADLINE WITH STAGGERED MASK REVEAL */}
          <h1
            ref={headlineRef}
            className="fluid-hero-headline font-black tracking-tight uppercase text-[#0E1118] dark:text-white"
          >
            <div className="overflow-hidden">
              <span className="hero-headline-line block">FIND YOUR</span>
            </div>
            <div className="overflow-hidden">
              <span className="hero-headline-line block">PLACE.</span>
            </div>
            <div className="overflow-hidden">
              <span className="hero-headline-line hero-headline-accent block text-[#DE4B31] italic tracking-tight">
                NAVIGATE
              </span>
            </div>
            <div className="overflow-hidden">
              <span className="hero-headline-line hero-headline-accent block text-[#DE4B31] italic tracking-tight">
                FURTHER.
              </span>
            </div>
          </h1>

          {/* Subheading */}
          <p
            ref={paragraphRef}
            className="text-base sm:text-lg text-[#5B5750] dark:text-zinc-300 font-normal leading-relaxed max-w-lg"
          >
            Discover destinations, plan smarter routes, and experience Lovely Professional University with architectural clarity and step-by-step guidance.
          </p>

          {/* CTAs */}
          <div ref={ctaRef} className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6">
            <MagneticButton
              href="/explore"
              variant="primary"
              cursorLabel="EXPLORE"
              className="px-8 py-4 text-xs sm:text-sm shadow-md hover:shadow-xl"
            >
              <span>EXPLORE CAMPUS</span>
              <span className="text-[#DE4B31] font-bold text-sm">↗</span>
            </MagneticButton>

            {/* Circular Play Button + WATCH OVERVIEW */}
            <button
              ref={playBtnRef}
              type="button"
              data-cursor="PLAY"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
              aria-label="View system overview"
            >
              <div className="w-12 h-12 rounded-full border border-[#0E1118]/30 dark:border-white/20 group-hover:border-[#DE4B31] bg-white/70 dark:bg-zinc-800/80 flex items-center justify-center transition-all group-hover:scale-105 shadow-sm">
                <svg
                  className="w-4 h-4 text-[#0E1118] dark:text-white group-hover:text-[#DE4B31] ml-0.5 transition-colors"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div className="flex flex-col text-[11px] font-mono font-bold tracking-widest uppercase text-[#0E1118] dark:text-zinc-200 leading-tight group-hover:text-[#DE4B31] transition-colors">
                <span>SYSTEM</span>
                <span>OVERVIEW</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 6. BOTTOM BAR: SCROLL INDICATOR & STATS ROW */}
      <div
        ref={metaRowRef}
        className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-12 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono text-[#5B5750] dark:text-zinc-400 pt-6"
      >
        <div className="flex flex-wrap items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-3">
            <div className="w-4 h-7 rounded-full border border-[#0E1118]/40 dark:border-white/30 flex items-start justify-center p-1">
              <span className="w-1 h-1.5 bg-[#DE4B31] rounded-full animate-bounce" />
            </div>
            <span className="tracking-widest uppercase text-[11px] font-semibold text-[#5B5750] dark:text-zinc-400">
              SCROLL TO EXPLORE &mdash;
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono tracking-wider uppercase text-[#5B5750] dark:text-zinc-400">
            <span>38+ ACADEMIC BLOCKS</span>
            <span className="opacity-40">&bull;</span>
            <span>27 SURVEYED NODES</span>
            <span className="opacity-40">&bull;</span>
            <span className="text-[#DE4B31] font-semibold">DATASET C VERIFIED</span>
          </div>
        </div>
      </div>

      {/* 7. ROTATING CIRCULAR SCROLL BADGE */}
      <div
        ref={badgeRef}
        id="hero-rotating-badge"
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

      {/* System Overview Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-[#0E1422] rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#E1DDD3] dark:border-zinc-800 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E1DDD3] dark:border-zinc-800">
              <span className="font-mono text-xs font-bold text-[#DE4B31] uppercase tracking-wider">
                CAMPUSWAY // ARCHITECTURAL SPECIFICATION
              </span>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-black dark:hover:text-white flex items-center justify-center text-sm font-bold"
              >
                &times;
              </button>
            </div>
            <h3 className="text-xl font-bold text-[#0E1118] dark:text-white">
              CampusWay for Lovely Professional University
            </h3>
            <p className="text-sm text-[#5B5750] dark:text-zinc-300 leading-relaxed">
              CampusWay is an intelligent wayfinding system powered by verified ground-truth topological graphs (Dataset C), featuring 3D building visualization, step-free accessible route planning, and real-time navigation across LPU&apos;s 600+ acre campus.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-zinc-900 border border-[#E1DDD3] dark:border-zinc-800">
                <span className="text-[10px] text-slate-400 block">TOPOLOGY</span>
                <span className="font-bold text-[#0E1118] dark:text-white">Dataset C Verified</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-zinc-900 border border-[#E1DDD3] dark:border-zinc-800">
                <span className="text-[10px] text-slate-400 block">MAP ENGINE</span>
                <span className="font-bold text-[#0E1118] dark:text-white">Mapbox GL 3D</span>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Link
                href="/explore"
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 rounded-full bg-[#0E1118] dark:bg-white text-white dark:text-[#0E1118] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#DE4B31] dark:hover:bg-[#DE4B31] dark:hover:text-white transition"
              >
                Launch Map &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
