"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { useSection } from "@/context/SectionContext";

interface EditorialNavbarProps {
  rightSlot?: React.ReactNode;
  isFixedApp?: boolean;
}

export function EditorialNavbar({ rightSlot, isFixedApp = false }: EditorialNavbarProps = {}) {
  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isDarkSection } = useSection();

  useEffect(() => {
    if (isFixedApp) return;
    let lastScrollY = window.scrollY;

    function handleScroll() {
      const currentScrollY = window.scrollY;

      // Blur backdrop after leaving top
      setScrolled(currentScrollY > 40);

      // Hide on scroll down, reveal on scroll up
      if (currentScrollY > 150) {
        if (currentScrollY > lastScrollY && currentScrollY - lastScrollY > 6) {
          setNavVisible(false);
        } else if (lastScrollY - currentScrollY > 6) {
          setNavVisible(true);
        }
      } else {
        setNavVisible(true);
      }

      lastScrollY = currentScrollY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isFixedApp]);

  // Theme styling based on dark active section (Section 06, etc.)
  const navBgClass = isFixedApp
    ? "bg-[#F7F3EC]/95 backdrop-blur-md py-3.5 border-b border-[#111111]/12 shadow-[0_2px_12px_rgba(17,17,17,0.04)]"
    : isDarkSection
    ? "bg-[#0E1118]/92 backdrop-blur-md py-3.5 border-b border-white/12 shadow-[0_8px_32px_rgba(0,0,0,0.36)]"
    : scrolled
    ? "bg-[#F7F3EC]/92 backdrop-blur-md py-3.5 border-b border-[#111111]/10 shadow-[0_4px_24px_-4px_rgba(17,17,17,0.06)]"
    : "bg-transparent py-5 sm:py-7 border-b border-transparent";

  const textColorClass = isDarkSection ? "text-white" : "text-[#111111]";
  const subTextColorClass = isDarkSection ? "text-white/60" : "text-[#5B5750]";
  const navLinkColorClass = isDarkSection ? "text-white/70 hover:text-white" : "text-[#5B5750] hover:text-[#111111]";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        navVisible ? "translate-y-0" : "-translate-y-full"
      } ${navBgClass}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between">
        {/* Brand: Arch Logo + CampusWay™ + vertical divider + 2-line descriptor */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className={`group flex items-center gap-2.5 ${textColorClass} focus:outline-none transition-colors duration-250`}
            aria-label="CampusWay Home"
          >
            {/* Elegant Architectural Arch Icon (Burnt Orange) */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-t-full border-[2.5px] border-[#E8542F] border-b-0 flex items-end justify-center pb-0.5 transition-transform group-hover:scale-105">
              <div className="w-2.5 h-3.5 sm:w-3 sm:h-4 rounded-t-full border-[2px] border-[#E8542F] border-b-0" />
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight">
              CampusWay<sup className="text-[10px] font-normal ml-0.5">™</sup>
            </span>
          </Link>

          {/* Thin Vertical Divider */}
          <div className={`hidden sm:block h-6 w-px ${isDarkSection ? "bg-white/15" : "bg-[#111111]/15"}`} aria-hidden="true" />

          {/* 2-line Descriptor: UNIVERSITY / NAVIGATION SYSTEM */}
          <div className={`hidden sm:flex flex-col text-[9px] font-mono font-semibold tracking-widest ${subTextColorClass} uppercase leading-tight select-none transition-colors duration-250`}>
            <span>UNIVERSITY</span>
            <span>NAVIGATION SYSTEM</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden md:flex items-center gap-8 text-[12px] font-mono font-semibold tracking-wider uppercase"
          aria-label="Main Navigation"
        >
          {/* HOME with active burnt orange underline */}
          <Link
            href="/"
            className={`group relative py-1 transition-colors duration-150 ${navLinkColorClass} ${
              pathname === "/" ? (isDarkSection ? "!text-white font-bold" : "!text-[#111111] font-bold") : ""
            }`}
          >
            <span>HOME</span>
            {pathname === "/" ? (
              <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#E8542F] rounded-full" />
            ) : (
              <span className="absolute left-0 bottom-0 w-0 h-[1.5px] bg-[#E8542F] transition-all duration-300 group-hover:w-full" />
            )}
          </Link>

          <Link
            href="/explore"
            className={`group relative py-1 transition-colors duration-150 ${navLinkColorClass} ${
              pathname?.startsWith("/explore") ? (isDarkSection ? "!text-white font-bold" : "!text-[#111111] font-bold") : ""
            }`}
          >
            <span>EXPLORE</span>
            {pathname?.startsWith("/explore") ? (
              <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#E8542F] rounded-full" />
            ) : (
              <span className="absolute left-0 bottom-0 w-0 h-[1.5px] bg-[#E8542F] transition-all duration-300 group-hover:w-full" />
            )}
          </Link>

          <Link
            href="/explore?tab=routes"
            className={`group relative py-1 transition-colors duration-150 ${navLinkColorClass}`}
          >
            <span>ROUTES</span>
            <span className="absolute left-0 bottom-0 w-0 h-[1.5px] bg-[#E8542F] transition-all duration-300 group-hover:w-full" />
          </Link>

          <Link
            href="/about"
            className={`group relative py-1 transition-colors duration-150 ${navLinkColorClass}`}
          >
            <span>ABOUT</span>
            <span className="absolute left-0 bottom-0 w-0 h-[1.5px] bg-[#E8542F] transition-all duration-300 group-hover:w-full" />
          </Link>

          {/* Clean hairline separator */}
          <span className={`h-4 w-px ${isDarkSection ? "bg-white/20" : "bg-[#111111]/15"}`} aria-hidden="true" />

          {/* Action Slot: Custom rightSlot (e.g. user chip) or Magnetic Button EXPLORE CAMPUS */}
          {rightSlot ? (
            rightSlot
          ) : (
            <MagneticButton
              href="/explore"
              variant={isDarkSection ? "orange" : "primary"}
              cursorLabel="EXPLORE"
              className="px-5 py-2.5 text-[11px]"
            >
              <span>EXPLORE CAMPUS</span>
              <span className={isDarkSection ? "text-white font-bold text-xs" : "text-[#E8542F] font-bold text-xs"}>↗</span>
            </MagneticButton>
          )}
        </nav>

        {/* Mobile Action / Menu Trigger */}
        <div className="flex md:hidden items-center gap-2">
          {rightSlot ? (
            rightSlot
          ) : (
            <Link
              href="/explore"
              className="px-3.5 py-1.5 rounded-full bg-[#111111] text-white text-[10px] font-mono font-bold tracking-widest uppercase flex items-center gap-1.5"
            >
              <span>EXPLORE</span>
              <span className="text-[#E8542F]">↗</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#111111] hover:bg-[#111111]/05 focus:outline-none"
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

      {/* Full-screen Mobile Menu with Curved Wipe */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#F7F3EC] flex flex-col justify-between p-8 animate-in fade-in duration-300 md:hidden"
          style={{
            clipPath: "ellipse(150% 100% at 50% 0%)",
          }}
        >
          <div className="flex items-center justify-between pb-6 border-b border-[#111111]/10">
            <span className="text-xl font-bold">CampusWay™</span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-2xl font-bold"
              aria-label="Close menu"
            >
              &times;
            </button>
          </div>

          <nav className="flex flex-col space-y-6 text-2xl font-black uppercase text-[#111111] py-8">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between hover:text-[#E8542F]"
            >
              <span>01 / HOME</span>
              <span className="text-sm font-mono">&bull;</span>
            </Link>
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between hover:text-[#E8542F]"
            >
              <span>02 / EXPLORE</span>
              <span className="text-sm font-mono">↗</span>
            </Link>
            <Link
              href="/explore?tab=routes"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between hover:text-[#E8542F]"
            >
              <span>03 / ROUTES</span>
              <span className="text-sm font-mono">↗</span>
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between hover:text-[#E8542F]"
            >
              <span>04 / ABOUT</span>
              <span className="text-sm font-mono">&rarr;</span>
            </Link>
          </nav>

          <div className="pt-4 border-t border-[#111111]/10">
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-4 rounded-full bg-[#111111] text-white text-xs font-mono font-bold tracking-widest uppercase flex items-center justify-center gap-2"
            >
              <span>EXPLORE LIVE CAMPUS</span>
              <span className="text-[#E8542F]">↗</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
