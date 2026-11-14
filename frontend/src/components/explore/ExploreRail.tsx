"use client";

import React, { useState } from "react";
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
      {/* Desktop / Tablet Expandable Rail Wrapper (Fixed 72px in flex flow, expands overlay smoothly) */}
      <div className="hidden lg:block w-[72px] shrink-0 h-full relative z-30 select-none">
        <aside
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
          onFocus={() => setIsExpanded(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              setIsExpanded(false);
            }
          }}
          className={`absolute inset-y-0 left-0 flex flex-col justify-between py-6 bg-[#FBF8F2] border-r border-[#111111]/12 transition-all duration-300 ease-out ${
            isExpanded
              ? "w-[220px] shadow-2xl bg-[#FBF8F2]/98 backdrop-blur-md rounded-r-[24px]"
              : "w-[72px] rounded-r-none"
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
                  className={`w-full h-12 group relative flex items-center rounded-2xl transition-all cursor-pointer text-left ${
                    isExpanded ? "px-3.5 justify-start" : "px-0 justify-center"
                  } ${
                    isActive
                      ? "bg-[#E8542F]/10 text-[#111111] font-bold"
                      : "text-[#5B5750] hover:text-[#111111] hover:bg-[#111111]/[0.04]"
                  }`}
                  title={tab.label}
                  aria-label={tab.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  {/* Active Orange Left Bar */}
                  {isActive && (
                    <span
                      className="absolute left-0 top-2 bottom-2 w-1 bg-[#E8542F] rounded-r-full"
                      aria-hidden="true"
                    />
                  )}

                  {/* Icon Container */}
                  <div
                    className={`relative shrink-0 flex items-center justify-center transition-transform group-hover:scale-108 ${
                      isActive ? "text-[#E8542F]" : "text-[#5B5750] group-hover:text-[#111111]"
                    }`}
                  >
                    {tab.icon}

                    {/* Badge Counter */}
                    {tab.badge !== undefined && (
                      <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-[#E8542F] text-white text-[9px] font-mono font-bold leading-tight shadow-sm">
                        {tab.badge}
                      </span>
                    )}
                  </div>

                  {/* Expanded Text Labels */}
                  {isExpanded && (
                    <div className="ml-3 flex flex-col min-w-0 transition-opacity duration-200">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#111111] truncate">
                        {tab.label}
                      </span>
                      <span className="text-[10px] font-mono text-[#5B5750] truncate">
                        {tab.sub}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Rail Mini-Card */}
          <div className="px-3 pt-4 border-t border-[#111111]/10">
            <div
              className={`rounded-2xl bg-[#F7F3EC] border border-[#111111]/10 p-2.5 flex items-center transition-all ${
                isExpanded ? "gap-2.5" : "justify-center"
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-[#E8542F]/10 text-[#E8542F] flex items-center justify-center text-xs font-bold shrink-0">
                ✦
              </div>

              {isExpanded && (
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-[10px] font-bold text-[#111111] truncate">
                    Navigate &bull; Belong
                  </span>
                  <span className="text-[9px] font-mono text-[#5B5750] truncate uppercase tracking-wider">
                    Prototype &bull; Phase 3
                  </span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile / Tablet Bottom Tab Bar (< 1024px) */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-[#FBF8F2]/95 backdrop-blur-md border-t border-[#111111]/12 flex items-center justify-around px-2 z-40 select-none shadow-lg"
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
              className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                isActive ? "text-[#E8542F]" : "text-[#5B5750] hover:text-[#111111]"
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