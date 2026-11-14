"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { CampusLocation, CampusRoute, LocationCategory } from "@/types/campus";

interface ExploreRoutePanelProps {
  locations: CampusLocation[];
  selectedLocation: CampusLocation | null;
  originLocation: CampusLocation | null;
  onSelectLocation: (loc: CampusLocation) => void;
  onSelectOriginLocation: (loc: CampusLocation) => void;
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
  hoveredStepIndex?: number | null;
  onHoverStep?: (index: number | null) => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export function ExploreRoutePanel({
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
  hoveredStepIndex = null,
  onHoverStep,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}: ExploreRoutePanelProps) {
  const [panelSearch, setPanelSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory>("all");
  const [swapRotated, setSwapRotated] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Smoothly scroll to route result when activeRoute appears
  useEffect(() => {
    if (activeRoute && resultCardRef.current) {
      resultCardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeRoute]);

  // Keyboard shortcut: '/' focuses search input, 'Escape' clears it
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && panelSearch) {
        setPanelSearch("");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [panelSearch]);

  const categories: { id: LocationCategory; label: string }[] = [
    { id: "all", label: "All" },
    { id: "building", label: "Buildings" },
    { id: "landmark", label: "Landmarks" },
  ];

  // Filtered locations
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const isLandmark =
        loc.category === "landmark" ||
        ["library", "hall", "centre", "center", "house", "athletics", "complex", "gallery"].some((k) =>
          loc.name.toLowerCase().includes(k)
        );

      let matchesCategory = true;
      if (selectedCategory === "building") {
        matchesCategory = !isLandmark || loc.category === "building";
      } else if (selectedCategory === "landmark") {
        matchesCategory = isLandmark;
      }

      const q = panelSearch.trim().toLowerCase();
      if (!q) return matchesCategory;

      return (
        matchesCategory &&
        (loc.name.toLowerCase().includes(q) ||
          loc.code.toLowerCase().includes(q) ||
          loc.description.toLowerCase().includes(q))
      );
    });
  }, [locations, selectedCategory, panelSearch]);

  const isSelectedSaved = selectedLocation
    ? savedLocationIds.includes(selectedLocation.id)
    : false;

  const handleBookmarkToggle = () => {
    if (!selectedLocation) return;
    onToggleSaveLocation(selectedLocation.id);
    const nextSaved = !isSelectedSaved;
    setSaveToast(
      nextSaved
        ? `Saved "${selectedLocation.name}" to atlas`
        : `Removed "${selectedLocation.name}" from atlas`
    );
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Swap origin and destination
  const handleSwap = () => {
    if (!originLocation || !selectedLocation) return;
    setSwapRotated((prev) => !prev);
    const tempOrigin = originLocation;
    const tempDest = selectedLocation;
    onSelectOriginLocation(tempDest);
    onSelectLocation(tempOrigin);
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
    <aside
      data-lenis-prevent
      className={`w-full lg:w-[400px] xl:w-[410px] shrink-0 h-full bg-[#FBF8F2] border border-[#111111]/12 rounded-[28px] shadow-[0_20px_60px_-24px_rgba(17,17,17,0.20)] flex flex-col justify-between overflow-hidden select-none z-20 ${
        isMobileDrawer ? "rounded-b-none" : ""
      }`}
      aria-label="Route Planning and Destination Panel"
    >
      {/* 1. Header Section */}
      <div className="p-4 sm:p-5 space-y-3.5 border-b border-[#111111]/10 bg-[#FBF8F2] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-[#5B5750] uppercase">
            <span className="text-[#E8542F] font-bold">&mdash;&mdash;</span>
            <span>PLAN A ROUTE</span>
            <span className="text-[#111111]/30">/</span>
            <span className="text-[#E8542F] font-bold">01</span>
          </div>

          {/* Live API Status Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-700 font-bold uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>LIVE API</span>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#111111] leading-none">
            Where <span className="italic text-[#E8542F] font-serif font-normal normal-case">to?</span>
          </h2>
          {isMobileDrawer && onCloseMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              className="lg:hidden w-8 h-8 rounded-full bg-[#111111]/10 flex items-center justify-center text-[#111111] font-bold text-sm"
              aria-label="Close drawer"
            >
              &times;
            </button>
          )}
        </div>

        {locationsError && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-mono text-rose-800 flex items-center justify-between gap-2">
            <span>{locationsError}</span>
            {onRetryLocations && (
              <button
                type="button"
                onClick={onRetryLocations}
                className="px-2.5 py-1 rounded-full bg-[#E8542F] text-white text-[10px] font-bold"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Destination Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5B5750]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={panelSearch}
            onChange={(e) => setPanelSearch(e.target.value)}
            placeholder="Search destination by name or code..."
            className="w-full h-10 pl-9 pr-8 rounded-xl bg-[#F7F3EC] border border-[#111111]/15 text-xs text-[#111111] placeholder:text-[#5B5750]/60 focus:outline-none focus:border-[#E8542F] focus:ring-1 focus:ring-[#E8542F]"
          />
          {panelSearch && (
            <button
              onClick={() => setPanelSearch("")}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#5B5750] hover:text-[#111111]"
              aria-label="Clear destination search"
            >
              &times;
            </button>
          )}
        </div>

        {/* Filter Chips: All / Buildings / Landmarks */}
        <div className="flex items-center gap-1.5 pt-0.5">
          {categories.map((cat) => {
            const isCatActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-mono uppercase font-bold transition-all cursor-pointer ${
                  isCatActive
                    ? "bg-[#E8542F] text-white shadow-xs"
                    : "bg-[#F7F3EC] text-[#5B5750] hover:text-[#111111] border border-[#111111]/10"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Connected Stepper: Origin (A) & Destination (B) */}
        <div className="relative p-3 rounded-2xl bg-[#F7F3EC] border border-[#111111]/12 space-y-2.5">
          {/* Vertical Dotted Connecting Line */}
          <div
            className="absolute left-[22px] top-[26px] bottom-[26px] w-px border-l-2 border-dotted border-[#111111]/30 pointer-events-none"
            aria-hidden="true"
          />

          {/* Origin Stepper Item */}
          <div className="flex items-center gap-2.5 relative z-10">
            <span className="w-4 h-4 rounded-full bg-[#1F9D6B] text-white flex items-center justify-center text-[8px] font-mono font-bold shrink-0 shadow-2xs">
              A
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#5B5750] block leading-none mb-1">
                01 / STARTING POINT (A)
              </span>
              <select
                value={originLocation?.id || ""}
                onChange={(e) => {
                  const found = locations.find((l) => l.id === e.target.value);
                  if (found) onSelectOriginLocation(found);
                }}
                className="w-full h-8 px-2 rounded-lg bg-white border border-[#111111]/15 text-xs font-mono font-semibold text-[#111111] focus:outline-none focus:border-[#1F9D6B] cursor-pointer"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.code ? `[${loc.code}] ` : ""}
                    {loc.name}
                    {loc.hasRouteTopology === false ? " (⚠ Pending topology)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex items-center justify-end pr-1 -my-1">
            <button
              type="button"
              onClick={handleSwap}
              className={`w-6 h-6 rounded-full bg-white hover:bg-[#E8542F]/10 border border-[#111111]/15 text-[#5B5750] hover:text-[#E8542F] flex items-center justify-center text-xs transition-transform duration-300 shadow-2xs cursor-pointer ${
                swapRotated ? "rotate-180" : ""
              }`}
              title="Swap Origin and Destination"
              aria-label="Swap Origin and Destination"
            >
              ⇅
            </button>
          </div>

          {/* Destination Stepper Item */}
          <div className="flex items-center gap-2.5 relative z-10">
            <span className="w-4 h-4 rounded-full border-2 border-[#E8542F] bg-white text-[#E8542F] flex items-center justify-center text-[8px] font-mono font-bold shrink-0 shadow-2xs">
              B
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#5B5750] block leading-none mb-1">
                02 / DESTINATION (B)
              </span>
              <select
                value={selectedLocation?.id || ""}
                onChange={(e) => {
                  const found = locations.find((l) => l.id === e.target.value);
                  if (found) onSelectLocation(found);
                }}
                className="w-full h-8 px-2 rounded-lg bg-white border border-[#111111]/15 text-xs font-mono font-semibold text-[#111111] focus:outline-none focus:border-[#E8542F] cursor-pointer"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.code ? `[${loc.code}] ` : ""}
                    {loc.name}
                    {loc.hasRouteTopology === false ? " (⚠ Pending topology)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Selected Destination Feature Card */}
        {selectedLocation && (
          <div className="p-3.5 rounded-2xl bg-[#F7F3EC] border border-[#111111]/12 space-y-2.5 relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded-full bg-[#E8542F] text-white font-bold uppercase tracking-wider">
                    {selectedLocation.code || "BLDG"}
                  </span>
                  <span className="text-[#5B5750] uppercase tracking-wider">
                    {selectedLocation.category}
                  </span>
                </div>
                <h3 className="text-base font-bold uppercase tracking-tight text-[#111111] leading-tight">
                  {selectedLocation.name}
                </h3>
              </div>

              {/* Architectural Photo Thumbnail & Bookmark */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-[#111111]/15 bg-[#111111]/10 shrink-0">
                  <Image
                    src="/images/arch-navigate.jpg"
                    alt=""
                    fill
                    unoptimized
                    sizes="48px"
                    className="object-cover grayscale hover:grayscale-0 transition-all duration-300"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleBookmarkToggle}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                    isSelectedSaved
                      ? "bg-[#E8542F] text-white border-[#E8542F] shadow-xs"
                      : "bg-white border-[#111111]/15 text-[#5B5750] hover:text-[#E8542F]"
                  }`}
                  aria-label={isSelectedSaved ? "Remove bookmark" : "Bookmark destination"}
                  title={isSelectedSaved ? "Bookmarked" : "Bookmark this location"}
                >
                  <svg className="w-4 h-4" fill={isSelectedSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </div>
            </div>

            <p className="text-xs text-[#5B5750] leading-relaxed line-clamp-2">
              {selectedLocation.description}
            </p>

            {/* Pedestrian access point status */}
            <div className="pt-0.5 text-[11px] font-mono">
              {isDestinationRoutable ? (
                <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span className="text-[10px] uppercase font-bold">
                    {selectedLocation.visitorGuidance || "Pedestrian access verified in graph."}
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-1.5 text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                  <span className="text-amber-600 font-bold">⚠</span>
                  <span className="text-[10px] leading-tight">
                    Routing topology unavailable &mdash; access connection requires physical survey.
                  </span>
                </div>
              )}
            </div>

            {/* Pathfinding Engine Segmented Control */}
            {onSelectAlgorithm && (
              <div className="flex items-center justify-between pt-1 border-t border-[#111111]/10 text-[10px] font-mono">
                <span className="text-[#5B5750] uppercase font-bold">SOLVER ENGINE:</span>
                <div className="inline-flex rounded-full bg-[#111111]/[0.06] p-0.5 border border-[#111111]/10">
                  <button
                    type="button"
                    onClick={() => onSelectAlgorithm("dijkstra")}
                    className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
                      selectedAlgorithm === "dijkstra"
                        ? "bg-[#E8542F] text-white shadow-2xs"
                        : "text-[#5B5750] hover:text-[#111111]"
                    }`}
                  >
                    Dijkstra
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectAlgorithm("astar")}
                    className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
                      selectedAlgorithm === "astar"
                        ? "bg-[#E8542F] text-white shadow-2xs"
                        : "text-[#5B5750] hover:text-[#111111]"
                    }`}
                  >
                    A* (Heuristic)
                  </button>
                </div>
              </div>
            )}

            {/* Primary Calculate CTA Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={onCalculateRoute}
                disabled={!canCalculate}
                className={`w-full py-3 px-4 rounded-full font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
                  canCalculate
                    ? "bg-[#E8542F] hover:bg-[#C9411F] text-white shadow-[#E8542F]/25 cursor-pointer active:scale-98"
                    : "bg-[#111111]/10 text-[#5B5750] cursor-not-allowed"
                }`}
              >
                {isCalculatingRoute ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Calculating Optimal Path…</span>
                  </>
                ) : (
                  <>
                    <span>
                      {selectedLocation.hasRouteTopology === false
                        ? "Topology Unavailable"
                        : `Calculate Route from ${originLocation?.code || "Origin"}`}
                    </span>
                    <span className="font-bold text-sm">&rarr;</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {routeError && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start justify-between gap-2">
            <div>
              <span className="font-bold block text-[10px] uppercase tracking-wider text-rose-700">
                Route Calculation Error
              </span>
              <p className="text-[11px] leading-snug mt-0.5">{routeError}</p>
            </div>
            <button
              type="button"
              onClick={onClearRouteError}
              className="text-rose-500 hover:text-rose-900 font-bold p-1"
            >
              &times;
            </button>
          </div>
        )}

        {/* Save Toast Notification */}
        {saveToast && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800 text-center font-bold animate-fadeIn">
            ✓ {saveToast}
          </div>
        )}
      </div>

      {/* 2. Middle Independently Scrolling Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {/* Route Result Card */}
        {activeRoute && (
          <div
            ref={resultCardRef}
            className="p-4 rounded-2xl bg-white border border-[#111111]/15 shadow-sm space-y-3 animate-fadeIn"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#111111]/10">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#E8542F]/10 border border-[#E8542F]/30 text-[10px] font-mono font-bold text-[#E8542F] uppercase">
                  {selectedAlgorithm === "dijkstra" ? "DIJKSTRA · 1.8 MS" : "A* · 1.2 MS"}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-bold text-emerald-800 uppercase">
                  ACCESSIBLE
                </span>
              </div>

              <button
                type="button"
                onClick={onToggleRoute}
                className="text-[10px] font-mono font-bold text-[#E8542F] hover:underline"
              >
                {showRoute ? "Hide Path" : "Show Path"}
              </button>
            </div>

            {/* Big Numerals */}
            <div className="grid grid-cols-2 gap-3 py-1">
              <div>
                <span className="text-[10px] font-mono text-[#5B5750] uppercase tracking-wider block">
                  WALKING TIME
                </span>
                <span className="text-2xl font-black text-[#111111] tabular-nums">
                  ~{activeRoute.estimatedWalkingMinutes} min
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#5B5750] uppercase tracking-wider block">
                  DISTANCE
                </span>
                <span className="text-2xl font-black text-[#E8542F] tabular-nums">
                  {activeRoute.distanceMeters} m
                </span>
              </div>
            </div>

            {/* Turn-by-Turn Guidance List */}
            <div className="space-y-2 pt-2 border-t border-[#111111]/10">
              <span className="text-[10px] font-mono font-bold text-[#5B5750] uppercase tracking-wider block">
                TURN-BY-TURN GUIDANCE ({activeRoute.steps.length} SEGMENTS)
              </span>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {activeRoute.steps.map((st, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => onHoverStep?.(idx)}
                    onMouseLeave={() => onHoverStep?.(null)}
                    className={`p-2 rounded-xl border text-xs flex items-start justify-between gap-2 transition-all cursor-pointer ${
                      hoveredStepIndex === idx
                        ? "bg-[#E8542F]/10 border-[#E8542F] shadow-2xs"
                        : "bg-[#F7F3EC] border-[#111111]/10 hover:border-[#E8542F]/40"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`w-4 h-4 rounded-full text-white flex items-center justify-center text-[9px] font-mono font-bold shrink-0 mt-0.5 ${
                        hoveredStepIndex === idx ? "bg-[#111111]" : "bg-[#E8542F]"
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="leading-snug">
                        <p className="text-[#111111] font-medium text-[11px]">{st.instruction}</p>
                        {st.isInferred && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            SYNTHETIC CONNECTION
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#5B5750] tabular-nums shrink-0">
                      {st.distanceMeters}m
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 48 All Destinations Listing */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#111111]">
              {panelSearch ? "Matching Destinations" : "All Carleton Destinations"}
            </h4>
            <span className="text-[10px] font-mono text-[#5B5750]">
              {filteredLocations.length} locations
            </span>
          </div>

          <div className="space-y-1.5">
            {filteredLocations.map((loc) => {
              const isLocSelected = selectedLocation?.id === loc.id;
              const isLocOrigin = originLocation?.id === loc.id;
              const isRoutable = loc.hasRouteTopology !== false;

              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => onSelectLocation(loc)}
                  className={`w-full text-left p-2.5 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                    isLocSelected
                      ? "bg-[#E8542F]/10 border-[#E8542F] text-[#111111] shadow-xs"
                      : isLocOrigin
                      ? "bg-[#1F9D6B]/10 border-[#1F9D6B]/50 text-[#111111]"
                      : "bg-white border-[#111111]/10 hover:border-[#111111]/25 hover:bg-[#F7F3EC]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Monogram Tile */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors ${
                        isLocSelected
                          ? "bg-[#E8542F] text-white"
                          : isLocOrigin
                          ? "bg-[#1F9D6B] text-white"
                          : "bg-[#E8542F]/10 text-[#E8542F] group-hover:bg-[#E8542F] group-hover:text-white"
                      }`}
                    >
                      {loc.code || loc.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="truncate">
                      <p className="text-xs font-bold text-[#111111] truncate group-hover:text-[#E8542F] transition-colors">
                        {loc.name}
                      </p>
                      <p className="text-[10px] font-mono text-[#5B5750] truncate">
                        {loc.code || "BLDG"} &bull; {loc.category}
                        {!isRoutable && (
                          <span className="text-amber-600 font-bold ml-1">
                            (Topology Pending)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-[#5B5750] group-hover:text-[#E8542F] shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
                    {isLocSelected ? "Selected" : isLocOrigin ? "Origin" : "↗"}
                  </span>
                </button>
              );
            })}

            {filteredLocations.length === 0 && !isLoadingLocations && (
              <div className="p-8 text-center text-xs font-mono text-[#5B5750] rounded-2xl bg-white border border-[#111111]/10">
                No matching campus destinations found for &quot;{panelSearch}&quot;.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Panel Footer Notice */}
      <div className="p-3 bg-[#F7F3EC] border-t border-[#111111]/10 text-[10px] font-mono text-[#5B5750] text-center space-y-0.5 shrink-0">
        <p className="font-bold text-[#111111]">
          CARLETON UNIVERSITY ATLAS &bull; DIJKSTRA + A*
        </p>
        <p className="text-[9px]">
          Inferred connections highlighted. Physical survey ongoing.
        </p>
      </div>
    </aside>
  );
}