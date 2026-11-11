"use client";

import React, { useState, useMemo } from "react";
import { CampusLocation, CampusRoute, LocationCategory } from "@/types/campus";
import {
  SearchIcon,
  MapPinIcon,
  WalkingIcon,
  AccessibilityIcon,
  BookmarkIcon,
  RouteIcon,
  CloseIcon,
  CheckCircleIcon,
} from "./DashboardIcons";
import { Spinner } from "@/components/icons/Icons";

interface DestinationPanelProps {
  locations: CampusLocation[];
  selectedLocation: CampusLocation | null;
  originLocation: CampusLocation | null;
  onSelectLocation: (location: CampusLocation) => void;
  onSelectOriginLocation: (location: CampusLocation) => void;
  activeRoute: CampusRoute | null;
  showRoute: boolean;
  onToggleRoute: () => void;
  onCalculateRoute: () => void;
  isCalculatingRoute: boolean;
  routeError: string | null;
  onClearRouteError: () => void;
  savedLocationIds: string[];
  onToggleSaveLocation: (id: string) => void;
  isLoadingLocations?: boolean;
  locationsError?: string | null;
  onRetryLocations?: () => void;
  selectedAlgorithm?: "dijkstra" | "astar";
  onSelectAlgorithm?: (algo: "dijkstra" | "astar") => void;
}

