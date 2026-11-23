"use client";

import React from "react";
import Link from "next/link";
import { CampusWayLogo } from "@/components/icons/Icons";
import {
  CompassIcon,
  RouteIcon,
  BookmarkIcon,
  HelpCircleIcon,
  SettingsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
} from "./DashboardIcons";
import { SidebarTab } from "@/types/campus";

interface SidebarProps {
  currentTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  savedCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  isOpenMobile = false,
  onCloseMobile,
  savedCount = 0,
  isCollapsed = false,
  onToggleCollapse,
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
    <div
      data-testid="sidebar-scroll-container"
      className={`flex flex-col h-full justify-between bg-white dark:bg-[#0d131f] text-slate-800 dark:text-zinc-100 border-r border-slate-200 dark:border-zinc-800/80 overflow-y-auto overscroll-contain transition-all duration-300 ${
        isCollapsed ? "p-2 items-center" : "p-4"
      }`}
    >
      {/* Top Branding */}
      <div className={isCollapsed ? "w-full flex flex-col items-center" : "w-full"}>
        <div
          className={`flex items-center pt-2 pb-5 ${
            isCollapsed ? "justify-center px-0" : "justify-between px-2"
          }`}
        >
          <Link
            href="/explore"
            className="flex items-center gap-3 group focus:outline-none"
            aria-label="CampusWay Dashboard"
            title={isCollapsed ? "CampusWay Dashboard" : undefined}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E8452C] to-[#992E1B] p-2 flex items-center justify-center shadow-lg shadow-[#E8452C]/20 group-hover:scale-105 transition-transform shrink-0">
              <CampusWayLogo className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight truncate">
                  CampusWay
                </span>
                <span className="text-[10px] tracking-wider uppercase text-slate-500 dark:text-zinc-400 font-medium font-mono truncate">
                  Wayfinding System
                </span>
              </div>
            )}
          </Link>

          {/* Close button for mobile */}
          {onCloseMobile && !isCollapsed && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close navigation"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav
          className={`space-y-1.5 mt-2 ${isCollapsed ? "w-full flex flex-col items-center" : "w-full"}`}
          aria-label="Sidebar Navigation"
        >
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
                title={item.label}
                aria-label={item.label}
                className={`relative flex items-center rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                  isCollapsed
                    ? "w-11 h-11 justify-center p-0"
                    : "w-full justify-between px-3.5 py-3"
                } ${
                  isActive
                    ? "bg-[#E8452C] text-white shadow-md shadow-[#E8452C]/25 font-semibold"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/60"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive
                        ? "text-white scale-110"
                        : "text-slate-400 dark:text-zinc-400 group-hover:text-slate-700 dark:group-hover:text-zinc-200"
                    }`}
                  />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`${
                      isCollapsed
                        ? "absolute -top-1 -right-1 min-w-[18px] h-[18px] text-[10px] flex items-center justify-center rounded-full font-bold font-mono"
                        : "text-[11px] px-2 py-0.5 rounded-full font-bold font-mono"
                    } ${
                      isActive
                        ? "bg-white text-[#E8452C]"
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Settings Nav Item (Links to /profile) */}
          <Link
            href="/profile"
            title="Settings"
            aria-label="Settings"
            className={`relative flex items-center rounded-xl text-sm font-medium transition-all group cursor-pointer ${
              isCollapsed
                ? "w-11 h-11 justify-center p-0"
                : "w-full justify-between px-3.5 py-3"
            } text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/60`}
          >
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-5 h-5 text-slate-400 dark:text-zinc-400 group-hover:text-slate-700 dark:group-hover:text-zinc-200 transition-transform group-hover:rotate-45 duration-300" />
              {!isCollapsed && <span>Settings</span>}
            </div>
          </Link>
        </nav>
      </div>

      {/* Bottom Section */}
      <div className={`pt-4 border-t border-slate-200 dark:border-zinc-800/80 w-full space-y-3 pb-8 ${isCollapsed ? "flex flex-col items-center" : ""}`}>
        {/* Slogan Branding Card (only when expanded) */}
        {!isCollapsed && (
          <div className="relative overflow-hidden rounded-2xl bg-slate-50 dark:bg-zinc-900/90 p-3.5 border border-slate-200 dark:border-zinc-700/60 shadow-xs">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#E8452C]/15 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E8452C] animate-pulse" />
              <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 dark:text-zinc-400 font-mono">
                Campus Experience
              </span>
            </div>

            <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide leading-snug">
              Navigate. Explore. Belong.
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
              Smart wayfinding across lecture halls & landmarks.
            </p>

            <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-zinc-500 pt-2 border-t border-slate-200 dark:border-zinc-700/40">
              <span>v1.0 &bull; Prototype</span>
              <span className="text-[#E8452C] font-medium">Phase 3</span>
            </div>
          </div>
        )}

        {/* Collapse / Expand persistent rail toggle button */}
        {onToggleCollapse && (
          <button
            type="button"
            data-testid="sidebar-collapse-toggle"
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand sidebar (1280px+)" : "Collapse to icon rail"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex items-center rounded-xl text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer ${
              isCollapsed
                ? "w-10 h-10 justify-center"
                : "w-full justify-between px-3 py-2 border border-slate-200 dark:border-zinc-800"
            }`}
          >
            {!isCollapsed && <span>Collapse Sidebar</span>}
            {isCollapsed ? (
              <ChevronRightIcon className="w-4 h-4 text-[#E8452C]" />
            ) : (
              <ChevronLeftIcon className="w-4 h-4 text-slate-400 dark:text-zinc-400" />
            )}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop collapsible rail */}
      <aside
        className={`hidden md:flex shrink-0 h-full flex-col min-h-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
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
