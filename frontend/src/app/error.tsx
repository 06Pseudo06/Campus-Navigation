"use client";

import React, { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log unexpected client runtime exceptions safely
    console.error("CampusWay Runtime Exception:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F7F3EC] text-[#111111] selection:bg-[#E8542F] selection:text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-lg p-8 sm:p-10 rounded-[28px] bg-white border border-[#E1DDD3] shadow-[0_20px_50px_rgba(14,17,24,0.08)] text-center space-y-6">
        {/* Error Badge */}
        <div className="w-16 h-16 mx-auto rounded-full bg-[#FEEBE7] border border-[#F6B2A2] flex items-center justify-center text-[#9A2617] text-2xl font-black">
          !
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold tracking-widest text-[#E8542F] uppercase">
            <span>✦</span>
            <span>SYSTEM RUNTIME EXCEPTION</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#111111] font-display">
            Corridor Calculation <span className="italic text-[#E8542F]">Interrupted</span>
          </h1>

          <p className="text-xs sm:text-sm text-[#5B5750] leading-relaxed">
            An unexpected error occurred while rendering the spatial view or processing graph coordinates.
          </p>
        </div>

        {error.message && (
          <div className="p-3.5 rounded-xl bg-[#F7F3EC] border border-[#E1DDD3] text-left">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-[#5B5750] font-bold mb-1">
              Diagnostic Digest
            </span>
            <code className="text-xs font-mono text-[#111111] break-words">
              {error.message}
            </code>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 h-12 rounded-xl bg-[#E8542F] hover:bg-[#D44825] text-white text-xs font-mono font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span>RETRY VIEW</span>
            <span>&rarr;</span>
          </button>

          <Link
            href="/explore"
            className="flex-1 h-12 rounded-xl bg-[#111111] hover:bg-[#252833] text-white text-xs font-mono font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2"
          >
            <span>RESET TO MAP</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

