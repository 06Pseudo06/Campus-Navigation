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
    <div className="h-full overflow-y-auto px-6 py-6 lg:px-8 space-y-6 max-w-6xl mx-auto select-none slim-scrollbar pb-10 flex flex-col">
      {/* Sub-Header with Persistence Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E1DDD3] shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-[#6B665C]">
            <span className="text-[#E8542F]">&mdash;</span>
            <span>PERSONAL ATLAS &bull; PERSISTENT BOOKMARKS</span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B665C] font-sans leading-relaxed">
            Quickly navigate to your bookmarked classrooms, laboratories, and library study hubs.
          </p>
        </div>

        {/* Persistence Status Badge */}
        <div className="shrink-0 font-mono">
          {isAuthenticated ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>POSTGRESQL SYNCED</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E1DDD3] text-xs font-bold text-[#6B665C] uppercase shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#E8542F]" />
              <span>GUEST LOCAL STORAGE</span>
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="p-3.5 rounded-[14px] bg-white border border-[#E1DDD3] text-xs font-mono text-[#6B665C] flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#E8542F] animate-ping" />
          <span>Synchronizing bookmarks with atlas…</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-[14px] bg-rose-50 border border-rose-200 text-xs font-sans text-rose-800 shrink-0">
          {error}
        </div>
      )}

      {/* Saved Locations List or Vertically Centered Empty State */}
      {savedLocations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedLocations.map((loc) => (
            <div
              key={loc.id}
              className="p-5 rounded-[20px] bg-white border border-[#E1DDD3] shadow-[0_1px_0_rgba(14,17,24,0.04),0_18px_40px_-18px_rgba(14,17,24,0.18)] hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E8542F] text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                    {loc.code || "BLDG"}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveSaved(loc.id)}
                    className="text-xs font-mono text-[#6B665C] hover:text-rose-600 transition-colors cursor-pointer"
                    title="Remove from saved"
                    aria-label={`Remove ${loc.name} from saved`}
                  >
                    &times; Remove
                  </button>
                </div>

                <h3 className="text-base font-bold uppercase tracking-tight text-[#0E1118] leading-tight font-sans">
                  {loc.name}
                </h3>

                <p className="text-xs text-[#6B665C] line-clamp-2 leading-relaxed font-sans">
                  {loc.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E1DDD3] flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#6B665C] uppercase">
                  {loc.category}
                </span>

                <button
                  type="button"
                  onClick={() => onSelectLocation(loc)}
                  className="px-3.5 py-1.5 rounded-full bg-[#0E1118] hover:bg-[#E8542F] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                >
                  NAVIGATE &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Vertically Centered Empty State */
        <div className="flex-1 flex flex-col items-center justify-center min-h-[360px] my-auto">
          <div className="p-10 rounded-[20px] bg-white border border-[#E1DDD3] text-center max-w-md space-y-4 shadow-[0_1px_0_rgba(14,17,24,0.04),0_18px_40px_-18px_rgba(14,17,24,0.18)]">
            <div className="w-12 h-12 rounded-2xl bg-[#E8542F]/10 text-[#E8542F] mx-auto flex items-center justify-center text-xl font-bold">
              ✦
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold uppercase tracking-wider text-[#0E1118] font-sans">
                Nothing Saved Yet
              </h3>
              <p className="text-xs text-[#6B665C] leading-relaxed font-sans">
                Tap the bookmark icon on any building or landmark in the destination panel to save it for instant one-click wayfinding.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
