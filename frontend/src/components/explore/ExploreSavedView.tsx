"use client";

import React from "react";
import { CampusLocation } from "@/types/campus";

interface ExploreSavedViewProps {
  savedLocations: CampusLocation[];
  onSelectLocation: (loc: CampusLocation) => void;
  onRemoveSaved: (id: string) => void;
  isAuthenticated?: boolean;
  isLoading?: boolean;
  error?: string | null;
}

export function ExploreSavedView({
  savedLocations,
  onSelectLocation,
  onRemoveSaved,
  isAuthenticated = false,
  isLoading = false,
  error = null,
}: ExploreSavedViewProps) {
  return (
    <div className="h-full overflow-y-auto p-6 sm:p-8 max-w-5xl mx-auto space-y-8 select-none">
      {/* Header with Persistence Status */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#111111]/12">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-[#5B5750]">
            <span className="text-[#E8542F]">SAVED DESTINATIONS /</span>
            <span>PERSONAL ATLAS</span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-[#111111]">
            Your Bookmarked <span className="italic text-[#E8542F] font-serif font-normal normal-case">Places.</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#5B5750] leading-relaxed max-w-xl">
            Quickly navigate to your bookmarked classrooms, laboratories, offices, and library study hubs.
          </p>
        </div>

        {/* Persistence Status Badge */}
        <div className="shrink-0">
          {isAuthenticated ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono font-bold text-emerald-800 uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>POSTGRESQL SYNCED</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111111]/[0.06] border border-[#111111]/12 text-xs font-mono font-bold text-[#5B5750] uppercase">
              <span className="w-2 h-2 rounded-full bg-[#E8542F]" />
              <span>GUEST LOCAL STORAGE</span>
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="p-4 rounded-2xl bg-[#FBF8F2] border border-[#111111]/12 text-xs font-mono text-[#5B5750] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E8542F] animate-ping" />
          <span>Synchronizing bookmarks with atlas…</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-mono text-rose-800">
          {error}
        </div>
      )}

      {/* Saved Locations List */}
      {savedLocations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedLocations.map((loc) => (
            <div
              key={loc.id}
              className="p-5 rounded-[24px] bg-[#FBF8F2] border border-[#111111]/12 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E8542F] text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                    {loc.code || "BLDG"}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveSaved(loc.id)}
                    className="text-xs font-mono text-[#5B5750] hover:text-rose-600 transition-colors cursor-pointer"
                    title="Remove from saved"
                    aria-label={`Remove ${loc.name} from saved`}
                  >
                    &times; Remove
                  </button>
                </div>

                <h3 className="text-base font-bold uppercase tracking-tight text-[#111111] leading-tight">
                  {loc.name}
                </h3>

                <p className="text-xs text-[#5B5750] line-clamp-2 leading-relaxed">
                  {loc.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#111111]/10 flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#5B5750] uppercase">
                  {loc.category}
                </span>

                <button
                  type="button"
                  onClick={() => onSelectLocation(loc)}
                  className="px-3 py-1.5 rounded-full bg-[#111111] hover:bg-[#E8542F] text-white text-xs font-mono font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>NAVIGATE</span>
                  <span>↗</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State with ✦ Icon */
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 rounded-[28px] bg-[#FBF8F2] border border-[#111111]/10 p-8">
          <div className="w-12 h-12 rounded-2xl bg-[#E8542F]/10 text-[#E8542F] flex items-center justify-center text-xl font-bold">
            ✦
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold uppercase tracking-tight text-[#111111]">
              Nothing Saved Yet
            </h3>
            <p className="text-xs sm:text-sm text-[#5B5750] max-w-md mx-auto">
              Tap the bookmark icon on any building or landmark in the destination panel to save it for instant one-click wayfinding.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}