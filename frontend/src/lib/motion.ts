"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Ensure GSAP plugins are safely registered on the client
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ---------------------------------------------------------------------------
// 1. EASING CONSTANTS
// ---------------------------------------------------------------------------
/**
 * Exponential Ease-Out Curve
 * Framer Motion cubic-bezier tuple and GSAP easing string.
 */
export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;
export const GSAP_EASE_EXPO = "expo.out" as const;

export const EASE = {
  framer: EASE_OUT_EXPO,
  gsap: GSAP_EASE_EXPO,
  expo: EASE_OUT_EXPO,
} as const;

// ---------------------------------------------------------------------------
// 2. TIMING & DURATIONS
// ---------------------------------------------------------------------------
/**
 * Shared motion durations across the design system (seconds).
 */
export const DURATIONS = {
  fast: 0.4,
  base: 0.8,
  slow: 1.2,
} as const;

// ---------------------------------------------------------------------------
// 3. STAGGER OFFSETS
// ---------------------------------------------------------------------------
/**
 * Stagger offsets between adjacent animated children (seconds).
 */
export const STAGGER = {
  text: 0.08,
  cards: 0.12,
} as const;

// ---------------------------------------------------------------------------
// 4. THEME TOKENS
// ---------------------------------------------------------------------------
/**
 * Core architectural visual tokens for motion, surfaces, and accents.
 */
export const MOTION_THEME = {
  accent: "#E8452C",
  bg: "#070B14",
  surface: "#0D1322",
  border: "rgba(255, 255, 255, 0.08)",
} as const;

export const ACCENT_COLOR = MOTION_THEME.accent;
export const BG_COLOR = MOTION_THEME.bg;
export const SURFACE_COLOR = MOTION_THEME.surface;
export const BORDER_COLOR = MOTION_THEME.border;

// ---------------------------------------------------------------------------
// 5. REDUCED MOTION GUARD
// ---------------------------------------------------------------------------
/**
 * Non-hook check for SSR and GSAP execution contexts.
 */
export function isReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Hydration-safe React hook detecting (prefers-reduced-motion: reduce).
 */
