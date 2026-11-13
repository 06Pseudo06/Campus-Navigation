"use client";

import React, { useEffect, useRef } from "react";
import { isReducedMotion } from "@/lib/motion";

interface CurvedTextProps {
  className?: string;
  text?: string;
  radius?: number;
}

export function CurvedText({
  className = "",
  text = "CAMPUS · MAP · ROUTES · SPACES · NAVIGATE FURTHER · UNIVERSITY WAYFINDING · ",
  radius = 280,
}: CurvedTextProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || isReducedMotion()) return;

    let currentRotation = 0;
    let targetRotation = 0;
    let rafId: number;

    const onScroll = () => {
      // Speed up rotation with scroll
      targetRotation = window.scrollY * 0.12;
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    const animate = () => {
      // Continuous ambient rotation + scroll velocity
      currentRotation += (targetRotation - currentRotation) * 0.08 + 0.05;
      if (containerRef.current) {
        containerRef.current.style.transform = `rotate(${currentRotation}deg)`;
      }
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const size = radius * 2 + 60;
  const center = size / 2;

  return (
    <svg
      ref={containerRef}
      className={`pointer-events-none select-none origin-center ${className}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      <defs>
        <path
          ref={pathRef}
          id="curvedArcPath"
          d={`M ${center - radius}, ${center} A ${radius},${radius} 0 1,1 ${center + radius},${center} A ${radius},${radius} 0 1,1 ${center - radius},${center}`}
        />
      </defs>
      <text
        fill="#111111"
        fillOpacity="0.4"
        fontSize="10"
        fontFamily="monospace"
        fontWeight="bold"
        letterSpacing="0.18em"
      >
        <textPath href="#curvedArcPath" startOffset="0%">
          {text}
        </textPath>
      </text>
    </svg>
  );
}
