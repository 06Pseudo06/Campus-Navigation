"use client";

import React, { useState, useMemo } from "react";
import { CampusLocation } from "@/types/campus";
import { CARLETON_DEMO_LOCATIONS } from "@/data/carletonLocations";

interface ExploreRoutesViewProps {
  locations?: CampusLocation[];
  onSelectRoute: (fromId: string, toId: string) => void;
  onPlanCustomRoute?: () => void;
}

export function ExploreRoutesView({
  locations = [],
  onSelectRoute,
  onPlanCustomRoute,
}: ExploreRoutesViewProps) {
  const [filterMode, setFilterMode] = useState<"all" | "accessible" | "quick">("all");

  const displayRoutes = useMemo(() => {
    const activeLocations = locations.length >= 2 ? locations : CARLETON_DEMO_LOCATIONS;

    const lib = activeLocations.find((l) => l.name.toLowerCase().includes("library") || l.code === "ML");
    const paterson = activeLocations.find((l) => l.name.toLowerCase().includes("paterson") || l.code === "PA");
    const arise = activeLocations.find((l) => l.name.toLowerCase().includes("arise") || l.code === "AB");
    const alumni = activeLocations.find((l) => l.name.toLowerCase().includes("alumni") || l.code === "AH");
    const mackenzie = activeLocations.find((l) => l.name.toLowerCase().includes("mackenzie") || l.code === "ME");
    const richcraft = activeLocations.find((l) => l.name.toLowerCase().includes("richcraft") || l.code === "RB");

    const routes = [];

    if (lib && paterson) {
      routes.push({
        fromId: lib.id,
        toId: paterson.id,
        num: "01",
        title: `${lib.name} (${lib.code}) → ${paterson.name} (${paterson.code})`,
        minutes: 2,
        distance: 134,
        description: "Direct walkway connecting the Library to Paterson Hall with step-free verified access.",
        tag: "CENTRAL QUAD",
        isAccessible: true,
        pathD: "M 20 50 Q 80 30, 180 40",
      });
    }

    if (arise && alumni) {
      routes.push({
        fromId: arise.id,
        toId: alumni.id,
        num: "02",
        title: `${arise.name} (${arise.code}) → ${alumni.name} (${alumni.code})`,
        minutes: 20,
        distance: 1582,
        description: "Cross-campus corridor route between the ARISE research facility and Alumni Hall.",
        tag: "RESEARCH ARTERY",
        isAccessible: true,
        pathD: "M 20 60 C 70 20, 120 70, 180 30",
      });
    }

    if (mackenzie && richcraft) {
      routes.push({
        fromId: mackenzie.id,
        toId: richcraft.id,
        num: "03",
        title: `${mackenzie.name} (${mackenzie.code}) → ${richcraft.name} (${richcraft.code})`,
        minutes: 4,
        distance: 310,
        description: "Engineering and journalism corridor along the eastern academic quad.",
        tag: "ENGINEERING CORRIDOR",
        isAccessible: true,
        pathD: "M 30 25 L 90 60 L 170 35",
      });
    }

    if (filterMode === "accessible") {
      return routes.filter((r) => r.isAccessible);
    }
    if (filterMode === "quick") {
      return routes.filter((r) => r.minutes <= 5);
    }
    return routes;
  }, [locations, filterMode]);

  return (
    <div className="h-full overflow-y-auto px-6 py-6 lg:px-8 space-y-6 max-w-6xl mx-auto select-none slim-scrollbar pb-10">
      {/* Sub-Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E1DDD3]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-[#6B665C]">
            <span className="text-[#E8542F]">&mdash;</span>
            <span>CURATED ARTERIES &amp; PEDESTRIAN PATHS</span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B665C] font-sans leading-relaxed">
            Quickly navigate between high-traffic academic complexes and verified step-free pathways.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px]">
          {[
            { id: "all", label: "All Routes" },
            { id: "accessible", label: "Step-Free Accessible" },
            { id: "quick", label: "Under 5 min" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterMode(f.id as "all" | "accessible" | "quick")}
              className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                filterMode === f.id
                  ? "bg-[#0E1118] text-white shadow-xs"
                  : "bg-white text-[#6B665C] hover:text-[#0E1118] border border-[#E1DDD3]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Route Cards Grid: White Cards with Cool Shadow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayRoutes.map((rt) => (
          <div
            key={rt.num}
            onClick={() => onSelectRoute(rt.fromId, rt.toId)}
            className="group relative rounded-[20px] bg-white border border-[#E1DDD3] hover:border-[#E8542F] p-5 shadow-[0_1px_0_rgba(14,17,24,0.04),0_18px_40px_-18px_rgba(14,17,24,0.18)] hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#6B665C] uppercase tracking-wider">
                  [{rt.num}] {rt.tag}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-bold text-emerald-800 uppercase">
                  VERIFIED
                </span>
              </div>

              {/* Mini SVG Route Polyline Preview */}
              <div className="w-full h-16 rounded-[12px] bg-[#F7F5F0] border border-[#E1DDD3] relative overflow-hidden flex items-center justify-center">
                <svg viewBox="0 0 200 80" className="w-full h-full">
                  {/* Faint context building rects */}
                  <rect x="15" y="25" width="28" height="20" rx="4" fill="#E1DDD3" opacity="0.6" />
                  <rect x="85" y="15" width="30" height="24" rx="4" fill="#E1DDD3" opacity="0.5" />
                  <rect x="155" y="30" width="30" height="22" rx="4" fill="#E1DDD3" opacity="0.6" />
                  {/* Route line */}
                  <path d={rt.pathD} fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
                  <path d={rt.pathD} fill="none" stroke="#E8542F" strokeWidth="3" strokeLinecap="round" />
                  {/* Origin & Dest pins */}
                  <circle cx="20" cy="50" r="4.5" fill="#0F6E73" />
                  <circle cx="180" cy="40" r="4.5" fill="#E8542F" />
                </svg>
              </div>

              <h3 className="text-base font-bold uppercase tracking-tight text-[#0E1118] group-hover:text-[#E8542F] transition-colors leading-snug font-sans">
                {rt.title}
              </h3>

              <p className="text-xs text-[#6B665C] leading-relaxed font-sans">
                {rt.description}
              </p>
            </div>

            <div className="pt-3 border-t border-[#E1DDD3] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#0E1118]">~{rt.minutes} MIN</span>
                <span className="text-[#6B665C]">&bull;</span>
                <span className="text-[#6B665C]">{rt.distance} M</span>
              </div>

              <span className="text-xs font-bold text-[#E8542F] group-hover:translate-x-1 transition-transform">
                NAVIGATE &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Full-Width "Plan a Custom Route" Card Below Grid */}
      <div
        onClick={() => {
          if (onPlanCustomRoute) {
            onPlanCustomRoute();
          } else {
            // Default: pick first 2 locations
            const lib = locations.find((l) => l.code === "ML") || locations[0];
            const pa = locations.find((l) => l.code === "PA") || locations[1];
            if (lib && pa) onSelectRoute(lib.id, pa.id);
          }
        }}
        className="w-full p-6 rounded-[20px] bg-white border border-[#E1DDD3] hover:border-[#E8542F] shadow-[0_1px_0_rgba(14,17,24,0.04),0_18px_40px_-18px_rgba(14,17,24,0.18)] flex items-center justify-between cursor-pointer transition-all group"
      >
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B665C]">
            CUSTOM WAYFINDING &bull; ZERO RESTRICTIONS
          </span>
          <h4 className="text-lg font-bold text-[#0E1118] group-hover:text-[#E8542F] transition-colors font-sans">
            Need a custom point-to-point path?
          </h4>
          <p className="text-xs text-[#6B665C] font-sans">
            Select any pair of Carleton campus facilities in the Explore Masterplan to calculate Dijkstra or A* optimal routes.
          </p>
        </div>

        <div className="w-12 h-12 rounded-full bg-[#E8542F] text-white flex items-center justify-center text-lg font-bold group-hover:scale-108 transition-transform shrink-0 shadow-md">
          &rarr;
        </div>
      </div>
    </div>
  );
}