export function useReducedMotion(): boolean {
  const subscribe = (callback: () => void) => {
    if (typeof window === "undefined") return () => {};
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    media.addEventListener("change", callback);
    return () => media.removeEventListener("change", callback);
  };

  const getSnapshot = () => isReducedMotion();
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Comprehensive motion guard interface.
 * When active (reduced motion requested):
 * - skip pinning
 * - skip parallax
 * - skip counters (render final value immediately)
 * - skip text splitting
 * - render final state instantly
 */
export interface ReducedMotionGuard {
  active: boolean;
  skipPinning: boolean;
  skipParallax: boolean;
  skipCounters: boolean;
  skipTextSplitting: boolean;
  renderInstant: boolean;
  duration: (d: number) => number;
  delay: (d: number) => number;
  stagger: (s: number) => number;
  parallax: <T>(activeVal: T, fallbackVal: T) => T;
}

/**
 * useReducedMotionGuard
 * 
 * Provides an ergonomic guard object for any section:
 * When true, skip pinning, parallax, counters and text splitting, and render the final state instantly.
 */
export function useReducedMotionGuard(): ReducedMotionGuard {
  const shouldReduce = useReducedMotion();

  return {
    active: shouldReduce,
    skipPinning: shouldReduce,
    skipParallax: shouldReduce,
    skipCounters: shouldReduce,
    skipTextSplitting: shouldReduce,
    renderInstant: shouldReduce,
    duration: (d: number) => (shouldReduce ? 0 : d),
    delay: (d: number) => (shouldReduce ? 0 : d),
    stagger: (s: number) => (shouldReduce ? 0 : s),
    parallax: <T>(activeVal: T, fallbackVal: T): T => (shouldReduce ? fallbackVal : activeVal),
  };
}

// ---------------------------------------------------------------------------
// 6. LENIS SMOOTH-SCROLL INSTANCE WIRED TO GSAP SCROLLTRIGGER
// ---------------------------------------------------------------------------
let globalLenis: Lenis | null = null;
let tickerCallback: ((time: number) => void) | null = null;

/**
 * Retrieve the active shared Lenis instance.
 */
export function getLenis(): Lenis | null {
  return globalLenis;
}

/**
 * One Lenis smooth-scroll instance wired directly to GSAP ScrollTrigger:
 *   lenis.on('scroll', ScrollTrigger.update);
 *   gsap.ticker.add(t => lenis.raf(t*1000));
 *   gsap.ticker.lagSmoothing(0);
 * 
 * Ensures Framer Motion and GSAP scroll effects never fight or desynchronize.
 */
export function initSmoothScroll(): Lenis | null {
  if (typeof window === "undefined") return null;

  // Honor reduced motion by disabling smooth scroll hijacking
  if (isReducedMotion()) {
    return null;
  }

  if (globalLenis) {
    return globalLenis;
  }

  try {
    globalLenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    // 1. Sync Lenis scroll events with GSAP ScrollTrigger
    globalLenis.on("scroll", ScrollTrigger.update);

    // 2. Drive Lenis updates directly through GSAP's central requestAnimationFrame ticker
    tickerCallback = (time: number) => {
      globalLenis?.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);

    // 3. Disable lag smoothing to prevent sudden frame catch-up jumps
    gsap.ticker.lagSmoothing(0);

    return globalLenis;
  } catch (err) {
    console.warn("Failed to initialize Lenis smooth-scroll:", err);
    return null;
  }
}

/**
 * Safely destroy the shared Lenis instance and unbind GSAP ticker listeners.
 */
export function destroySmoothScroll(): void {
  if (tickerCallback) {
    gsap.ticker.remove(tickerCallback);
    tickerCallback = null;
  }
  if (globalLenis) {
    globalLenis.destroy();
    globalLenis = null;
  }
}

/**
 * React hook to mount and synchronize the Lenis smooth-scroll instance.
 */
export function useSmoothScroll(): Lenis | null {
  const [lenis, setLenis] = useState<Lenis | null>(() => globalLenis);

  useEffect(() => {
    const instance = initSmoothScroll();
    setLenis(instance);

    return () => {
      destroySmoothScroll();
      setLenis(null);
    };
  }, []);

  return lenis;
}

/**
 * Declarative component for mounting smooth scrolling in page layouts.
 */
export function SmoothScroll() {
  useSmoothScroll();
  return null;
}

// ---------------------------------------------------------------------------
// 7. SCROLL-SCRUBBED REVEAL HELPER & HOOK
// ---------------------------------------------------------------------------
export interface ScrollRevealConfig {
  containerRef: React.RefObject<HTMLElement | null>;
  cardRefs: React.RefObject<(HTMLElement | null)[]>;
  scrub?: number | boolean;
  start?: string;
  end?: string;
  offsets?: number[];
  mobileBreakpoint?: number;
  mobileStart?: string;
  mobileEnd?: string;
}

/**
 * useScrollReveal
 * 
 * Synchronizes element / card reveals directly to user scroll position with GSAP ScrollTrigger.
 * - Desktop: unified scrubbed timeline with sequential offsets (e.g. 0%, 8%, 16%) and staggered internal children.
 * - Mobile (<768px): per-card individual ScrollTriggers (start: "top 90%", end: "top 60%").
 * - Reduced motion: renders instantly at resting state (opacity: 1, transform: none).
 */
export function useScrollReveal({
  containerRef,
  cardRefs,
  scrub = 0.8,
  start = "top 88%",
  end = "top 48%",
  offsets = [0, 0.08, 0.16],
  mobileBreakpoint = 768,
  mobileStart = "top 90%",
  mobileEnd = "top 60%",
}: ScrollRevealConfig): void {
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const cards = (cardRefs.current || []).filter(Boolean) as HTMLElement[];
    if (cards.length === 0) return;

    if (isReducedMotion()) {
      cards.forEach((card) => {
        card.style.opacity = "1";
        card.style.transform = "none";
        const children = card.querySelectorAll<HTMLElement>("[data-reveal-child]");
        children.forEach((child) => {
          child.style.opacity = "1";
          child.style.transform = "none";
        });
      });
      return;
    }

    const isMobile = window.innerWidth < mobileBreakpoint;

    const ctx = gsap.context(() => {
      if (isMobile) {
        // Mobile: each card gets its own individual ScrollTrigger
        cards.forEach((card) => {
          const children = card.querySelectorAll<HTMLElement>("[data-reveal-child]");
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: card,
              start: mobileStart,
              end: mobileEnd,
              scrub,
            },
          });

          tl.fromTo(
            card,
            { opacity: 0, y: 35 },
            { opacity: 1, y: 0, ease: "power2.out", duration: 0.5 },
            0
          );

          if (children.length > 0) {
            tl.fromTo(
              children,
              { opacity: 0, y: 15 },
              { opacity: 1, y: 0, ease: "power2.out", duration: 0.4, stagger: 0.06 },
              0.15
            );
          }
        });
      } else {
        // Desktop: unified horizontal sequence across container trigger
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start,
            end,
            scrub,
          },
        });

        cards.forEach((card, idx) => {
          const cardOffset = offsets[idx] ?? idx * 0.08;
          const children = card.querySelectorAll<HTMLElement>("[data-reveal-child]");

          // Card container reveal
          tl.fromTo(
            card,
            { opacity: 0, y: 45 },
            { opacity: 1, y: 0, ease: "power2.out", duration: 0.45 },
            cardOffset
          );

          // Internal card elements (icon, title, body, link) staggered
          if (children.length > 0) {
            tl.fromTo(
              children,
              { opacity: 0, y: 18 },
              { opacity: 1, y: 0, ease: "power2.out", duration: 0.35, stagger: 0.05 },
              cardOffset + 0.08
            );
          }
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [containerRef, cardRefs, scrub, start, end, offsets, mobileBreakpoint, mobileStart, mobileEnd]);
}
