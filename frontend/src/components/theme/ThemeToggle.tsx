"use client";

import React, { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { useTheme, ThemeMode } from "@/context/ThemeContext";

const emptySubscribe = () => () => {};

export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function SunIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" strokeLinecap="round" />
      <line x1="12" y1="21" x2="12" y2="23" strokeLinecap="round" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeLinecap="round" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeLinecap="round" />
      <line x1="1" y1="12" x2="3" y2="12" strokeLinecap="round" />
      <line x1="21" y1="12" x2="23" y2="12" strokeLinecap="round" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" strokeLinecap="round" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" strokeLinecap="round" />
    </svg>
  );
}

export function MoonIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
      />
    </svg>
  );
}

export function MonitorIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="8" y1="21" x2="16" y2="21" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="17" x2="12" y2="21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface ThemeToggleProps {
  className?: string;
  showLabels?: boolean;
}

/**
 * Compact Icon Button with Dropdown (for Topbar & Navbar)
 */
export function ThemeToggle({ className = "", showLabels = false }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const mounted = useIsMounted();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const themeOptions: { id: ThemeMode; label: string; icon: typeof SunIcon }[] = [
    { id: "light", label: "Light Mode", icon: SunIcon },
    { id: "dark", label: "Dark Mode", icon: MoonIcon },
    { id: "system", label: "System Default", icon: MonitorIcon },
  ];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-2 rounded-xl text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 border border-slate-200 dark:border-zinc-700/70 transition-all cursor-pointer shadow-xs"
        aria-label="Change theme"
        title={mounted ? `Theme: ${theme === "system" ? `System (${resolvedTheme})` : theme}` : "Theme"}
        suppressHydrationWarning
      >
        {!mounted ? (
          <div className="w-4 h-4" />
        ) : resolvedTheme === "dark" ? (
          <MoonIcon className="w-4 h-4 text-amber-400" />
        ) : (
          <SunIcon className="w-4 h-4 text-amber-500" />
        )}
        {showLabels && (
          <span className="text-xs font-medium capitalize hidden sm:inline">
            {mounted ? theme : "Theme"}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-zinc-700 shadow-xl py-1.5 z-50 text-slate-800 dark:text-zinc-200 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800">
            Appearance
          </div>
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = mounted && theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setTheme(opt.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#DE4B31]/10 text-[#DE4B31] font-semibold"
                    : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isSelected
                        ? "text-[#DE4B31]"
                        : opt.id === "dark"
                        ? "text-blue-400"
                        : opt.id === "light"
                        ? "text-amber-500"
                        : "text-slate-400 dark:text-zinc-400"
                    }`}
                  />
                  <span>{opt.label}</span>
                </div>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DE4B31]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Segmented Selector (for Settings / Profile page)
 */
export function ThemeSegmentedControl({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();

  const options: { id: ThemeMode; label: string; desc: string; icon: typeof SunIcon }[] = [
    {
      id: "dark",
      label: "Dark Mode",
      desc: "Deep navy and orange tones",
      icon: MoonIcon,
    },
    {
      id: "light",
      label: "Light Mode",
      desc: "Crisp white and soft slate",
      icon: SunIcon,
    },
    {
      id: "system",
      label: "System",
      desc: "Sync with OS preference",
      icon: MonitorIcon,
    },
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${className}`}>
      {options.map((opt) => {
        const Icon = opt.icon;
        const isSelected = mounted && theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTheme(opt.id)}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              isSelected
                ? "bg-white dark:bg-[#151d2f] border-[#DE4B31] ring-2 ring-[#DE4B31]/30 shadow-md"
                : "bg-slate-50 dark:bg-zinc-900/50 hover:bg-slate-100 dark:hover:bg-zinc-800/60 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isSelected
                    ? "bg-[#DE4B31] text-white"
                    : "bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              {isSelected && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DE4B31]/10 text-[#DE4B31] border border-[#DE4B31]/30">
                  Active
                </span>
              )}
            </div>

            <div>
              <p
                className={`text-sm font-bold ${
                  isSelected
                    ? "text-[#DE4B31] dark:text-white"
                    : "text-slate-800 dark:text-zinc-200"
                }`}
              >
                {opt.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {opt.desc}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Inline Dropdown Options (for Topbar user menu)
 */
export function ThemeDropdownSection() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();

  return (
    <div className="px-3 py-2 border-b border-slate-200 dark:border-zinc-800/80">
      <div className="text-[10px] uppercase font-semibold text-slate-400 dark:text-zinc-500 mb-1.5 flex items-center justify-between">
        <span>Appearance</span>
        <span className="capitalize font-mono text-[10px] text-slate-600 dark:text-zinc-300">
          {mounted ? theme : "dark"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            mounted && theme === "light"
              ? "bg-white text-slate-900 shadow-xs font-semibold"
              : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          }`}
          title="Light Mode"
        >
          <SunIcon className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px]">Light</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            mounted && theme === "dark"
              ? "bg-zinc-800 text-white shadow-xs font-semibold"
              : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          }`}
          title="Dark Mode"
        >
          <MoonIcon className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px]">Dark</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme("system")}
          className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            mounted && theme === "system"
              ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs font-semibold"
              : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          }`}
          title="System Default"
        >
          <MonitorIcon className="w-3.5 h-3.5" />
          <span className="text-[11px]">Auto</span>
        </button>
      </div>
    </div>
  );
}
