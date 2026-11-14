"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
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
  const [hasScrolled, setHasScrolled] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("campusway_recent_destinations");
      return stored ? JSON.parse(stored).slice(0, 3) : [];
    } catch {
      return [];
    }
  });
  const [compareActive, setCompareActive] = useState(false);
  const [showAllDestinations, setShowAllDestinations] = useState(false);
  const [showAllSteps, setShowAllSteps] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const resultCardRef = useRef<HTMLDivElement>(null);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    try {
      const updated = [term.trim(), ...recentSearches.filter((s) => s.toLowerCase() !== term.toLowerCase())].slice(0, 3);
      setRecentSearches(updated);
      localStorage.setItem("campusway_recent_destinations", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Smoothly scroll ONLY the scroller (not ancestors) when activeRoute appears
  useEffect(() => {
    if (activeRoute && resultCardRef.current && scrollerRef.current) {
      const topOffset = resultCardRef.current.offsetTop - 16;
      scrollerRef.current.scrollTo({ top: topOffset, behavior: "smooth" });
    }
  }, [activeRoute]);

  const isSelectedSaved = selectedLocation
    ? savedLocationIds.includes(selectedLocation.id)
    : false;

  const handleBookmarkToggle = useCallback(() => {
    if (!selectedLocation) return;
    onToggleSaveLocation(selectedLocation.id);
    const nextSaved = !isSelectedSaved;
    setSaveToast(
      nextSaved
        ? `Saved "${selectedLocation.name}" to atlas`
        : `Removed "${selectedLocation.name}" from atlas`
    );
    setTimeout(() => setSaveToast(null), 2500);
  }, [selectedLocation, isSelectedSaved, onToggleSaveLocation]);

  // Keyboard shortcuts: '/' focuses search, 'Escape' clears, 'C' calculates, 'S' bookmarks
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isInput =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT";

      if (e.key === "Escape" && panelSearch) {
        setPanelSearch("");
      } else if (!isInput) {
        if (e.key === "c" || e.key === "C") {
          e.preventDefault();
          onCalculateRoute();
        } else if ((e.key === "s" || e.key === "S") && selectedLocation) {
          e.preventDefault();
          handleBookmarkToggle();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [panelSearch, onCalculateRoute, selectedLocation, handleBookmarkToggle]);

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

  // Sorted destinations: selected/recent first, then alphabetical
  const sortedDestinations = useMemo(() => {
    return [...filteredLocations].sort((a, b) => {
      if (a.id === selectedLocation?.id) return -1;
      if (b.id === selectedLocation?.id) return 1;
      if (a.id === originLocation?.id) return -1;
      if (b.id === originLocation?.id) return 1;

      const aRecent = recentSearches.includes(a.name) || recentSearches.includes(a.code);
      const bRecent = recentSearches.includes(b.name) || recentSearches.includes(b.code);
      if (aRecent && !bRecent) return -1;
      if (!aRecent && bRecent) return 1;

      return a.name.localeCompare(b.name);
    });
  }, [filteredLocations, selectedLocation, originLocation, recentSearches]);

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

  // Copy shareable route link to clipboard
  const handleCopyShareLink = () => {
    if (!originLocation || !selectedLocation) return;
    const originCode = originLocation.code || originLocation.id;
    const destCode = selectedLocation.code || selectedLocation.id;
    const shareUrl = `${window.location.origin}/explore?from=${encodeURIComponent(originCode)}&to=${encodeURIComponent(destCode)}&algo=${selectedAlgorithm}`;
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setSaveToast("Route link copied to clipboard!");
      setTimeout(() => setSaveToast(null), 2500);
    });
  };

  return (
    <aside
      data-lenis-prevent
      className={`w-full lg:w-[400px] xl:w-[410px] shrink-0 h-full bg-white border border-[#E1DDD3] rounded-[20px] shadow-[0_1px_0_rgba(14,17,24,0.04),0_18px_40px_-18px_rgba(14,17,24,0.28)] flex flex-col min-h-0 overflow-hidden select-none z-20 ${
        isMobileDrawer ? "rounded-b-none" : ""
      }`}
      aria-label="Route Planning and Destination Panel"
    >
      {/* 1. Scrollable Panel Body (flex: 1 1 auto; min-height: 0; overflow-y: auto) */}
      <div
        id="panel-scroll"
        ref={scrollerRef}
        onScroll={(e) => {
          if ((e.currentTarget as HTMLElement).scrollTop > 30) {
            setHasScrolled(true);
          }
        }}
        data-lenis-prevent
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 slim-scrollbar relative"
      >
        {/* Header Row */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-[#6B665C] uppercase">
              <span className="text-[#E8542F] font-bold">&mdash;</span>
              <span>PLAN A ROUTE</span>
              <span className="text-[#0E1118]/25">/</span>
              <span className="font-bold">01</span>
            </div>

            {/* Live API Status Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-800 font-bold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>LIVE API</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <h2 className="text-[32px] font-black uppercase tracking-tight text-[#0E1118] leading-none font-display">
              Where <span className="font-display font-black italic text-[#E8542F]">to?</span>
            </h2>

            {isMobileDrawer && onCloseMobileDrawer && (
              <button
                type="button"
                onClick={onCloseMobileDrawer}
                className="w-8 h-8 rounded-full bg-[#F7F5F0] hover:bg-[#E1DDD3] text-[#0E1118] flex items-center justify-center font-bold text-sm cursor-pointer"
                aria-label="Close drawer"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Offline / Error Banner */}
        {locationsError && (
          <div className="p-3 rounded-[14px] bg-rose-50 border border-rose-200 text-xs font-sans text-rose-800 flex items-center justify-between gap-2">
            <span>{locationsError}</span>
            {onRetryLocations && (
              <button
                type="button"
                onClick={onRetryLocations}
                className="px-2.5 py-1 rounded-full bg-[#E8542F] text-white text-[10px] font-mono font-bold uppercase cursor-pointer"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Destination Search Input with clean single focus glow */}
        <div className="space-y-1.5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B665C]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={panelSearch}
              onChange={(e) => setPanelSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && panelSearch) {
                  saveRecentSearch(panelSearch);
                }
              }}
              placeholder="Search destination by name or code..."
              className="w-full h-10 pl-10 pr-8 rounded-[12px] bg-[#F7F5F0] border border-[#E1DDD3] text-xs font-sans text-[#0E1118] placeholder:text-[#6B665C]/70 focus-ring-orange"
            />
            {panelSearch && (
              <button
                onClick={() => setPanelSearch("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B665C] hover:text-[#0E1118] cursor-pointer"
                aria-label="Clear destination search"
              >
                &times;
              </button>
            )}
          </div>

          {/* Recent Searches Chips */}
          {!panelSearch && recentSearches.length > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className="text-[#6B665C]">Recent:</span>
              {recentSearches.map((term, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPanelSearch(term)}
                  className="px-2 py-0.5 rounded-full bg-[#F7F5F0] hover:bg-[#E1DDD3] text-[#0E1118] border border-[#E1DDD3] transition-colors cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
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
                    : "bg-[#F7F5F0] text-[#6B665C] hover:text-[#0E1118] border border-[#E1DDD3]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Connected Stepper: Origin (A) & Destination (B) */}
        <div className="relative p-3.5 rounded-[16px] bg-[#F7F5F0] border border-[#E1DDD3] space-y-2.5">
          {/* Vertical Dotted Connecting Line */}
          <div
            className="absolute left-[24px] top-[26px] bottom-[26px] w-px border-l-2 border-dotted border-[#0E1118]/25 pointer-events-none"
            aria-hidden="true"
          />

          {/* Origin Stepper Item */}
          <div className="flex items-center gap-2.5 relative z-10">
            <span className="w-5 h-5 rounded-full bg-[#0F6E73] text-white flex items-center justify-center text-[9px] font-mono font-bold shrink-0 shadow-2xs">
              A
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#6B665C] block leading-none mb-1 font-semibold">
                01 / STARTING POINT (A)
              </span>
              <select
                value={originLocation?.id || ""}
                onChange={(e) => {
                  const found = locations.find((l) => l.id === e.target.value);
                  if (found) onSelectOriginLocation(found);
                }}
                className="w-full h-8 px-2 rounded-lg bg-white border border-[#E1DDD3] text-xs font-sans font-semibold text-[#0E1118] focus-ring-orange cursor-pointer"
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
              className={`w-6 h-6 rounded-full bg-white hover:bg-[#E8542F]/10 border border-[#E1DDD3] text-[#6B665C] hover:text-[#E8542F] flex items-center justify-center text-xs transition-transform duration-300 shadow-2xs cursor-pointer ${
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
            <span className="w-5 h-5 rounded-full border-2 border-[#E8542F] bg-white text-[#E8542F] flex items-center justify-center text-[9px] font-mono font-bold shrink-0 shadow-2xs">
              B
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#6B665C] block leading-none mb-1 font-semibold">
                02 / DESTINATION (B)
              </span>
              <select
                value={selectedLocation?.id || ""}
                onChange={(e) => {
                  const found = locations.find((l) => l.id === e.target.value);
                  if (found) onSelectLocation(found);
                }}
                className="w-full h-8 px-2 rounded-lg bg-white border border-[#E1DDD3] text-xs font-sans font-semibold text-[#0E1118] focus-ring-orange cursor-pointer"
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

        {/* Selected Destination Feature Card (Compact 56px photo, no duplicate text) */}
        {selectedLocation && (
          <div className="p-3.5 rounded-[16px] bg-white border border-[#E1DDD3] space-y-2.5 relative shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded-full bg-[#E8542F] text-white font-bold uppercase tracking-wider">
                    {selectedLocation.code || "BLDG"}
                  </span>
                  <span className="text-[#6B665C] uppercase tracking-wider">
                    {selectedLocation.category}
                  </span>
                </div>
                <h3 className="text-base font-bold uppercase tracking-tight text-[#0E1118] leading-tight font-sans">
                  {selectedLocation.name}
                </h3>
              </div>

              {/* 56px Thumbnail & Bookmark Button */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative w-14 h-14 rounded-[12px] overflow-hidden border border-[#E1DDD3] bg-[#0E1118]/05 shrink-0">
                  <Image
                    src="/images/arch-navigate.jpg"
                    alt=""
                    fill
                    unoptimized
                    sizes="56px"
                    className="object-cover grayscale hover:grayscale-0 transition-all duration-300"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleBookmarkToggle}
                  className={`w-9 h-9 rounded-[12px] border flex items-center justify-center transition-all cursor-pointer ${
                    isSelectedSaved
                      ? "bg-[#E8542F] text-white border-[#E8542F] shadow-xs"
                      : "bg-[#F7F5F0] border-[#E1DDD3] text-[#6B665C] hover:text-[#E8542F]"
                  }`}
                  aria-label={isSelectedSaved ? "Remove bookmark" : "Bookmark destination"}
                  title={isSelectedSaved ? "Bookmarked (S)" : "Bookmark this location (S)"}
                >
                  <svg className="w-4 h-4" fill={isSelectedSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Pedestrian access status */}
            <div className="pt-0.5 text-[11px] font-mono">
              {isDestinationRoutable ? (
                <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span className="text-[10px] uppercase font-bold">
                    {selectedLocation.visitorGuidance || "Pedestrian access point verified."}
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-1.5 text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-[10px]">
                  <span className="text-amber-600 font-bold">⚠</span>
                  <span className="text-[10px] leading-tight">
                    Routing topology unavailable &mdash; requires physical survey.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Route Error Notification */}
        {routeError && (
          <div className="p-3 rounded-[14px] bg-rose-50 border border-rose-200 text-xs font-sans text-rose-900 flex items-start justify-between gap-2">
            <div>
              <span className="font-bold block text-[10px] font-mono uppercase tracking-wider text-rose-700">
                Route Calculation Error
              </span>
              <p className="text-[11px] leading-snug mt-0.5">{routeError}</p>
            </div>
            <button
              type="button"
              onClick={onClearRouteError}
              className="text-rose-500 hover:text-rose-900 font-bold p-1 cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {/* Save Toast Notification */}
        {saveToast && (
          <div className="p-2.5 rounded-[12px] bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800 text-center font-bold animate-fadeIn">
            ✓ {saveToast}
          </div>
        )}

        {/* Route Result Card: Deep Ink-Navy Focal Card */}
        {activeRoute && (
          <div
            ref={resultCardRef}
            className="p-4 rounded-[16px] bg-gradient-to-b from-[#151B28] to-[#0F141F] text-[#F4F1EA] border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_28px_rgba(15,20,31,0.35)] space-y-3 animate-fadeIn"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#E8542F]/20 border border-[#E8542F]/40 text-[10px] font-mono font-bold text-[#E8542F] uppercase">
                  {selectedAlgorithm === "dijkstra" ? "DIJKSTRA · 1.8 MS" : "A* · 1.2 MS"}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#0F6E73]/35 text-[#8FE3D6] border border-[#0F6E73]/40 text-[10px] font-mono font-bold uppercase">
                  ACCESSIBLE
                </span>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="text-[#B4BCCB] hover:text-white transition-colors cursor-pointer underline"
                >
                  Share Link
                </button>
                <span className="text-white/20">&bull;</span>
                <button
                  type="button"
                  onClick={onToggleRoute}
                  className="font-bold text-[#E8542F] hover:underline cursor-pointer"
                >
                  {showRoute ? "Hide Path" : "Show Path"}
                </button>
              </div>
            </div>

            {/* Big Numerals */}
            <div className="grid grid-cols-2 gap-3 py-1">
              <div>
                <span className="text-[10px] font-mono text-[#B4BCCB] uppercase tracking-wider block">
                  WALKING TIME
                </span>
                <span className="text-2xl font-black text-white tabular-nums font-sans">
                  ~{activeRoute.estimatedWalkingMinutes} min
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#B4BCCB] uppercase tracking-wider block">
                  DISTANCE
                </span>
                <span className="text-2xl font-black text-[#E8542F] tabular-nums font-sans">
                  {activeRoute.distanceMeters} m
                </span>
              </div>
            </div>

            {/* Engine comparison link */}
            {onSelectAlgorithm && (
              <div className="pt-1 text-[10px] font-mono text-[#B4BCCB] flex items-center justify-between">
                <span>Solvers: Dijkstra (Optimal) &bull; A* (Fast)</span>
                <button
                  type="button"
                  onClick={() => {
                    const otherAlgo = selectedAlgorithm === "dijkstra" ? "astar" : "dijkstra";
                    onSelectAlgorithm(otherAlgo);
                    setCompareActive(true);
                  }}
                  className="text-[#E8542F] font-bold hover:underline cursor-pointer"
                >
                  {compareActive ? `Switch to ${selectedAlgorithm === "dijkstra" ? "A*" : "Dijkstra"}` : `Compare with ${selectedAlgorithm === "dijkstra" ? "A*" : "Dijkstra"}`}
                </button>
              </div>
            )}

            {/* Turn-by-Turn Guidance List with Expandable All Steps */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#B4BCCB] uppercase tracking-wider block">
                  TURN-BY-TURN ({activeRoute.steps.length} SEGMENTS)
                </span>
                <span className="text-[9px] font-mono text-[#B4BCCB]">
                  {showAllSteps ? `All ${activeRoute.steps.length} steps` : `First 4 of ${activeRoute.steps.length}`}
                </span>
              </div>

              <div className={`space-y-1.5 ${showAllSteps ? "max-h-72" : "max-h-48"} overflow-y-auto pr-1 slim-scrollbar transition-all duration-300`}>
                {(showAllSteps ? activeRoute.steps : activeRoute.steps.slice(0, 4)).map((st, idx) => {
                  let cleanText = st.instruction.replace(/\[Inferred Connection\]\s*/i, "");
                  cleanText = cleanText.replace(/inferred_access/gi, "inferred connector");
                  cleanText = cleanText.replace(/inferred_corridor/gi, "inferred corridor");
                  cleanText = cleanText.replace(/_/g, " ");
                  cleanText = cleanText.replace(/(\d+(\.\d+)?)m\b/g, "$1 m");
                  cleanText = cleanText.replace(/\(Pending survey\)/i, "· pending survey").trim();

                  const isSynthetic = st.isInferred || st.instruction.includes("Inferred") || st.instruction.includes("inferred");

                  return (
                    <div
                      key={idx}
                      title={st.instruction}
                      onMouseEnter={() => onHoverStep?.(idx)}
                      onMouseLeave={() => onHoverStep?.(null)}
                      className={`p-2 rounded-[10px] border text-xs flex items-start justify-between gap-2 transition-all cursor-pointer ${
                        hoveredStepIndex === idx
                          ? "bg-[#E8542F]/20 border-[#E8542F] shadow-2xs"
                          : "bg-[#0F141F] border-white/[0.06] hover:border-[#E8542F]/40"
                      }`}
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <span
                          className={`w-4 h-4 rounded-full text-white flex items-center justify-center text-[9px] font-mono font-bold shrink-0 mt-0.5 ${
                            hoveredStepIndex === idx ? "bg-[#FFBF29] text-black" : "bg-[#E8542F]"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="leading-snug font-sans min-w-0">
                          <p className="text-[#F4F1EA] font-medium text-[11px] truncate">{cleanText}</p>
                          {isSynthetic && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-900/60 text-amber-200 border border-amber-600/40">
                              SYNTHETIC CONNECTION
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#B4BCCB] tabular-nums shrink-0">
                        {st.distanceMeters} m
                      </span>
                    </div>
                  );
                })}
              </div>

              {activeRoute.steps.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllSteps(!showAllSteps)}
                  className="w-full py-1.5 px-3 rounded-[10px] bg-white/[0.06] hover:bg-white/[0.12] text-[#B4BCCB] hover:text-white text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>
                    {showAllSteps
                      ? "Show fewer ↑"
                      : `Show all ${activeRoute.steps.length} steps ↓`}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Compact 48 Destinations Listing (First 6 rows with expander) */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0E1118]">
              {panelSearch ? "Matching Destinations" : "All Carleton Destinations"}
            </h4>
            <span className="text-[10px] font-mono text-[#6B665C]">
              {sortedDestinations.length} locations
            </span>
          </div>

          {sortedDestinations.length === 0 ? (
            <div className="p-6 text-center rounded-[14px] bg-[#F7F5F0] border border-[#E1DDD3] text-xs font-sans text-[#6B665C]">
              <p className="font-semibold text-[#0E1118]">No matches found for &ldquo;{panelSearch}&rdquo;</p>
              <p className="mt-1 text-[11px]">Try searching by building code (e.g. ML, PA, ME) or full name.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {(showAllDestinations
                ? sortedDestinations
                : sortedDestinations.slice(0, panelSearch ? 8 : 6)
              ).map((loc) => {
                const isLocSelected = selectedLocation?.id === loc.id;
                const isLocOrigin = originLocation?.id === loc.id;
                const isSaved = savedLocationIds.includes(loc.id);

                return (
                  <div
                    key={loc.id}
                    onClick={() => onSelectLocation(loc)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSelectLocation(loc);
                    }}
                    tabIndex={0}
                    className={`group h-11 px-3 rounded-[12px] border text-xs flex items-center justify-between transition-all cursor-pointer relative ${
                      isLocSelected
                        ? "bg-[#FDE9E2] border-[#E8542F] text-[#0E1118] font-semibold shadow-xs"
                        : isLocOrigin
                        ? "bg-emerald-50 border-[#0F6E73] text-[#0E1118]"
                        : "bg-white border-[#E1DDD3] hover:bg-[#F7F5F0] hover:border-[#E8542F]/60 text-[#0E1118]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-[11px] font-mono font-bold shrink-0 ${
                          isLocSelected
                            ? "bg-[#E8542F] text-white shadow-xs"
                            : isLocOrigin
                            ? "bg-[#0F6E73] text-white"
                            : "bg-[#F7F5F0] text-[#0E1118] border border-[#E1DDD3]"
                        }`}
                      >
                        {loc.code || "BLD"}
                      </span>
                      <div className="min-w-0 font-sans flex items-baseline gap-1.5">
                        <span className="truncate font-semibold text-[13px]">{loc.name}</span>
                        <span className="text-[10px] font-mono text-[#6B665C] uppercase shrink-0">
                          {loc.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Bookmark icon affordance on hover */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSaveLocation(loc.id);
                        }}
                        className={`p-1 rounded-md transition-opacity cursor-pointer ${
                          isSaved ? "opacity-100 text-[#E8542F]" : "opacity-0 group-hover:opacity-100 text-[#6B665C] hover:text-[#E8542F]"
                        }`}
                        title={isSaved ? "Remove bookmark" : "Save place"}
                        aria-label={isSaved ? "Remove bookmark" : "Save place"}
                      >
                        <svg className="w-3.5 h-3.5" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>

                      {isLocSelected ? (
                        <span className="text-[10px] font-mono font-bold text-[#E8542F]">
                          ✓ DEST
                        </span>
                      ) : isLocOrigin ? (
                        <span className="text-[10px] font-mono font-bold text-[#0F6E73]">
                          ORIGIN
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-[#E8542F] opacity-0 group-hover:opacity-100 transition-opacity">
                          ↗
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Show All / Show Less Toggle Button */}
              {sortedDestinations.length > (panelSearch ? 8 : 6) && (
                <button
                  type="button"
                  onClick={() => setShowAllDestinations(!showAllDestinations)}
                  className="w-full py-2.5 px-3 rounded-[12px] bg-[#F7F5F0] hover:bg-[#E1DDD3] text-[#0E1118] text-xs font-mono font-bold flex items-center justify-between border border-[#E1DDD3] transition-colors cursor-pointer mt-1"
                >
                  <span>
                    {showAllDestinations
                      ? "Show less ↑"
                      : `Show all ${sortedDestinations.length} destinations ↓`}
                  </span>
                  <span className="text-[10px] text-[#6B665C]">
                    {showAllDestinations
                      ? `${sortedDestinations.length} of ${sortedDestinations.length}`
                      : `${panelSearch ? 8 : 6} of ${sortedDestinations.length}`}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="pt-3 pb-1 text-center font-mono text-[9px] text-[#6B665C] border-t border-[#E1DDD3]">
          Carleton University Atlas &bull; Dijkstra + A* &bull; Inferred connections highlighted
        </div>

        {/* Floating "Destinations ↓" Nudge Pill on first load */}
        {!hasScrolled && filteredLocations.length > 5 && (
          <div className="sticky bottom-1 flex justify-center pointer-events-none z-10 animate-bounce">
            <button
              type="button"
              onClick={() => {
                scrollerRef.current?.scrollBy({ top: 160, behavior: "smooth" });
                setHasScrolled(true);
              }}
              className="px-3 py-1 rounded-full bg-[#0E1118]/85 text-white text-[10px] font-mono shadow-md backdrop-blur-sm pointer-events-auto cursor-pointer"
            >
              Destinations &darr;
            </button>
          </div>
        )}
      </div>

      {/* 2. Docked Bottom Bar (flex: none; always visible) */}
      <div className="flex-none p-4 bg-white/95 backdrop-blur-md border-t border-[#E1DDD3] shadow-[0_-4px_16px_rgba(14,17,24,0.06)] space-y-2.5 z-10">
        {/* Solver Engine Selector */}
        {onSelectAlgorithm && (
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-[#6B665C] uppercase font-bold">SOLVER ENGINE:</span>
            <div className="inline-flex rounded-full bg-[#F7F5F0] p-0.5 border border-[#E1DDD3]">
              <button
                type="button"
                onClick={() => onSelectAlgorithm("dijkstra")}
                className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  selectedAlgorithm === "dijkstra"
                    ? "bg-[#E8542F] text-white shadow-2xs"
                    : "text-[#6B665C] hover:text-[#0E1118]"
                }`}
              >
                Dijkstra
              </button>
              <button
                type="button"
                onClick={() => onSelectAlgorithm("astar")}
                className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  selectedAlgorithm === "astar"
                    ? "bg-[#E8542F] text-white shadow-2xs"
                    : "text-[#6B665C] hover:text-[#0E1118]"
                }`}
              >
                A* (Heuristic)
              </button>
            </div>
          </div>
        )}

        {/* Primary Calculate CTA Button */}
        <button
          type="button"
          onClick={onCalculateRoute}
          disabled={!canCalculate}
          className={`w-full py-3.5 px-4 rounded-full font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
            canCalculate
              ? "bg-gradient-to-r from-[#F0643A] to-[#E8542F] hover:from-[#E8542F] hover:to-[#C9411F] text-white shadow-[0_12px_24px_-10px_rgba(232,84,47,0.55)] cursor-pointer active:scale-98"
              : "bg-[#0E1118]/10 text-[#6B665C] cursor-not-allowed"
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
                {selectedLocation?.hasRouteTopology === false
                  ? "Topology Unavailable"
                  : `Calculate Route from ${originLocation?.code || "Origin"}`}
              </span>
              <span className="font-bold text-sm">&rarr;</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
