"use client";

import React, { useMemo } from "react";
import { CampusLocation } from "@/types/campus";
import { CARLETON_DEMO_LOCATIONS } from "@/data/carletonLocations";

interface ExploreRoutesViewProps {
  locations?: CampusLocation[];
  onSelectRoute: (fromId: string, toId: string) => void;
}

export function ExploreRoutesView({
  locations = [],
  onSelectRoute,
}: ExploreRoutesViewProps) {
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
      });
    }

    return routes;
  }, [locations]);

  return (
    <div className="h-full overflow-y-auto p-6 sm:p-8 max-w-5xl mx-auto space-y-8 select-none">
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-[#111111]/12">
        <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-[#5B5750]">
          <span className="text-[#E8542F]">PREDEFINED ROUTES /</span>
          <span>CURATED CORRIDORS</span>
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tight text-[#111111]">
          Campus Wayfinding <span className="italic text-[#E8542F] font-serif font-normal normal-case">Corridors.</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#5B5750] leading-relaxed max-w-xl">
          Quickly navigate between high-traffic academic complexes and verified accessible pathways across Carleton University.
        </p>
      </div>

      {/* Route Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayRoutes.map((rt) => (
          <div
            key={rt.num}
            onClick={() => onSelectRoute(rt.fromId, rt.toId)}
            className="group relative rounded-[24px] bg-[#FBF8F2] border border-[#111111]/12 hover:border-[#E8542F] p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-6"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#E8542F]">
                  [{rt.num}] {rt.tag}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-bold text-emerald-800 uppercase">
                  VERIFIED
                </span>
              </div>

              <h3 className="text-base font-bold uppercase tracking-tight text-[#111111] group-hover:text-[#E8542F] transition-colors leading-snug">
                {rt.title}
              </h3>

              <p className="text-xs text-[#5B5750] leading-relaxed">
                {rt.description}
              </p>
            </div>

            <div className="pt-4 border-t border-[#111111]/10 flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-3 text-[#111111] font-bold">
                <span>~{rt.minutes} MIN</span>
                <span className="text-[#5B5750] font-normal">&bull; {rt.distance} M</span>
              </div>
              <span className="text-sm text-[#E8542F] group-hover:translate-x-1 transition-transform">
                ↗
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}