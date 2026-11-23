"use client";

import React, { useState } from "react";
import { GeoCoordinates } from "@/hooks/useGeolocation";
import { IS_DEV } from "@/lib/featureFlags";

interface MockPreset {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number;
  isOutside?: boolean;
}

const PRESETS: MockPreset[] = [
  {
    id: "gate-1",
    name: "Main Gate 1 (Entrance)",
    description: "North-West campus entry point (G1-ENTRY)",
    latitude: 31.260565,
    longitude: 75.706815,
    accuracy: 8,
    heading: 90,
  },
  {
    id: "block-1",
    name: "Block 1 (Computer Science)",
    description: "Academic block entrance (BLOCK-1)",
    latitude: 31.258646,
    longitude: 75.708691,
    accuracy: 10,
    heading: 180,
  },
  {
    id: "block-30",
    name: "Block 30 / Central Spine",
    description: "Pedestrian walkway junction",
    latitude: 31.2585,
    longitude: 75.7042,
    accuracy: 12,
    heading: 0,
  },
  {
    id: "block-34-area",
    name: "Near Block 34 (South Area)",
    description: "South campus sector (>75m from surveyed paths)",
    latitude: 31.2568,
    longitude: 75.7035,
    accuracy: 15,
    heading: 270,
  },
  {
    id: "unimall",
    name: "Uni-Mall (Dining & Retail)",
    description: "East campus student services",
    latitude: 31.2625,
    longitude: 75.708,
    accuracy: 10,
  },
  {
    id: "low-accuracy",
    name: "Low Accuracy Fix (±68m)",
    description: "Tests low-accuracy filter fallback (>50m threshold)",
    latitude: 31.260565,
    longitude: 75.706815,
    accuracy: 68,
  },
  {
    id: "outside-campus",
    name: "Outside Campus (Jalandhar Hwy)",
    description: "Tests outside campus boundary warning",
    latitude: 31.285,
    longitude: 75.65,
    accuracy: 15,
    isOutside: true,
  },
];

interface MockLocationPanelProps {
  isMocked: boolean;
  currentCoords: GeoCoordinates | null;
  onSetMockCoordinates: (coords: Partial<GeoCoordinates> | null) => void;
}

export function MockLocationPanel({
  isMocked,
  currentCoords,
  onSetMockCoordinates,
}: MockLocationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customLat, setCustomLat] = useState<string>("31.260565");
  const [customLng, setCustomLng] = useState<string>("75.706815");
  const [customAccuracy, setCustomAccuracy] = useState<number>(10);

  // In production (or when NEXT_PUBLIC_ENABLE_MOCK_LOCATION=false) hide the Dev GPS Mock panel completely
  const isMockDisabled = process.env.NEXT_PUBLIC_ENABLE_MOCK_LOCATION === "false";
  const isMockAllowed =
    !isMockDisabled &&
    (IS_DEV || process.env.NEXT_PUBLIC_ENABLE_MOCK_LOCATION === "true");

  if (!isMockAllowed) {
    return null;
  }

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      onSetMockCoordinates({
        latitude: lat,
        longitude: lng,
        accuracy: customAccuracy,
      });
    }
  };

  return (
    <aside
      aria-label="Developer GPS Mock Panel"
      className="absolute bottom-14 left-4 z-30"
      data-testid="mock-location-panel"
    >
      {/* Floating Toggle Pill */}
      <button
        type="button"
        data-testid="mock-location-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-8 px-3 rounded-full text-[11px] font-bold font-mono shadow-xl border flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md ${
          isMocked
            ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/80 hover:bg-amber-500/30"
            : "bg-white/90 dark:bg-[#111827]/90 text-slate-700 dark:text-zinc-400 border-slate-200 dark:border-zinc-700/80 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800"
        }`}
      >
        <span>🧪</span>
        <span>{isMocked ? "Mock GPS: Active" : "Dev GPS Mock"}</span>
        <span className="text-[9px] opacity-70">
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {/* Expanded Presets & Custom Coordinates Drawer */}
      {isOpen && (
        <div className="mt-2 w-80 p-3.5 rounded-2xl bg-white/95 dark:bg-[#0f172a]/95 border border-slate-200 dark:border-zinc-700 shadow-2xl backdrop-blur-xl text-slate-800 dark:text-zinc-200 animate-in fade-in zoom-in-95 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
              GPS Simulation Presets
            </span>
            {isMocked && (
              <button
                type="button"
                data-testid="mock-reset-gps"
                onClick={() => onSetMockCoordinates(null)}
                className="text-[10px] text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline font-mono cursor-pointer"
              >
                Reset to Device GPS
              </button>
            )}
          </div>

          {/* Current Fix readout */}
          {currentCoords && (
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 font-mono text-[10px] space-y-0.5">
              <div className="text-slate-600 dark:text-zinc-400 flex justify-between">
                <span>Lat: {currentCoords.latitude.toFixed(6)}</span>
                <span>Lng: {currentCoords.longitude.toFixed(6)}</span>
              </div>
              <div className="text-slate-500 dark:text-zinc-500 flex justify-between">
                <span>Acc: ±{Math.round(currentCoords.accuracy)}m</span>
                <span className={isMocked ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-emerald-600 dark:text-emerald-400 font-semibold"}>
                  {isMocked ? "MOCK" : "HARDWARE"}
                </span>
              </div>
            </div>
          )}

          {/* Preset Buttons Grid */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                data-testid={`mock-preset-${p.id}`}
                onClick={() => {
                  onSetMockCoordinates({
                    latitude: p.latitude,
                    longitude: p.longitude,
                    accuracy: p.accuracy,
                    heading: p.heading,
                  });
                }}
                className={`w-full text-left p-2 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                  currentCoords?.latitude === p.latitude && currentCoords?.longitude === p.longitude
                    ? "bg-amber-500/20 border-amber-500 text-slate-900 dark:text-white font-bold"
                    : "bg-slate-50 dark:bg-zinc-900/70 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800/60 text-slate-700 dark:text-zinc-300"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-500 line-clamp-1">{p.description}</p>
                </div>
                {p.isOutside && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 ml-1 shrink-0 font-mono">
                    OUTSIDE
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Custom Coordinate Form */}
          <form onSubmit={handleApplyCustom} className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono block">
              Custom Coordinate
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="any"
                value={customLat}
                onChange={(e) => setCustomLat(e.target.value)}
                placeholder="Latitude"
                data-testid="mock-custom-lat"
                className="h-8 px-2 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-[11px] font-mono text-slate-900 dark:text-zinc-200 focus:outline-none focus:border-amber-500"
              />
              <input
                type="number"
                step="any"
                value={customLng}
                onChange={(e) => setCustomLng(e.target.value)}
                placeholder="Longitude"
                data-testid="mock-custom-lng"
                className="h-8 px-2 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-[11px] font-mono text-slate-900 dark:text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                Accuracy: ±{customAccuracy}m
              </span>
              <input
                type="range"
                min="5"
                max="80"
                value={customAccuracy}
                onChange={(e) => setCustomAccuracy(parseInt(e.target.value))}
                data-testid="mock-custom-acc"
                className="w-32 accent-amber-500 cursor-pointer"
              />
            </div>
            <button
              type="submit"
              data-testid="mock-set-custom-gps-btn"
              className="w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
            >
              Set Custom GPS
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
