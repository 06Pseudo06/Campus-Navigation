"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isReducedMotion, GSAP_EASE_EXPO, MOTION_THEME } from "@/lib/motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface StatDef {
  value: number;
  suffix: string;
  label: string;
  sub: string;
}

const STATS_DATA: StatDef[] = [
  { value: 38, suffix: "+", label: "BLOCKS INDEXED", sub: "Academic, Hostel & Lab Zones" },
  { value: 27, suffix: "", label: "SURVEYED NODES", sub: "Ground-Truth Graph Network" },
  { value: 29, suffix: "", label: "PEDESTRIAN EDGES", sub: "Walkways & Concourse Paths" },
  { value: 100, suffix: "%", label: "ACCESSIBLE", sub: "Step-Free Ramp Planning" },
];

interface FeatureCardItem {
  id: string;
  num: string;
  title: string;
  description: string;
  href: string;
  ctaText: string;
  iconPath: string;
}

const FEATURES_DATA: FeatureCardItem[] = [
  {
    id: "discover",
    num: "01",
    title: "Discover",
    description: "Locate academic blocks 1 through 38, auditoriums, food courts, and campus facilities with smart search.",
    href: "/explore",
    ctaText: "EXPLORE DESTINATIONS",
    iconPath: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  },
  {
    id: "navigate",
    num: "02",
    title: "Navigate",
    description: "Get verified turn-by-turn walking directions with step-free accessibility across LPU's pedestrian network.",
    href: "/explore?tab=routes",
    ctaText: "CALCULATE ROUTES",
    iconPath: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  },
  {
    id: "save",
    num: "03",
    title: "Save",
    description: "Bookmark your frequent classrooms, lecture halls, and department offices to your personal atlas.",
    href: "/explore?tab=saved",
    ctaText: "MANAGE BOOKMARKS",
    iconPath: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z",
  },
];

