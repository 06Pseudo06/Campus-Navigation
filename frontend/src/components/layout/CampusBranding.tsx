import React from "react";

/**
 * Architectural Slogan:
 * FIND
 * EXPLORE
 * BELONG
 * —
 * Exactly matching the design reference
 */
export function CampusBranding() {
  return (
    <div className="flex flex-col items-start select-none">
      <div className="space-y-0.5 text-white">
        <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-semibold tracking-[0.2em] leading-tight drop-shadow-md">
          FIND
        </h2>
        <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-semibold tracking-[0.2em] leading-tight drop-shadow-md">
          EXPLORE
        </h2>
        <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-semibold tracking-[0.2em] leading-tight drop-shadow-md">
          BELONG
        </h2>
      </div>

      {/* Short clean horizontal bar below BELONG */}
      <div className="w-10 sm:w-12 h-[2px] bg-white/90 rounded-full mt-3.5 shadow-sm" />
    </div>
  );
}
