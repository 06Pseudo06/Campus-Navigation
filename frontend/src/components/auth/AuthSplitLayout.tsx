"use client";

import React, { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { isReducedMotion } from "@/lib/motion";

interface AuthSplitLayoutProps {
  kicker: string;
  headingPrefix: string;
  headingAccent: string;
  subtext?: string;
  children: ReactNode;
  footerNotice?: ReactNode;
}

export function AuthSplitLayout({
  kicker,
  headingPrefix,
  headingAccent,
  subtext,
  children,
  footerNotice,
}: AuthSplitLayoutProps) {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isReducedMotion()) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 12;
      const y = (e.clientY / innerHeight - 0.5) * 12;
      setMouseOffset({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#F7F3EC] text-[#111111] flex flex-col justify-between selection:bg-[#E8542F] selection:text-white relative overflow-x-hidden">
      {/* 1. Minimal Shared Header */}
      <header className="w-full px-6 py-6 sm:px-10 flex items-center justify-between border-b border-[#111111]/08 shrink-0 z-30">
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-[#111111] focus:outline-none"
          aria-label="CampusWay Home"
        >
          <div className="w-7 h-7 rounded-t-full border-[2.5px] border-[#E8542F] border-b-0 flex items-end justify-center pb-0.5 transition-transform group-hover:scale-105">
            <div className="w-2.5 h-3.5 rounded-t-full border-[2px] border-[#E8542F] border-b-0" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            CampusWay<sup className="text-[10px] font-normal ml-0.5">™</sup>
          </span>
        </Link>

        <div className="flex items-center gap-4 text-xs font-mono">
          <Link
            href="/"
            className="text-[#5B5750] hover:text-[#111111] transition-colors flex items-center gap-1.5"
          >
            <span>&larr;</span>
            <span className="hidden sm:inline">Back to home</span>
          </Link>
          <span className="text-[#111111]/20">&bull;</span>
          <Link
            href="/explore"
            className="text-[#E8542F] font-bold hover:underline flex items-center gap-1"
          >
            <span>Explore Map</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </header>

      {/* 2. Main Split Zone */}
      <main className="flex-1 flex w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 gap-8 items-center justify-center">
        {/* Left Column: Form (Paper background, max 440px) */}
        <div className="w-full max-w-[440px] flex flex-col justify-center py-6 sm:py-10 space-y-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold tracking-widest uppercase text-[#5B5750]">
              <span className="text-[#E8542F]">&mdash;</span>
              <span>{kicker}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#111111] font-display">
              {headingPrefix}{" "}
              <span className="font-display font-black italic text-[#E8542F]">
                {headingAccent}
              </span>
            </h1>

            {subtext && (
              <p className="text-xs sm:text-sm text-[#5B5750] font-sans leading-relaxed">
                {subtext}
              </p>
            )}
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-[22px] p-6 sm:p-7 border border-[#E1DDD3] shadow-[0_1px_0_rgba(14,17,24,0.04),0_18px_40px_-18px_rgba(14,17,24,0.18)]">
            {children}
          </div>

          {/* Legal / Notice Footer */}
          {footerNotice ? (
            <div className="text-center text-xs text-[#5B5750] font-sans">
              {footerNotice}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4 text-xs font-mono text-[#5B5750]">
              <Link href="/terms" className="hover:text-[#E8542F] transition-colors">
                Terms of Service
              </Link>
              <span>&bull;</span>
              <Link href="/privacy" className="hover:text-[#E8542F] transition-colors">
                Privacy Policy
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Visual Architectural Panel (>= 1024px) */}
        <div className="hidden lg:flex flex-1 max-w-[540px] h-[640px] rounded-[28px] overflow-hidden relative shadow-2xl border border-[#111111]/15 bg-[#0E1118] p-8 flex-col justify-between select-none">
          {/* Background Photo with Subtle Parallax */}
          <div
            className="absolute inset-0 transition-transform duration-300 ease-out scale-105"
            style={{
              transform: `translate(${mouseOffset.x}px, ${mouseOffset.y}px) scale(1.06)`,
            }}
          >
            <Image
              src="/images/arch-navigate.jpg"
              alt="Architectural campus elevation"
              fill
              priority
              sizes="540px"
              className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
            />
            {/* Deep Ink Overlay */}
            <div className="absolute inset-0 bg-[#0E1118]/45 backdrop-blur-[0.5px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0E1118]/90 via-transparent to-[#0E1118]/30" />
          </div>

          {/* Top Sun Disc & Arc */}
          <div className="relative z-10 flex items-start justify-between">
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-[#F2793A] to-[#E8542F] opacity-90 shadow-xl">
              <div className="absolute -inset-2.5 rounded-full border border-[#E8542F]/40" />
            </div>

            {/* Rotating Badge */}
            <div className="relative w-20 h-20 rounded-full border border-white/20 flex items-center justify-center text-[8px] font-mono font-bold tracking-widest text-white/80 animate-spin-slow">
              <span className="text-center leading-tight">
                FIND &bull; EXPLORE &bull; BELONG
              </span>
            </div>
          </div>

          {/* Bottom 3 Benefit Lines with ✦ bullets */}
          <div className="relative z-10 space-y-3.5 pt-6 border-t border-white/15 backdrop-blur-xs rounded-2xl p-4 bg-black/20">
            <div className="flex items-center gap-3 text-white text-xs font-sans">
              <span className="text-[#E8542F] font-bold text-sm">✦</span>
              <span>Sync saved places across all your devices</span>
            </div>
            <div className="flex items-center gap-3 text-white text-xs font-sans">
              <span className="text-[#E8542F] font-bold text-sm">✦</span>
              <span>Accessible routes and custom corridors remembered</span>
            </div>
            <div className="flex items-center gap-3 text-white text-xs font-sans">
              <span className="text-[#E8542F] font-bold text-sm">✦</span>
              <span>Your university campus, one tap away</span>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Minimal Bottom Bar */}
      <footer className="w-full py-4 text-center text-xs font-mono text-[#5B5750]/70 border-t border-[#111111]/06">
        CampusWay Navigation System &bull; Secure Session Tier &bull; Zero-Login Enabled
      </footer>
    </div>
  );
}

