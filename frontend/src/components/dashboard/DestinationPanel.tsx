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
  WalkingIcon,
} from "./DashboardIcons";
import type { GeoCoordinates } from "@/hooks/useGeolocation";
import { FEATURE_QR } from "@/lib/featureFlags";
import { QrCodeModal } from "./QrCodeModal";
import type { NearestSurveyedPlace } from "@/lib/gpsSnapping";

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
  onCalculateRoute?: () => void;
  isCalculatingRoute?: boolean;
  unsurveyedState?: {
    distanceMeters: number;
    nearestPlaces: NearestSurveyedPlace[];
  } | null;
  onSelectNearestPlace?: (location: CampusLocation) => void;
  isOutsideCampusBanner?: boolean;
  onDismissOutsideCampusBanner?: () => void;
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
  onCalculateRoute,
  isCalculatingRoute = false,
  unsurveyedState,
  onSelectNearestPlace,
  isOutsideCampusBanner = false,
  onDismissOutsideCampusBanner,
}: DestinationPanelProps) {
  const [panelSearch, setPanelSearch] = useState<string>("");
  const debouncedPanelSearch = useDebounce(panelSearch, 250);
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory>("all");
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [selectingField, setSelectingField] = useState<"origin" | "destination" | null>(null);
  const [showSteps, setShowSteps] = useState(true);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [navigationMode, setNavigationMode] = useState<"walking" | "accessible">("walking");
  const [isNavigating, setIsNavigating] = useState(false);

  const isSameLocation = Boolean(
    originLocation && selectedLocation && originLocation.id === selectedLocation.id
  );

  // Filter categories
  const categories: { id: LocationCategory; label: string; icon: string }[] = [
    { id: "all", label: "All", icon: "🌐" },
    { id: "building", label: "Academic", icon: "🏛️" },
    { id: "hostel", label: "Hostels", icon: "🏠" },
    { id: "gate", label: "Gates", icon: "🚪" },
    { id: "service", label: "Food & Dining", icon: "🍴" },
    { id: "landmark", label: "Landmarks", icon: "📍" },
  ];

  // Category place counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: locations.length };
    for (const loc of locations) {
      counts[loc.category] = (counts[loc.category] || 0) + 1;
    }
    return counts;
  }, [locations]);

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

  const canCalculateRoute = Boolean(
    originLocation &&
    selectedLocation &&
    originLocation.id !== selectedLocation.id
  );

  const hasActiveRouteForSelection = Boolean(
    activeRoute &&
    originLocation &&
    selectedLocation &&
    (activeRoute.fromLocationId === originLocation.id || activeRoute.fromName === originLocation.name) &&
    (activeRoute.toLocationId === selectedLocation.id || activeRoute.toName === selectedLocation.name)
  );

  return (
    <aside
      data-testid="destination-panel-scroll"
      className="w-full lg:w-96 shrink-0 h-full min-h-0 bg-[#F6F4EF] dark:bg-[#0d131f] border-l border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 flex flex-col justify-between overflow-y-auto overscroll-contain z-10 transition-colors duration-200"
    >
      <div className="p-4 sm:p-5 space-y-4">
        {/* Header with QR Scan CTA */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <RouteIcon className="w-5 h-5 text-[#E8452C]" />
              <span>Campus Directions</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-mono">
              Point A to Point B Smart Navigation
            </p>
          </div>
          {FEATURE_QR && onOpenQrScanner && (
            <button
              type="button"
              onClick={onOpenQrScanner}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-slate-700 hover:text-slate-950 dark:text-zinc-300 dark:hover:text-white border border-slate-200 dark:border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
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
            <p className="text-[11px] text-amber-300/80 pt-1 border-t border-amber-900/50 leading-relaxed font-mono">
              💡 Suggestion: Pick a nearby main avenue or Gate 1 as your starting point.
            </p>
          </div>
        )}

        {/* ──── Origin = Destination Identical Location Banner ──── */}
        {isSameLocation && (
          <div
            data-testid="same-location-banner"
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900/95 border border-emerald-500/50 space-y-3 animate-in fade-in shadow-xl"
          >
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircleIcon className="w-5 h-5 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono">
                Location Reached
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
              Starting point and destination are identical. You are already at this location.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800 text-center">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800">
                <span className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase font-mono block">Distance</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">0 m</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800">
                <span className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase font-mono block">Duration</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">0 min</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800">
                <span className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase font-mono block">Steps</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">0 steps</span>
              </div>
            </div>
          </div>
        )}

        {/* ──── State C: Outside Campus Banner ──── */}
        {isOutsideCampusBanner && (
          <div
            role="status"
            data-testid="outside-campus-banner"
            className="p-3.5 rounded-2xl border border-amber-600/70 bg-amber-500/10 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs space-y-1.5 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
                <span>📍</span>
                <span>Outside Campus Bounds</span>
              </div>
              {onDismissOutsideCampusBanner && (
                <button
                  type="button"
                  onClick={onDismissOutsideCampusBanner}
                  className="text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-white font-bold cursor-pointer text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-200/90">
              You are outside LPU campus. Walking directions start from Main Gate 1 by default.
            </p>
          </div>
        )}

        {/* ──── State B: Unsurveyed Campus Area Card ──── */}
        {unsurveyedState && (
          <div
            role="status"
            data-testid="unsurveyed-area-card"
            className="p-4 rounded-2xl border border-amber-600/70 bg-amber-500/10 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs space-y-3 animate-in fade-in"
          >
            <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
              <span className="text-base">⚠️</span>
              <span>Unsurveyed Campus Area</span>
            </div>
            <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              You are in an unsurveyed campus area (~{unsurveyedState.distanceMeters}m from surveyed paths).
            </p>
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-amber-700 dark:text-amber-400 block">
                Snap to nearest surveyed place:
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {unsurveyedState.nearestPlaces.map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => onSelectNearestPlace && onSelectNearestPlace(place.location)}
                    className="w-full text-left p-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-800 border border-amber-500/30 dark:border-amber-700/50 text-slate-800 dark:text-zinc-200 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer group shadow-xs"
                  >
                    <span className="font-semibold truncate group-hover:text-[#E8452C] transition-colors">
                      Snap to {place.name}
                    </span>
                    <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 shrink-0 ml-2 font-bold">
                      {place.distanceMeters}m {place.compassDirection}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ──── CARD A: Directions Input Card (From, To, Swap, Mode Switcher) ──── */}
        <div
          data-testid="directions-input-card"
          className="p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 space-y-3 shadow-xs"
        >
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
                    data-testid="origin-my-location-btn"
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
              className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors cursor-pointer ${
                isOriginCurrentLocation
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
              className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors cursor-pointer ${
                selectingField === "destination"
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

          {/* Navigation Mode Switcher: Walking vs Accessible */}
          <div className="pt-1">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60">
              <button
                type="button"
                onClick={() => setNavigationMode("walking")}
                className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  navigationMode === "walking"
                    ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs font-semibold"
                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                }`}
              >
                <span>🚶</span>
                <span>Walking</span>
              </button>
              <button
                type="button"
                onClick={() => setNavigationMode("accessible")}
                className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  navigationMode === "accessible"
                    ? "bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                }`}
              >
                <span>♿</span>
                <span>Accessible</span>
              </button>
            </div>
          </div>

          {/* ──── Primary Route Action Button ──── */}
          <div className="pt-1">
            <button
              type="button"
              data-testid="get-directions-button"
              onClick={onCalculateRoute}
              disabled={!canCalculateRoute || isCalculatingRoute}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                !canCalculateRoute
                  ? "bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed shadow-none"
                  : isCalculatingRoute
                  ? "bg-[#E8452C]/80 text-white cursor-wait"
                  : "bg-[#E8452C] hover:bg-[#DE4B31] text-white active:scale-[0.99] hover:shadow-lg hover:shadow-[#E8452C]/25"
              }`}
            >
              {isCalculatingRoute ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Calculating Route…</span>
                </>
              ) : hasActiveRouteForSelection ? (
                <>
                  <RouteIcon className="w-4 h-4" />
                  <span>Recalculate</span>
                </>
              ) : (
                <>
                  <RouteIcon className="w-4 h-4" />
                  <span>Get directions</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ──── CARD B: Route Summary Card (Big ETA, distance, elevation, Start Navigation) ──── */}
        {activeRoute && !isSameLocation && showRoute && (
          <div
            data-testid="route-summary-panel"
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 space-y-3.5 shadow-xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-zinc-400 font-mono">
                  Shortest Pedestrian Path
                </span>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                  {activeRoute.fromName} → {activeRoute.toName}
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-[#E8452C] tracking-tight">
                    ~{activeRoute.estimatedWalkingMinutes}
                  </span>
                  <span className="text-sm font-bold text-[#E8452C]">min</span>
                  <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                    ({formatDistance(activeRoute.distanceMeters)})
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                {FEATURE_QR && selectedLocation && (
                  <button
                    type="button"
                    data-testid="destination-qr-button"
                    onClick={() => setShowQrModal(true)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer text-[10px] flex items-center gap-1 font-mono shadow-xs"
                    title="Share this route via QR Code"
                    aria-label="Share this route via QR Code"
                  >
                    <QrCodeIcon className="w-3.5 h-3.5 text-[#E8452C]" />
                    <span>Share QR</span>
                  </button>
                )}
              </div>
            </div>

            {/* Metrics Chips */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 flex items-center gap-2">
                <span className="text-sm">👣</span>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-mono">Pedometer</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-200 font-mono">
                    {formatSteps(activeRoute.distanceMeters)}
                  </span>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 flex items-center gap-2">
                <span className="text-sm">📐</span>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-mono">Incline</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-200 font-mono">
                    0% • Level Path
                  </span>
                </div>
              </div>
            </div>

            {/* Accessibility Rating */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-zinc-800">
              <span className="text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
                Pathway Classification
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                  activeRoute.isAccessible
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800/60"
                    : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/60"
                }`}
              >
                {getAccessibilityBadge(activeRoute.isAccessible).badgeText}
              </span>
            </div>

            {/* Primary Start Navigation CTA + Toggle View */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                data-testid="start-navigation-button"
                onClick={() => setIsNavigating(!isNavigating)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                  isNavigating
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-[#E8452C] hover:bg-[#DE4B31] text-white"
                }`}
              >
                <WalkingIcon className="w-4 h-4" />
                <span>{isNavigating ? "Navigation Active (Pause)" : "Start Navigation"}</span>
              </button>

              <button
                type="button"
                onClick={onToggleRoute}
                className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer border border-slate-200 dark:border-zinc-700"
              >
                {showRoute ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        )}

        {/* ──── CARD C: Turn-by-Turn Steps Card ──── */}
        {activeRoute && !isSameLocation && showRoute && activeRoute.steps && activeRoute.steps.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>🧭</span>
                <span>Turn-by-Turn Directions ({activeRoute.steps.length})</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSteps(!showSteps)}
                className="text-[11px] font-mono text-[#E8452C] hover:underline cursor-pointer font-bold"
              >
                {showSteps ? "Collapse" : "Expand"}
              </button>
            </div>

            {showSteps && (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 pt-1 border-t border-slate-100 dark:border-zinc-800">
                {activeRoute.steps.map((step, idx) => {
                  const isStepActive = activeStepIndex === idx;
                  const icon = getDirectionIcon(step.direction);
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveStepIndex(isStepActive ? null : idx)}
                      className={`p-2.5 rounded-xl border text-[11px] flex items-start gap-2.5 transition-all cursor-pointer ${
                        isStepActive
                          ? "bg-[#E8452C]/15 border-[#E8452C] shadow-md text-slate-900 dark:text-white font-medium"
                          : "bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-700 dark:text-zinc-300"
                      }`}
                      title="Click to focus step"
                    >
                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        <span className="w-5 h-5 rounded-lg bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 flex items-center justify-center text-[10px] font-mono font-bold">
                          {idx + 1}
                        </span>
                        <span className="w-5 h-5 rounded-lg bg-[#E8452C]/20 border border-[#E8452C]/40 text-[#E8452C] flex items-center justify-center text-xs font-bold">
                          {icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`leading-snug ${isStepActive ? "text-slate-900 dark:text-white font-semibold" : "text-slate-700 dark:text-zinc-300"}`}>
                          {step.instruction}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
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

        {/* ──── CARD D: Place Details Card (When destination is selected without an active route) ──── */}
        {selectedLocation && !hasActiveRouteForSelection && (
          <div
            data-testid="place-details-card"
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 space-y-3 shadow-xs"
          >
            {/* Visual Header / Illustration placeholder */}
            <div className="relative h-28 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-900 border border-slate-200 dark:border-zinc-700 flex flex-col justify-between p-3 overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-white/90 dark:bg-zinc-950/80 text-[#E8452C] border border-[#E8452C]/40 shadow-xs uppercase">
                  {selectedLocation.category} • {selectedLocation.code}
                </span>
                <button
                  type="button"
                  onClick={handleSaveClick}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isSaved
                      ? "bg-[#E8452C] text-white border-[#E8452C]"
                      : "bg-white/80 dark:bg-zinc-900/80 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700"
                  }`}
                  title={isSaved ? "Saved" : "Save location"}
                >
                  <BookmarkIcon className="w-3.5 h-3.5" filled={isSaved} />
                </button>
              </div>

              <div className="z-10">
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {selectedLocation.name}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                  {selectedLocation.floors || "Campus Landmark • Sector C"}
                </p>
              </div>

              {/* Decorative background watermark */}
              <div className="absolute -right-4 -bottom-4 text-6xl opacity-10 font-bold select-none pointer-events-none">
                🏛️
              </div>
            </div>

            {selectedLocation.description && (
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                {selectedLocation.description}
              </p>
            )}

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block uppercase">Operating Hours</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  {selectedLocation.operatingHours || "08:00 AM – 08:00 PM"}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block uppercase">Accessibility</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {selectedLocation.accessibility || "Verified Access"}
                </span>
              </div>
            </div>

            {/* CTAs: Directions Here + Share QR */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                data-testid="place-directions-here-btn"
                onClick={onCalculateRoute}
                className="flex-1 py-2 px-3 rounded-xl bg-[#E8452C] hover:bg-[#DE4B31] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <RouteIcon className="w-4 h-4" />
                <span>Directions Here</span>
              </button>

              {FEATURE_QR && (
                <button
                  type="button"
                  data-testid="destination-qr-button"
                  onClick={() => setShowQrModal(true)}
                  className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-zinc-700"
                  title="Generate QR Sign"
                >
                  <QrCodeIcon className="w-3.5 h-3.5 text-[#E8452C]" />
                  <span>QR Sign</span>
                </button>
              )}
            </div>

            {saveNotice && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                <span>{saveNotice}</span>
              </p>
            )}
          </div>
        )}

        {/* ──── CARD E: Category Browse & Destination Explorer Card ──── */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {selectingField === "origin"
                ? "Choose Starting Point"
                : selectingField === "destination"
                ? "Choose Destination"
                : "Explore Campus Places"}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
              {filteredLocations.length} surveyed places
            </span>
          </div>

          {/* Search Input inside panel */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-zinc-400">
              <SearchIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={panelSearch}
              onChange={(e) => setPanelSearch(e.target.value)}
              placeholder="Search blocks, gates, food courts..."
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700/80 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#E8452C] transition-all"
              data-testid="destination-search"
              aria-label="Search destination list"
            />
            {panelSearch && (
              <button
                type="button"
                onClick={() => setPanelSearch("")}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-800 dark:hover:text-white"
                aria-label="Clear search"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Clean Category Grid with Place Counts */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#E8452C] border-[#E8452C] text-white shadow-xs font-semibold"
                      : "bg-slate-50 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm">{cat.icon}</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1 rounded ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-400"
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                  <span className="text-[11px] truncate mt-1 leading-tight">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Block 34 Warning Notice */}
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

          {/* Location List */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 pt-1">
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
                  className={`p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isDest
                      ? "bg-[#E8452C]/10 border-[#E8452C] text-slate-900 dark:text-white"
                      : isOrig
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-slate-900 dark:text-white"
                      : "bg-slate-50 dark:bg-zinc-900/70 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800/70 text-slate-800 dark:text-zinc-300"
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
                      className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 hover:bg-emerald-600 text-slate-600 dark:text-zinc-400 hover:text-white transition-colors cursor-pointer"
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
                      className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 hover:bg-[#DE4B31] text-slate-600 dark:text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Set as destination"
                    >
                      <span className="text-[10px] font-bold">Go</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredLocations.length === 0 && (
              <div className="p-6 text-center text-slate-400 dark:text-zinc-500 text-xs rounded-xl bg-slate-100 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800">
                No matching campus places found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="p-3 bg-white dark:bg-zinc-900/80 border-t border-slate-200 dark:border-zinc-800 text-[10px] text-slate-400 dark:text-zinc-500 text-center font-mono">
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
