"use client";

import React, { useEffect, useRef, useState } from "react";
import { isReducedMotion } from "@/lib/motion";

type CursorMode =
  | "default"
  | "button"
  | "label"
  | "map"
  | "map-dragging"
  | "disabled"
  | "hidden";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<CursorMode>("default");
  const [label, setLabel] = useState<string>("");
  const [isVisible, setIsVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Disable completely on touch / coarse pointer devices or reduced-motion preference
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
        setLabel("");
        return;
      }

      // 1. Text input / selectable editable elements -> Hide cursor completely so native I-beam is visible
      if (el.closest("input, textarea, select, [contenteditable='true']")) {
        setMode("hidden");
        setLabel("");
        return;
      }

      // 2. Custom label elements (data-cursor="EXPLORE" / "PLAY" / "EXPAND" / "PAUSE" / "STEP")
      const customCursorEl = el.closest("[data-cursor]");
      const customAttr = customCursorEl ? customCursorEl.getAttribute("data-cursor") : null;

      // 3. Map surface resolution
      if (customAttr === "map" || el.closest("[data-cursor='map']")) {
        const mapEl = customCursorEl || el.closest("[data-cursor='map']");
        const isDragging = mapEl?.getAttribute("data-dragging") === "true";
        setMode(isDragging ? "map-dragging" : "map");
        setLabel("DRAG");
        return;
      }

      // 4. Custom label with string value (not just 'ui', 'button', 'node')
      if (
        customAttr &&
        customAttr !== "ui" &&
        customAttr !== "button" &&
        customAttr !== "node" &&
        customAttr.trim().length > 0
      ) {
        setMode("label");
        setLabel(customAttr.trim());
        return;
      }

      // 5. Interactive controls (buttons, links, summary, role='button')
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
        setLabel("");
        return;
      }

      // 6. Default fallback
      setMode("default");
      setLabel("");
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    const onMouseEnter = () => {
      setIsVisible(true);
    };

    const onMouseDown = () => {
      const el = document.elementFromPoint(mouseX, mouseY);
      if (el?.closest("[data-cursor='map']")) {
        setMode("map-dragging");
      }
    };

    const onMouseUp = () => {
      const el = document.elementFromPoint(mouseX, mouseY);
      if (el?.closest("[data-cursor='map']")) {
        setMode("map");
      }
    };

    const render = () => {
      // Lerp ring position smoothly toward mouse
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
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(enableRaf);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
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
      {/* Central Terracotta Dot */}
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 rounded-full transition-[width,height,background-color,opacity,transform] duration-150 pointer-events-none ${
          mode === "button"
            ? "w-3 h-3 bg-[#DE4B31] opacity-100 shadow-sm"
            : mode === "disabled"
            ? "w-2.5 h-2.5 bg-[#9AA3B2] opacity-80"
            : mode === "label" || mode === "map" || mode === "map-dragging"
            ? "w-1 h-1 bg-[#DE4B31] opacity-0"
            : "w-1.5 h-1.5 bg-[#DE4B31] opacity-100"
        }`}
      />

      {/* Outer Lerping Ring / State Badge */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 rounded-full flex items-center justify-center transition-[width,height,border-color,background-color,opacity,transform] duration-150 pointer-events-none ${
          mode === "button" || mode === "disabled"
            ? "w-0 h-0 border-none bg-transparent opacity-0"
            : mode === "label"
            ? "w-14 h-14 border-[1.5px] border-[#DE4B31] bg-[#DE4B31]/15 backdrop-blur-[1px] opacity-100 shadow-sm"
            : mode === "map"
            ? "w-10 h-10 border-[1.5px] border-[#DE4B31] bg-[#DE4B31]/10 opacity-100 shadow-xs"
            : mode === "map-dragging"
            ? "w-8 h-8 border-[1.5px] border-[#DE4B31] bg-[#DE4B31]/25 opacity-100 shadow-xs scale-90"
            : "w-[24px] h-[24px] border-[1.5px] border-[#0E1118]/30 dark:border-white/40 bg-transparent opacity-100"
        }`}
      >
        {(mode === "label" || mode === "map" || mode === "map-dragging") && (
          <span className="text-[8px] font-mono font-bold tracking-widest text-[#DE4B31] dark:text-[#F87157] uppercase select-none text-center px-1">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
