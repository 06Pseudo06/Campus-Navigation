"use client";

import React from "react";
import { CampusLocation } from "@/types/campus";
import { RouteIcon, WalkingIcon, ArrowRightIcon } from "./DashboardIcons";

interface RoutesTabProps {
  locations?: CampusLocation[];
  onSelectRoute: (fromId: string, toId: string) => void;
}

export function RoutesTab({ onSelectRoute }: RoutesTabProps) {
  const popularRoutes = [
    {
      fromId: "loc-main-gate",
      toId: "loc-block-34",
      title: "Main Gate → Block 34 (Academic Quad)",
      minutes: 4,
      distance: 280,
      description: "Direct walkway via South Boulevard and Central Plaza.",
    },
    {
      fromId: "loc-main-gate",
      toId: "loc-library",
      title: "Main Gate → Central Library",
      minutes: 7,
      distance: 480,
      description: "Northbound pedestrian route through the main garden promenade.",
    },
    {
      fromId: "loc-north-gate",
      toId: "loc-engineering",
      title: "North Gate → Engineering Block",
      minutes: 3,
      distance: 210,
      description: "Direct access path past the Science Courtyard.",
    },
    {
      fromId: "loc-admin",
      toId: "loc-cafeteria",
      title: "Admin Block → Cafeteria & Food Court",
      minutes: 4,
      distance: 270,
      description: "Level paved connector walkway past the central fountain.",
    },
    {
      fromId: "loc-sports",
      toId: "loc-block-25",
      title: "Sports Complex → Block 25 (Computer Science)",
      minutes: 5,
      distance: 330,
      description: "West cross-campus pathway with shaded seating.",
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DE4B31]/15 dark:bg-[#DE4B31]/20 border border-[#DE4B31]/30 dark:border-[#DE4B31]/40 text-xs font-semibold text-[#DE4B31] dark:text-[#fca5a5] mb-2">
          <RouteIcon className="w-3.5 h-3.5" />
          <span>Campus Wayfinding Routes</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Common Campus Navigation Routes
        </h2>
        <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1">
          Select a popular route to instantly visualize the step-by-step path on the campus map.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {popularRoutes.map((rt, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-sm dark:shadow-lg flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 mb-1">
                <span className="font-semibold text-[#DE4B31] flex items-center gap-1.5">
                  <WalkingIcon className="w-3.5 h-3.5" />
                  ~{rt.minutes} mins walking
                </span>
                <span className="font-mono text-slate-400 dark:text-zinc-500">{rt.distance} meters</span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {rt.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                {rt.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSelectRoute(rt.fromId, rt.toId)}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-[#DE4B31] text-xs font-medium text-slate-700 hover:text-white dark:bg-zinc-800 dark:hover:bg-[#DE4B31] dark:text-zinc-200 dark:hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Preview on Map</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
