"use client";

import React, { useEffect, useState } from "react";
import { isReducedMotion } from "@/lib/motion";

export function PageIntro() {
  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState(0);
  const [animatingOut, setAnimatingOut] = useState(false);

  useEffect(() => {
    if (isReducedMotion() || sessionStorage.getItem("campusway_intro_played")) {
      return;
    }
    setVisible(true);

    // Counter animation 00 -> 100 over ~1.1s
    const startTime = performance.now();
    const duration = 1100;

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      setCount(Math.floor(progress * 100));

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        // Trigger wipe-up transition
        setTimeout(() => {
          setAnimatingOut(true);
          sessionStorage.setItem("campusway_intro_played", "1");
          setTimeout(() => {
            setVisible(false);
          }, 800);
        }, 150);
      }
    };

    const rafId = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(rafId);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#F7F3EC] flex flex-col items-center justify-center select-none transition-transform duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] ${
        animatingOut ? "-translate-y-full" : "translate-y-0"
      }`}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-6">
        {/* Animated Architectural Arch Logo */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
            {/* Outer Arch */}
            <path
              d="M12 56 V32 C12 20.954 20.954 12 32 12 C43.046 12 52 20.954 52 32 V56"
              stroke="#E8542F"
              strokeWidth="4"
              strokeLinecap="round"
              className="animate-[dash_1.2s_ease-out_forwards]"
              style={{
                strokeDasharray: 120,
                strokeDashoffset: 120,
                animation: "drawArch 1.1s ease-out forwards",
              }}
            />
            {/* Inner Portal */}
            <path
              d="M24 56 V36 C24 31.582 27.582 28 32 28 C36.418 28 40 31.582 40 36 V56"
              stroke="#111111"
              strokeWidth="3"
              strokeLinecap="round"
              style={{
                strokeDasharray: 80,
                strokeDashoffset: 80,
                animation: "drawArch 1.1s ease-out 0.2s forwards",
              }}
            />
          </svg>
        </div>

        {/* Counter in Mono (00 -> 100) */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-[#111111]">
            {String(count).padStart(2, "0")}
          </span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-[#5B5750]">
            INITIALIZING CAMPUS TOPOLOGY
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes drawArch {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
