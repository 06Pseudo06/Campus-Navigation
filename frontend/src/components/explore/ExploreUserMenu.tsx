"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function ExploreUserMenu() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName =
    user?.full_name || user?.name || user?.email?.split("@")[0] || "Campus Explorer";
  const userInitials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await logout();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* User Chip Button */}
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#111111]/[0.06] hover:bg-[#111111]/[0.10] border border-[#111111]/12 transition-all cursor-pointer select-none"
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
        aria-label="User navigation menu"
      >
        {/* CE Avatar */}
        <div className="w-6 h-6 rounded-full bg-[#E8542F] text-white flex items-center justify-center text-[10px] font-mono font-bold shrink-0 shadow-sm">
          {userInitials || "CE"}
        </div>

        {/* User Name & Role */}
        <div className="hidden sm:flex flex-col text-left leading-tight">
          <span className="text-[11px] font-bold text-[#111111] truncate max-w-[120px]">
            {displayName}
          </span>
          <span className="text-[9px] font-mono text-[#5B5750] uppercase tracking-wider">
            {user ? "Verified Student" : "Visitor · Guest"}
          </span>
        </div>

        {/* Small Chevron */}
        <svg
          className={`w-3.5 h-3.5 text-[#5B5750] transition-transform duration-200 ${
            dropdownOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Restyled Dropdown Popover matching editorial theme */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#FBF8F2] border border-[#111111]/15 shadow-2xl p-3 z-50 animate-fadeIn space-y-2 text-[#111111]">
          <div className="px-3 py-2 border-b border-[#111111]/10">
            <p className="text-xs font-bold truncate text-[#111111]">{displayName}</p>
            <p className="text-[10px] font-mono text-[#5B5750] truncate">
              {user?.email || "guest@campusway.atlas"}
            </p>
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#E8542F]/10 border border-[#E8542F]/20 text-[9px] font-mono text-[#E8542F] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8542F]" />
              <span>{user ? "PostgreSQL Synced" : "Guest Mode Active"}</span>
            </div>
          </div>

          <div className="space-y-0.5 text-xs font-mono">
            <Link
              href="/"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#111111]/[0.05] transition-colors"
            >
              <span>Home Overview</span>
              <span className="text-[#E8542F]">↗</span>
            </Link>

            <Link
              href="/about"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#111111]/[0.05] transition-colors"
            >
              <span>About Project</span>
              <span className="text-[#5B5750]">↗</span>
            </Link>

            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full text-left flex items-center justify-between px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
              >
                <span>Sign Out</span>
                <span>&rarr;</span>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#E8542F] text-white hover:bg-[#C9411F] transition-colors"
              >
                <span>Sign In / Sync</span>
                <span>&rarr;</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}