export function DestinationPanel({
  locations,
  selectedLocation,
  originLocation,
  onSelectLocation,
  onSelectOriginLocation,
  activeRoute,
  showRoute,
  onToggleRoute,
  onCalculateRoute,
  isCalculatingRoute,
  routeError,
  onClearRouteError,
  savedLocationIds,
  onToggleSaveLocation,
  isLoadingLocations = false,
  locationsError = null,
  onRetryLocations,
  selectedAlgorithm = "dijkstra",
  onSelectAlgorithm,
}: DestinationPanelProps) {
  const [panelSearch, setPanelSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory>("all");
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Filter categories
  const categories: { id: LocationCategory; label: string }[] = [
    { id: "all", label: "All" },
    { id: "building", label: "Buildings" },
    { id: "landmark", label: "Landmarks" },
  ];

  // Filtered locations
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesCategory =
        selectedCategory === "all" || loc.category === selectedCategory;

      const q = panelSearch.trim().toLowerCase();
      if (!q) return matchesCategory;

      const matchesQuery =
        loc.name.toLowerCase().includes(q) ||
        loc.code.toLowerCase().includes(q) ||
        loc.description.toLowerCase().includes(q);

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

  const isDestinationRoutable = selectedLocation ? selectedLocation.hasRouteTopology !== false : false;
  const isOriginRoutable = originLocation ? originLocation.hasRouteTopology !== false : false;
  const canCalculate = Boolean(
    selectedLocation &&
    originLocation &&
    selectedLocation.id !== originLocation.id &&
    isDestinationRoutable &&
    isOriginRoutable &&
    !isCalculatingRoute
  );

  return (
    <aside className="w-full lg:w-96 shrink-0 h-full bg-[#0d131f] border-l border-zinc-800 flex flex-col justify-between overflow-y-auto z-10">
      <div className="p-4 sm:p-5 space-y-4">
        {/* Header with Backend Live Status */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Where do you want to go?
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 border border-emerald-700/80 text-emerald-400">
              Live API
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Search 48 Carleton campus destinations with graph navigation
          </p>
        </div>

        {/* Global Loading or Error Banners */}
        {isLoadingLocations && (
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2 text-xs text-zinc-300">
            <Spinner className="w-4 h-4 text-[#DE4B31]" />
            <span>Fetching live campus destinations...</span>
          </div>
        )}

        {locationsError && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-200 space-y-2">
            <p className="font-semibold">{locationsError}</p>
            {onRetryLocations && (
              <button
                type="button"
                onClick={onRetryLocations}
                className="px-2.5 py-1 rounded-lg bg-red-900 hover:bg-red-800 text-white font-medium text-[11px] transition-colors"
              >
                Retry Loading
              </button>
            )}
          </div>
        )}

        {/* Route Error Notification */}
        {routeError && (
          <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-800 text-xs text-amber-200 flex items-start justify-between gap-2 animate-in fade-in">
            <div className="space-y-1">
              <span className="font-bold block text-[11px] uppercase tracking-wider text-amber-400">
                Route Calculation Error
              </span>
              <p className="text-[11px] leading-snug">{routeError}</p>
            </div>
            <button
              type="button"
              onClick={onClearRouteError}
              className="text-amber-400 hover:text-white p-1"
              aria-label="Dismiss error"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Search input in destination panel */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={panelSearch}
            onChange={(e) => setPanelSearch(e.target.value)}
            placeholder="Search destination by name or code..."
            className="w-full h-10 pl-9 pr-8 rounded-xl bg-zinc-900 border border-zinc-700/80 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#DE4B31] transition-all"
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

        {/* Filter categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-[#DE4B31] text-white shadow-sm"
                  : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Active Origin Selector Card */}
        <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Origin / Starting Point (A)</span>
            </span>
          </div>

          <select
            value={originLocation?.id || ""}
            onChange={(e) => {
              const found = locations.find((l) => l.id === e.target.value);
              if (found) onSelectOriginLocation(found);
            }}
            className="w-full h-9 px-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.code ? `[${loc.code}] ` : ""}{loc.name}
                {loc.hasRouteTopology === false ? " (⚠ Pending topology)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Destination Card */}
        {selectedLocation && (
          <div className="rounded-2xl bg-gradient-to-b from-zinc-800/90 to-zinc-900/90 border border-zinc-700 p-4 shadow-xl space-y-3 relative overflow-hidden">
            {/* Accent glow */}
            <div className="absolute top-0 right-0 w-28 h-28 bg-[#DE4B31]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DE4B31]/20 border border-[#DE4B31]/40 text-[#fca5a5] uppercase">
                    {selectedLocation.code || "BLDG"}
                  </span>
                  <span className="text-[11px] text-zinc-400 capitalize">
                    {selectedLocation.category}
                  </span>
                  <span className="text-[10px] text-zinc-500">Destination (B)</span>
                </div>
                <h3 className="text-base font-bold text-white mt-1 leading-snug">
                  {selectedLocation.name}
                </h3>
              </div>

              {/* Bookmark Button */}
              <button
                type="button"
                onClick={handleSaveClick}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isSaved
                    ? "bg-[#DE4B31]/20 border-[#DE4B31] text-[#DE4B31]"
                    : "bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-white"
                }`}
                title={isSaved ? "Saved" : "Save location"}
                aria-label={isSaved ? "Saved location" : "Save location"}
              >
                <BookmarkIcon className="w-4 h-4" filled={isSaved} />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-light">
              {selectedLocation.description}
            </p>

            {/* Routability Status Verification */}
            <div className="pt-1 text-[11px]">
              {selectedLocation.hasRouteTopology !== false ? (
                <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2 py-1 rounded-lg">
                  <AccessibilityIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[10px]">
                    {selectedLocation.visitorGuidance || "Pedestrian access point verified in graph."}
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-1.5 text-amber-300 bg-amber-950/50 border border-amber-800/60 px-2.5 py-1.5 rounded-lg">
                  <span className="text-amber-400 font-bold shrink-0">⚠</span>
                  <span className="text-[10px] leading-tight">
                    Routing topology unavailable — access connection requires verification. Nearest surveyed pedestrian path exceeds 35m distance threshold.
                  </span>
                </div>
              )}
            </div>

            {/* Algorithm Selector Pill */}
            {onSelectAlgorithm && (
              <div className="flex items-center justify-between pt-1 border-t border-zinc-800 text-[11px]">
                <span className="text-zinc-400 text-[10px]">Pathfinding Engine:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onSelectAlgorithm("dijkstra")}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      selectedAlgorithm === "dijkstra"
                        ? "bg-[#DE4B31] text-white"
                        : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Dijkstra
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectAlgorithm("astar")}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      selectedAlgorithm === "astar"
                        ? "bg-[#DE4B31] text-white"
                        : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    A* (Heuristic)
                  </button>
                </div>
              </div>
            )}

            {/* Calculate Route Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onCalculateRoute}
                disabled={!canCalculate}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg ${
                  canCalculate
                    ? "bg-[#DE4B31] hover:bg-[#c93f27] text-white shadow-[#DE4B31]/30 cursor-pointer"
                    : "bg-zinc-800 text-zinc-500 border border-zinc-700/60 cursor-not-allowed"
                }`}
              >
                {isCalculatingRoute ? (
                  <>
                    <Spinner className="w-4 h-4 text-white" />
                    <span>Calculating Optimal Path...</span>
                  </>
                ) : (
                  <>
                    <RouteIcon className="w-4 h-4" />
                    <span>
                      {selectedLocation.hasRouteTopology === false
                        ? "Routing Topology Unavailable"
                        : `Calculate Route from ${originLocation?.code || "Origin"}`}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Active Route Metrics & Guidance Steps */}
            {activeRoute && (
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-700/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <WalkingIcon className="w-4 h-4 text-[#DE4B31]" />
                    <span>
                      {activeRoute.fromName} → {activeRoute.toName}
                    </span>
                  </div>
                  <div className="font-semibold text-white">
                    ~{activeRoute.estimatedWalkingMinutes} min ({activeRoute.distanceMeters}m)
                  </div>
                </div>

                {/* Turn-by-Turn Navigation Steps */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block px-1">
                    Turn-by-Turn Guidance ({activeRoute.steps.length} segments)
                  </span>
                  {activeRoute.steps.map((st, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-[11px] flex items-start justify-between gap-2"
                    >
                      <div className="flex items-start gap-1.5">
                        <span className="text-[#DE4B31] font-bold text-xs shrink-0 mt-0.5">
                          {idx + 1}.
                        </span>
                        <div>
                          <p className="text-zinc-200 leading-tight">{st.instruction}</p>
                          {st.isInferred && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-medium bg-amber-950/80 border border-amber-800 text-amber-300">
                              Synthetic Access Connection
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                        {st.distanceMeters}m
                      </span>
                    </div>
                  ))}
                </div>

                {/* Toggle Map Preview Visibility */}
                <button
                  type="button"
                  onClick={onToggleRoute}
                  className="w-full py-1.5 px-3 rounded-lg text-[11px] font-medium text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
                >
                  {showRoute ? "Hide Route Path on Map" : "Show Route Path on Map"}
                </button>
              </div>
            )}

            {saveNotice && (
              <div className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 rounded-lg p-2 text-center flex items-center justify-center gap-1.5 animate-in fade-in">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                <span>{saveNotice}</span>
              </div>
            )}
          </div>
        )}

        {/* Filtered Destination Listing */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              {panelSearch ? "Matching Destinations" : "All Carleton Destinations"}
            </h4>
            <span className="text-[11px] text-zinc-500">
              {filteredLocations.length} locations
            </span>
          </div>

          <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
            {filteredLocations.map((loc) => {
              const isSelected = selectedLocation?.id === loc.id;
              const isOrigin = originLocation?.id === loc.id;
              const isRoutable = loc.hasRouteTopology !== false;

              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => onSelectLocation(loc)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? "bg-zinc-800 border-[#DE4B31]/80 text-white shadow-md"
                      : isOrigin
                      ? "bg-emerald-950/30 border-emerald-800/60 text-zinc-200"
                      : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/70 hover:border-zinc-700 text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-[#DE4B31] text-white"
                          : isOrigin
                          ? "bg-emerald-600 text-white"
                          : "bg-zinc-800 text-zinc-400 group-hover:text-zinc-200"
                      }`}
                    >
                      <MapPinIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-zinc-100 truncate">
                        {loc.name}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate">
                        {loc.code || "BLDG"} &bull; {loc.category}
                        {!isRoutable && (
                          <span className="text-amber-400 font-semibold ml-1">
                            (Topology pending)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs text-zinc-500 group-hover:text-zinc-300 shrink-0 ml-2">
                    {isSelected ? "Selected" : isOrigin ? "Origin" : "→"}
                  </span>
                </button>
              );
            })}

            {filteredLocations.length === 0 && !isLoadingLocations && (
              <div className="p-6 text-center text-zinc-500 text-xs rounded-xl bg-zinc-900/40 border border-zinc-800">
                No matching destinations found for &quot;{panelSearch}&quot;.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Demonstration Notice */}
      <div className="p-3 bg-zinc-900/80 border-t border-zinc-800 text-[10px] text-zinc-500 text-center space-y-0.5">
        <p className="font-medium text-zinc-400">
          Carleton Demonstration &bull; Real Graph Routing Engine
        </p>
        <p className="text-[9px] text-zinc-500">
          Inferred connections are clearly flagged. Physical survey pending.
        </p>
      </div>
    </aside>
  );
}
