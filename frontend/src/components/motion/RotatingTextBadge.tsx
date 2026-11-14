"use client";

import React from "react";

interface RotatingTextBadgeProps {
  className?: string;
  size?: number;
  text?: string;
  onClick?: () => void;
  dark?: boolean;
}

export function RotatingTextBadge({
  className = "",
  size = 110,
  text = "EXPLORE CAMPUS ✦ NAVIGATE FURTHER ✦ ",
  onClick,
  dark = false,
}: RotatingTextBadgeProps) {
  const radius = (size - 24) / 2;
  const center = size / 2;

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center justify-center cursor-pointer select-none transition-transform duration-300 hover:scale-105 ${className}`}
      style={{ width: size, height: size }}
      role="button"
      tabIndex={0}
      aria-label="Scroll down"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Rotating SVG Circular Text */}
      <svg
        className="w-full h-full animate-[spin_20s_linear_infinite] group-hover:[animation-duration:10s]"
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          <path
            id="textCircle"
            d={`M ${center}, ${center} m -${radius}, 0 a ${radius},${radius} 0 1,1 ${radius * 2},0 a ${radius},${radius} 0 1,1 -${radius * 2},0`}
          />
        </defs>
        <text
          fill={dark ? "#F7F3EC" : "#111111"}
          fontSize="9.5"
          fontFamily="monospace"
          fontWeight="bold"
          letterSpacing="0.14em"
        >
          <textPath href="#textCircle" startOffset="0%">
            {text}
          </textPath>
        </text>
      </svg>

      {/* Central Pulsing Accent Circle with Down Arrow */}
      <div
        className={`absolute rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
          dark
            ? "w-10 h-10 bg-[#E8542F] text-white group-hover:scale-110 shadow-[#E8542F]/30"
            : "w-10 h-10 bg-[#E8542F] text-white group-hover:scale-110 shadow-[#E8542F]/30"
        }`}
      >
        <svg
          className="w-4 h-4 transition-transform group-hover:translate-y-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </div>
  );
}

