"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isReducedMotion } from "@/lib/motion";
import { HairlineDivider } from "@/components/motion/HairlineDivider";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STATS = [
  { value: 48, suffix: "", label: "BUILDINGS INDEXED", sub: "Carleton Campus Footprint" },
  { value: 1957, suffix: "", label: "GRAPH VERTICES", sub: "Pedestrian Concourse Network" },
  { value: 1.8, suffix: "ms", label: "SOLVER LATENCY", sub: "Dijkstra & A* Sub-2ms Solver" },
  { value: 0, suffix: "", label: "LOGINS REQUIRED", sub: "Instant Zero-Friction Storage" },
];

export function MarqueeSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const marqueeTrackRef = useRef<HTMLDivElement>(null);
  const statsGridRef = useRef<HTMLDivElement>(null);
  const [counts, setCounts] = useState([0, 0, 0, 0]);

  useEffect(() => {
    if (!containerRef.current || isReducedMotion()) return;

    // 1. Marquee velocity & animation: slower base speed by ~25%
    let xPos = 0;
    const baseSpeed = 0.75;
    let currentSpeed = 0.75;
    let targetSpeed = 0.75;
    let lastScrollY = window.scrollY;
    let rafId: number;

    const onScroll = () => {
      const delta = Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;
      // Cap boost to 3.0 max
      targetSpeed = 0.75 + Math.min(delta * 0.08, 3.0);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    const animateMarquee = () => {
      currentSpeed += (targetSpeed - currentSpeed) * 0.08;
      targetSpeed += (baseSpeed - targetSpeed) * 0.04;

      xPos -= currentSpeed;
      if (xPos <= -1400) {
        xPos = 0;
      }

      if (marqueeTrackRef.current) {
        marqueeTrackRef.current.style.transform = `translate3d(${xPos}px, 0, 0)`;
      }

      rafId = requestAnimationFrame(animateMarquee);
    };

    rafId = requestAnimationFrame(animateMarquee);

    // 2. Count-up animation triggered on scroll into view (start: "top 85%")
    // Replays on onEnter + onEnterBack; resets to 0 on onLeave + onLeaveBack
    let animTimelines: gsap.core.Tween[] = [];

    const playCountUp = () => {
      animTimelines.forEach((t) => t.kill());
      animTimelines = [];

      STATS.forEach((st, idx) => {
        const obj = { val: 0 };
        const tween = gsap.to(obj, {
          val: st.value,
          duration: 1.6,
          delay: idx * 0.12,
          ease: "power2.out",
          onUpdate: () => {
            setCounts((prev) => {
              const next = [...prev];
              next[idx] = st.value === 1.8 ? parseFloat(obj.val.toFixed(1)) : Math.floor(obj.val);
              return next;
            });
          },
        });
        animTimelines.push(tween);
      });
    };

    const resetCountUp = () => {
      animTimelines.forEach((t) => t.kill());
      animTimelines = [];
      setCounts([0, 0, 0, 0]);
    };

    const statsTrigger = ScrollTrigger.create({
      trigger: statsGridRef.current || containerRef.current,
      start: "top 85%",
      end: "bottom 15%",
      invalidateOnRefresh: true,
      onEnter: playCountUp,
      onEnterBack: playCountUp,
      onLeave: resetCountUp,
      onLeaveBack: resetCountUp,
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
      animTimelines.forEach((t) => t.kill());
      statsTrigger.kill();
    };
  }, []);

  const marqueeText = "DISCOVER ✦ NAVIGATE ✦ SAVE ✦ ARRIVE ✦ WAYFINDING ✦ CAMPUS ✦ ";

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-[#F7F3EC] text-[#111111] py-8 sm:py-12 overflow-hidden select-none"
      aria-label="Campus Statistics & Wayfinding Capabilities"
    >
      <HairlineDivider markerCount={2} className="mb-6 sm:mb-8" />

      {/* 1. INFINITE RUNNING MARQUEE (Refined size: clamp(1.75rem, 3.4vw, 3.25rem), padding clamp(14px, 2vw, 28px)) */}
      <div className="relative w-full overflow-hidden py-[clamp(14px,2vw,28px)] border-y border-[#111111]/08">
        <div
          ref={marqueeTrackRef}
          className="flex items-center whitespace-nowrap will-change-transform font-black uppercase tracking-tight text-[#111111]"
          style={{ fontSize: "clamp(1.75rem, 3.4vw, 3.25rem)", lineHeight: 1 }}
        >
          <span className="mr-6">{marqueeText}</span>
          <span
            className="mr-6 text-transparent"
            style={{ WebkitTextStroke: "1.2px #E8542F" }}
          >
            {marqueeText}
          </span>
          <span className="mr-6">{marqueeText}</span>
          <span
            className="mr-6 text-transparent"
            style={{ WebkitTextStroke: "1.2px #111111" }}
          >
            {marqueeText}
          </span>
          <span className="mr-6">{marqueeText}</span>
        </div>
      </div>

      <HairlineDivider markerCount={1} className="my-6 sm:my-8" />

      {/* 2. CENTERED 4-COLUMN STATS GRID (Equal widths, centered text, tabular-nums) */}
      <div
        ref={statsGridRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 section-gutter"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#111111]/12 border-y md:border border-[#111111]/12 bg-[#F7F3EC]">
          {STATS.map((stat, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center text-center p-6 sm:p-8 space-y-2"
            >
              <div className="flex items-baseline justify-center gap-1 min-w-[120px]">
                <span
                  className="font-mono font-black tracking-tight text-[#111111] tabular-nums"
                  style={{
                    fontSize: "clamp(2rem, 3.8vw, 3.6rem)",
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {stat.value === 1.8
                    ? counts[idx].toFixed(1)
                    : counts[idx].toLocaleString()}
                </span>
                {stat.suffix && (
                  <span className="text-lg sm:text-xl font-mono font-bold text-[#E8542F]">
                    {stat.suffix}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#111111] block">
                {stat.label}
              </span>
              <span className="text-[11px] text-[#5B5750] leading-snug block max-w-[180px]">
                {stat.sub}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
