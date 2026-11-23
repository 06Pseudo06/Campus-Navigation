"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  UniversityIcon,
  SearchIcon,
  ChevronDownIcon,
  SignOutIcon,
  CloseIcon,
  CheckCircleIcon,
  QrCodeIcon,
} from "./DashboardIcons";
import { ThemeDropdownSection } from "@/components/theme/ThemeToggle";
import { FEATURE_QR } from "@/lib/featureFlags";

interface TopbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenMobileSidebar: () => void;
  onToggleMobileDrawer?: () => void;
  isMobileDrawerOpen?: boolean;
  locationsStatus?: "loading" | "available" | "unavailable";
  onOpenQrScanner?: () => void;
}

export function Topbar({
  searchQuery,
  onSearchChange,
  onOpenMobileSidebar,
  onToggleMobileDrawer,
  isMobileDrawerOpen,
  locationsStatus,
  onOpenQrScanner,
}: TopbarProps) {
  const { user, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setProfileDropdownOpen(false);
    await logout();
  };

  // Derive display initials and name
  const displayName = user?.name || user?.email?.split("@")[0] || "Campus Explorer";
  const userInitials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-16 px-4 sm:px-6 bg-white dark:bg-[#0e1422] border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4 shrink-0 z-20 transition-colors duration-200">
      {/* Left: Mobile hamburger + University Selector */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors"
          aria-label="Open navigation sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* University Selector (LPU Campus Branding) */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/70 text-slate-800 dark:text-zinc-200">
          <div className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-700/80 flex items-center justify-center text-[#E8452C] shrink-0 shadow-xs">
            <UniversityIcon className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-[200px]">
                LPU Campus
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 font-mono">
                Dataset C
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 hidden sm:inline">
              Lovely Professional University &bull; Phagwara
            </span>
          </div>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-lg hidden sm:block">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-400">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search buildings, rooms, landmarks..."
            className="w-full h-10 pl-10 pr-9 rounded-xl bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-700/80 text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#E8452C] focus:ring-1 focus:ring-[#E8452C] transition-all"
            data-testid="campus-search"
            aria-label="Search campus locations"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              aria-label="Clear search"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Destination panel toggle (mobile) + User Profile Menu */}
      <div className="flex items-center gap-2.5">
        {/* Quick QR Scanner trigger */}
        {FEATURE_QR && onOpenQrScanner && (
          <button
            type="button"
            onClick={onOpenQrScanner}
            className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-slate-700 hover:text-slate-950 dark:text-zinc-300 dark:hover:text-white border border-slate-200 dark:border-zinc-700/80 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Scan CampusWay QR Sign"
            aria-label="Scan CampusWay QR Sign"
            data-testid="topbar-scan-qr-button"
          >
            <QrCodeIcon className="w-3.5 h-3.5 text-[#E8452C]" />
            <span className="hidden sm:inline font-mono">Scan QR</span>
          </button>
        )}

        {/* Toggle mobile destination drawer */}
        {onToggleMobileDrawer && (
          <button
            type="button"
            onClick={onToggleMobileDrawer}
            className="lg:hidden px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-[#E8452C]" />
            <span>{isMobileDrawerOpen ? "Map View" : "Search Places"}</span>
          </button>
        )}

        {/* User Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-zinc-700/60 focus:outline-none cursor-pointer"
            aria-expanded={profileDropdownOpen}
            aria-haspopup="true"
            aria-label="User profile menu"
          >
            {user?.picture ? (
              <Image
                src={user.picture}
                alt={displayName}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full border border-slate-300 dark:border-zinc-600 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E8452C] to-[#f97316] text-white text-xs font-bold flex items-center justify-center shadow-sm">
                {userInitials}
              </div>
            )}

            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 max-w-[120px] truncate leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">
                {user?.email ? "Authenticated" : "Visitor"}
              </span>
            </div>

            <ChevronDownIcon
              className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-400 transition-transform ${
                profileDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-zinc-700 shadow-2xl py-2 z-50 text-slate-800 dark:text-zinc-200 animate-in fade-in zoom-in-95 duration-100">
              {/* User details header */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                  {user?.email || "No email provided"}
                </p>
                {user?.email_verified && (
                  <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/60 text-[10px] text-emerald-800 dark:text-emerald-400 font-medium">
                    <CheckCircleIcon className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                    <span>Verified Session</span>
                  </div>
                )}
              </div>

              {/* Theme Dropdown Section */}
              <ThemeDropdownSection />

              {/* Status information */}
              <div className="px-4 py-2.5 text-[11px] text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span>Authentication</span>
                  <span className="text-slate-700 dark:text-zinc-200 font-mono">
                    {user?.auth_provider === "google" ? "Google OAuth 2.0" : "Email & Password"}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span>Session Storage</span>
                  <span className="text-slate-700 dark:text-zinc-200 font-mono">HTTP-Only Cookie</span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-1.5 space-y-1">
                <Link
                  href="/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 rounded-xl transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Profile & Settings</span>
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                >
                  <SignOutIcon className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
