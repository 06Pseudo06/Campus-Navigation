"use client";

import React, { useState } from "react";
import { CampusLocation } from "@/types/campus";
import { RouteIcon, WalkingIcon, ArrowRightIcon } from "./DashboardIcons";

interface RoutesTabProps {
  locations?: CampusLocation[];
  onSelectRoute: (fromId: string, toId: string) => void;
}

export function RoutesTab({ locations = [], onSelectRoute }: RoutesTabProps) {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const defaultFrom = locations.find((location) => location.slug === "gate-1");
  const defaultTo =
    locations.find((location) => location.slug === "block-1") ??
    locations.find((location) => location.id !== defaultFrom?.id);
  const selectedFromId = fromId || defaultFrom?.id || "";
  const selectedToId = toId || defaultTo?.id || "";
  const canPreview =
    locations.some((location) => location.id === selectedFromId) &&
    locations.some((location) => location.id === selectedToId) &&
    selectedFromId !== selectedToId;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DE4B31]/20 border border-[#DE4B31]/40 text-xs font-semibold text-[#fca5a5] mb-2">
          <RouteIcon className="w-3.5 h-3.5" />
          <span>Dataset C campus routes</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Plan a campus walking route</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Routes use the surveyed campus connections. Segment lengths and straight-line map geometry are estimates.
        </p>
      </div>

      {locations.length === 0 ? (
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-sm text-zinc-400">
          Verified campus locations are unavailable. Try again after the Dataset C service is connected.
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
          <label className="block space-y-2">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-2">
              <WalkingIcon className="w-3.5 h-3.5" /> Starting point
            </span>
            <select
              value={selectedFromId}
              onChange={(event) => setFromId(event.target.value)}
              className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3 py-3 text-sm text-zinc-100"
            >
              {locations.map((location) => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold text-[#DE4B31]">Destination</span>
            <select
              value={selectedToId}
              onChange={(event) => setToId(event.target.value)}
              className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3 py-3 text-sm text-zinc-100"
            >
              {locations.map((location) => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            disabled={!canPreview}
            onClick={() => onSelectRoute(selectedFromId, selectedToId)}
            className="w-full py-3 px-4 rounded-xl bg-[#DE4B31] hover:bg-[#c93e27] disabled:bg-zinc-800 disabled:text-zinc-500 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
          >
            <span>Show route on map</span>
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
