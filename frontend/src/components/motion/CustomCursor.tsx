"use client";

import React, { useEffect, useRef, useState } from "react";
import { isReducedMotion } from "@/lib/motion";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch || isReducedMotion()) return;

    setEnabled(true);

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      setIsVisible(true);

      // Check for custom cursor label safely across all target types
      const el = e.target instanceof Element ? e.target : (e.target as Node)?.parentElement;
      const target = el?.closest ? el.closest("[data-cursor]") : null;
      if (target) {
        const customLabel = target.getAttribute("data-cursor");
        setLabel(customLabel || null);
        setIsHovered(true);
      } else {
        const isClickable = el?.closest ? el.closest("a, button, input, [role='button']") : null;
        setIsHovered(!!isClickable);
        setLabel(null);
      }
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    const render = () => {
      // Lerp ring position
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }

      rafId = requestAnimationFrame(render);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[1000] transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    >
      {/* Central Orange Dot */}
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 rounded-full bg-[#E8542F] transition-[width,height] duration-200 pointer-events-none ${
          isHovered ? "w-1.5 h-1.5 opacity-40" : "w-2 h-2 opacity-100"
        }`}
      />

      {/* Trailing Ring with Optional Label */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 rounded-full flex items-center justify-center transition-[width,height,background-color,border-color] duration-200 pointer-events-none ${
          label
            ? "w-16 h-16 bg-[#E8542F] text-white border-none shadow-lg shadow-[#E8542F]/30"
            : isHovered
            ? "w-10 h-10 border border-[#E8542F] bg-[#E8542F]/10"
            : "w-7 h-7 border border-[#111111]/30 dark:border-white/40 bg-transparent"
        }`}
      >
        {label && (
          <span className="text-[9px] font-mono font-bold tracking-widest uppercase select-none">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
