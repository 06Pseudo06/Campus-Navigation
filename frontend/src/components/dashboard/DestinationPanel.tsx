"use client";

import React, { useState, useMemo } from "react";
import { CampusLocation, CampusRoute, LocationCategory } from "@/types/campus";
import {
  SearchIcon,
  MapPinIcon,
  WalkingIcon,
  ClockIcon,
  AccessibilityIcon,
  BookmarkIcon,
  RouteIcon,
  CloseIcon,
  CheckCircleIcon,
} from "./DashboardIcons";

interface DestinationPanelProps {
  locations: CampusLocation[];
  selectedLocation: CampusLocation | null;
  onSelectLocation: (location: CampusLocation) => void;
  activeRoute: CampusRoute | null;
  showRoute: boolean;
  onToggleRoute: () => void;
  savedLocationIds: string[];
  onToggleSaveLocation: (id: string) => void;
}

export function DestinationPanel({
  locations,
  selectedLocation,
  onSelectLocation,
  activeRoute,
  showRoute,
  onToggleRoute,
  savedLocationIds,
  onToggleSaveLocation,
}: DestinationPanelProps) {
  const [panelSearch, setPanelSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory>("all");
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Filter categories
  const categories: { id: LocationCategory; label: string }[] = [
    { id: "all", label: "All" },
    { id: "building", label: "Buildings" },
    { id: "room", label: "Rooms" },
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
        ? `Added "${selectedLocation.name}" to Saved (Session demo)`
        : `Removed "${selectedLocation.name}" from Saved`
    );
    setTimeout(() => setSaveNotice(null), 3000);
  };

  return (
    <aside className="w-full lg:w-96 shrink-0 h-full bg-[#0d131f] border-l border-zinc-800 flex flex-col justify-between overflow-y-auto z-10">
      <div className="p-4 sm:p-5 space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Where do you want to go?
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Search buildings, rooms, or select campus points
          </p>
        </div>

        {/* Search input in destination panel */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={panelSearch}
            onChange={(e) => setPanelSearch(e.target.value)}
            placeholder="Search destination..."
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

        {/* Selected Destination Card */}
        {selectedLocation && (
          <div className="rounded-2xl bg-gradient-to-b from-zinc-800/90 to-zinc-900/90 border border-zinc-700 p-4 shadow-xl space-y-3 relative overflow-hidden">
            {/* Ambient accent glow */}
            <div className="absolute top-0 right-0 w-28 h-28 bg-[#DE4B31]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DE4B31]/20 border border-[#DE4B31]/40 text-[#fca5a5] uppercase">
                    {selectedLocation.code}
                  </span>
                  <span className="text-[11px] text-zinc-400 capitalize">
                    {selectedLocation.category}
                  </span>
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

            {/* Meta tags: Floors, Hours, Accessibility */}
            <div className="space-y-1.5 pt-1 text-[11px] text-zinc-400">
              {selectedLocation.floors && (
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 font-medium">Floors:</span>
                  <span className="text-zinc-200">{selectedLocation.floors}</span>
                </div>
              )}
              {selectedLocation.operatingHours && (
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="text-zinc-300">{selectedLocation.operatingHours}</span>
                </div>
              )}
              <div className="flex items-start gap-2 pt-0.5">
                <AccessibilityIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-zinc-300 text-[10px] leading-tight">
                  {selectedLocation.accessibility}
                </span>
              </div>
            </div>

            {/* Route summary metric if generated */}
            {activeRoute && (
              <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-700/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  <WalkingIcon className="w-4 h-4 text-[#DE4B31]" />
                  <span>Main Gate → {selectedLocation.code}</span>
                </div>
                <div className="font-semibold text-white">
                  ~{activeRoute.estimatedWalkingMinutes} min ({activeRoute.distanceMeters}m)
                </div>
              </div>
            )}

            {/* View Route Action Button */}
            <button
              type="button"
              onClick={onToggleRoute}
              className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                showRoute
                  ? "bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-600"
                  : "bg-[#DE4B31] hover:bg-[#c93f27] text-white shadow-[#DE4B31]/30"
              }`}
            >
              <RouteIcon className="w-4 h-4" />
              <span>{showRoute ? "Hide Route Preview" : "View Route from Main Gate"}</span>
            </button>

            {saveNotice && (
              <div className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 rounded-lg p-2 text-center flex items-center justify-center gap-1.5 animate-in fade-in">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                <span>{saveNotice}</span>
              </div>
            )}
          </div>
        )}

        {/* Filtered or Recent Destinations List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              {panelSearch ? "Matching Locations" : "Campus Destinations"}
            </h4>
            <span className="text-[11px] text-zinc-500">
              {filteredLocations.length} locations
            </span>
          </div>

          <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
            {filteredLocations.map((loc) => {
              const isSelected = selectedLocation?.id === loc.id;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => onSelectLocation(loc)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? "bg-zinc-800 border-[#DE4B31]/80 text-white"
                      : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/70 hover:border-zinc-700 text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-[#DE4B31] text-white"
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
                        {loc.code} &bull; {loc.category}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs text-zinc-500 group-hover:text-zinc-300 shrink-0 ml-2">
                    →
                  </span>
                </button>
              );
            })}

            {filteredLocations.length === 0 && (
              <div className="p-6 text-center text-zinc-500 text-xs rounded-xl bg-zinc-900/40 border border-zinc-800">
                No matching locations found for &quot;{panelSearch}&quot;.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Demonstration Boundary Notice at footer */}
      <div className="p-3 bg-zinc-900/80 border-t border-zinc-800 text-[10px] text-zinc-500 text-center">
        <span>Demonstration prototype &bull; Sample routes and distances</span>
      </div>
    </aside>
  );
}
