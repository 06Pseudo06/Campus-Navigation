"use client";

import React, { useEffect, useRef, useState } from "react";
import { isReducedMotion } from "@/lib/motion";

type CursorMode = "default" | "button" | "disabled" | "map" | "map-dragging" | "hidden";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<CursorMode>("default");
  const [isVisible, setIsVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch || isReducedMotion()) return;

    const enableRaf = requestAnimationFrame(() => {
      setEnabled(true);
    });

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      setIsVisible(true);

      const el = e.target instanceof Element ? e.target : (e.target as Node)?.parentElement;
      if (!el || !el.closest) {
        setMode("default");
        return;
      }

      // 1. Text input / selectable editable elements -> Hide cursor completely
      if (el.closest("input, textarea, select, [contenteditable='true']")) {
        setMode("hidden");
        return;
      }

      // 2. Interactive control resolution (Innermost first)
      const ctrl = el.closest(
        "button, a, summary, [role='button'], [data-cursor='ui'], [data-cursor='button'], [data-cursor='node']"
      );
      if (ctrl) {
        const isDisabled =
          (ctrl as HTMLElement).hasAttribute("disabled") ||
          ctrl.getAttribute("aria-disabled") === "true" ||
          ctrl.classList.contains("disabled") ||
          ctrl.classList.contains("cursor-not-allowed");
        setMode(isDisabled ? "disabled" : "button");
        return;
      }

      // 3. Map surface resolution
      const map = el.closest("[data-cursor='map']");
      if (map) {
        const isDragging = map.getAttribute("data-dragging") === "true";
        setMode(isDragging ? "map-dragging" : "map");
        return;
      }

      // 4. Default fallback
      setMode("default");
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    const onMouseEnter = () => {
      setIsVisible(true);
    };

    const render = () => {
      // Lerp ring position smoothly
      ringX += (mouseX - ringX) * 0.22;
      ringY += (mouseY - ringY) * 0.22;

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
    document.addEventListener("mouseenter", onMouseEnter);
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(enableRaf);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!enabled) return null;

  const isHidden = mode === "hidden" || !isVisible;

  return (
    <div
      id="custom-cursor"
      data-cursor-mode={mode}
      className={`fixed inset-0 pointer-events-none z-[9999] transition-opacity duration-150 ${
        isHidden ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      {/* Central Dot */}
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 rounded-full transition-[width,height,background-color,opacity] duration-150 pointer-events-none ${
          mode === "button"
            ? "w-2.5 h-2.5 bg-[#E8542F] opacity-100 shadow-sm"
            : mode === "disabled"
            ? "w-2.5 h-2.5 bg-[#9AA3B2] opacity-80"
            : mode === "map" || mode === "map-dragging"
            ? "w-1 h-1 bg-[#E8542F] opacity-0"
            : "w-1 h-1 bg-[#E8542F] opacity-100"
        }`}
      />

      {/* Outer Ring / State Element */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 rounded-full flex items-center justify-center transition-[width,height,border-color,background-color,opacity] duration-150 pointer-events-none ${
          mode === "button" || mode === "disabled"
            ? "w-0 h-0 border-none bg-transparent opacity-0"
            : mode === "map"
            ? "w-9 h-9 border-[1.5px] border-[#E8542F] bg-[#E8542F]/10 opacity-100 shadow-xs"
            : mode === "map-dragging"
            ? "w-7 h-7 border-[1.5px] border-[#E8542F] bg-[#E8542F]/20 opacity-100 shadow-xs scale-90"
            : "w-[22px] h-[22px] border-[1.5px] border-[#111111]/35 dark:border-white/40 bg-transparent opacity-100"
        }`}
      >
        {mode === "map" && (
          <span className="text-[8px] font-mono font-bold tracking-widest text-[#E8542F] uppercase select-none">
            DRAG
          </span>
        )}
      </div>
    </div>
  );
}
