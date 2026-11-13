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
  const [counts, setCounts] = useState([0, 0, 0, 0]);

  useEffect(() => {
    if (!containerRef.current || isReducedMotion()) return;

    let xPos = 0;
    const baseSpeed = 1.0;
    let currentSpeed = 1.0;
    let targetSpeed = 1.0;
    let lastScrollY = window.scrollY;
    let rafId: number;

    const onScroll = () => {
      const delta = Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;
      targetSpeed = 1.0 + Math.min(delta * 0.15, 6.0);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    const animateMarquee = () => {
      currentSpeed += (targetSpeed - currentSpeed) * 0.1;
      targetSpeed += (baseSpeed - targetSpeed) * 0.05;

      xPos -= currentSpeed;
      if (xPos <= -1200) {
        xPos = 0;
      }

      if (marqueeTrackRef.current) {
        marqueeTrackRef.current.style.transform = `translate3d(${xPos}px, 0, 0)`;
      }

      rafId = requestAnimationFrame(animateMarquee);
    };

    rafId = requestAnimationFrame(animateMarquee);

    // Counter animations on enter
    const statsTrigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top 80%",
      once: true,
      onEnter: () => {
        STATS.forEach((st, idx) => {
          const obj = { val: 0 };
          gsap.to(obj, {
            val: st.value,
            duration: 1.8,
            ease: "power2.out",
            onUpdate: () => {
              setCounts((prev) => {
                const next = [...prev];
                next[idx] = st.value < 10 && st.value > 0 ? parseFloat(obj.val.toFixed(1)) : Math.floor(obj.val);
                return next;
              });
            },
          });
        });
      },
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
      statsTrigger.kill();
    };
  }, []);

  const marqueeText = "DISCOVER ✦ NAVIGATE ✦ SAVE ✦ ARRIVE ✦ DISCOVER ✦ NAVIGATE ✦ SAVE ✦ ARRIVE ✦ ";

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-[#F7F3EC] text-[#111111] py-12 sm:py-16 overflow-hidden select-none"
      aria-label="Campus Statistics & Wayfinding Capabilities"
    >
      <HairlineDivider markerCount={2} className="mb-10 sm:mb-14" />

      {/* 1. INFINITE RUNNING MARQUEE OF GIANT WORDS */}
      <div className="relative w-full overflow-hidden py-4 border-y border-[#111111]/08">
        <div
          ref={marqueeTrackRef}
          className="flex items-center whitespace-nowrap will-change-transform text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tight text-[#111111]"
        >
          <span className="mr-8">{marqueeText}</span>
          <span
            className="mr-8 text-transparent"
            style={{ WebkitTextStroke: "1.5px #E8542F" }}
          >
            {marqueeText}
          </span>
          <span className="mr-8">{marqueeText}</span>
          <span
            className="mr-8 text-transparent"
            style={{ WebkitTextStroke: "1.5px #111111" }}
          >
            {marqueeText}
          </span>
        </div>
      </div>

      <HairlineDivider markerCount={1} className="my-10 sm:my-14" />

      {/* 2. 4 ANIMATED METRIC COUNTERS WITH MONO LABELS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
        {STATS.map((stat, idx) => (
          <div key={idx} className="flex flex-col space-y-1.5 border-l border-[#111111]/12 pl-4 sm:pl-6">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight text-[#111111]">
                {stat.value === 1.8 ? counts[idx].toFixed(1) : counts[idx].toLocaleString()}
              </span>
              {stat.suffix && (
                <span className="text-xl sm:text-2xl font-mono font-bold text-[#E8542F]">
                  {stat.suffix}
                </span>
              )}
            </div>
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#111111]">
              {stat.label}
            </span>
            <span className="text-[11px] text-[#5B5750] leading-snug">
              {stat.sub}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
