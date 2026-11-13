/**
 * CampusWay — Centralized Motion & Animation Architecture
 * High-performance GSAP + Lenis configurations with strict reduced-motion fallbacks.
 */

export const MOTION = {
  // Easing presets
  ease: {
    reveal: "power3.out",
    cinematic: "expo.out",
    smooth: "power2.out",
    wipe: "power2.inOut",
    ambient: "sine.inOut",
  },

  // Timing durations (seconds)
  duration: {
    instant: 0.15,
    fast: 0.35,
    normal: 0.6,
    reveal: 0.9,
    cinematic: 1.4,
    ambient: 5.0,
  },

  // Stagger intervals
  stagger: {
    fast: 0.04,
    normal: 0.08,
    relaxed: 0.12,
  },

  // Responsive Breakpoints (matching Tailwind)
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
  },

  // Parallax intensities (px displacement)
  parallax: {
    slow: 30,
    normal: 60,
    fast: 110,
    float: 16,
  },
} as const;

/**
 * Checks whether user has requested reduced motion.
 */
export function isReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
