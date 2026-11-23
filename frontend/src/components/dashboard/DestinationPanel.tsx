"use client";

import React, { useState, useMemo } from "react";
import { CampusLocation, CampusRoute, LocationCategory } from "@/types/campus";
import { useDebounce } from "@/hooks/useDebounce";
import {
  formatDistance,
  formatSteps,
  getDirectionIcon,
  getAccessibilityBadge,
} from "@/lib/routeFormatting";
import {
  SearchIcon,
  BookmarkIcon,
  RouteIcon,
  CloseIcon,
  CheckCircleIcon,
  CrosshairIcon,
  QrCodeIcon,
} from "./DashboardIcons";
import type { GeoCoordinates } from "@/hooks/useGeolocation";
import { FEATURE_QR } from "@/lib/featureFlags";
import { QrCodeModal } from "./QrCodeModal";

interface DestinationPanelProps {
  locations: CampusLocation[];
  originLocation: CampusLocation | null;
  selectedLocation: CampusLocation | null;
  onSelectOrigin: (location: CampusLocation) => void;
  onSelectDestination: (location: CampusLocation) => void;
  onSelectLocation?: (location: CampusLocation) => void;
  onSwapLocations: () => void;
  onUseCurrentLocation: () => void;
  onSelectCurrentLocationAsOrigin?: () => void;
  isOriginCurrentLocation?: boolean;
  isRerouting?: boolean;
  userCoordinates?: GeoCoordinates | null;
  isInsideCampus?: boolean;
  geolocationError?: string | null;
  activeRoute: CampusRoute | null;
  routeError?: string | null;
  showRoute: boolean;
  onToggleRoute: () => void;
  savedLocationIds: string[];
  onToggleSaveLocation: (id: string) => void;
  onOpenQrScanner?: () => void;
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
  onSelectCurrentLocationAsOrigin,
  isOriginCurrentLocation = false,
  isRerouting = false,
  userCoordinates,
  isInsideCampus = true,
  geolocationError: _geolocationError,
  activeRoute,
  routeError,
  showRoute,
  onToggleRoute,
  savedLocationIds,
  onToggleSaveLocation,
  onOpenQrScanner,
}: DestinationPanelProps) {
  const [panelSearch, setPanelSearch] = useState<string>("");
  const debouncedPanelSearch = useDebounce(panelSearch, 250);
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory>("all");
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [selectingField, setSelectingField] = useState<"origin" | "destination" | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  const isSameLocation = Boolean(
    originLocation && selectedLocation && originLocation.id === selectedLocation.id
  );

  // Filter categories
  const categories: { id: LocationCategory; label: string }[] = [
    { id: "all", label: "All" },
    { id: "building", label: "Academic Blocks" },
    { id: "hostel", label: "Hostels" },
    { id: "gate", label: "Gates" },
    { id: "service", label: "Food & Dining" },
    { id: "landmark", label: "Landmarks" },
  ];

  // Filtered locations for search / list (debounced)
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesCategory =
        selectedCategory === "all" || loc.category === selectedCategory;

      const q = debouncedPanelSearch.trim().toLowerCase();
      if (!q) return matchesCategory;

      const matchesQuery =
        loc.name.toLowerCase().includes(q) ||
        loc.code.toLowerCase().includes(q) ||
        loc.description.toLowerCase().includes(q) ||
        loc.departments?.some((d) => d.toLowerCase().includes(q)) ||
        loc.facilities?.some((f) => f.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [locations, selectedCategory, debouncedPanelSearch]);

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

  const isQueryingBlock34 = debouncedPanelSearch.toLowerCase().includes("34");

  return (
    <aside
      data-testid="destination-panel-scroll"
      className="w-full lg:w-96 shrink-0 h-full min-h-0 bg-[#F6F4EF] dark:bg-[#0d131f] border-l border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 flex flex-col justify-between overflow-y-auto overscroll-contain z-10 transition-colors duration-200"
    >
      <div className="p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <RouteIcon className="w-5 h-5 text-[#E8452C]" />
              <span>Campus Directions</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Select your starting point and destination
            </p>
          </div>
          {FEATURE_QR && onOpenQrScanner && (
            <button
              type="button"
              onClick={onOpenQrScanner}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-slate-700 hover:text-slate-950 dark:text-zinc-300 dark:hover:text-white border border-slate-200 dark:border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Scan QR Code Sign"
              aria-label="Scan QR Code Sign"
              data-testid="panel-scan-qr-button"
            >
              <QrCodeIcon className="w-4 h-4 text-[#E8452C]" />
              <span className="text-[11px] font-mono hidden sm:inline">Scan</span>
            </button>
          )}
        </div>

        {/* ──── Route Error / Unreachable Notice ──── */}
        {routeError && !isSameLocation && (
          <div
            role="status"
            data-testid="route-error-banner"
            className="p-3.5 rounded-2xl border border-amber-800/70 bg-amber-950/40 space-y-2 animate-in fade-in"
          >
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
              <span className="text-sm">⚠️</span>
              <span>Route Notice</span>
            </div>
            <p className="text-xs leading-relaxed text-amber-200">
              {routeError}
            </p>
            <p className="text-[11px] text-amber-300/80 pt-1 border-t border-amber-900/50 leading-relaxed">
              💡 Suggestion: Pick a nearby main avenue (such as Grand Trunk Road or Central Spine) or Gate 1 as your starting point.
            </p>
          </div>
        )}

        {/* ──── Origin = Destination Identical Location Banner ──── */}
        {isSameLocation && (
          <div
            data-testid="same-location-banner"
            className="p-4 rounded-2xl bg-zinc-900/95 border border-emerald-500/50 space-y-3 animate-in fade-in shadow-xl"
          >
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircleIcon className="w-5 h-5 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono">
                Location Reached
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-medium">
              Starting point and destination are identical. You are already at this location.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800 text-center">
              <div className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Distance</span>
                <span className="text-xs font-bold text-white font-mono">0 m</span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Duration</span>
                <span className="text-xs font-bold text-white font-mono">0 min</span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Steps</span>
                <span className="text-xs font-bold text-white font-mono">0 steps</span>
              </div>
            </div>
          </div>
        )}

        {/* ──── Outside Campus Notice when GPS origin is outside ──── */}
        {isOriginCurrentLocation && !isInsideCampus && userCoordinates && (
          <div
            role="status"
            className="p-3.5 rounded-2xl border border-amber-800/70 bg-amber-950/40 text-amber-200 text-xs space-y-1.5 animate-in fade-in"
          >
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <span>📍</span>
              <span>You appear to be outside campus</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-200/90">
              CampusWay cannot auto-route across external highways. You can pick an LPU campus entrance (such as Gate 1) manually or use the mock location panel.
            </p>
          </div>
        )}

        {/* ──── Origin & Destination Controls (Point A to B) ──── */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 space-y-2.5 relative shadow-xs">
          {/* Starting Point (Origin) */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Starting Point (From)
              </span>
              <div className="flex items-center gap-2">
                {onSelectCurrentLocationAsOrigin && (
                  <button
                    type="button"
                    onClick={onSelectCurrentLocationAsOrigin}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                    title="Use GPS current location"
                  >
                    <CrosshairIcon className="w-3 h-3 text-blue-500" />
                    <span>My Location</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onUseCurrentLocation}
                  className="text-[10px] text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-300 hover:underline cursor-pointer"
                >
                  Gate 1
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectingField(selectingField === "origin" ? null : "origin")}
              className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors cursor-pointer ${isOriginCurrentLocation
                ? "bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-500 text-blue-900 dark:text-white"
                : selectingField === "origin"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-500 text-emerald-900 dark:text-white"
                  : "bg-slate-50 dark:bg-zinc-800/70 border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:border-slate-300 dark:hover:border-zinc-600"
                }`}
            >
              <div className="flex items-center gap-1.5 truncate font-medium">
                {isOriginCurrentLocation ? (
                  <>
                    <CrosshairIcon className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                    <span className="text-blue-700 dark:text-blue-200 truncate">My Current Location</span>
                    {isRerouting && (
                      <span className="text-[10px] text-amber-500 animate-pulse font-mono ml-1">
                        (Re-routing…)
                      </span>
                    )}
                  </>
                ) : (
                  <span className="truncate">
                    {originLocation ? originLocation.name : "Select starting location..."}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-400 uppercase font-mono ml-2 shrink-0">
                {isOriginCurrentLocation
                  ? "GPS"
                  : selectingField === "origin"
                    ? "Selecting..."
                    : "Change"}
              </span>
            </button>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-1">
            <button
              type="button"
              onClick={onSwapLocations}
              className="w-7 h-7 rounded-full bg-white dark:bg-zinc-800 hover:bg-[#E8452C] dark:hover:bg-[#E8452C] border border-slate-300 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:text-white dark:hover:text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer text-xs"
              title="Swap starting point and destination"
              aria-label="Swap starting point and destination"
            >
              ⇅
            </button>
          </div>

          {/* Destination */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
              <span className="flex items-center gap-1.5 text-[#E8452C]">
                <span className="w-2 h-2 rounded-full bg-[#E8452C]" />
                Destination (To)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectingField(selectingField === "destination" ? null : "destination")}
              className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors cursor-pointer ${selectingField === "destination"
                ? "bg-[#E8452C]/10 border-[#E8452C] text-[#E8452C] font-semibold"
                : "bg-slate-50 dark:bg-zinc-800/70 border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:border-slate-300 dark:hover:border-zinc-600"
                }`}
            >
              <span className="truncate font-medium">
                {selectedLocation ? selectedLocation.name : "Select destination..."}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-400 uppercase font-mono ml-2 shrink-0">
                {selectingField === "destination" ? "Selecting..." : "Change"}
              </span>
            </button>
          </div>
        </div>

        {/* ──── Active Route Summary ──── */}
        {activeRoute && !isSameLocation && (
          <div
            data-testid="route-summary-panel"
            className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 space-y-3 shadow-xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-zinc-400 font-mono">
                  Calculated Route
                </span>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                  {activeRoute.fromName} → {activeRoute.toName}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700/60">
                    {formatSteps(activeRoute.distanceMeters)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${activeRoute.isAccessible
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800/60"
                      : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/60"
                      }`}
                  >
                    {getAccessibilityBadge(activeRoute.isAccessible).badgeText}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                <span className="text-sm font-extrabold text-[#E8452C]">
                  ~{activeRoute.estimatedWalkingMinutes} min
                </span>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                  {formatDistance(activeRoute.distanceMeters)}
                </p>
                {FEATURE_QR && selectedLocation && (
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer text-[10px] flex items-center gap-1 font-mono"
                    title="Share this route via QR Code"
                    aria-label="Share this route via QR Code"
                  >
                    <QrCodeIcon className="w-3 h-3" />
                    <span>QR</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
              <button
                type="button"
                onClick={onToggleRoute}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${showRoute
                  ? "bg-[#E8452C] text-white hover:bg-[#CF3A23]"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700"
                  }`}
              >
                <span>{showRoute ? "Hide Route" : "Show Route"}</span>
              </button>

              {activeRoute.steps && activeRoute.steps.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSteps(!showSteps)}
                  className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  {showSteps ? "Hide Steps" : `Steps (${activeRoute.steps.length})`}
                </button>
              )}
            </div>

            {/* Turn-by-Turn Steps with direction icons, distances, and active step interaction */}
            {showSteps && activeRoute.steps && (
              <div className="mt-2 pt-2 border-t border-zinc-800/80 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {activeRoute.steps.map((step, idx) => {
                  const isStepActive = activeStepIndex === idx;
                  const icon = getDirectionIcon(step.direction);
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveStepIndex(isStepActive ? null : idx)}
                      className={`p-2.5 rounded-xl border text-[11px] flex items-start gap-2.5 transition-all cursor-pointer ${isStepActive
                        ? "bg-[#DE4B31]/15 border-[#DE4B31] shadow-lg text-white"
                        : "bg-zinc-800/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/70 text-zinc-300"
                        }`}
                      title="Click to focus step"
                    >
                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        <span className="w-5 h-5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center text-[10px] font-mono font-bold">
                          {idx + 1}
                        </span>
                        <span className="w-5 h-5 rounded-lg bg-[#DE4B31]/20 border border-[#DE4B31]/40 text-[#DE4B31] flex items-center justify-center text-xs font-bold">
                          {icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`leading-snug ${isStepActive ? "text-white font-medium" : "text-zinc-200"}`}>
                          {step.instruction}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          {formatDistance(step.distanceMeters)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ──── Selected Destination Card (Details & Save) ──── */}
        {selectedLocation && (
          <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 space-y-2.5 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-zinc-400 font-mono">
                  {selectedLocation.category} • {selectedLocation.code}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {selectedLocation.name}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {FEATURE_QR && (
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800/70 text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white hover:border-[#E8452C] transition-colors cursor-pointer"
                    title="Generate QR code & deep link"
                    aria-label="Generate QR code & deep link"
                    data-testid="destination-qr-button"
                  >
                    <QrCodeIcon className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveClick}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${isSaved
                    ? "bg-[#E8452C]/10 border-[#E8452C] text-[#E8452C]"
                    : "bg-slate-100 dark:bg-zinc-800/70 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white"
                    }`}
                  title={isSaved ? "Remove from saved" : "Save location"}
                  aria-label={isSaved ? "Remove from saved" : "Save location"}
                >
                  <BookmarkIcon className="w-4 h-4" filled={isSaved} />
                </button>
              </div>
            </div>

            {selectedLocation.description && (
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                {selectedLocation.description}
              </p>
            )}

            {saveNotice && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                <span>{saveNotice}</span>
              </p>
            )}
          </div>
        )}

        {/* Block 34 Notice if user queries for 34 */}
        {isQueryingBlock34 && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/70 text-amber-900 dark:text-amber-200 text-xs space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span>⚠️</span>
              <span>Block 34 (Problem Statement P10)</span>
            </p>
            <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
              Block 34 is not present in Dataset C. In accordance with data integrity guidelines, its coordinates have not been synthesized. It is scheduled for the next physical survey.
            </p>
          </div>
        )}

        {/* ──── Campus Places Search & Filter List ──── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-zinc-300">
              {selectingField === "origin"
                ? "Choose Starting Point"
                : selectingField === "destination"
                  ? "Choose Destination"
                  : "All Campus Places"}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
              {filteredLocations.length} locations
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-zinc-400">
              <SearchIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={panelSearch}
              onChange={(e) => setPanelSearch(e.target.value)}
              placeholder="Search blocks, gates, food courts..."
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#E8452C] transition-all"
              data-testid="destination-search"
              aria-label="Search destination list"
            />
            {panelSearch ? (
              <button
                onClick={() => setPanelSearch("")}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-800 dark:hover:text-white"
                aria-label="Clear search"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            ) : (
              FEATURE_QR &&
              onOpenQrScanner && (
                <button
                  type="button"
                  onClick={onOpenQrScanner}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                  title="Scan QR Code"
                  aria-label="Scan QR Code"
                  data-testid="search-scan-qr-button"
                >
                  <QrCodeIcon className="w-3.5 h-3.5 text-[#E8452C]" />
                </button>
              )
            )}
          </div>

          {/* Category filter pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${selectedCategory === cat.id
                  ? "bg-[#E8452C] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800"
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Location list */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {/* Top option when choosing origin: My Current Location */}
            {selectingField === "origin" && onSelectCurrentLocationAsOrigin && (
              <div
                onClick={() => {
                  onSelectCurrentLocationAsOrigin();
                  setSelectingField(null);
                }}
                data-testid="origin-my-current-location"
                className="p-2.5 rounded-xl border border-blue-400 dark:border-blue-500/70 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs transition-all flex items-center justify-between gap-2.5 cursor-pointer shadow-xs group mb-1.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-600/30 border border-blue-300 dark:border-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <CrosshairIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300 truncate">
                      <span>My Current Location</span>
                      <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white text-[9px] uppercase font-mono">
                        GPS
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                      {userCoordinates
                        ? isInsideCampus
                          ? `Accuracy ±${Math.round(userCoordinates.accuracy)}m • Snaps to campus path`
                          : "Outside campus boundary"
                        : "Tap to request GPS and snap to nearest path"}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 group-hover:underline uppercase font-mono shrink-0">
                  Select
                </span>
              </div>
            )}

            {filteredLocations.map((loc) => {
              const isOrig = originLocation?.id === loc.id;
              const isDest = selectedLocation?.id === loc.id;

              return (
                <div
                  key={loc.id}
                  data-testid={`location-item-${loc.slug || loc.id}`}
                  className={`p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${isDest
                    ? "bg-[#E8452C]/10 border-[#E8452C] text-slate-900 dark:text-white"
                    : isOrig
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-slate-900 dark:text-white"
                      : "bg-white dark:bg-zinc-900/70 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800/70 text-slate-800 dark:text-zinc-300"
                    }`}
                  onClick={() => handleLocationPick(loc)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                        {loc.name}
                      </span>
                      {isOrig && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white uppercase font-mono">
                          Start
                        </span>
                      )}
                      {isDest && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#E8452C] text-white uppercase font-mono">
                          Dest
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
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

      {/* QR Code Navigation Modal */}
      {FEATURE_QR && selectedLocation && (
        <QrCodeModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          destination={selectedLocation}
          origin={originLocation}
          isOriginCurrentLocation={isOriginCurrentLocation}
        />
      )}
    </aside>
  );
}
