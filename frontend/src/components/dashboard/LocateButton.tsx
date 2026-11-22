"use client";

import React, { useState } from "react";
import { CrosshairIcon } from "./DashboardIcons";
import { GeolocationStatus, GeolocationPermission } from "@/hooks/useGeolocation";

interface LocateButtonProps {
  status: GeolocationStatus;
  permissionState: GeolocationPermission;
  onLocate: () => void;
  hasLocation: boolean;
  isInsideCampus: boolean;
  errorMessage?: string | null;
}

export function LocateButton({
  status,
  permissionState,
  onLocate,
  hasLocation,
  isInsideCampus,
  errorMessage,
}: LocateButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const isRequesting = status === "requesting";
  const isWatching = status === "watching" && hasLocation;
  const isDenied = permissionState === "denied" || status === "error";

  let buttonTitle = "Find my current location";
  if (isRequesting) buttonTitle = "Locating your position...";
  else if (isWatching) buttonTitle = isInsideCampus ? "Current location active" : "Location outside campus";
  else if (isDenied) buttonTitle = "Location access blocked — click for details";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onLocate}
        onMouseEnter={() => (isDenied || (isWatching && !isInsideCampus)) && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`w-10 h-10 rounded-xl border shadow-lg backdrop-blur-md flex items-center justify-center transition-all cursor-pointer group ${
          isRequesting
            ? "bg-[#111827]/95 border-amber-500/80 text-amber-400 shadow-amber-950/40"
            : isWatching
            ? isInsideCampus
              ? "bg-blue-600 text-white border-blue-400 shadow-blue-900/50"
              : "bg-amber-600/90 text-white border-amber-400 shadow-amber-900/50"
            : isDenied
            ? "bg-rose-950/60 border-rose-700/80 text-rose-300 hover:bg-rose-900/60"
            : "bg-[#111827]/90 hover:bg-[#1f2937] text-zinc-200 border-zinc-700/80 active:bg-zinc-700"
        }`}
        title={buttonTitle}
        aria-label="Find my current location"
        data-testid="locate-button"
      >
        <CrosshairIcon
          className={`w-5 h-5 transition-transform duration-300 ${
            isRequesting
              ? "animate-spin text-amber-400"
              : isWatching
              ? "scale-110 text-white"
              : isDenied
              ? "text-rose-400"
              : "text-zinc-300 group-hover:scale-110 group-hover:text-white"
          }`}
        />
      </button>

      {/* Tooltip for permission denied or outside campus */}
      {showTooltip && (errorMessage || !isInsideCampus) && (
        <div
          role="tooltip"
          className="absolute top-0 right-12 w-64 p-2.5 rounded-xl bg-[#0f172a] border border-zinc-700 text-[11px] text-zinc-200 shadow-2xl z-50 animate-in fade-in"
        >
          {isDenied && (
            <div>
              <p className="font-bold text-rose-400 mb-1 flex items-center gap-1">
                <span>⚠️</span> Location Blocked
              </p>
              <p className="text-zinc-300 leading-tight">
                {errorMessage || "Click the lock icon in your browser address bar to allow location access for CampusWay."}
              </p>
            </div>
          )}
          {isWatching && !isInsideCampus && (
            <div>
              <p className="font-bold text-amber-400 mb-1 flex items-center gap-1">
                <span>📍</span> Outside LPU Campus
              </p>
              <p className="text-zinc-300 leading-tight">
                Your GPS fix is outside the campus boundary. You can select a campus start point manually.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
