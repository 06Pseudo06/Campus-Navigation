"use client";

import React, { useEffect, useRef, useState } from "react";
import { HairlineDivider } from "@/components/motion/HairlineDivider";
import { isReducedMotion, getLenis } from "@/lib/motion";
import { gsap } from "gsap";

export function MarqueeSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !trackRef.current) return;

    if (isReducedMotion()) {
      return;
    }

    const track = trackRef.current;
    let currentX = 0;
    const baseSpeed = 1.2; // default forward movement speed
    let targetSpeed = 1.2;
    let currentSpeed = 1.2;
    let lastScrollY = window.scrollY;
    let lastTime = performance.now();
    let isPaused = false;

    // Track total single repetition width for seamless modular wrap
    let wrapWidth = track.scrollWidth / 2 || 2000;

    const updateWrapWidth = () => {
      if (track) {
        wrapWidth = track.scrollWidth / 2 || 2000;
      }
    };
    updateWrapWidth();
    window.addEventListener("resize", updateWrapWidth, { passive: true });

    // Scroll listener to compute scroll velocity and flip direction
    const onScroll = () => {
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;
      lastTime = now;

      // Calculate instantaneous scroll velocity
      const velocity = (delta / dt) * 60; // normalized to ~60fps frame delta

      if (Math.abs(velocity) > 0.5) {
        // Direction flips with scroll direction (down = positive, up = negative)
        const direction = velocity > 0 ? 1 : -1;
        const boost = Math.min(Math.abs(velocity) * 0.75, 12);
        targetSpeed = direction * (baseSpeed + boost);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    // Also sync with Lenis scroll velocity if available
    const lenis = getLenis();
    const lenisUnsub = lenis
      ? lenis.on("scroll", (e) => {
          if (Math.abs(e.velocity) > 0.2) {
            const direction = e.velocity > 0 ? 1 : -1;
            const boost = Math.min(Math.abs(e.velocity) * 0.8, 12);
            targetSpeed = direction * (baseSpeed + boost);
          }
        })
      : null;

    // Smooth ticker loop
    const tickerCallback = () => {
      if (isPaused) {
        // Decelerate to 0 when hovered
        currentSpeed += (0 - currentSpeed) * 0.15;
      } else {
        // Interpolate toward targetSpeed
        currentSpeed += (targetSpeed - currentSpeed) * 0.08;
        // Gradually decay targetSpeed back toward baseSpeed (preserving direction)
        const sign = targetSpeed >= 0 ? 1 : -1;
        targetSpeed += (sign * baseSpeed - targetSpeed) * 0.03;
      }

      currentX -= currentSpeed;

      // Wrap around seamlessly
      if (currentX <= -wrapWidth) {
        currentX += wrapWidth;
      } else if (currentX >= 0) {
        currentX -= wrapWidth;
      }

      if (track) {
        track.style.transform = `translate3d(${currentX}px, 0, 0)`;
      }
    };

    gsap.ticker.add(tickerCallback);

    // Hover event handlers on track container
    const onMouseEnter = () => {
      isPaused = true;
      setIsHovered(true);
    };

    const onMouseLeave = () => {
      isPaused = false;
      setIsHovered(false);
    };

    const containerEl = containerRef.current;
    if (containerEl) {
      containerEl.addEventListener("mouseenter", onMouseEnter);
      containerEl.addEventListener("mouseleave", onMouseLeave);
    }

    return () => {
      window.removeEventListener("resize", updateWrapWidth);
      window.removeEventListener("scroll", onScroll);
      if (lenis && lenisUnsub) {
        // unbind lenis
      }
      gsap.ticker.remove(tickerCallback);
      if (containerEl) {
        containerEl.removeEventListener("mouseenter", onMouseEnter);
        containerEl.removeEventListener("mouseleave", onMouseLeave);
      }
    };
  }, []);

  const marqueeText = "DISCOVER ✦ NAVIGATE ✦ SAVE ✦ ARRIVE ✦ WAYFINDING ✦ CAMPUS ✦ ";

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-[#F7F3EC] dark:bg-[#070B14] text-[#0E1118] dark:text-[#F4F6FA] py-6 sm:py-8 overflow-hidden select-none transition-colors duration-200"
      aria-label="Campus Wayfinding Running Marquee"
    >
      <HairlineDivider markerCount={2} className="mb-4 sm:mb-6" />

      {/* INFINITE RUNNING MARQUEE WITH EDGE FADE MASKS & HOVER PAUSE */}
      <div
        data-cursor="PAUSE"
        className="relative w-full overflow-hidden py-3 sm:py-4 cursor-pointer"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        }}
      >
        <div
          ref={trackRef}
          className="flex items-center whitespace-nowrap will-change-transform font-black uppercase tracking-tight text-[#0E1118] dark:text-[#F4F6FA]"
          style={{ fontSize: "clamp(1.75rem, 3.4vw, 3.25rem)", lineHeight: 1 }}
        >
          {/* Repeated segments to ensure infinite seamless scrolling */}
          <span className="mr-6 shrink-0">{marqueeText}</span>
          <span
            className="mr-6 shrink-0 text-transparent"
            style={{ WebkitTextStroke: "1.2px #E8452C" }}
          >
            {marqueeText}
          </span>
          <span className="mr-6 shrink-0">{marqueeText}</span>
          <span
            className="mr-6 shrink-0 text-transparent"
            style={{ WebkitTextStroke: "1.2px currentColor" }}
          >
            {marqueeText}
          </span>
          <span className="mr-6 shrink-0">{marqueeText}</span>
          <span
            className="mr-6 shrink-0 text-transparent"
            style={{ WebkitTextStroke: "1.2px #E8452C" }}
          >
            {marqueeText}
          </span>
          {/* Duplicate set for wrap continuity */}
          <span className="mr-6 shrink-0">{marqueeText}</span>
          <span
            className="mr-6 shrink-0 text-transparent"
            style={{ WebkitTextStroke: "1.2px #E8452C" }}
          >
            {marqueeText}
          </span>
          <span className="mr-6 shrink-0">{marqueeText}</span>
          <span
            className="mr-6 shrink-0 text-transparent"
            style={{ WebkitTextStroke: "1.2px currentColor" }}
          >
            {marqueeText}
          </span>
        </div>
      </div>

      <HairlineDivider markerCount={1} className="mt-4 sm:mt-6" />
    </section>
  );
}
