"use client";

import React, { useMemo } from "react";
import { CampusLocation } from "@/types/campus";
import { RouteIcon, WalkingIcon, ArrowRightIcon } from "./DashboardIcons";

interface RoutesTabProps {
  locations?: CampusLocation[];
  onSelectRoute: (fromId: string, toId: string) => void;
}

export function RoutesTab({ locations = [], onSelectRoute }: RoutesTabProps) {
  // Generate routes using actual Carleton buildings if loaded
  const displayRoutes = useMemo(() => {
    if (locations.length >= 2) {
      // Find key Carleton landmark buildings
      const lib = locations.find((l) => l.name.toLowerCase().includes("library") || l.code === "ML");
      const paterson = locations.find((l) => l.name.toLowerCase().includes("paterson") || l.code === "PA");
      const arise = locations.find((l) => l.name.toLowerCase().includes("arise") || l.code === "AB");
      const alumni = locations.find((l) => l.name.toLowerCase().includes("alumni") || l.code === "AH");
      const mackenzie = locations.find((l) => l.name.toLowerCase().includes("mackenzie") || l.code === "ME");
      const richcraft = locations.find((l) => l.name.toLowerCase().includes("richcraft") || l.code === "RB");

      const routes = [];

      if (lib && paterson) {
        routes.push({
          fromId: lib.id,
          toId: paterson.id,
          title: `${lib.name} (${lib.code}) → ${paterson.name} (${paterson.code})`,
          minutes: 2,
          distance: 134,
          description: "Direct walkway connecting the Library to Paterson Hall with step-free verified access.",
          isLive: true,
        });
      }

      if (arise && alumni) {
        routes.push({
          fromId: arise.id,
          toId: alumni.id,
          title: `${arise.name} (${arise.code}) → ${alumni.name} (${alumni.code})`,
          minutes: 7,
          distance: 580,
          description: "Cross-campus corridor route between the ARISE research facility and Alumni Hall.",
          isLive: true,
        });
      }

      if (mackenzie && richcraft) {
        routes.push({
          fromId: mackenzie.id,
          toId: richcraft.id,
          title: `${mackenzie.name} (${mackenzie.code}) → ${richcraft.name} (${richcraft.code})`,
          minutes: 4,
          distance: 310,
          description: "Engineering and journalism corridor along the eastern academic quad.",
          isLive: true,
        });
      }

      // Add a couple additional combinations if available
      if (locations.length > 5) {
        const b1 = locations[2];
        const b2 = locations[5];
        if (b1 && b2 && b1.id !== b2.id) {
          routes.push({
            fromId: b1.id,
            toId: b2.id,
            title: `${b1.name} → ${b2.name}`,
            minutes: 5,
            distance: 420,
            description: "Campus pedestrian connection between academic departments.",
            isLive: true,
          });
        }
      }

      if (routes.length > 0) return routes;
    }

    // Default concept fallback
    return [
      {
        fromId: "loc-main-gate",
        toId: "loc-block-34",
        title: "Main Gate → Block 34 (Academic Quad)",
        minutes: 4,
        distance: 280,
        description: "Direct walkway via South Boulevard and Central Plaza.",
        isLive: false,
      },
      {
        fromId: "loc-main-gate",
        toId: "loc-library",
        title: "Main Gate → Central Library",
        minutes: 7,
        distance: 480,
        description: "Northbound pedestrian route through the main garden promenade.",
        isLive: false,
      },
      {
        fromId: "loc-sports",
        toId: "loc-block-25",
        title: "Sports Complex → Block 25",
        minutes: 5,
        distance: 330,
        description: "West cross-campus pathway with shaded seating.",
        isLive: false,
      },
    ];
  }, [locations]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DE4B31]/20 border border-[#DE4B31]/40 text-xs font-semibold text-[#fca5a5] mb-2">
          <RouteIcon className="w-3.5 h-3.5" />
          <span>Active Demonstration Routes</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Common Campus Navigation Routes
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Select any popular route below to submit actual origin and destination nodes to the backend graph solver.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayRoutes.map((rt, i) => (
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
                <span className="font-mono text-zinc-500">~{rt.distance}m</span>
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                <h3 className="text-sm font-bold text-white leading-snug">
                  {rt.title}
                </h3>
              </div>

              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {rt.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSelectRoute(rt.fromId, rt.toId)}
              className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-[#DE4B31] text-xs font-medium text-zinc-200 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Calculate Real Route</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
