"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
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
import { ThemeDropdownSection, ThemeToggle } from "@/components/theme/ThemeToggle";
import { FEATURE_QR } from "@/lib/featureFlags";
import { CampusLocation } from "@/types/campus";

interface TopbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenMobileSidebar: () => void;
  onToggleMobileDrawer?: () => void;
  isMobileDrawerOpen?: boolean;
  locationsStatus?: "loading" | "available" | "unavailable";
  onOpenQrScanner?: () => void;
  locations?: CampusLocation[];
  onSelectLocation?: (location: CampusLocation) => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

const CATEGORY_FILTERS = [
  { id: "all", label: "All" },
  { id: "building", label: "Academic" },
  { id: "hostel", label: "Hostels" },
  { id: "service", label: "Food" },
  { id: "gate", label: "Gates" },
  { id: "landmark", label: "Landmarks" },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  building: { bg: "bg-red-500/10", text: "text-[#E8452C]", border: "border-[#E8452C]/30" },
  hostel: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/30" },
  service: { bg: "bg-pink-500/10", text: "text-pink-500", border: "border-pink-500/30" },
  gate: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/30" },
  landmark: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/30" },
  room: { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/30" },
};

export function Topbar({
  searchQuery,
  onSearchChange,
  onOpenMobileSidebar,
  onToggleMobileDrawer,
  isMobileDrawerOpen,
  locationsStatus: _locationsStatus,
  onOpenQrScanner,
  locations = [],
  onSelectLocation,
  selectedCategory = "all",
  onSelectCategory,
}: TopbarProps) {
  const { user, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Press "/" anywhere to focus the search bar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        const targetTag = (e.target as HTMLElement)?.tagName;
        if (targetTag !== "INPUT" && targetTag !== "TEXTAREA") {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      } else if (e.key === "Escape" && isSearchFocused) {
        setIsSearchFocused(false);
        searchInputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchFocused]);

  // Close profile dropdown and instant search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setProfileDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsSearchFocused(false);
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

  // Instant matching search results
  const matchingLocations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !locations.length) return [];
    return locations
      .filter(
        (loc) =>
          loc.name.toLowerCase().includes(q) ||
          loc.code.toLowerCase().includes(q) ||
          loc.description.toLowerCase().includes(q) ||
          loc.category.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [searchQuery, locations]);

  return (
    <header className="h-16 px-3 sm:px-5 bg-white dark:bg-[#0e1422] border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0 z-20 transition-colors duration-200">
      {/* Left: Mobile hamburger + University Selector */}
      <div className="flex items-center gap-2.5 shrink-0">
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
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/70 text-slate-800 dark:text-zinc-200">
          <div className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-700/80 flex items-center justify-center text-[#E8452C] shrink-0 shadow-xs">
            <UniversityIcon className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[110px] sm:max-w-[160px]">
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

      {/* Center: Global Centered Search Bar with Shortcut Hint & Instant Dropdown */}
      <div className="flex-1 max-w-xl mx-2 relative" ref={searchContainerRef}>
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-400">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="Search buildings, rooms, landmarks..."
            className="w-full h-10 pl-10 pr-16 rounded-xl bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-700/80 text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#E8452C] focus:ring-1 focus:ring-[#E8452C] transition-all"
            data-testid="campus-search"
            aria-label="Search campus locations"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  onSearchChange("");
                  searchInputRef.current?.focus();
                }}
                className="p-1 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-md"
                aria-label="Clear search"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-zinc-500 bg-slate-200 dark:bg-zinc-800 rounded border border-slate-300 dark:border-zinc-700 select-none shadow-xs">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Instant Search Results Dropdown */}
        {isSearchFocused && matchingLocations.length > 0 && (
          <div
            data-testid="instant-search-dropdown"
            className="absolute top-12 left-0 right-0 bg-white dark:bg-[#111827] border border-slate-200 dark:border-zinc-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1 max-h-72 overflow-y-auto"
          >
            <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono border-b border-slate-100 dark:border-zinc-800">
              <span>Matching Places ({matchingLocations.length})</span>
              <span>Select destination</span>
            </div>
            {matchingLocations.map((loc) => {
              const catBadge = CATEGORY_COLORS[loc.category] || CATEGORY_COLORS.building;
              return (
                <button
                  key={loc.id}
                  type="button"
                  data-testid={`search-result-${loc.slug || loc.id}`}
                  onClick={() => {
                    if (onSelectLocation) onSelectLocation(loc);
                    setIsSearchFocused(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover:text-[#E8452C] transition-colors truncate">
                        {loc.name}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono uppercase font-bold border ${catBadge.bg} ${catBadge.text} ${catBadge.border}`}
                      >
                        {loc.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                      {loc.description}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 group-hover:text-[#E8452C] shrink-0 font-semibold">
                    Go →
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Controls: Quick Filter Pills (hidden on mobile), Scan QR, Theme Toggle, Profile */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quick Filter Pills (desktop only) */}
        {onSelectCategory && (
          <div className="hidden xl:flex items-center gap-1 mr-1">
            {CATEGORY_FILTERS.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  data-testid={`filter-pill-${cat.id}`}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#E8452C] text-white font-semibold shadow-xs"
                      : "bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-700/80"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Quick QR Scanner trigger */}
        {FEATURE_QR && onOpenQrScanner && (
          <button
            type="button"
            onClick={onOpenQrScanner}
            className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-slate-700 hover:text-slate-950 dark:text-zinc-300 dark:hover:text-white border border-slate-200 dark:border-zinc-700/80 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
            title="Scan CampusWay QR Sign"
            aria-label="Scan CampusWay QR Sign"
            data-testid="topbar-scan-qr-button"
          >
            <QrCodeIcon className="w-3.5 h-3.5 text-[#E8452C]" />
            <span className="hidden sm:inline font-mono">Scan QR</span>
          </button>
        )}

        {/* Appearance Quick Toggle (Light / Dark / Auto) */}
        <ThemeToggle />

        {/* Toggle mobile destination drawer */}
        {onToggleMobileDrawer && (
          <button
            type="button"
            onClick={onToggleMobileDrawer}
            className="lg:hidden px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-[#E8452C]" />
            <span>{isMobileDrawerOpen ? "Map View" : "Search Places"}</span>
          </button>
        )}

        {/* User Profile dropdown with Status Dot */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-zinc-700/60 focus:outline-none cursor-pointer"
            aria-expanded={profileDropdownOpen}
            aria-haspopup="true"
            aria-label="User profile menu"
            data-testid="topbar-profile-button"
          >
            <div className="relative">
              {user?.picture ? (
                <Image
                  src={user.picture}
                  alt={displayName}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full border border-slate-300 dark:border-zinc-600 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E8452C] to-[#f97316] text-white text-xs font-bold flex items-center justify-center shadow-xs">
                  {userInitials}
                </div>
              )}
              {/* Active status indicator dot */}
              <span
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0e1422]"
                title="Active Session"
              />
            </div>

            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 max-w-[110px] truncate leading-tight">
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
