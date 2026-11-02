"use client";

import React from "react";
import { CampusLocation } from "@/types/campus";
import { BookmarkIcon, ArrowRightIcon } from "./DashboardIcons";

interface SavedTabProps {
  savedLocations: CampusLocation[];
  onSelectLocation: (loc: CampusLocation) => void;
  onRemoveSaved: (id: string) => void;
}

export function SavedTab({
  savedLocations,
  onSelectLocation,
  onRemoveSaved,
}: SavedTabProps) {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DE4B31]/20 border border-[#DE4B31]/40 text-xs font-semibold text-[#fca5a5] mb-2">
          <BookmarkIcon className="w-3.5 h-3.5" filled />
          <span>Saved Locations</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Your Bookmarked Places
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Quickly access your frequent lecture halls, labs, and department offices.
        </p>
      </div>

      {savedLocations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedLocations.map((loc) => (
            <div
              key={loc.id}
              className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all shadow-lg flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {loc.code} &bull; {loc.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveSaved(loc.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>

                <h3 className="text-base font-bold text-white mt-2">
                  {loc.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                  {loc.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onSelectLocation(loc)}
                className="w-full py-2 px-3 rounded-xl bg-[#DE4B31] hover:bg-[#c93f27] text-xs font-semibold text-white transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#DE4B31]/20"
              >
                <span>Navigate on Map</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 mx-auto flex items-center justify-center text-zinc-500">
            <BookmarkIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Saved Places Yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Click the bookmark icon on any building or room card in the Explore tab to save it here for fast access.
          </p>
        </div>
      )}

      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 text-xs text-zinc-500">
        <p>
          <strong className="text-zinc-400">Session Storage Notice:</strong> Saved items are currently stored in frontend session state for demonstration. Persistent database storage will be connected when PostgreSQL is linked in Phase 4.
        </p>
      </div>
    </div>
  );
}
