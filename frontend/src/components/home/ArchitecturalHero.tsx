"use client";

import React, { useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isReducedMotion, getLenis } from "@/lib/motion";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { RotatingTextBadge } from "@/components/motion/RotatingTextBadge";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Module-level persistence: resets on full page load / reload, persists during client-side navigation
let introPlayed = false;

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/**
 * ArchitecturalHero
 * 
 * Cinematic architectural entrance sequence for CampusWay.
 * Controlled by a single unified GSAP timeline:
 * - STAGE 0: Full-screen #070B14 Preloader with SVG logo stroke draw, counter 000 -> 100, and split-curtain exit.
 * - STAGE 1: Orange sun disc scale/blur reveal, orbit ring stroke draw, sparkle pop, and building clip-path wipe.
 * - STAGE 2: Line-by-line masked headline reveal, per-character italic kinetic slide, and typed eyebrow.
 * - STAGE 3: Supporting UI fade-up, play button pulse, meta row reveal, navbar drop, and rotating badge entrance.
 * - AFTER INTRO: Idle mouse parallax (quickTo), slow breathing scale, and scroll-out scrub.
 * 
 * Timeline duration: ~3.3 seconds.
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
  const discScrollLayerRef = useRef<HTMLDivElement>(null);
  const discParallaxLayerRef = useRef<HTMLDivElement>(null);
  const discBreathingLayerRef = useRef<HTMLDivElement>(null);
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

  // State: preloader active on first load; client-side navigation skips it immediately
  const [isIntroActive, setIsIntroActive] = useState(() => !introPlayed);
  const [modalOpen, setModalOpen] = useState(false);

  // Scroll locking utilities
  const lockScroll = useCallback(() => {
    const lenis = getLenis();
    if (lenis) lenis.stop();
    if (typeof document !== "undefined") {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    }
  }, []);

  const unlockScroll = useCallback(() => {
    const lenis = getLenis();
    if (lenis) lenis.start();
    if (typeof document !== "undefined") {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
  }, []);

  // Idle effects: mouse parallax, breathing scale, and scroll-out scrub
  const initIdleEffects = useCallback(() => {
    if (isReducedMotion() || !containerRef.current) return;

    // 1. Mouse Parallax (Sphere on parallax layer ±15px, Building ±8px with duration 0.8 quickTo)
    const xSphereTo = gsap.quickTo(discParallaxLayerRef.current, "x", { duration: 0.8, ease: "power2.out" });
    const ySphereTo = gsap.quickTo(discParallaxLayerRef.current, "y", { duration: 0.8, ease: "power2.out" });
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

    // 2. Pure CSS breathing animation runs on discBreathingLayerRef via .hero-disc-breathing class.
    // Breathing is paused during scroll-out scrub to prevent compounding scales.

    // 3. Scroll-out scrub: single reversible deterministic ScrollTrigger
    const scrollOutCtx = gsap.context(() => {
      const heroScrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.4,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (discBreathingLayerRef.current) {
              if (self.progress > 0.005) {
                discBreathingLayerRef.current.classList.add("hero-breathing-paused");
              } else {
                discBreathingLayerRef.current.classList.remove("hero-breathing-paused");
              }
            }
          },
          onLeave: () => {
            if (discBreathingLayerRef.current) {
              discBreathingLayerRef.current.classList.add("hero-breathing-paused");
            }
          },
          onLeaveBack: () => {
            if (discBreathingLayerRef.current) {
              discBreathingLayerRef.current.classList.remove("hero-breathing-paused");
            }
          },
        },
      });

      if (discScrollLayerRef.current) {
        heroScrollTl.fromTo(
          discScrollLayerRef.current,
          { scale: 1 },
          { scale: 1.1, ease: "none", immediateRender: false },
          0
        );
      }

      if (headlineRef.current) {
        heroScrollTl.fromTo(
          headlineRef.current,
          { yPercent: 0 },
          { yPercent: -35, ease: "none", immediateRender: false },
          0
        );
      }

      if (buildingLayerRef.current) {
        heroScrollTl.fromTo(
          buildingLayerRef.current,
          { yPercent: 0 },
          { yPercent: -15, ease: "none", immediateRender: false },
          0
        );
      }
    }, containerRef);

    // 4. IntersectionObserver: toggle willChange and pause breathing when offscreen
    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        if (discScrollLayerRef.current) {
          discScrollLayerRef.current.style.willChange = inView ? "transform" : "auto";
        }
        if (discParallaxLayerRef.current) {
          discParallaxLayerRef.current.style.willChange = inView ? "transform" : "auto";
        }
        if (buildingLayerRef.current) {
          buildingLayerRef.current.style.willChange = inView ? "transform" : "auto";
        }
        if (discBreathingLayerRef.current && !inView) {
          discBreathingLayerRef.current.classList.add("hero-breathing-paused");
        }
      },
      { threshold: 0 }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      scrollOutCtx.revert();
      observer.disconnect();
    };
  }, []);

  // Quick skip function
  const skipIntro = useCallback(() => {
    console.log("[INTRO] skipIntro triggered");
    if (timelineRef.current) {
      timelineRef.current.progress(1);
      timelineRef.current.kill();
    }
    // Explicitly guarantee all elements are visible and clean of lingering transforms
    gsap.set(".hero-headline-line", { yPercent: 0, rotate: 0, clearProps: "transform" });
    gsap.set(".hero-headline-accent", { x: 0, skewX: 0, clearProps: "transform" });
    gsap.set(".hero-p-line", { opacity: 1, y: 0, clearProps: "all" });
    if (ctaRef.current) gsap.set(ctaRef.current, { opacity: 1, y: 0, scale: 1, clearProps: "all" });
    if (metaRowRef.current) gsap.set(metaRowRef.current, { opacity: 1, clipPath: "inset(0 0% 0 0)", clearProps: "all" });
    if (sunDiscRef.current) gsap.set(sunDiscRef.current, { clearProps: "filter,transform", filter: "none", opacity: 0.95 });
    if (orbitRingRef.current) gsap.set(orbitRingRef.current, { clearProps: "strokeDasharray,strokeDashoffset" });
    if (sparkleRef.current) gsap.set(sparkleRef.current, { clearProps: "transform", opacity: 1 });
    if (buildingImgRef.current) gsap.set(buildingImgRef.current, { clearProps: "clipPath,transform" });
    introPlayed = true;
    setIsIntroActive(false);
    unlockScroll();
    initIdleEffects();
  }, [unlockScroll, initIdleEffects]);

  // Master Cinematic entrance sequence built in useIsomorphicLayoutEffect inside gsap.context
  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    // Check ?intro=1 override
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("intro") === "1") {
      introPlayed = false;
    }

    // 1. SCROLL AND HASH RESET
    // Manual scroll restoration ensures hero stays in view on reload
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    if (window.location.hash) {
      try {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      } catch {}
    }
    const resetScrollToTop = () => {
      window.scrollTo(0, 0);
      const activeLenis = getLenis();
      if (activeLenis) {
        activeLenis.scrollTo(0, { immediate: true });
      }
    };
    resetScrollToTop();
    requestAnimationFrame(resetScrollToTop);
    setTimeout(resetScrollToTop, 50);
    setTimeout(resetScrollToTop, 150);

    const reduced = isReducedMotion();

    if (introPlayed || reduced) {
      setIsIntroActive(false);
      unlockScroll();
      gsap.set(".hero-headline-line", { yPercent: 0, rotate: 0, clearProps: "transform" });
      gsap.set(".hero-headline-accent", { x: 0, skewX: 0, clearProps: "transform" });
      gsap.set(".hero-p-line", { opacity: 1, y: 0, clearProps: "all" });
      if (ctaRef.current) gsap.set(ctaRef.current, { opacity: 1, y: 0, scale: 1, clearProps: "all" });
      if (metaRowRef.current) gsap.set(metaRowRef.current, { opacity: 1, clipPath: "inset(0 0% 0 0)", clearProps: "all" });
      if (sunDiscRef.current) gsap.set(sunDiscRef.current, { clearProps: "filter,transform", filter: "none", opacity: 0.95 });
      if (orbitRingRef.current) gsap.set(orbitRingRef.current, { clearProps: "strokeDasharray,strokeDashoffset" });
      if (sparkleRef.current) gsap.set(sparkleRef.current, { clearProps: "transform", opacity: 1 });
      if (buildingImgRef.current) gsap.set(buildingImgRef.current, { clearProps: "clipPath,transform" });
      initIdleEffects();
      return;
    }

    // Lock scroll during intro
    lockScroll();
    setIsIntroActive(true);

    // Keyboard listener to skip intro (Escape, Space, Enter)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        skipIntro();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    // Master GSAP Context for StrictMode double-invocation safety
    const ctx = gsap.context(() => {
      // SET INITIAL STATES BEFORE FIRST PAINT (prevents flash of resting text)
      gsap.set(".hero-headline-line", { yPercent: 110, rotate: 3 });
      gsap.set(".hero-headline-accent", { x: -35, skewX: -8 });
      gsap.set(".hero-p-line", { opacity: 0, y: 20 });
      if (ctaRef.current) gsap.set(ctaRef.current, { opacity: 0, y: 20, scale: 0.95 });
      if (metaRowRef.current) gsap.set(metaRowRef.current, { opacity: 0, clipPath: "inset(0 100% 0 0)" });
      const navEl = document.getElementById("main-navbar");
      if (navEl) gsap.set(navEl, { yPercent: -100 });
      if (badgeRef.current) gsap.set(badgeRef.current, { scale: 0, rotation: 0 });
      gsap.set(["#scroll-progress-rail", calloutRef.current], { opacity: 0, y: -10 });

      // Single unified GSAP master timeline
      const tl = gsap.timeline({
        defaults: { ease: "expo.out" },
        onComplete: () => {
          gsap.set(".hero-headline-line", { clearProps: "transform" });
          gsap.set(".hero-headline-accent", { clearProps: "transform" });
          if (sunDiscRef.current) gsap.set(sunDiscRef.current, { clearProps: "filter,transform", filter: "none", opacity: 0.95 });
          if (orbitRingRef.current) gsap.set(orbitRingRef.current, { clearProps: "strokeDasharray,strokeDashoffset" });
          if (sparkleRef.current) gsap.set(sparkleRef.current, { clearProps: "transform", opacity: 1 });
          if (buildingImgRef.current) gsap.set(buildingImgRef.current, { clearProps: "clipPath,transform" });
          introPlayed = true;
          setIsIntroActive(false);
          unlockScroll();
          initIdleEffects();
        },
      });

      timelineRef.current = tl;

      // =========================================================================
      // STAGE 0: PRELOADER (0.0s – 1.2s)
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

      // Exit: overlay content fades out and curtains split up/down (yPercent ±100, 0.8s, power4.inOut)
      tl.to(preloaderContentRef.current, {
        opacity: 0,
        duration: 0.25,
        ease: "power2.out",
      }, 0.8);

      tl.to(topCurtainRef.current, {
        yPercent: -100,
        duration: 0.8,
        ease: "power4.inOut",
      }, 0.85);

      tl.to(bottomCurtainRef.current, {
        yPercent: 100,
        duration: 0.8,
        ease: "power4.inOut",
      }, 0.85);

      // =========================================================================
      // STAGE 1: BACKGROUND (starts at 0.85s)
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
          duration: 1.3,
          ease: "expo.out",
        }, 0.85);
      }

      // Thin orbit ring: draws itself with stroke-dashoffset (1.6s)
      if (orbitRingRef.current) {
        const ringLen = 2 * Math.PI * 285; // ~1791px
        gsap.set(orbitRingRef.current, { strokeDasharray: ringLen, strokeDashoffset: ringLen });
        tl.to(orbitRingRef.current, {
          strokeDashoffset: 0,
          duration: 1.5,
          ease: "expo.out",
        }, 0.85);
      }

      // Sparkle/crosshair marker pops in with back.out(2)
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
        }, 1.6);
      }

      // Monumental building image: clip-path wipe from bottom-left (1.2s) & scale 1.15 -> 1
      if (buildingImgRef.current) {
        tl.fromTo(buildingImgRef.current, {
          clipPath: "polygon(0 100%, 0 100%, 0 100%)",
          scale: 1.15,
        }, {
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
          scale: 1,
          duration: 1.2,
          ease: "expo.out",
        }, 0.85);
      }

      // =========================================================================
      // STAGE 2: HEADLINE (starts at 1.1s so it's fully emerging as curtains part)
      // =========================================================================
      const headlineStartTime = 1.1;

      // Eyebrow clip reveal & line draw
      if (eyebrowTextRef.current) {
        tl.fromTo(eyebrowTextRef.current, {
          clipPath: "inset(0 100% 0 0)",
        }, {
          clipPath: "inset(0 0% 0 0)",
          duration: 0.8,
          ease: "expo.out",
        }, headlineStartTime);
      }

      if (eyebrowLineRef.current) {
        tl.fromTo(eyebrowLineRef.current, {
          width: 0,
        }, {
          width: "6rem", // 96px
          duration: 0.8,
          ease: "expo.out",
        }, headlineStartTime);
      }

      // Headline lines animate yPercent: 110 -> 0, rotate: 3 -> 0, duration 1.0, stagger 0.08
      tl.to(".hero-headline-line", {
        yPercent: 0,
        rotate: 0,
        duration: 1.0,
        stagger: 0.08,
        ease: "expo.out",
        clearProps: "transform",
      }, headlineStartTime);

      // Italic accent words slide in from x: -35 with skewX: -8 -> 0 settle
      tl.to(".hero-headline-accent", {
        x: 0,
        skewX: 0,
        duration: 1.0,
        stagger: 0.08,
        ease: "expo.out",
        clearProps: "transform",
      }, headlineStartTime + 0.16);

      // =========================================================================
      // STAGE 3: SUPPORTING UI (starts at 1.8s)
      // =========================================================================
      // Subtitle paragraph by lines (opacity 0 -> 1, y 20 -> 0, stagger 0.06)
      tl.to(".hero-p-line", {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.06,
        ease: "expo.out",
      }, 1.8);

      // CTA buttons slide up with slight scale
      if (ctaRef.current) {
        tl.to(ctaRef.current, {
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
        }, 2.2);
      }

      // Bottom meta row reveals left-to-right
      if (metaRowRef.current) {
        tl.to(metaRowRef.current, {
          clipPath: "inset(0 0% 0 0)",
          opacity: 1,
          duration: 0.8,
          ease: "expo.out",
        }, 2.0);
      }

      // Main Navbar drops down
      if (navEl) {
        tl.to(navEl, {
          yPercent: 0,
          duration: 0.8,
          ease: "expo.out",
        }, 1.9);
      }

      // Side progress rail and top-right callout fade in
      tl.to(["#scroll-progress-rail", calloutRef.current], {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "expo.out",
        stagger: 0.1,
      }, 2.0);

      // Rotating circular badge scales in with 360 spin
      if (badgeRef.current) {
        tl.to(badgeRef.current, {
          scale: 1,
          rotation: 360,
          duration: 1.0,
          ease: "back.out(1.5)",
        }, 2.0);
      }
    }, containerRef);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      unlockScroll();
      ctx.revert();
    };
  }, [skipIntro, lockScroll, unlockScroll, initIdleEffects]);

  return (
    <section
      id="section-01"
      ref={containerRef}
      className="relative w-full min-h-[92svh] lg:min-h-[96svh] bg-[#F7F3EC] dark:bg-[#070B14] text-[#0E1118] dark:text-zinc-100 overflow-hidden [overflow:clip] flex flex-col justify-between pt-12 sm:pt-16 pb-0 select-none transition-colors duration-200 border-b border-[#0E1118]/10 dark:border-white/10"
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
                  className="font-mono text-2xl sm:text-3xl font-bold text-[#E8452C] tracking-widest tabular-nums"
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

      {/* 3. SUN DISC & CONCENTRIC OUTLINE ARC (Behind Building) - Split into Layered Transforms */}
      <div
        id="hero-sun-disc-container"
        className="hidden lg:block absolute right-[4vw] top-[14%] w-[clamp(440px,50vw,720px)] aspect-square pointer-events-none z-[1] [contain:layout_paint] [backface-visibility:hidden]"
        aria-hidden="true"
      >
        {/* Layer 1 (Outer): Scroll Scrub (scale 1 -> 1.1) */}
        <div
          ref={discScrollLayerRef}
          id="hero-sun-disc-scroll-layer"
          className="w-full h-full [transform-origin:center_center] [backface-visibility:hidden]"
        >
          {/* Layer 2 (Middle): Mouse Parallax (translate x/y ±15px) */}
          <div
            ref={discParallaxLayerRef}
            id="hero-sun-disc-parallax-layer"
            className="w-full h-full [transform-origin:center_center] [backface-visibility:hidden]"
          >
            {/* Layer 3 (Inner): Breathing Scale (pure CSS keyframe 1 <-> 1.03) */}
            <div
              ref={discBreathingLayerRef}
              id="hero-sun-disc-breathing-layer"
              className="w-full h-full [transform-origin:center_center] [backface-visibility:hidden] hero-disc-breathing"
            >
              {/* Innermost Visual Target: intro scale & blur, cleared on complete */}
              <div
                ref={sunDiscRef}
                id="hero-sun-disc"
                className="w-full h-full [transform-origin:center_center] [backface-visibility:hidden]"
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
            </div>
          </div>
        </div>
      </div>

      {/* 4. MONUMENTAL FULL-BLEED CURVED UNIVERSITY BUILDING (Oversized with bleed to prevent parallax gaps) */}
      <div
        ref={buildingLayerRef}
        id="hero-building-layer"
        className="absolute right-[-3vw] -bottom-[5%] w-[clamp(520px,62vw,1120px)] h-[clamp(440px,88svh,940px)] pointer-events-none z-[2] select-none flex items-end justify-end overflow-visible will-change-transform"
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
            <span className="text-[#E8452C]">01 /</span>
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
            <div className="overflow-hidden pb-1 -mb-1">
              <div className="hero-headline-line will-change-transform">
                <span className="block">FIND YOUR</span>
              </div>
            </div>
            <div className="overflow-hidden pb-1 -mb-1">
              <div className="hero-headline-line will-change-transform">
                <span className="block">PLACE.</span>
              </div>
            </div>
            <div className="overflow-hidden pb-1 -mb-1">
              <div className="hero-headline-line will-change-transform">
                <span className="hero-headline-accent block text-[#E8452C] italic tracking-tight will-change-transform">
                  NAVIGATE
                </span>
              </div>
            </div>
            <div className="overflow-hidden pb-1 -mb-1">
              <div className="hero-headline-line will-change-transform">
                <span className="hero-headline-accent block text-[#E8452C] italic tracking-tight will-change-transform">
                  FURTHER.
                </span>
              </div>
            </div>
          </h1>

          {/* Subheading with per-line reveal */}
          <p
            ref={paragraphRef}
            className="text-base sm:text-lg text-[#5B5750] dark:text-zinc-300 font-normal leading-relaxed max-w-lg"
          >
            <span className="hero-p-line block will-change-transform">
              Discover destinations, plan smarter routes, and experience
            </span>
            <span className="hero-p-line block will-change-transform">
              Lovely Professional University with architectural clarity
            </span>
            <span className="hero-p-line block will-change-transform">
              and step-by-step guidance.
            </span>
          </p>

          {/* CTAs */}
          <div ref={ctaRef} className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6 will-change-transform">
            <MagneticButton
              href="/explore"
              variant="primary"
              cursorLabel="EXPLORE"
              className="px-8 py-4 text-xs sm:text-sm shadow-md hover:shadow-xl"
            >
              <span>EXPLORE CAMPUS</span>
              <span className="text-[#E8452C] font-bold text-sm">↗</span>
            </MagneticButton>

            {/* Circular Play Button + WATCH OVERVIEW */}
            <button
              ref={playBtnRef}
              type="button"
              data-cursor="PLAY"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none will-change-transform"
              aria-label="View system overview"
            >
              <div className="w-12 h-12 rounded-full border border-[#0E1118]/30 dark:border-white/20 group-hover:border-[#E8452C] bg-white/70 dark:bg-zinc-800/80 flex items-center justify-center transition-all group-hover:scale-105 shadow-sm">
                <svg
                  className="w-4 h-4 text-[#0E1118] dark:text-white group-hover:text-[#E8452C] ml-0.5 transition-colors"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div className="flex flex-col text-[11px] font-mono font-bold tracking-widest uppercase text-[#0E1118] dark:text-zinc-200 leading-tight group-hover:text-[#E8452C] transition-colors">
                <span>SYSTEM</span>
                <span>OVERVIEW</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 6. CONSOLIDATED BOTTOM META BAR WITH SUBTLE 48PX CONTRAST SCRIM */}
      <div className="relative z-20 w-full mt-auto pointer-events-none">
        {/* Subtle backdrop gradient scrim (transparent to bg with 60% opacity over 48px) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 h-12 bg-gradient-to-t from-[#F7F3EC]/60 to-transparent dark:from-[#070B14]/60 dark:to-transparent pointer-events-none"
        />
        <div
          ref={metaRowRef}
          className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-4 text-xs font-mono text-slate-700 dark:text-zinc-300 py-3 will-change-transform pointer-events-auto"
        >
          {/* Left: Scroll indicator with coordinates */}
          <div className="flex items-center gap-3">
            <div className="w-4 h-6 rounded-full border border-slate-700/60 dark:border-white/50 flex items-start justify-center p-1 bg-white/40 dark:bg-black/40 backdrop-blur-xs">
              <div className="w-1 h-1.5 bg-[#E8452C] rounded-full animate-scroll-bounce" />
            </div>
            <span className="tracking-wider font-semibold text-[11px] hidden sm:inline">SCROLL TO EXPLORE</span>
            <span className="hidden md:inline opacity-30">&bull;</span>
            <span className="hidden md:inline tracking-wider text-[11px] opacity-70">31.2536&deg; N, 75.7037&deg; E</span>
          </div>

          {/* Right: Consolidated Single-Line Metadata */}
          <div className="flex items-center gap-2 sm:gap-2.5 text-[11px] font-mono tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-[#E8452C] animate-pulse shrink-0" />
            <span className="font-bold text-[#0E1118] dark:text-white">LIVE SATELLITE SYNC</span>
            <span className="opacity-40">&bull;</span>
            <span className="text-[#5B5750] dark:text-zinc-400 font-medium hidden xs:inline">DATASET C VERIFIED</span>
            <span className="opacity-40 hidden xs:inline">&bull;</span>
            <span className="text-[#E8452C] font-semibold">LPU CAMPUS</span>
          </div>
        </div>
      </div>

      {/* 7. ROTATING CIRCULAR SCROLL BADGE */}
      <div
        ref={badgeRef}
        id="hero-rotating-badge"
        className="hidden md:block fixed lg:absolute right-[clamp(24px,4vw,64px)] bottom-[clamp(88px,12svh,140px)] z-20 pointer-events-auto will-change-transform"
      >
        <RotatingTextBadge
          size={92}
          onClick={() => {
            const nextSec = document.getElementById("section-02");
            if (nextSec) {
              nextSec.scrollIntoView({ behavior: isReducedMotion() ? "auto" : "smooth" });
            }
          }}
        />
      </div>

      {/* OVERVIEW VIDEO MODAL DIALOG */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="CampusWay System Overview Video"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-[#FAF8F5] dark:bg-[#0E1422] rounded-3xl p-6 sm:p-8 border border-[#E1DDD3] dark:border-zinc-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E1DDD3] dark:border-zinc-800 font-mono text-xs text-[#0E1118] dark:text-zinc-300">
              <span className="font-bold text-[#E8452C]">✦ CAMPUSWAY SYSTEM OVERVIEW</span>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="hover:text-[#E8452C] transition-colors cursor-pointer text-sm font-bold"
                aria-label="Close dialog"
              >
                ✕ CLOSE
              </button>
            </div>

            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black relative flex items-center justify-center">
              <iframe
                className="w-full h-full"
                src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="System Overview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
