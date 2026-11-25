"use client";

import React, { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { locationService, BackendLocation } from "@/services/locationService";
import { VERIFIED_DATASET_C_LOCATIONS } from "@/data/campusData";
import { parseNavigateParams, validateLocationIdentifier } from "@/lib/qrNavigation";
import {
  MapPinIcon,
  SearchIcon,
  RouteIcon,
  ArrowRightIcon,
  CompassIcon,
} from "@/components/dashboard/DashboardIcons";
import { Icon } from "@/components/ui/Icon";

function NavigateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [locations, setLocations] = useState<BackendLocation[]>(VERIFIED_DATASET_C_LOCATIONS);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [redirectCountdown, setRedirectCountdown] = useState<number>(2);

  const { to: toParam, from: fromParam } = useMemo(() => {
    return parseNavigateParams(searchParams);
  }, [searchParams]);

  // Load latest verified catalog from backend
  useEffect(() => {
    let cancelled = false;
    locationService
      .getLocations()
      .then((data) => {
        if (!cancelled && data.length > 0) {
          setLocations(data);
        }
      })
      .catch(() => {
        // Fallback already pre-set to VERIFIED_DATASET_C_LOCATIONS
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Validate destination target
  const destination = useMemo(() => {
    if (!toParam) return null;
    return validateLocationIdentifier(toParam, locations);
  }, [toParam, locations]);

  // Validate origin (if provided)
  const origin = useMemo(() => {
    if (!fromParam) return null;
    if (fromParam.toLowerCase() === "gps") return "gps";
    return validateLocationIdentifier(fromParam, locations);
  }, [fromParam, locations]);

  // Destination Found: auto-forward countdown to /explore
  useEffect(() => {
    if (loading || !destination) return;

    const targetSlug = destination.slug || destination.id;
    const originSlug =
      origin === "gps"
        ? "gps"
        : origin && typeof origin === "object"
        ? origin.slug || origin.id
        : fromParam || null;

    const targetUrl = originSlug
      ? `/explore?to=${encodeURIComponent(targetSlug)}&from=${encodeURIComponent(originSlug)}`
      : `/explore?to=${encodeURIComponent(targetSlug)}`;

    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.replace(targetUrl);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, destination, origin, router]);

  // Filter available campus destinations for the not-found state
  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((loc) => {
      return (
        loc.name.toLowerCase().includes(q) ||
        (loc.slug && loc.slug.toLowerCase().includes(q)) ||
        (loc.description && loc.description.toLowerCase().includes(q)) ||
        (loc.location_type && loc.location_type.toLowerCase().includes(q))
      );
    });
  }, [locations, searchQuery]);

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F4EF] dark:bg-[#070B14] flex flex-col items-center justify-center p-6 text-slate-700 dark:text-zinc-300 font-sans">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-[#0B1220] border border-[#E1DDD3] dark:border-zinc-800 shadow-2xl flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#DE4B31]/15 border border-[#DE4B31]/40 text-[#DE4B31] flex items-center justify-center animate-pulse">
            <CompassIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-zinc-500 font-mono">
              Resolving CampusWay Route
            </span>
            <h1 className="text-lg font-bold text-[#111318] dark:text-white">Looking up destination…</h1>
          </div>
          <div className="w-32 h-1 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-[#DE4B31] animate-[indeterminate_1.5s_infinite_linear]" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Destination Found: Handoff Card & Countdown
  if (destination) {
    const targetSlug = destination.slug || destination.id;
    const originSlug =
      origin === "gps"
        ? "gps"
        : origin && typeof origin === "object"
        ? origin.slug || origin.id
        : fromParam || null;

    const exploreUrl = originSlug
      ? `/explore?to=${encodeURIComponent(targetSlug)}&from=${encodeURIComponent(originSlug)}`
      : `/explore?to=${encodeURIComponent(targetSlug)}`;

    return (
      <div className="min-h-screen bg-[#F6F4EF] dark:bg-[#070B14] flex flex-col items-center justify-center p-6 text-slate-700 dark:text-zinc-200 font-sans">
        <div
          data-testid="navigate-handoff-card"
          className="w-full max-w-lg p-8 rounded-3xl bg-white dark:bg-[#0B1220] border border-[#E1DDD3] dark:border-zinc-800 shadow-2xl space-y-6 animate-in fade-in zoom-in-95"
        >
          {/* Header Badge */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                Destination Verified
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              Dataset C &bull; Dijkstra & A*
            </span>
          </div>

          {/* Destination Details */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-[#DE4B31] uppercase">
              <MapPinIcon className="w-3 h-3" />
              <span>
                {("location_type" in destination ? destination.location_type : destination.category) || "destination"}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {destination.name}
            </h1>
            {destination.description && (
              <p className="text-xs text-zinc-400 leading-relaxed">
                {destination.description}
              </p>
            )}
          </div>

          {/* Route Routing Hint */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-300">
              <RouteIcon className="w-4 h-4 text-[#DE4B31]" />
              <span>
                Origin:{" "}
                <strong className="text-white">
                  {origin === "gps"
                    ? "Device GPS Location"
                    : origin && typeof origin === "object"
                    ? origin.name
                    : "Main Gate 1 (Default)"}
                </strong>
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">
              Auto-centering
            </span>
          </div>

          {/* Forward Button & Countdown */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => router.replace(exploreUrl)}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#DE4B31] hover:bg-[#DE4B31]/90 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#DE4B31]/20 transition-all cursor-pointer"
            >
              <span>Launch Campus Map</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
            <p className="text-center text-[11px] text-zinc-500 font-mono">
              Directing to interactive map in {redirectCountdown}s…
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Destination Not Found / Missing Target
  return (
    <div
      data-testid="navigate-not-found"
      className="min-h-screen bg-[#F6F4EF] dark:bg-[#070B14] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-700 dark:text-zinc-200 font-sans"
    >
      <div className="w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0B1220] border border-[#E1DDD3] dark:border-zinc-800 shadow-2xl space-y-6">
        {/* Warning Banner */}
        <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200">
          <Icon name="warning" size={24} className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 min-w-0">
            <h1 className="text-sm font-bold text-[#111318] dark:text-white uppercase tracking-wider font-mono">
              Destination Not Found
            </h1>
            <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
              The location code{" "}
              {toParam ? (
                <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-zinc-900 border border-amber-300 dark:border-amber-700/60 font-mono text-[#111318] dark:text-white">
                  {toParam}
                </code>
              ) : (
                <span className="italic font-mono">(none provided)</span>
              )}{" "}
              does not match any verified place in the current LPU Dataset C catalog.
            </p>
          </div>
        </div>

        {/* Quick Search */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <span>Search Verified Campus Destinations</span>
            <span className="font-mono text-[10px]">
              {filteredCatalog.length} places available
            </span>
          </div>
          <div className="relative">
            <SearchIcon className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search blocks, gates, dining, hostels…"
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 text-xs text-[#111318] dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#DE4B31]"
            />
          </div>
        </div>

        {/* Destination Cards Grid */}
        <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
          {filteredCatalog.map((loc) => (
            <Link
              key={loc.id}
              href={`/explore?to=${encodeURIComponent(loc.slug || loc.id)}&from=gate-1`}
              className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 hover:bg-slate-100 dark:hover:bg-zinc-800/80 border border-slate-200 dark:border-zinc-800 hover:border-[#DE4B31]/60 flex items-center justify-between text-xs transition-colors group"
            >
              <div className="min-w-0 pr-2">
                <p className="font-bold text-[#111318] dark:text-white group-hover:text-[#DE4B31] transition-colors truncate">
                  {loc.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono uppercase">
                  {loc.location_type || "location"} &bull; {loc.slug}
                </p>
              </div>
              <span className="shrink-0 text-slate-400 dark:text-zinc-500 group-hover:text-[#DE4B31] transition-colors">
                →
              </span>
            </Link>
          ))}
          {filteredCatalog.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-400 dark:text-zinc-500">
              No matching destinations found.
            </div>
          )}
        </div>

        {/* Direct Link to Map */}
        <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-zinc-500 text-[11px] font-mono">
            Or open the free-roam map:
          </span>
          <Link
            href="/explore"
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 dark:hover:bg-zinc-700 text-white font-semibold transition-colors flex items-center gap-1.5"
          >
            <span>Open Campus Map</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function NavigatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F4EF] dark:bg-[#070B14] flex items-center justify-center text-slate-500 dark:text-zinc-400 font-mono text-xs">
          Loading CampusWay Navigation…
        </div>
      }
    >
      <NavigateContent />
    </Suspense>
  );
}
