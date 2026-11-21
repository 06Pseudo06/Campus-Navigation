"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { isReducedMotion } from "@/lib/motion";

/**
 * AtlasCursor
 * 
 * Replaces the tiny cursor with a 72px glassy circular cursor displaying "VIEW".
 * Features spring physics (stiffness: 150, damping: 15), scales in on card hover,
 * and is hidden on touch devices or under reduced-motion preference.
 * Portaled to document.body to prevent any ancestor transform distortion.
 */
export function AtlasCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Raw mouse coordinates
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth spring physics for cursor following (stiffness: 150, damping: 15 as specified)
  const springX = useSpring(mouseX, { stiffness: 150, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 15 });

  // Spring scale for entry/exit (stiffness: 220, damping: 20)
  const scale = useMotionValue(0);
  const springScale = useSpring(scale, { stiffness: 220, damping: 20 });

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Hide completely on touch devices or when user prefers reduced motion
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch || isReducedMotion()) return;

    setMounted(true);

    const onMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const target = e.target as HTMLElement | null;
      const atlasCard = target?.closest("[data-atlas-card='true']");

      if (atlasCard) {
        setIsVisible(true);
        setIsHovered(true);
        scale.set(1);
      } else {
        setIsHovered(false);
        scale.set(0);
      }
    };

    const onMouseLeave = () => {
      setIsVisible(false);
      setIsHovered(false);
      scale.set(0);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [mouseX, mouseY, scale]);

  if (!mounted) return null;

  return createPortal(
    <motion.div
      id="atlas-custom-cursor"
      aria-hidden="true"
      style={{
        x: springX,
        y: springY,
        scale: springScale,
      }}
      className={`fixed top-0 left-0 -ml-[36px] -mt-[36px] w-[72px] h-[72px] rounded-full pointer-events-none z-[9999] hidden md:flex items-center justify-center backdrop-blur-md bg-white/10 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${
        isVisible && isHovered ? "opacity-100" : "opacity-0"
      } transition-opacity duration-150 will-change-transform`}
    >
      <span className="font-mono text-[11px] font-bold tracking-[0.12em] text-[#F4F6FA] uppercase select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        VIEW
      </span>
    </motion.div>,
    document.body
  );
}

// Export as CustomCursor alias if needed for modularity
export { AtlasCursor as CustomCursor };
