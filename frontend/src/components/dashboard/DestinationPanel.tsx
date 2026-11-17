"use client";

import React, { useState, useMemo } from "react";
import { CampusLocation, CampusRoute, LocationCategory } from "@/types/campus";
import {
  SearchIcon,
  AccessibilityIcon,
  BookmarkIcon,
  RouteIcon,
  CloseIcon,
  CheckCircleIcon,
  WalkingIcon,
  ClockIcon,
} from "./DashboardIcons";

interface DestinationPanelProps {
  locations: CampusLocation[];
  originLocation: CampusLocation | null;
  selectedLocation: CampusLocation | null;
  onSelectOrigin: (location: CampusLocation) => void;
  onSelectDestination: (location: CampusLocation) => void;
  onSelectLocation?: (location: CampusLocation) => void;
  onSwapLocations: () => void;
  onUseCurrentLocation: () => void;
  activeRoute: CampusRoute | null;
  routeError?: string | null;
  showRoute: boolean;
  onToggleRoute: () => void;
  savedLocationIds: string[];
  onToggleSaveLocation: (id: string) => void;
}

export function DestinationPanel({
  locations,
  originLocation,
  selectedLocation,
  onSelectOrigin,
  onSelectDestination,
  onSelectLocation,
  onSwapLocations,
  onUseCurrentLocation,
  activeRoute,
  routeError,
  showRoute,
  onToggleRoute,
  savedLocationIds,
  onToggleSaveLocation,
}: DestinationPanelProps) {
  const [panelSearch, setPanelSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory>("all");
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [selectingField, setSelectingField] = useState<"origin" | "destination" | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  // Filter categories
  const categories: { id: LocationCategory; label: string }[] = [
    { id: "all", label: "All" },
    { id: "building", label: "Academic Blocks" },
    { id: "hostel", label: "Hostels" },
    { id: "gate", label: "Gates" },
    { id: "service", label: "Food & Dining" },
    { id: "landmark", label: "Landmarks" },
  ];

  // Filtered locations for search / list
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesCategory =
        selectedCategory === "all" || loc.category === selectedCategory;

      const q = panelSearch.trim().toLowerCase();
      if (!q) return matchesCategory;

      const matchesQuery =
        loc.name.toLowerCase().includes(q) ||
        loc.code.toLowerCase().includes(q) ||
        loc.description.toLowerCase().includes(q) ||
        loc.departments?.some((d) => d.toLowerCase().includes(q)) ||
        loc.facilities?.some((f) => f.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [locations, selectedCategory, panelSearch]);

  const isSaved = selectedLocation
    ? savedLocationIds.includes(selectedLocation.id)
    : false;

  const handleSaveClick = () => {
    if (!selectedLocation) return;
    onToggleSaveLocation(selectedLocation.id);
    const nextSaved = !isSaved;
    setSaveNotice(
      nextSaved
        ? `Added "${selectedLocation.name}" to Saved`
        : `Removed "${selectedLocation.name}" from Saved`
    );
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleLocationPick = (loc: CampusLocation) => {
    if (selectingField === "origin") {
      onSelectOrigin(loc);
      setSelectingField(null);
    } else {
      onSelectDestination(loc);
      if (onSelectLocation) onSelectLocation(loc);
      setSelectingField(null);
    }
  };

  const isQueryingBlock34 = panelSearch.toLowerCase().includes("34");

  return (
    <aside className="w-full lg:w-96 shrink-0 h-full bg-[#0d131f] border-l border-zinc-800 flex flex-col justify-between overflow-y-auto z-10">
      <div className="p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <RouteIcon className="w-5 h-5 text-[#DE4B31]" />
            <span>Campus Directions</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Select your starting point and destination
          </p>
        </div>

        {routeError && (
          <div role="status" className="rounded-xl border border-amber-800/70 bg-amber-950/40 px-3 py-2 text-xs leading-relaxed text-amber-200">
            {routeError}
          </div>
        )}

        {/* ──── Origin & Destination Controls (Point A to B) ──── */}
        <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2.5 relative">
          {/* Starting Point (Origin) */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 mb-1">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Starting Point (From)
              </span>
              <button
                type="button"
                onClick={onUseCurrentLocation}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
              >
                Use Gate 1
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSelectingField(selectingField === "origin" ? null : "origin")}
              className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors cursor-pointer ${
                selectingField === "origin"
                  ? "bg-emerald-950/40 border-emerald-500 text-white"
                  : "bg-zinc-800/70 border-zinc-700 text-zinc-200 hover:border-zinc-600"
              }`}
            >
              <span className="truncate font-medium">
                {originLocation ? originLocation.name : "Select starting location..."}
              </span>
              <span className="text-[10px] text-zinc-400 uppercase font-mono ml-2 shrink-0">
                {selectingField === "origin" ? "Selecting..." : "Change"}
              </span>
            </button>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-1">
            <button
              type="button"
              onClick={onSwapLocations}
              className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-[#DE4B31] border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shadow cursor-pointer text-xs"
              title="Swap starting point and destination"
              aria-label="Swap starting point and destination"
            >
              ⇅
            </button>
          </div>

          {/* Destination */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 mb-1">
              <span className="flex items-center gap-1.5 text-[#DE4B31]">
                <span className="w-2 h-2 rounded-full bg-[#DE4B31]" />
                Destination (To)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectingField(selectingField === "destination" ? null : "destination")}
              className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors cursor-pointer ${
                selectingField === "destination"
                  ? "bg-[#DE4B31]/20 border-[#DE4B31] text-white"
                  : "bg-zinc-800/70 border-zinc-700 text-zinc-200 hover:border-zinc-600"
              }`}
            >
              <span className="truncate font-medium">
                {selectedLocation ? selectedLocation.name : "Select destination..."}
              </span>
              <span className="text-[10px] text-zinc-400 uppercase font-mono ml-2 shrink-0">
                {selectingField === "destination" ? "Selecting..." : "Change"}
              </span>
            </button>
          </div>
        </div>

        {/* ──── Active Route Summary ──── */}
        {activeRoute && (
          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">
                  Calculated Route
                </span>
                <p className="text-xs font-semibold text-white mt-0.5">
                  {activeRoute.fromName} → {activeRoute.toName}
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-[#DE4B31]">
                  ~{activeRoute.estimatedWalkingMinutes} min
                </span>
                <p className="text-[11px] text-zinc-400">
                  {activeRoute.distanceMeters} meters
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={onToggleRoute}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  showRoute
                    ? "bg-[#DE4B31] text-white hover:bg-[#b83821]"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                <span>{showRoute ? "Hide Route" : "Show Route"}</span>
              </button>

              {activeRoute.steps && activeRoute.steps.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSteps(!showSteps)}
                  className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                >
                  {showSteps ? "Hide Steps" : `Steps (${activeRoute.steps.length})`}
                </button>
              )}
            </div>

            {/* Turn-by-Turn Steps */}
            {showSteps && activeRoute.steps && (
              <div className="mt-2 pt-2 border-t border-zinc-800/80 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {activeRoute.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-zinc-800/50 text-[11px] flex items-start gap-2"
                  >
                    <span className="w-5 h-5 rounded-full bg-zinc-700 text-zinc-300 flex items-center justify-center text-[10px] font-mono shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-zinc-200">{step.instruction}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {step.distanceMeters}m
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ──── Selected Destination Card (Details & Save) ──── */}
        {selectedLocation && (
          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                  {selectedLocation.category} • {selectedLocation.code}
                </span>
                <h3 className="text-sm font-bold text-white truncate">
                  {selectedLocation.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleSaveClick}
                className={`p-2 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                  isSaved
                    ? "bg-[#DE4B31]/20 border-[#DE4B31] text-[#DE4B31]"
                    : "bg-zinc-800/70 border-zinc-700 text-zinc-400 hover:text-white"
                }`}
                title={isSaved ? "Remove from saved" : "Save location"}
                aria-label={isSaved ? "Remove from saved" : "Save location"}
              >
                <BookmarkIcon className="w-4 h-4" filled={isSaved} />
              </button>
            </div>

            {selectedLocation.description && (
              <p className="text-xs text-zinc-400 leading-relaxed">
                {selectedLocation.description}
              </p>
            )}

            {saveNotice && (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                <span>{saveNotice}</span>
              </p>
            )}
          </div>
        )}

        {/* Block 34 Notice if user queries for 34 */}
        {isQueryingBlock34 && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/70 text-amber-200 text-xs space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span>⚠️</span>
              <span>Block 34 (Problem Statement P10)</span>
            </p>
            <p className="text-[11px] leading-relaxed text-amber-300">
              Block 34 is not present in Dataset C. In accordance with data integrity guidelines, its coordinates have not been synthesized. It is scheduled for the next physical survey.
            </p>
          </div>
        )}

        {/* ──── Campus Places Search & Filter List ──── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300">
              {selectingField === "origin"
                ? "Choose Starting Point"
                : selectingField === "destination"
                ? "Choose Destination"
                : "All Campus Places"}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              {filteredLocations.length} locations
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <SearchIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={panelSearch}
              onChange={(e) => setPanelSearch(e.target.value)}
              placeholder="Search blocks, gates, food courts..."
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-zinc-900 border border-zinc-700/80 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#DE4B31] transition-all"
            />
            {panelSearch && (
              <button
                onClick={() => setPanelSearch("")}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-400 hover:text-white"
                aria-label="Clear search"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category filter pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-[#DE4B31] text-white shadow-sm"
                    : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Location list */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {filteredLocations.map((loc) => {
              const isOrig = originLocation?.id === loc.id;
              const isDest = selectedLocation?.id === loc.id;

              return (
                <div
                  key={loc.id}
                  className={`p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isDest
                      ? "bg-[#DE4B31]/15 border-[#DE4B31]/70 text-white"
                      : isOrig
                      ? "bg-emerald-950/40 border-emerald-600/70 text-white"
                      : "bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/70 text-zinc-300"
                  }`}
                  onClick={() => handleLocationPick(loc)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white truncate">
                        {loc.name}
                      </span>
                      {isOrig && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white uppercase">
                          Start
                        </span>
                      )}
                      {isDest && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#DE4B31] text-white uppercase">
                          Dest
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                      {loc.description}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOrigin(loc);
                      }}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-emerald-600 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Set as starting point"
                    >
                      <span className="text-[10px] font-bold">Start</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDestination(loc);
                        if (onSelectLocation) onSelectLocation(loc);
                      }}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-[#DE4B31] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Set as destination"
                    >
                      <span className="text-[10px] font-bold">Go</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredLocations.length === 0 && (
              <div className="p-6 text-center text-zinc-500 text-xs rounded-xl bg-zinc-900/40 border border-zinc-800">
                No matching locations found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="p-3 bg-zinc-900/80 border-t border-zinc-800 text-[10px] text-zinc-500 text-center">
        <span>LPU Dataset C &bull; Dijkstra & A* Navigation</span>
      </div>
    </aside>
  );
}
