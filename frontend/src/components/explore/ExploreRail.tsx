"use client";

import React, { useState, useRef, useEffect } from "react";
import { SidebarTab } from "@/types/campus";

interface ExploreRailProps {
  currentTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  savedCount?: number;
}

export function ExploreRail({
  currentTab,
  onSelectTab,
  savedCount = 0,
}: ExploreRailProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [badgeBump, setBadgeBump] = useState(false);

  const expandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Bump animation when saved count changes
  useEffect(() => {
    if (savedCount > 0) {
      const startTimer = setTimeout(() => {
        setBadgeBump(true);
        const endTimer = setTimeout(() => setBadgeBump(false), 300);
        return () => clearTimeout(endTimer);
      }, 0);
      return () => clearTimeout(startTimer);
    }
  }, [savedCount]);

  const handleMouseEnter = () => {
    if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current);
    expandTimeoutRef.current = setTimeout(() => {
      setIsExpanded(true);
    }, 150); // 150ms hover-intent delay
  };

  const handleMouseLeave = () => {
    if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
    collapseTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 250); // 250ms collapse delay
  };

  const tabs: {
    id: SidebarTab;
    label: string;
    sub: string;
    badge?: number;
    icon: React.ReactNode;
  }[] = [
    {
      id: "explore",
      label: "Explore",
      sub: "Campus Masterplan",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
      ),
    },
    {
      id: "routes",
      label: "Routes",
      sub: "Predefined Paths",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
    },
    {
      id: "saved",
      label: "Saved",
      sub: "Bookmarked Places",
      badge: savedCount > 0 ? savedCount : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      ),
    },
    {
      id: "help",
      label: "Help",
      sub: "Visitor Guidance",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Soft Scrim (8% ink) when rail is expanded over the map */}
      {isExpanded && (
        <div
          className="hidden lg:block fixed inset-0 bg-[#0E1118]/[0.08] pointer-events-none z-20 transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Desktop Expandable Left Rail: Floating rounded card with ink-navy depth */}
      <div className="hidden lg:block w-[72px] shrink-0 h-full relative z-30 select-none">
        <aside
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={() => setIsExpanded(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              setIsExpanded(false);
            }
          }}
          className={`absolute inset-y-0 left-0 flex flex-col justify-between py-6 bg-gradient-to-b from-[#151B28] to-[#0F141F] text-[#F4F1EA] border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_36px_rgba(15,20,31,0.4)] rounded-[22px] transition-all duration-300 ease-out ${
            isExpanded
              ? "w-[220px] shadow-2xl z-40"
              : "w-[72px]"
          }`}
          aria-label="Campus navigation modes"
        >
          {/* Top: Rail Icon List */}
          <div className="space-y-3 px-3">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  data-tab={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`w-full h-12 group relative flex items-center rounded-[14px] transition-all cursor-pointer text-left ${
                    isExpanded ? "px-3.5 justify-start" : "px-0 justify-center"
                  } ${
                    isActive
                      ? "bg-[#E8542F] text-white shadow-md shadow-[#E8542F]/25"
                      : "text-[#B4BCCB] hover:text-white hover:bg-white/[0.08]"
                  }`}
                  title={!isExpanded ? tab.label : undefined}
                  aria-label={tab.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  {/* Icon Container */}
                  <div className="relative shrink-0 flex items-center justify-center transition-transform group-hover:scale-105">
                    {tab.icon}

                    {/* Badge Counter */}
                    {tab.badge !== undefined && (
                      <span
                        className={`absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-white text-[9px] font-mono font-bold leading-tight shadow-sm transition-transform ${
                          isActive ? "bg-[#0E1118] text-[#E8542F]" : "bg-[#E8542F]"
                        } ${badgeBump ? "scale-125" : "scale-100"}`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </div>

                  {/* Expanded Text Labels */}
                  {isExpanded && (
                    <div className="ml-3 flex flex-col min-w-0 transition-opacity duration-200">
                      <span className="text-xs font-bold font-sans tracking-wide text-[#F4F1EA] truncate">
                        {tab.label}
                      </span>
                      <span className="text-[10px] font-mono text-[#B4BCCB] truncate">
                        {tab.sub}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Rail Mini-Card: Ink Navy Surface */}
          <div className="px-3 pt-4 border-t border-white/[0.06]">
            <div
              className={`rounded-[14px] bg-[#0F141F] border border-white/[0.06] p-2.5 flex items-center transition-all ${
                isExpanded ? "gap-2.5" : "justify-center"
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-[#E8542F]/20 text-[#E8542F] flex items-center justify-center text-xs font-bold shrink-0">
                ✦
              </div>

              {isExpanded && (
                <div className="flex flex-col min-w-0 text-left font-sans">
                  <span className="text-[10px] font-bold text-[#F4F1EA] truncate">
                    Navigate &bull; Belong
                  </span>
                  <span className="text-[9px] font-mono text-[#B4BCCB] truncate uppercase tracking-wider">
                    Prototype &bull; Phase 4
                  </span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Tab Bar (< 1024px): Dark Ink-900 with 44px+ touch targets */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-[#0E1118]/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around px-2 z-40 select-none shadow-2xl text-[#9AA3B2]"
        aria-label="Mobile navigation bar"
      >
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-tab={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 h-full flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                isActive ? "text-[#E8542F]" : "text-[#9AA3B2] hover:text-white"
              }`}
              title={tab.label}
              aria-label={tab.label}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-[#E8542F] text-white text-[8px] font-mono font-bold leading-none shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
