"use client";

import React from "react";

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
  const borderColor = dark
    ? "border-white/10"
    : "border-[#E1DDD3] dark:border-white/10";
  const starColor = "text-[#DE4B31]";

  return (
    <div
      className={`relative w-full border-t ${borderColor} flex items-center justify-between select-none ${className}`}
      aria-hidden="true"
    >
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
