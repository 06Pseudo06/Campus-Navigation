"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { VERIFIED_DATASET_C_LOCATIONS } from "@/data/campusData";
import { BackendLocation, locationService } from "@/services/locationService";
import { buildNavigateUrl } from "@/lib/qrNavigation";
import { PrinterIcon, ArrowRightIcon } from "@/components/dashboard/DashboardIcons";

interface QrCardData {
  location: BackendLocation;
  url: string;
  svg: string;
}

export default function PrintableQrSheetPage() {
  const [locations, setLocations] = useState<BackendLocation[]>(VERIFIED_DATASET_C_LOCATIONS);
  const [qrCards, setQrCards] = useState<QrCardData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  // Load locations
  useEffect(() => {
    let cancelled = false;
    locationService
      .getLocations()
      .then((data) => {
        if (!cancelled && data.length > 0) {
          setLocations(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Generate QR codes for all locations using dynamic import of qrcode
  useEffect(() => {
    let cancelled = false;

    async function generateAllQrs() {
      try {
        const QRCode = await import("qrcode");
        const origin =
          typeof window !== "undefined" && window.location.origin
            ? window.location.origin
            : "https://campusway.lpu.in";

        const generated: QrCardData[] = [];

        for (const loc of locations) {
          const targetUrl = buildNavigateUrl({
            to: loc.slug || loc.id,
            origin,
          });

          const svg = await QRCode.toString(targetUrl, {
            type: "svg",
            errorCorrectionLevel: "M",
            margin: 1,
            color: {
              dark: "#070B14",
              light: "#FFFFFF",
            },
          });

          generated.push({
            location: loc,
            url: targetUrl,
            svg,
          });
        }

        if (!cancelled) {
          setQrCards(generated);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to generate signage QR codes:", err);
      }
    }

    if (locations.length > 0) {
      generateAllQrs();
    }

    return () => {
      cancelled = true;
    };
  }, [locations]);

  const filteredCards = qrCards.filter((card) => {
    if (selectedFilter === "all") return true;
    return card.location.location_type === selectedFilter;
  });

  return (
    <div className="min-h-screen bg-[#070B14] text-zinc-200 font-sans print:bg-white print:text-black">
      {/* ──── Screen-only Header & Action Bar ──── */}
      <header className="p-4 sm:p-6 bg-[#0B1220] border-b border-zinc-800 print:hidden sticky top-0 z-30 shadow-xl backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#DE4B31]/20 text-[#DE4B31] border border-[#DE4B31]/40 uppercase">
                Admin &bull; Physical Signage
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                LPU Dataset C ({qrCards.length} Verified Locations)
              </span>
            </div>
            <h1 className="text-lg font-extrabold text-white">
              CampusWay QR Signage Sheet
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Filter */}
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="h-9 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-medium text-zinc-200 focus:outline-none focus:border-[#DE4B31] cursor-pointer"
            >
              <option value="all">All Locations ({qrCards.length})</option>
              <option value="building">Academic Blocks</option>
              <option value="gate">Gates & Checkpoints</option>
              <option value="service">Services & Dining</option>
              <option value="landmark">Landmarks</option>
            </select>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => window.print()}
              disabled={loading}
              className="h-9 px-4 rounded-xl bg-[#DE4B31] hover:bg-[#DE4B31]/90 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#DE4B31]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>Print A4 Signage</span>
            </button>

            {/* Back to Map */}
            <Link
              href="/explore"
              className="h-9 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Back to Map</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ──── Printable Grid Container ──── */}
      <main className="max-w-6xl mx-auto p-4 sm:p-8 print:p-0 print:max-w-none">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-[#DE4B31] animate-spin" />
            <span>Generating high-resolution QR vectors for Dataset C…</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
            {filteredCards.map(({ location: loc, url, svg }) => (
              <article
                key={loc.id}
                className="rounded-3xl bg-[#0B1220] border-2 border-zinc-800 p-6 flex flex-col justify-between shadow-lg relative overflow-hidden page-break-inside-avoid print:bg-white print:border-2 print:border-black print:text-black print:shadow-none print:rounded-2xl"
                style={{ breakInside: "avoid" }}
              >
                {/* Decorative cut marks for physical printing */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#DE4B31] print:border-black" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#DE4B31] print:border-black" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#DE4B31] print:border-black" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#DE4B31] print:border-black" />

                {/* Card Header */}
                <div className="space-y-1.5 pb-3 border-b border-zinc-800 print:border-black">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#DE4B31] print:text-black">
                      CAMPUSWAY &bull; LPU
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-zinc-900 print:bg-zinc-100 border border-zinc-700 print:border-black text-zinc-300 print:text-black">
                      {loc.location_type || "DESTINATION"}
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold text-white print:text-black leading-snug">
                    {loc.name}
                  </h2>
                  {loc.address_details && (
                    <p className="text-[11px] text-zinc-400 print:text-zinc-700 font-mono">
                      {loc.address_details}
                    </p>
                  )}
                </div>

                {/* QR Code Graphic Box */}
                <div className="py-4 flex flex-col items-center justify-center">
                  <div className="p-3 rounded-2xl bg-white border-2 border-zinc-300 print:border-black shadow-inner flex items-center justify-center">
                    <div
                      className="w-44 h-44 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                      dangerouslySetInnerHTML={{ __html: svg }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 print:text-zinc-600 mt-2 text-center break-all select-all">
                    {url}
                  </span>
                </div>

                {/* Signage Instructions & Footer */}
                <div className="pt-3 border-t border-zinc-800 print:border-black text-center space-y-1">
                  <p className="text-xs font-bold text-white print:text-black">
                    Scan with any phone camera
                  </p>
                  <p className="text-[10px] text-zinc-400 print:text-zinc-700 leading-tight">
                    Launches instant turn-by-turn walking navigation to this destination.
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
