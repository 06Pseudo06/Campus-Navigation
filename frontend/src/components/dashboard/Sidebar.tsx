"use client";

import React from "react";
import Link from "next/link";
import { CampusWayLogo } from "@/components/icons/Icons";
import {
  CompassIcon,
  RouteIcon,
  BookmarkIcon,
  HelpCircleIcon,
  CloseIcon,
} from "./DashboardIcons";
import { SidebarTab } from "@/types/campus";

interface SidebarProps {
  currentTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  savedCount?: number;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  isOpenMobile = false,
  onCloseMobile,
  savedCount = 0,
}: SidebarProps) {
  const navItems = [
    {
      id: "explore" as SidebarTab,
      label: "Explore",
      description: "Interactive campus map & buildings",
      icon: CompassIcon,
    },
    {
      id: "routes" as SidebarTab,
      label: "Routes",
      description: "Campus paths & walking directions",
      icon: RouteIcon,
    },
    {
      id: "saved" as SidebarTab,
      label: "Saved",
      description: "Bookmarked rooms & lecture halls",
      icon: BookmarkIcon,
      badge: savedCount > 0 ? savedCount : undefined,
    },
    {
      id: "help" as SidebarTab,
      label: "Help",
      description: "Visitor assistance & contacts",
      icon: HelpCircleIcon,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 bg-[#0d131f] text-zinc-100 border-r border-zinc-800/80 select-none">
      {/* Top Branding */}
      <div>
        <div className="flex items-center justify-between px-2 pt-2 pb-6">
          <Link
            href="/explore"
            className="flex items-center gap-3 group focus:outline-none"
            aria-label="CampusWay Dashboard"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#DE4B31] to-[#992E1B] p-2 flex items-center justify-center shadow-lg shadow-[#DE4B31]/20 group-hover:scale-105 transition-transform">
              <CampusWayLogo className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white leading-tight">
                CampusWay
              </span>
              <span className="text-[10px] tracking-wider uppercase text-zinc-400 font-medium">
                Wayfinding System
              </span>
            </div>
          </Link>

          {/* Close button for mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Close navigation"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="space-y-1.5 mt-2" aria-label="Sidebar Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                  isActive
                    ? "bg-[#DE4B31] text-white shadow-md shadow-[#DE4B31]/25 font-semibold"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? "text-white scale-110" : "text-zinc-400 group-hover:text-zinc-200"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? "bg-white text-[#DE4B31]"
                        : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Slogan Branding Card at bottom */}
      <div className="pt-4 border-t border-zinc-800/80">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-800/70 to-zinc-900/90 p-4 border border-zinc-700/60 shadow-inner">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#DE4B31]/15 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#DE4B31] animate-pulse" />
            <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400">
              Campus Experience
            </span>
          </div>

          <h4 className="text-xs font-bold text-white tracking-wide leading-snug">
            Navigate. Explore. Belong.
          </h4>
          <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
            Smart wayfinding across lecture halls, departments & campus landmarks.
          </p>

          <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-700/40">
            <span>v1.0 &bull; Prototype</span>
            <span className="text-[#DE4B31] font-medium">Phase 3</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 h-full flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
