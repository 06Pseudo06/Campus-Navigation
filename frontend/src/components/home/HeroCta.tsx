"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function HeroCta() {
  const { user, loading } = useAuth();

  // Initial loading state:
  // Render matching pulse skeleton placeholder to avoid layout shift,
  // prevent flashing unauthenticated buttons to authenticated users,
  // and ensure consistent server/client hydration.
  if (loading) {
    return (
      <div className="pt-4 flex flex-wrap items-center gap-4 min-h-[52px]">
        <div className="h-[48px] w-48 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 animate-pulse" />
        <div className="h-[48px] w-36 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 animate-pulse" />
        <Link
          href="/explore"
          className="px-6 py-3.5 text-sm font-medium text-white/80 hover:text-white transition-colors underline-offset-4 hover:underline"
        >
          Explore Public Campus Map →
        </Link>
      </div>
    );
  }

  // Authenticated state
  if (user) {
    return (
      <div className="pt-4 flex flex-wrap items-center gap-4">
        <Link
          href="/explore"
          className="px-7 py-3.5 rounded-xl bg-[#DE4B31] hover:bg-[#C93F27] active:bg-[#B33520] text-white text-sm font-semibold tracking-wide transition-all shadow-lg shadow-[#DE4B31]/30 hover:shadow-xl hover:shadow-[#DE4B31]/40 flex items-center gap-2 cursor-pointer"
        >
          <span>Explore Campus</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>

        <Link
          href="/explore"
          className="px-7 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 backdrop-blur-md border border-white/30 text-white text-sm font-semibold tracking-wide transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <span>Go to Dashboard</span>
        </Link>

        <Link
          href="/explore"
          className="px-6 py-3.5 text-sm font-medium text-white/80 hover:text-white transition-colors underline-offset-4 hover:underline"
        >
          Explore Public Campus Map →
        </Link>
      </div>
    );
  }

  // Unauthenticated state
  return (
    <div className="pt-4 flex flex-wrap items-center gap-4">
      <Link
        href="/login"
        className="px-7 py-3.5 rounded-xl bg-[#DE4B31] hover:bg-[#C93F27] active:bg-[#B33520] text-white text-sm font-semibold tracking-wide transition-all shadow-lg shadow-[#DE4B31]/30 hover:shadow-xl hover:shadow-[#DE4B31]/40 flex items-center gap-2 cursor-pointer"
      >
        <span>Sign In to CampusWay</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </Link>

      <Link
        href="/signup"
        className="px-7 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 backdrop-blur-md border border-white/30 text-white text-sm font-semibold tracking-wide transition-all shadow-sm cursor-pointer"
      >
        Create Account
      </Link>

      <Link
        href="/explore"
        className="px-6 py-3.5 text-sm font-medium text-white/80 hover:text-white transition-colors underline-offset-4 hover:underline"
      >
        Explore Public Campus Map →
      </Link>
    </div>
  );
}
