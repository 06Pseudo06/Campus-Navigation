"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CampusWayLogo } from "@/components/icons/Icons";

import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className="w-full z-30 px-6 sm:px-12 lg:px-16 py-6 sm:py-8">
      <div className="w-full flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link
          href="/"
          className="flex items-center gap-3 text-white focus:outline-none"
          aria-label="CampusWay Home"
        >
          <CampusWayLogo className="w-7 h-7 sm:w-8 sm:h-8 text-white shrink-0" />
          <span className="text-xl sm:text-2xl font-semibold tracking-tight text-white drop-shadow-sm">
            CampusWay
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-normal text-white/90"
          aria-label="Main Navigation"
        >
          <Link
            href="/"
            className="hover:text-white transition-colors duration-150"
          >
            Home
          </Link>
          <Link
            href="/explore"
            className="hover:text-white transition-colors duration-150"
          >
            Explore
          </Link>
          <Link
            href="/about"
            className="hover:text-white transition-colors duration-150"
          >
            About
          </Link>

          {/* Authentication State */}
          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-white/20">
              <div className="flex items-center gap-2">
                {user.picture ? (
                  <Image
                    src={user.picture}
                    alt={user.name || "User"}
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full border border-white/30 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#C84B31] text-white text-xs font-bold flex items-center justify-center">
                    {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-white/90 max-w-[120px] truncate">
                  {user.name || user.email.split("@")[0]}
                </span>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="px-2.5 py-1 text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 rounded-lg border border-white/30 transition-all"
            >
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white/90 hover:text-white focus:outline-none"
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

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 px-5 py-4 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 shadow-xl flex flex-col gap-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="text-white/90 hover:text-white text-sm py-1"
          >
            Home
          </Link>
          <Link
            href="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="text-white/90 hover:text-white text-sm py-1"
          >
            Explore
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="text-white/90 hover:text-white text-sm py-1"
          >
            About
          </Link>
          <div className="pt-2 border-t border-white/10">
            {user ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/80 truncate">
                  Signed in as <b>{user.name || user.email}</b>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="px-2.5 py-1 text-xs text-white bg-white/15 rounded-lg border border-white/20"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 px-3 text-xs font-semibold text-white bg-[#C84B31] rounded-lg"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
