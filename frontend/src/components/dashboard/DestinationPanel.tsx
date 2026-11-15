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
} from "./DashboardIcons";

interface DestinationPanelProps {
  locations: CampusLocation[];
  originLocation: CampusLocation | null;
  selectedLocation: CampusLocation | null;
  onSelectOrigin: (location: CampusLocation) => void;
  onSelectDestination: (location: CampusLocation) => void;
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
      setSelectingField(null);
    }
  };

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
            {routeError} No route is being drawn. Campus path or entrance data may need verification.
          </div>
        )}

        {/* ──── Origin & Destination Controls (A to B) ──── */}
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
                className="text-[10px] text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
                title="Detect GPS location"
              >
                <span>📍 My GPS Location</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSelectingField(selectingField === "origin" ? null : "origin")}
              className={`w-full h-10 px-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                selectingField === "origin"
                  ? "bg-zinc-800 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/30"
                  : "bg-zinc-950 border-zinc-700/80 text-zinc-200 hover:border-zinc-600"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-medium truncate">
                  {originLocation?.name || "Choose starting point..."}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono shrink-0 ml-1">
                {originLocation?.code || "Change"}
              </span>
            </button>
          </div>

          {/* Swap Button (⇅) */}
          <div className="flex justify-center -my-1 z-10 relative">
            <button
              type="button"
              onClick={onSwapLocations}
              className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-[#DE4B31] border border-zinc-700 hover:border-[#DE4B31] text-zinc-300 hover:text-white flex items-center justify-center transition-all shadow-md cursor-pointer"
              title="Swap Starting Point and Destination"
              aria-label="Swap Starting Point and Destination"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* Destination (To) */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 mb-1">
              <span className="flex items-center gap-1.5 text-[#fca5a5]">
                <span className="w-2 h-2 rounded-full bg-[#DE4B31]" />
                Destination (To)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectingField(selectingField === "destination" ? null : "destination")}
              className={`w-full h-10 px-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                selectingField === "destination"
                  ? "bg-zinc-800 border-[#DE4B31] text-white shadow-sm ring-1 ring-[#DE4B31]/30"
                  : "bg-zinc-950 border-zinc-700/80 text-zinc-200 hover:border-zinc-600"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DE4B31] shrink-0" />
                <span className="font-medium truncate">
                  {selectedLocation?.name || "Choose destination..."}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono shrink-0 ml-1">
                {selectedLocation?.code || "Change"}
              </span>
            </button>
          </div>
        </div>

        {/* ──── Route Metrics & Turn-by-Turn Steps ──── */}
        {activeRoute && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-zinc-800/90 to-zinc-900/90 border border-zinc-700 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Walking Route
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-black text-white">
                    ~{activeRoute.estimatedWalkingMinutes} min
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    (~{activeRoute.distanceMeters} m est.)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onToggleRoute}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  showRoute
                    ? "bg-[#DE4B31] text-white shadow-md shadow-[#DE4B31]/20"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700"
                }`}
              >
                {showRoute ? "Hide on Map" : "Show on Map"}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <AccessibilityIcon className="w-3.5 h-3.5" />
                <span>{activeRoute.isAccessible ? "Accessibility verified" : "Accessibility unverified"}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSteps(!showSteps)}
                className="text-[11px] text-[#fca5a5] hover:underline font-medium cursor-pointer"
              >
                {showSteps ? "Hide Steps" : `View ${activeRoute.steps.length} Steps`}
              </button>
            </div>

            {/* Turn-by-turn navigation steps accordion */}
            {showSteps && activeRoute.steps.length > 0 && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pt-2 border-t border-zinc-800 pr-1">
                {activeRoute.steps.map((st, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg bg-zinc-950/70 border border-zinc-800 text-[11px] flex items-start gap-2"
                  >
                    <span className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-300 font-mono text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-zinc-200">{st.instruction}</p>
                      {st.distanceMeters > 0 && (
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          ~{st.distanceMeters} m est.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ──── Destination Details Card (when selected) ──── */}
        {selectedLocation && (
          <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-3.5 space-y-2 relative">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DE4B31]/20 border border-[#DE4B31]/40 text-[#fca5a5] uppercase">
                    {selectedLocation.code}
                  </span>
                  <span className="text-[10px] text-zinc-400 capitalize">
                    {selectedLocation.category}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-1">
                  {selectedLocation.name}
                </h3>
              </div>

              {/* Bookmark Button */}
              <button
                type="button"
                onClick={handleSaveClick}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isSaved
                    ? "bg-[#DE4B31]/20 border-[#DE4B31] text-[#DE4B31]"
                    : "bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-white"
                }`}
                title={isSaved ? "Saved" : "Save location"}
                aria-label="Bookmark destination"
              >
                <BookmarkIcon className="w-4 h-4" filled={isSaved} />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-light">
              {selectedLocation.description}
            </p>

            {saveNotice && (
              <div className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 rounded-lg p-1.5 text-center flex items-center justify-center gap-1.5">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                <span>{saveNotice}</span>
              </div>
            )}
          </div>
        )}

        {/* ──── Location Search / Browser ──── */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">
              {selectingField === "origin"
                ? "Select Starting Point"
                : selectingField === "destination"
                ? "Select Destination"
                : "Browse Campus Locations"}
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              {filteredLocations.length} locations
            </span>
          </div>

          {/* Search box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <SearchIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={panelSearch}
              onChange={(e) => setPanelSearch(e.target.value)}
              placeholder="Filter blocks, hostels, food courts..."
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

          {/* Filter category pills */}
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
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-600 text-white uppercase">
                          Start
                        </span>
                      )}
                      {isDest && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#DE4B31] text-white uppercase">
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
          </div>
        </div>
      </div>
    </aside>
  );
}
