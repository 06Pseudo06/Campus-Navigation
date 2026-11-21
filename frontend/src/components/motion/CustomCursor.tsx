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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelSpanRef = useRef<HTMLSpanElement>(null);

  const [mode, setMode] = useState<CursorMode>("default");
  const [label, setLabel] = useState<string>("");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Disable completely on touch / coarse pointer devices or reduced-motion preference
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch || isReducedMotion()) return;

    setEnabled(true);

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let rafId: number;

    let currentMode: CursorMode = "default";
    let currentLabel = "";
    let isVisible = false;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // 1. Hardware-immediate dot positioning (0ms input latency)
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      }

      if (!isVisible && wrapperRef.current) {
        isVisible = true;
        wrapperRef.current.style.opacity = "1";
      }

      const el = e.target instanceof Element ? e.target : (e.target as Node)?.parentElement;
      if (!el || !el.closest) {
        updateCursorState("default", "");
        return;
      }

      // 2. Text input / selectable editable elements / Atlas cards with dedicated cursor -> Hide cursor completely
      if (el.closest("input, textarea, select, [contenteditable='true'], [data-atlas-card], [data-cursor='none']")) {
        updateCursorState("hidden", "");
        return;
      }

      // 3. Map surface resolution
      const customCursorEl = el.closest("[data-cursor]");
      const customAttr = customCursorEl ? customCursorEl.getAttribute("data-cursor") : null;

      if (customAttr === "map" || el.closest("[data-cursor='map']")) {
        const mapEl = customCursorEl || el.closest("[data-cursor='map']");
        const isDragging = mapEl?.getAttribute("data-dragging") === "true";
        updateCursorState(isDragging ? "map-dragging" : "map", "DRAG");
        return;
      }

      // 4. Custom label with string value (not 'ui', 'button', 'node')
      if (
        customAttr &&
        customAttr !== "ui" &&
        customAttr !== "button" &&
        customAttr !== "node" &&
        customAttr.trim().length > 0
      ) {
        updateCursorState("label", customAttr.trim());
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
        updateCursorState(isDisabled ? "disabled" : "button", "");
        return;
      }

      // 6. Default fallback
      updateCursorState("default", "");
    };

    function updateCursorState(newMode: CursorMode, newLabel: string) {
      if (newMode === currentMode && newLabel === currentLabel) return;
      currentMode = newMode;
      currentLabel = newLabel;

      if (wrapperRef.current) {
        wrapperRef.current.setAttribute("data-cursor-mode", newMode);
        if (newMode === "hidden") {
          wrapperRef.current.style.opacity = "0";
        } else if (isVisible) {
          wrapperRef.current.style.opacity = "1";
        }
      }

      if (labelSpanRef.current) {
        labelSpanRef.current.textContent = newLabel;
      }

      // Trigger React state only on actual mode/label change, never on every mouse move
      setMode(newMode);
      setLabel(newLabel);
    }

    const onMouseLeave = () => {
      isVisible = false;
      if (wrapperRef.current) wrapperRef.current.style.opacity = "0";
    };

    const onMouseEnter = () => {
      isVisible = true;
      if (wrapperRef.current && currentMode !== "hidden") {
        wrapperRef.current.style.opacity = "1";
      }
    };

    const onMouseDown = () => {
      const el = document.elementFromPoint(mouseX, mouseY);
      if (el?.closest("[data-cursor='map']")) {
        updateCursorState("map-dragging", "DRAG");
      }
    };

    const onMouseUp = () => {
      const el = document.elementFromPoint(mouseX, mouseY);
      if (el?.closest("[data-cursor='map']")) {
        updateCursorState("map", "DRAG");
      }
    };

    const render = () => {
      // Responsive, fluid ring lerp factor (0.40 ensures instant, agile trailing with zero drag feeling)
      ringX += (mouseX - ringX) * 0.40;
      ringY += (mouseY - ringY) * 0.40;

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
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      ref={wrapperRef}
      id="custom-cursor"
      data-cursor-mode={mode}
      className="fixed inset-0 pointer-events-none z-[9999] opacity-0 transition-opacity duration-150 will-change-transform"
      aria-hidden="true"
    >
      {/* Central Terracotta Dot */}
      <div
        ref={dotRef}
        style={{ transform: "translate3d(-9999px, -9999px, 0)" }}
        className={`fixed top-0 left-0 rounded-full transition-[width,height,background-color,opacity] duration-150 pointer-events-none will-change-transform ${
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
        style={{ transform: "translate3d(-9999px, -9999px, 0)" }}
        className={`fixed top-0 left-0 rounded-full flex items-center justify-center transition-[width,height,border-color,background-color,opacity] duration-150 pointer-events-none will-change-transform ${
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
        <span
          ref={labelSpanRef}
          className={`text-[8px] font-mono font-bold tracking-widest text-[#DE4B31] dark:text-[#F87157] uppercase select-none text-center px-1 ${
            mode === "label" || mode === "map" || mode === "map-dragging" ? "block" : "hidden"
          }`}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