export function InteractiveFeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const statsBoxRef = useRef<HTMLDivElement>(null);
  const topAccentLineRef = useRef<HTMLDivElement>(null);
  const dividersRef = useRef<(HTMLDivElement | null)[]>([]);
  const suffixesRef = useRef<(HTMLSpanElement | null)[]>([]);
  const labelsRef = useRef<(HTMLDivElement | null)[]>([]);
  const featureCardsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const iconPathsRef = useRef<(SVGPathElement | null)[]>([]);

  // Array of refs for each digit strip
  // statIdx -> array of digit refs
  const digitStripsRef = useRef<HTMLDivElement[][]>([[], [], [], []]);

  const [hasCounted, setHasCounted] = useState(false);

  // Mousemove handler for card spotlight effect (sets CSS variables --mx, --my)
  const handleCardMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--mx", `${x}px`);
    card.style.setProperty("--my", `${y}px`);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !sectionRef.current) return;

    if (isReducedMotion()) {
      // Instantly set final resting states for reduced motion
      if (topAccentLineRef.current) topAccentLineRef.current.style.transform = "scaleX(1)";
      dividersRef.current.forEach((d) => d && (d.style.opacity = "1"));
      suffixesRef.current.forEach((s) => s && (s.style.opacity = "1", s.style.transform = "scale(1)"));
      labelsRef.current.forEach((l) => l && (l.style.opacity = "1", l.style.transform = "none"));
      featureCardsRef.current.forEach((c) => c && (c.style.opacity = "1", c.style.transform = "none"));
      setHasCounted(true);
      return;
    }

    const ctx = gsap.context(() => {
      // 1. STATS STRIP: Trigger once at 35% in view
      ScrollTrigger.create({
        trigger: statsBoxRef.current,
        start: "top 65%", // 35% into the viewport
        once: true,
        onEnter: () => {
          // A. Draw 1px top-edge accent line from left to right (1s)
          if (topAccentLineRef.current) {
            gsap.fromTo(
              topAccentLineRef.current,
              { scaleX: 0 },
              { scaleX: 1, duration: 1.0, ease: GSAP_EASE_EXPO }
            );
          }

          // B. Faint vertical dividers fade in staggered
          const validDividers = dividersRef.current.filter(Boolean);
          if (validDividers.length > 0) {
            gsap.fromTo(
              validDividers,
              { opacity: 0, scaleY: 0.4 },
              { opacity: 1, scaleY: 1, duration: 0.8, stagger: 0.08, ease: "power2.out" }
            );
          }

          // C. Odometer rolling digits (1.4s, expo.out, stagger 0.08 per digit)
          STATS_DATA.forEach((stat, sIdx) => {
            const digits = String(stat.value).split("");
            digits.forEach((dChar, dIdx) => {
              const targetDigit = parseInt(dChar, 10);
              const strip = digitStripsRef.current[sIdx]?.[dIdx];
              if (strip) {
                // Height of each digit item is 100% / 10 = 10%
                gsap.fromTo(
                  strip,
                  { yPercent: 0 },
                  {
                    yPercent: -targetDigit * 10,
                    duration: 1.4,
                    ease: GSAP_EASE_EXPO,
                    delay: dIdx * 0.08 + sIdx * 0.05,
                  }
                );
              }
            });

            // D. Pop in suffix (+ or %) after number finishes (scale 0 -> 1, back.out)
            const suffixEl = suffixesRef.current[sIdx];
            if (suffixEl) {
              gsap.fromTo(
                suffixEl,
                { scale: 0, opacity: 0 },
                {
                  scale: 1,
                  opacity: 1,
                  duration: 0.5,
                  ease: "back.out(2)",
                  delay: 1.3 + sIdx * 0.05,
                }
              );
            }

            // E. Labels and descriptions fade up 0.15s after each number
            const labelEl = labelsRef.current[sIdx];
            if (labelEl) {
              gsap.fromTo(
                labelEl,
                { y: 12, opacity: 0 },
                {
                  y: 0,
                  opacity: 1,
                  duration: 0.6,
                  ease: "power2.out",
                  delay: 1.45 + sIdx * 0.05,
                }
              );
            }
          });
        },
      });

      // 2. FEATURE SECTION: Staggered fade-up & Icon stroke-dashoffset draw
      const cards = featureCardsRef.current.filter(Boolean);
      if (cards.length > 0) {
        ScrollTrigger.create({
          trigger: cards[0],
          start: "top 80%",
          once: true,
          onEnter: () => {
            // Cards entrance: staggered fade-up (y 40 -> 0, 0.8s, 0.12 stagger)
            gsap.fromTo(
              cards,
              { y: 40, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.12,
                ease: GSAP_EASE_EXPO,
              }
            );

            // Icon stroke-dashoffset draw on enter
            iconPathsRef.current.forEach((path, pIdx) => {
              if (path) {
                const len = path.getTotalLength() || 60;
                gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
                gsap.to(path, {
                  strokeDashoffset: 0,
                  duration: 1.0,
                  delay: 0.2 + pIdx * 0.12,
                  ease: "power2.out",
                });
              }
            });
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="section-02"
      ref={sectionRef}
      className="relative w-full bg-[#F7F3EC] dark:bg-[#070B14] text-[#0E1118] dark:text-[#F4F6FA] py-24 md:py-32 border-b border-[#0E1118]/15 dark:border-white/10 select-none overflow-hidden transition-colors duration-200"
      aria-label="Capabilities and Features"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* =================================================================== */}
        {/* 1. STATS STRIP                                                      */}
        {/* =================================================================== */}
        <div
          ref={statsBoxRef}
          className="relative w-full rounded-3xl border border-[#0E1118]/15 dark:border-white/10 bg-white/70 dark:bg-[#0D1322] shadow-sm overflow-hidden"
        >
          {/* 1px top-edge accent line that draws left to right on enter (1s) */}
          <div
            ref={topAccentLineRef}
            aria-hidden="true"
            className="absolute top-0 left-0 right-0 h-[1.5px] bg-[#E8452C] origin-left will-change-transform z-20"
            style={{ transform: "scaleX(0)" }}
          />

          {/* 4-Column Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 relative">
            {STATS_DATA.map((stat, sIdx) => {
              const digits = String(stat.value).split("");
              const isNotLast = sIdx < STATS_DATA.length - 1;

              return (
                <div
                  key={sIdx}
                  className="group/stat relative p-6 sm:p-8 lg:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-transform duration-300 hover:-translate-y-1 select-none"
                >
                  {/* Soft radial accent glow behind each number that brightens on hover */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(232,69,44,0.12),transparent_70%)] opacity-40 group-hover/stat:opacity-100 group-hover/stat:scale-110 transition-all duration-500 pointer-events-none -z-0"
                  />

                  {/* Faint vertical divider for desktop columns */}
                  {isNotLast && (
                    <div
                      ref={(el) => {
                        dividersRef.current[sIdx] = el;
                      }}
                      aria-hidden="true"
                      className="hidden lg:block absolute right-0 top-6 bottom-6 w-[1px] bg-[#0E1118]/10 dark:bg-white/10 opacity-0 will-change-transform"
                    />
                  )}

                  {/* Number row: Odometer rolling digits + suffix */}
                  <div className="relative z-10 flex items-baseline justify-center gap-1 mb-2 font-mono tabular-nums leading-none">
                    {/* Digits Container */}
                    <div className="flex items-center overflow-hidden h-[clamp(2.5rem,4.2vw,3.8rem)] text-[#0E1118] dark:text-[#F4F6FA] font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight">
                      {digits.map((digitChar, dIdx) => (
                        <div
                          key={dIdx}
                          className="relative inline-block h-full w-[0.62em] overflow-hidden tabular-nums leading-none"
                        >
                          <div
                            ref={(el) => {
                              if (!digitStripsRef.current[sIdx]) digitStripsRef.current[sIdx] = [];
                              if (el) digitStripsRef.current[sIdx][dIdx] = el;
                            }}
                            className="flex flex-col will-change-transform font-mono font-black text-center"
                          >
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => (
                              <span
                                key={val}
                                className="h-[clamp(2.5rem,4.2vw,3.8rem)] flex items-center justify-center tabular-nums"
                              >
                                {val}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Suffix (+ or %) */}
                    {stat.suffix && (
                      <span
                        ref={(el) => {
                          suffixesRef.current[sIdx] = el;
                        }}
                        className="text-xl sm:text-2xl lg:text-3xl font-black text-[#E8452C] opacity-0 will-change-transform origin-bottom-left"
                      >
                        {stat.suffix}
                      </span>
                    )}
                  </div>

                  {/* Label and Subhead */}
                  <div
                    ref={(el) => {
                      labelsRef.current[sIdx] = el;
                    }}
                    className="relative z-10 space-y-1 opacity-0 will-change-transform"
                  >
                    <span className="block font-mono text-[11px] sm:text-xs font-bold tracking-wider uppercase text-[#0E1118] dark:text-zinc-200 group-hover/stat:text-[#E8452C] transition-colors duration-200">
                      {stat.label}
                    </span>
                    <span className="block text-[11px] text-[#5B5750] dark:text-zinc-400 leading-snug max-w-[190px]">
                      {stat.sub}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. SECTION 02 HEADER (Disciplined Spacing & Left-Aligned Grid Edge) */}
        {/* =================================================================== */}
        <div className="mt-20 sm:mt-24 mb-10 sm:mb-14">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 text-xs font-mono font-bold tracking-widest uppercase text-[#0E1118] dark:text-zinc-200 mb-3">
            <span className="text-[#E8452C]">02 /</span>
            <span>WHAT YOU CAN DO</span>
            <span className="h-[1px] w-12 bg-[#E8452C]/40 ml-1" />
          </div>

          {/* Large Section Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-[#0E1118] dark:text-[#F4F6FA] mb-3">
            PRECISION WAYFINDING FOR A 600-ACRE CAMPUS.
          </h2>

          {/* One-Line Subhead */}
          <p className="text-sm sm:text-base text-[#5B5750] dark:text-zinc-400 font-normal leading-relaxed max-w-2xl">
            Discover destinations, compute step-free accessible routes, and persist frequent halls to your personal atlas.
          </p>
        </div>

        {/* =================================================================== */}
        {/* 3. 3-FEATURE EDITORIAL CARDS (Spotlight Hover & Stroke-Dashoffset)  */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {FEATURES_DATA.map((feature, idx) => (
            <Link
              key={feature.id}
              href={feature.href}
              ref={(el) => {
                featureCardsRef.current[idx] = el;
              }}
              onMouseMove={handleCardMouseMove}
              data-cursor="EXPLORE"
              className="group relative p-8 rounded-3xl border border-[#0E1118]/15 dark:border-white/10 bg-white/80 dark:bg-[#0D1322] flex flex-col justify-between overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8452C]"
            >
              {/* Cursor Spotlight Gradient (Accent at 12% opacity, 300px circle) */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
                style={{
                  background:
                    "radial-gradient(300px circle at var(--mx, 50%) var(--my, 50%), rgba(232, 69, 44, 0.12), transparent 80%)",
                }}
              />

              {/* Upper Content */}
              <div className="relative z-10 space-y-6">
                {/* Icon Tile with Subtle Accent Gradient Border */}
                <div className="w-14 h-14 rounded-2xl p-[1px] bg-gradient-to-br from-[#E8452C]/40 via-[#E8452C]/15 to-transparent transition-transform duration-300 group-hover:scale-105">
                  <div className="w-full h-full bg-[#F7F3EC] dark:bg-[#070B14] rounded-2xl flex items-center justify-center">
                    <svg
                      className="w-7 h-7 text-[#E8452C]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.75}
                    >
                      <path
                        ref={(el) => {
                          iconPathsRef.current[idx] = el;
                        }}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={feature.iconPath}
                      />
                    </svg>
                  </div>
                </div>

                {/* Index Numeral & Title */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#5B5750] dark:text-zinc-500 uppercase tracking-wider group-hover:text-[#E8452C] transition-colors duration-200">
                      {feature.num}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#0E1118] dark:text-[#F4F6FA] group-hover:text-[#E8452C] transition-colors duration-200">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#5B5750] dark:text-zinc-300 font-normal leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>

              {/* Bottom "→ Try it" Text Link that Underlines from the Left on Hover */}
              <div className="relative z-10 pt-8 mt-auto flex items-center justify-between border-t border-[#0E1118]/10 dark:border-white/10">
                <span className="relative inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-[#0E1118] dark:text-[#F4F6FA] group-hover:text-[#E8452C] transition-colors duration-200">
                  <span>&rarr; Try it</span>
                  {/* Underline expanding from left on hover */}
                  <span
                    aria-hidden="true"
                    className="absolute bottom-[-3px] left-0 w-0 h-[1.5px] bg-[#E8452C] group-hover:w-full transition-all duration-300 ease-out"
                  />
                </span>

                {/* Arrow Glyph */}
                <span className="text-base font-mono text-[#5B5750] dark:text-zinc-500 group-hover:text-[#E8452C] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300">
                  ↗
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
