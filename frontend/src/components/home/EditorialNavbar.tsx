"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CampusWayLogo } from "@/components/icons/Icons";

export function EditorialNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#FBF9F5]/90 backdrop-blur-md py-3.5 border-b border-[#1A1A1A]/10 shadow-[0_4px_20px_-4px_rgba(26,26,26,0.05)]"
          : "bg-transparent py-6 sm:py-8 border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link
          href="/"
          className="group flex items-center gap-3 text-[#111111] focus:outline-none"
          aria-label="CampusWay Architectural Home"
        >
          <div className="w-8 h-8 rounded-lg bg-[#D9532F] text-white flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
            <CampusWayLogo className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-[#111111] leading-none">
              CampusWay
            </span>
            <span className="text-[9px] font-mono tracking-widest text-[#88847C] uppercase mt-0.5">
              Wayfinding &bull; Arch. 2026
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden md:flex items-center gap-8 text-[13px] font-medium tracking-wide uppercase text-[#5A5854]"
          aria-label="Main Navigation"
        >
          <Link
            href="/"
            className={`transition-colors duration-150 hover:text-[#D9532F] ${
              pathname === "/" ? "text-[#111111] font-semibold" : ""
            }`}
          >
            Home
          </Link>
          <Link
            href="/explore"
            className="transition-colors duration-150 hover:text-[#D9532F]"
          >
            Explore
          </Link>
          <Link
            href="/explore?tab=routes"
            className="transition-colors duration-150 hover:text-[#D9532F]"
          >
            Routes
          </Link>
          <Link
            href="/about"
            className="transition-colors duration-150 hover:text-[#D9532F]"
          >
            About
          </Link>
        </nav>

        {/* Action Button */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/explore"
            className="px-5 py-2.5 rounded-full bg-[#D9532F] hover:bg-[#C44524] active:bg-[#B33B1D] text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-sm hover:shadow-md hover:shadow-[#D9532F]/20 flex items-center gap-2 group cursor-pointer"
          >
            <span>Explore Campus</span>
            <svg
              className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          <Link
            href="/explore"
            className="px-3.5 py-1.5 rounded-full bg-[#D9532F] text-white text-[11px] font-semibold tracking-wider uppercase"
          >
            Map
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#111111] hover:text-[#D9532F] focus:outline-none"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 px-4 py-4 bg-[#FBF9F5] border-b border-[#1A1A1A]/10 shadow-lg flex flex-col gap-3 text-sm font-medium uppercase tracking-wider text-[#111111]">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg hover:bg-[#1A1A1A]/5"
          >
            Home
          </Link>
          <Link
            href="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg hover:bg-[#1A1A1A]/5"
          >
            Explore Map
          </Link>
          <Link
            href="/explore?tab=routes"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg hover:bg-[#1A1A1A]/5"
          >
            Predefined Routes
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg hover:bg-[#1A1A1A]/5"
          >
            About CampusWay
          </Link>
          <div className="pt-2 border-t border-[#1A1A1A]/10">
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-full bg-[#D9532F] text-white text-xs font-semibold block"
            >
              Explore Campus Map →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
