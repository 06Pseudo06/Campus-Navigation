"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function EditorialNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 25) {
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
          ? "bg-[#F7F3ED]/92 backdrop-blur-md py-3.5 border-b border-[#151515]/10 shadow-[0_4px_24px_-4px_rgba(21,21,21,0.06)]"
          : "bg-transparent py-5 sm:py-7 border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between">
        {/* Brand: Arch Logo + CampusWay™ + vertical divider + 2-line descriptor */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="group flex items-center gap-2.5 text-[#151515] focus:outline-none"
            aria-label="CampusWay Home"
          >
            {/* Elegant Architectural Arch Icon (Burnt Orange) */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-t-full border-[2.5px] border-[#E6532E] border-b-0 flex items-end justify-center pb-0.5 transition-transform group-hover:scale-105">
              <div className="w-2.5 h-3.5 sm:w-3 sm:h-4 rounded-t-full border-[2px] border-[#E6532E] border-b-0" />
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#151515]">
              CampusWay<sup className="text-[10px] font-normal ml-0.5">™</sup>
            </span>
          </Link>

          {/* Thin Vertical Divider */}
          <div className="hidden sm:block h-6 w-px bg-[#151515]/20" aria-hidden="true" />

          {/* 2-line Descriptor: UNIVERSITY / NAVIGATION SYSTEM */}
          <div className="hidden sm:flex flex-col text-[9px] font-sans font-semibold tracking-widest text-[#6E6B65] uppercase leading-tight select-none">
            <span>UNIVERSITY</span>
            <span>NAVIGATION SYSTEM</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden md:flex items-center gap-8 text-[12px] font-semibold tracking-wider uppercase text-[#5A5854]"
          aria-label="Main Navigation"
        >
          {/* HOME with active burnt orange underline */}
          <Link
            href="/"
            className={`relative py-1 transition-colors duration-150 hover:text-[#151515] ${
              pathname === "/" ? "text-[#151515]" : ""
            }`}
          >
            <span>HOME</span>
            {pathname === "/" && (
              <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#E6532E] rounded-full" />
            )}
          </Link>

          <Link
            href="/explore"
            className="py-1 transition-colors duration-150 hover:text-[#151515]"
          >
            EXPLORE
          </Link>

          <Link
            href="/explore?tab=routes"
            className="py-1 transition-colors duration-150 hover:text-[#151515]"
          >
            ROUTES
          </Link>

          <Link
            href="/about"
            className="py-1 transition-colors duration-150 hover:text-[#151515]"
          >
            ABOUT
          </Link>

          {/* Em-dash indicator */}
          <span className="text-[#8B8780] select-none" aria-hidden="true">
            &mdash;
          </span>

          {/* Primary Action Button: EXPLORE CAMPUS ↗ (Charcoal Pill) */}
          <Link
            href="/explore"
            className="px-5 py-2.5 rounded-full bg-[#151515] hover:bg-[#282828] active:bg-[#000000] text-white text-[11px] font-bold tracking-widest uppercase transition-all shadow-sm hover:shadow-md flex items-center gap-2 group cursor-pointer"
          >
            <span>EXPLORE CAMPUS</span>
            <span className="text-[#E6532E] font-bold text-xs transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              ↗
            </span>
          </Link>
        </nav>

        {/* Mobile Hamburger Trigger */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/explore"
            className="px-3.5 py-1.5 rounded-full bg-[#151515] text-white text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5"
          >
            <span>EXPLORE</span>
            <span className="text-[#E6532E]">↗</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#151515] hover:bg-[#151515]/05 focus:outline-none"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#F7F3ED] border-b border-[#151515]/10 px-6 py-6 shadow-xl space-y-4 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-3 text-sm font-semibold tracking-wider uppercase text-[#151515]">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 border-b border-[#151515]/05 text-[#E6532E]"
            >
              <span>HOME</span>
              <span>&bull;</span>
            </Link>
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 border-b border-[#151515]/05 hover:text-[#E6532E]"
            >
              <span>EXPLORE</span>
              <span>↗</span>
            </Link>
            <Link
              href="/explore?tab=routes"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 border-b border-[#151515]/05 hover:text-[#E6532E]"
            >
              <span>ROUTES</span>
              <span>↗</span>
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 hover:text-[#E6532E]"
            >
              <span>ABOUT</span>
              <span>&rarr;</span>
            </Link>
          </nav>

          <div className="pt-2">
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 rounded-full bg-[#151515] text-white text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2"
            >
              <span>EXPLORE CAMPUS</span>
              <span className="text-[#E6532E]">↗</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
