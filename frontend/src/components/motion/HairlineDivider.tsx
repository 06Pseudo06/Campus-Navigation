"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isReducedMotion } from "@/lib/motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface HairlineDividerProps {
  className?: string;
  markerCount?: number;
  dark?: boolean;
}

export function HairlineDivider({
  className = "",
  markerCount = 1,
  dark = false,
}: HairlineDividerProps) {
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lineRef.current || isReducedMotion()) return;

    const el = lineRef.current;
    gsap.fromTo(
      el,
      { scaleX: 0, transformOrigin: "left center" },
      {
        scaleX: 1,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          toggleActions: "play none none none",
        },
      }
    );
  }, []);

  const borderColor = dark ? "border-[#F7F3EC]/15" : "border-[#111111]/12";
  const starColor = dark ? "text-[#E8542F]" : "text-[#E8542F]";

  return (
    <div
      ref={lineRef}
      className={`relative w-full border-t ${borderColor} flex items-center justify-between select-none ${className}`}
      aria-hidden="true"
    >
      {/* ✦ Markers at intersections */}
      {markerCount === 1 && (
        <span
          className={`absolute left-1/2 -translate-x-1/2 -top-2 text-[10px] ${starColor} bg-transparent px-1`}
        >
          ✦
        </span>
      )}
      {markerCount >= 2 && (
        <>
          <span className={`absolute left-8 sm:left-12 -top-2 text-[10px] ${starColor} px-1`}>
            ✦
          </span>
          <span className={`absolute right-8 sm:right-12 -top-2 text-[10px] ${starColor} px-1`}>
            ✦
          </span>
        </>
      )}
    </div>
  );
}

