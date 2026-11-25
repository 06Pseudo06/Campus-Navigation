"use client";

import React, { useState, useEffect, useId, useCallback, useMemo } from "react";
import { CampusLocation } from "@/types/campus";
import { buildNavigateUrl } from "@/lib/qrNavigation";
import {
  CloseIcon,
  CopyIcon,
  DownloadIcon,
  ShareIcon,
  PrinterIcon,
  CheckCircleIcon,
  QrCodeIcon,
} from "./DashboardIcons";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: CampusLocation | null;
  origin?: CampusLocation | null;
  isOriginCurrentLocation?: boolean;
  onTestScan?: (payload: string) => void;
}

export function QrCodeModal({
  isOpen,
  onClose,
  destination,
  origin,
  isOriginCurrentLocation = false,
  onTestScan,
}: QrCodeModalProps) {
  const titleId = useId();
  const descId = useId();

  // Mode: "destination" (default, navigates from anywhere) or "route" (specific origin -> destination)
  const [includeOrigin, setIncludeOrigin] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [svgString, setSvgString] = useState<string>("");
  const [pngDataUrl, setPngDataUrl] = useState<string>("");
  const [canShare] = useState<boolean>(() => {
    return typeof navigator !== "undefined" && typeof navigator.share === "function";
  });

  // Compute navigation target URL
  const originSlug = includeOrigin
    ? isOriginCurrentLocation
      ? "gps"
      : origin?.slug || null
    : null;

  const targetPath = destination
    ? buildNavigateUrl({ to: destination.slug || destination.id, from: originSlug })
    : "";

  const fullUrl = useMemo(() => {
    if (!targetPath) return "";
    if (typeof window !== "undefined") {
      return `${window.location.origin}${targetPath}`;
    }
    return targetPath;
  }, [targetPath]);

  // Lazy-load QRCode library and generate SVG & PNG
  useEffect(() => {
    if (!isOpen || !fullUrl) return;

    let isCancelled = false;

    import("qrcode")
      .then(async (QRCode) => {
        if (isCancelled) return;

        // Generate clean SVG with error correction level M
        const svg = await QRCode.toString(fullUrl, {
          type: "svg",
          errorCorrectionLevel: "M",
          margin: 2,
          color: {
            dark: "#070B14",
            light: "#FFFFFF",
          },
        });

        // Generate PNG data URL for direct download
        const png = await QRCode.toDataURL(fullUrl, {
          errorCorrectionLevel: "M",
          margin: 2,
          width: 512,
          color: {
            dark: "#070B14",
            light: "#FFFFFF",
          },
        });

        if (!isCancelled) {
          setSvgString(svg);
          setPngDataUrl(png);
        }
      })
      .catch((err) => {
        console.error("[QrCodeModal] Failed to generate QR code:", err);
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, fullUrl]);

  const isGenerating = !svgString;

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !destination) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const handleShare = async () => {
    if (canShare && navigator.share) {
      try {
        await navigator.share({
          title: `Navigate to ${destination.name} - CampusWay`,
          text: `Scan or tap to open walking navigation to ${destination.name} on LPU campus.`,
          url: fullUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadSvg = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `campusway-qr-${destination.slug || "destination"}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    if (!pngDataUrl) return;
    const link = document.createElement("a");
    link.href = pngDataUrl;
    link.download = `campusway-qr-${destination.slug || "destination"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasSpecificOrigin = Boolean(origin && origin.id !== destination.id) || isOriginCurrentLocation;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="qr-code-modal"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col text-slate-800 dark:text-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#DE4B31]/15 border border-[#DE4B31]/40 text-[#DE4B31] flex items-center justify-center">
              <QrCodeIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 id={titleId} className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                Navigation QR Code
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                LPU Dataset C Signage
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close QR Modal"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* Target Destination Eyebrow & Name */}
          <div className="text-center space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#DE4B31] font-mono">
              Destination Target
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {destination.name}
            </h3>
            <p id={descId} className="text-xs text-slate-600 dark:text-zinc-400">
              {includeOrigin
                ? `Route from ${isOriginCurrentLocation ? "Your Current Location" : origin?.name || "Starting Point"} to ${destination.name}`
                : "Scanners will be routed directly to this destination from their device GPS or Gate 1."}
            </p>
          </div>

          {/* QR Code Presentation Box */}
          <div className="flex justify-center">
            <div className="relative p-4 rounded-2xl bg-white shadow-xl border-2 border-[#DE4B31]/60 flex items-center justify-center group">
              {/* Outer decorative corner marks */}
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#DE4B31]" />
              <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#DE4B31]" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#DE4B31]" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#DE4B31]" />

              {isGenerating ? (
                <div className="w-52 h-52 flex flex-col items-center justify-center gap-2 text-zinc-500">
                  <div className="w-8 h-8 rounded-full border-2 border-zinc-300 border-t-[#DE4B31] animate-spin" />
                  <span className="text-xs font-mono">Generating QR…</span>
                </div>
              ) : (
                <div
                  className="w-52 h-52 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: svgString }}
                  data-testid="qr-code-svg-container"
                />
              )}
            </div>
          </div>

          {/* Origin Mode Toggle (if a specific origin is set) */}
          {hasSpecificOrigin && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-xs">
              <span className="text-slate-700 dark:text-zinc-300">
                Include origin: <span className="text-slate-900 dark:text-white font-semibold">{isOriginCurrentLocation ? "My GPS Location" : origin?.name}</span>
              </span>
              <button
                type="button"
                onClick={() => setIncludeOrigin(!includeOrigin)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  includeOrigin ? "bg-[#DE4B31]" : "bg-slate-300 dark:bg-zinc-700"
                }`}
                aria-pressed={includeOrigin}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    includeOrigin ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}

          {/* Deep Link URL Readout & Copy Button */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 font-mono tracking-wider">
              Deep Link URL
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={fullUrl}
                className="flex-1 h-9 px-3 rounded-xl bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 text-xs font-mono text-slate-800 dark:text-zinc-300 truncate focus:outline-none select-all"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`h-9 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  copied
                    ? "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-white"
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleDownloadSvg}
              disabled={isGenerating || !svgString}
              className="py-2.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              <span>SVG</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isGenerating || !pngDataUrl}
              className="py-2.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              <span>PNG (HD)</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              disabled={isGenerating}
              className="py-2.5 px-2 rounded-xl bg-[#DE4B31]/15 hover:bg-[#DE4B31]/25 border border-[#DE4B31]/40 text-[#DE4B31] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShareIcon className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>

          {/* In-App Simulation: Test this QR */}
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onTestScan) {
                onTestScan(fullUrl || targetPath);
              }
            }}
            data-testid="test-qr-button"
            className="w-full py-2.5 px-3 rounded-xl bg-[#E8452C] hover:bg-[#D43B23] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
          >
            <Icon name="route" size={16} />
            <span>Test this QR in App (Simulate Scan)</span>
          </button>
        </div>

        {/* Footer / Printable Sheet Link */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-900/30 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-zinc-500 text-[11px]">
            Physical Signage Deployment
          </span>
          <Link
            href="/admin/qr"
            onClick={onClose}
            className="text-[11px] font-mono font-semibold text-[#DE4B31] hover:underline flex items-center gap-1"
          >
            <PrinterIcon className="w-3.5 h-3.5" />
            <span>Printable A4 Sheet →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
