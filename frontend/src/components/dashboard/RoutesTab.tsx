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
      fromId: "gate-1",
      toId: "block-1",
      title: "Gate 1 (Main Gate) → Block 1 (Fashion Design)",
      minutes: 4,
      distance: 310,
      description: "Walk via Junctions 1, 3, and 4 along East Central Promenade.",
    },
    {
      fromId: "gate-1",
      toId: "baldev-auditorium",
      title: "Gate 1 → Shri Baldev Raj Mittal Auditorium",
      minutes: 4,
      distance: 336,
      description: "Direct walkway via Junctions 1, 3, and 4.",
    },
    {
      fromId: "gate-1",
      toId: "uni-hospital",
      title: "Gate 1 → University Hospital",
      minutes: 3,
      distance: 265,
      description: "Quick emergency path via Junctions 1 and 3.",
    },
    {
      fromId: "gate-1",
      toId: "gh-2",
      title: "Gate 1 → Girls Hostel 2 (GH-2)",
      minutes: 6,
      distance: 468,
      description: "South central pathway via Junctions 1, 3, 9, and 10.",
    },
    {
      fromId: "block-1",
      toId: "mb-food-square",
      title: "Block 1 → MB Food Square",
      minutes: 7,
      distance: 512,
      description: "Cross-campus route past Baldev Auditorium and south junctions.",
    },
    {
      fromId: "block-2",
      toId: "cc-food-court",
      title: "Block 2 → CC Food Court",
      minutes: 2,
      distance: 84,
      description: "Direct walkway via Junction 6.",
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DE4B31]/20 border border-[#DE4B31]/40 text-xs font-semibold text-[#fca5a5] mb-2">
          <RouteIcon className="w-3.5 h-3.5" />
          <span>Campus Wayfinding Routes</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Common Campus Navigation Routes
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Select a verified survey route to immediately visualize the Dijkstra path on the interactive map.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {popularRoutes.map((rt, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all shadow-lg flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span className="font-semibold text-[#DE4B31] flex items-center gap-1.5">
                  <WalkingIcon className="w-3.5 h-3.5" />
                  ~{rt.minutes} mins walking
                </span>
                <span className="font-mono text-zinc-500">{rt.distance} meters</span>
              </div>

              <h3 className="text-sm font-bold text-white leading-snug">
                {rt.title}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {rt.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSelectRoute(rt.fromId, rt.toId)}
              className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-[#DE4B31] text-xs font-medium text-zinc-200 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Preview on Map</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 text-xs text-zinc-400">
        <p>
          <strong className="text-zinc-300">Dataset C Specification:</strong> Routes are calculated across the verified 27-node, 29-segment LPU pedestrian graph using Dijkstra and A* pathfinding.
        </p>
      </div>
    </div>
  );
}
