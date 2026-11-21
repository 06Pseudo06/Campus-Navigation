"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CampusWayLogo } from "@/components/icons/Icons";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle, ThemeDropdownSection } from "@/components/theme/ThemeToggle";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isLinkActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="w-full z-30 px-4 sm:px-8 lg:px-12 py-3.5 sm:py-4.5 bg-[#F7F3EC]/92 dark:bg-[#070B14]/88 backdrop-blur-md border-b border-[#E1DDD3]/80 dark:border-white/10 transition-colors duration-200 sticky top-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand: Arch Logo + CampusWay™ + vertical divider + 2-line descriptor */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          <Link
            href="/"
            className="group flex items-center gap-2.5 focus:outline-none transition-colors"
            aria-label="CampusWay Home"
          >
            <CampusWayLogo className="w-7 h-7 sm:w-8 sm:h-8 text-[#DE4B31] shrink-0 group-hover:scale-105 transition-transform" />
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#0E1118] dark:text-white transition-colors">
              CampusWay<sup className="text-[10px] font-normal ml-0.5 text-[#DE4B31]">™</sup>
            </span>
          </Link>

          {/* Thin Architectural Divider */}
          <div
            className="hidden sm:block h-6 w-px bg-[#E1DDD3] dark:bg-zinc-800"
            aria-hidden="true"
          />

          {/* 2-line Monospace Descriptor */}
          <div className="hidden sm:flex flex-col text-[9px] font-mono font-semibold tracking-widest text-[#6B665C] dark:text-zinc-400 uppercase leading-tight select-none transition-colors">
            <span>UNIVERSITY</span>
            <span>NAVIGATION SYSTEM</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden md:flex items-center gap-7 lg:gap-8 text-xs font-mono font-semibold tracking-wider uppercase"
          aria-label="Main Navigation"
        >
          <Link
            href="/"
            className={`group relative py-1.5 transition-colors duration-150 ${
              isLinkActive("/")
                ? "text-[#0E1118] dark:text-white font-bold"
                : "text-[#6B665C] dark:text-zinc-400 hover:text-[#0E1118] dark:hover:text-white"
            }`}
          >
            <span>HOME</span>
            {isLinkActive("/") && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#DE4B31] rounded-full" />
            )}
          </Link>
          <Link
            href="/explore"
            className={`group relative py-1.5 transition-colors duration-150 ${
              isLinkActive("/explore")
                ? "text-[#0E1118] dark:text-white font-bold"
                : "text-[#6B665C] dark:text-zinc-400 hover:text-[#0E1118] dark:hover:text-white"
            }`}
          >
            <span>EXPLORE</span>
            {isLinkActive("/explore") && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#DE4B31] rounded-full" />
            )}
          </Link>
          <Link
            href="/about"
            className={`group relative py-1.5 transition-colors duration-150 ${
              isLinkActive("/about")
                ? "text-[#0E1118] dark:text-white font-bold"
                : "text-[#6B665C] dark:text-zinc-400 hover:text-[#0E1118] dark:hover:text-white"
            }`}
          >
            <span>ABOUT</span>
            {isLinkActive("/about") && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#DE4B31] rounded-full" />
            )}
          </Link>
        </nav>

        {/* Desktop Right Controls (Theme Toggle + Auth Controls) */}
        <div className="hidden md:flex items-center gap-3">
          {/* Theme Mode Toggle with intuitive Light / Dark / System dropdown */}
          <ThemeToggle />

          {/* Authentication State */}
          {user ? (
            <div className="flex items-center gap-2.5 pl-3 border-l border-[#E1DDD3] dark:border-zinc-800">
              <div className="flex items-center gap-2">
                {user.picture ? (
                  <Image
                    src={user.picture}
                    alt={user.name || "User"}
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full border border-slate-300 dark:border-zinc-700 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#DE4B31] text-white text-xs font-bold flex items-center justify-center shadow-xs">
                    {user.name
                      ? user.name[0].toUpperCase()
                      : user.email[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-[#0E1118] dark:text-zinc-200 max-w-[130px] truncate">
                  {user.name || user.email.split("@")[0]}
                </span>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 rounded-lg border border-slate-200 dark:border-zinc-700/70 transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-3 border-l border-[#E1DDD3] dark:border-zinc-800">
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 hover:text-[#DE4B31] dark:hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/explore"
                className="px-3.5 py-1.5 rounded-full bg-[#0E1118] hover:bg-[#DE4B31] dark:bg-zinc-100 dark:hover:bg-[#DE4B31] text-white dark:text-[#0E1118] dark:hover:text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors shadow-xs flex items-center gap-1"
              >
                <span>EXPLORE</span>
                <span className="text-[#DE4B31] dark:text-[#DE4B31]">&rarr;</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Controls (Theme Toggle + Hamburger) */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors focus:outline-none"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 px-5 py-5 rounded-2xl bg-[#F7F3EC] dark:bg-[#0E1422] border border-[#E1DDD3] dark:border-zinc-800 shadow-2xl flex flex-col gap-4 text-slate-800 dark:text-zinc-200 animate-in fade-in zoom-in-95 duration-150">
          <nav className="flex flex-col gap-1.5 font-mono text-xs uppercase font-semibold">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors ${
                isLinkActive("/")
                  ? "bg-[#DE4B31]/10 text-[#DE4B31] font-bold"
                  : "hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 text-slate-700 dark:text-zinc-300"
              }`}
            >
              <span>01 / HOME</span>
              <span className="text-xs">&rarr;</span>
            </Link>
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors ${
                isLinkActive("/explore")
                  ? "bg-[#DE4B31]/10 text-[#DE4B31] font-bold"
                  : "hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 text-slate-700 dark:text-zinc-300"
              }`}
            >
              <span>02 / EXPLORE CAMPUS</span>
              <span className="text-xs">↗</span>
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors ${
                isLinkActive("/about")
                  ? "bg-[#DE4B31]/10 text-[#DE4B31] font-bold"
                  : "hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 text-slate-700 dark:text-zinc-300"
              }`}
            >
              <span>03 / ABOUT SYSTEM</span>
              <span className="text-xs">&rarr;</span>
            </Link>
          </nav>

          {/* Theme Switcher Options in Mobile Menu */}
          <div className="pt-2 border-t border-[#E1DDD3] dark:border-zinc-800">
            <ThemeDropdownSection className="!px-0 !py-1 !border-0" />
          </div>

          {/* Mobile Authentication Controls */}
          <div className="pt-2 border-t border-[#E1DDD3] dark:border-zinc-800">
            {user ? (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  {user.picture ? (
                    <Image
                      src={user.picture}
                      alt={user.name || "User"}
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full border border-slate-300 dark:border-zinc-700 object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#DE4B31] text-white text-xs font-bold flex items-center justify-center">
                      {user.name
                        ? user.name[0].toUpperCase()
                        : user.email[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-medium text-slate-700 dark:text-zinc-300 max-w-[140px] truncate">
                    {user.name || user.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 px-3 text-xs font-mono font-bold uppercase rounded-xl border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/explore"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 px-3 text-xs font-mono font-bold uppercase tracking-wider text-white bg-[#0E1118] dark:bg-[#DE4B31] rounded-xl hover:bg-[#DE4B31] transition shadow-xs"
                >
                  Explore Live Campus &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
