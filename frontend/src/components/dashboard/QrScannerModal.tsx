"use client";

import React, { useState, useEffect, useRef, useId, useCallback } from "react";
import { CampusLocation } from "@/types/campus";
import { BackendLocation, locationService } from "@/services/locationService";
import { VERIFIED_DATASET_C_LOCATIONS } from "@/data/campusData";
import { parseScannedQrPayload } from "@/lib/qrNavigation";
import {
  CloseIcon,
  QrCodeIcon,
  CheckCircleIcon,
  SearchIcon,
} from "./DashboardIcons";

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (
    destination: CampusLocation | BackendLocation,
    origin: string | null
  ) => void;
}

type CameraStatus =
  | "idle"
  | "requesting"
  | "scanning"
  | "success"
  | "denied"
  | "unsupported"
  | "insecure"
  | "unavailable";

export function QrScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}: QrScannerModalProps) {
  const titleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);
  const [torchAvailable, setTorchAvailable] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);

  // Manual code entry mode
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>("");
  const [manualError, setManualError] = useState<string | null>(null);

  // Non-blocking scan notification (e.g. for foreign QR codes)
  const [scanAlert, setScanAlert] = useState<string | null>(null);

  // Verified catalog for validation
  const [catalog, setCatalog] = useState<(CampusLocation | BackendLocation)[]>(
    VERIFIED_DATASET_C_LOCATIONS
  );

  // MediaStream tracking ref
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isCooldownRef = useRef<boolean>(false);

  // 1. Load catalog from service if available
  useEffect(() => {
    let cancelled = false;
    locationService
      .getLocations()
      .then((data) => {
        if (!cancelled && data.length > 0) setCatalog(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Stop camera stream helper
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setTorchOn(false);
    setTorchAvailable(false);
  }, []);

  // 3. Process scanned text payload
  const handlePayloadDetected = useCallback(
    (scannedText: string) => {
      if (isCooldownRef.current) return;

      const result = parseScannedQrPayload(scannedText, catalog);
      if (result.valid && result.destination) {
        isCooldownRef.current = true;
        setCameraStatus("success");

        // Small success vibration if available
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try {
            navigator.vibrate([40, 60, 40]);
          } catch {}
        }

        setTimeout(() => {
          stopCamera();
          onScanSuccess(result.destination!, result.origin);
        }, 500);
      } else {
        // Show non-blocking alert and pause for 2s before resuming detection
        isCooldownRef.current = true;
        setScanAlert(
          result.error || "Unrecognized QR sign. Please aim at an official CampusWay code."
        );
        setTimeout(() => {
          setScanAlert(null);
          isCooldownRef.current = false;
        }, 2200);
      }
    },
    [catalog, onScanSuccess, stopCamera]
  );

  // 4. Scanner detection loop (Native BarcodeDetector or jsQR canvas fallback)
  const startDetectionLoop = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Check for native BarcodeDetector
    const hasBarcodeDetector =
      typeof window !== "undefined" && "BarcodeDetector" in window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let detector: any = null;
    if (hasBarcodeDetector) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      } catch {
        detector = null;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let jsQRModule: any = null;
    if (!detector) {
      try {
        const mod = await import("jsqr");
        jsQRModule = mod.default || mod;
      } catch (err) {
        console.warn("[QrScanner] Failed to load jsQR fallback:", err);
      }
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const scanFrame = async () => {
      if (!videoRef.current || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (!isCooldownRef.current) {
        if (detector) {
          try {
            const barcodes = await detector.detect(video);
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              handlePayloadDetected(barcodes[0].rawValue);
            }
          } catch {}
        } else if (jsQRModule && ctx) {
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQRModule(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            if (code && code.data) {
              handlePayloadDetected(code.data);
            }
          } catch {}
        }
      }

      animFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, [handlePayloadDetected]);

  // 5. Initialize camera on modal open
  const startCamera = useCallback(async () => {
    // Check secure context
    if (
      typeof window !== "undefined" &&
      window.isSecureContext === false &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      setCameraStatus("insecure");
      setCameraErrorMessage("Camera access requires HTTPS or localhost.");
      return;
    }

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraStatus("unsupported");
      setCameraErrorMessage("Camera is not supported on this browser or device.");
      return;
    }

    setCameraStatus("requesting");
    setCameraErrorMessage(null);
    isCooldownRef.current = false;

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Check torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const capabilities = (videoTrack.getCapabilities?.() as any) || {};
        if (capabilities.torch) {
          setTorchAvailable(true);
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraStatus("scanning");
        startDetectionLoop();
      }
    } catch (err: unknown) {
      console.warn("[QrScanner] Camera error:", err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const domErr = err as any;
      if (domErr?.name === "NotAllowedError" || domErr?.name === "PermissionDeniedError") {
        setCameraStatus("denied");
        setCameraErrorMessage(
          "Camera permission was denied. Allow camera access in your browser settings to scan campus signs."
        );
      } else if (domErr?.name === "NotFoundError" || domErr?.name === "DevicesNotFoundError") {
        setCameraStatus("unsupported");
        setCameraErrorMessage("No camera found on this device.");
      } else {
        setCameraStatus("unavailable");
        setCameraErrorMessage(
          "Unable to start camera stream. It may be in use by another application."
        );
      }
    }
  }, [startDetectionLoop]);

  // Handle modal lifecycle
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setScanAlert(null);
      setShowManualInput(false);
      setManualCode("");
      setManualError(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Page Visibility API: pause camera when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopCamera();
      } else if (isOpen && document.visibilityState === "visible") {
        startCamera();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isOpen, startCamera, stopCamera]);

  // Torch toggle handler
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !torchOn;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (track.applyConstraints as any)({
        advanced: [{ torch: nextState }],
      });
      setTorchOn(nextState);
    } catch (err) {
      console.warn("Failed to toggle torch:", err);
    }
  };

  // Fallback A: Photo Upload decoder
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);

      // Try native BarcodeDetector
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
          const barcodes = await detector.detect(img);
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            handlePayloadDetected(barcodes[0].rawValue);
            return;
          }
        } catch {}
      }

      // Try jsQR fallback
      try {
        const mod = await import("jsqr");
        const jsQR = mod.default || mod;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          handlePayloadDetected(code.data);
          return;
        }
      } catch {}

      setScanAlert("No readable QR code found in the uploaded photo. Please try a clearer shot.");
    };
  };

  // Fallback B: Manual code entry
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    const result = parseScannedQrPayload(manualCode.trim(), catalog);
    if (result.valid && result.destination) {
      stopCamera();
      onScanSuccess(result.destination, result.origin);
    } else {
      setManualError(result.error || "Location code not recognized.");
    }
  };

  // Escape key dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="qr-scanner-modal"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-[#0a0f1d] border border-zinc-800 shadow-2xl overflow-hidden flex flex-col text-zinc-200">
        {/* Hidden Canvas for Frame Processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hidden File Input for Photo Upload Fallback */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoUpload}
          className="hidden"
          data-testid="qr-photo-input"
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/60 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#DE4B31]/15 border border-[#DE4B31]/40 text-[#DE4B31] flex items-center justify-center">
              <QrCodeIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 id={titleId} className="text-sm font-bold text-white">
                Scan Navigation Sign
              </h2>
              <p className="text-[10px] text-zinc-400 font-mono">
                LPU Dataset C Physical QR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Torch toggle if hardware supported */}
            {torchAvailable && (
              <button
                type="button"
                onClick={handleToggleTorch}
                className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                  torchOn
                    ? "bg-amber-500/20 text-amber-300 border-amber-500"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white"
                }`}
                title={torchOn ? "Turn off flashlight" : "Turn on flashlight"}
              >
                🔦
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close Scanner"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewfinder / Video Canvas Area */}
        <div className="relative w-full aspect-square bg-black overflow-hidden flex items-center justify-center">
          {/* Live Video Feed */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              cameraStatus === "scanning" || cameraStatus === "success"
                ? "opacity-100"
                : "opacity-0"
            }`}
          />

          {/* Frosted Viewfinder Overlay Frame */}
          {(cameraStatus === "scanning" || cameraStatus === "success") && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Semi-transparent dark mask around scanning box */}
              <div className="relative w-64 h-64 border-2 border-white/20 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                {/* Targeting Corners */}
                <div
                  className={`absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 rounded-tl-lg transition-colors ${
                    cameraStatus === "success" ? "border-emerald-400" : "border-[#DE4B31]"
                  }`}
                />
                <div
                  className={`absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 rounded-tr-lg transition-colors ${
                    cameraStatus === "success" ? "border-emerald-400" : "border-[#DE4B31]"
                  }`}
                />
                <div
                  className={`absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 rounded-bl-lg transition-colors ${
                    cameraStatus === "success" ? "border-emerald-400" : "border-[#DE4B31]"
                  }`}
                />
                <div
                  className={`absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 rounded-br-lg transition-colors ${
                    cameraStatus === "success" ? "border-emerald-400" : "border-[#DE4B31]"
                  }`}
                />

                {/* Animated Scanning Laser Line */}
                {cameraStatus === "scanning" && (
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#DE4B31] to-transparent shadow-[0_0_8px_#DE4B31] animate-[bounce_2s_infinite]" />
                )}

                {/* Success Check Overlay */}
                {cameraStatus === "success" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/40 rounded-2xl animate-in zoom-in-75">
                    <CheckCircleIcon className="w-16 h-16 text-emerald-400 animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Camera Loading / Requesting State */}
          {cameraStatus === "requesting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="w-10 h-10 rounded-full border-2 border-zinc-700 border-t-[#DE4B31] animate-spin" />
              <p className="text-xs text-zinc-300 font-medium">
                Requesting camera access…
              </p>
              <p className="text-[10px] text-zinc-500 font-mono">
                Point at any campus signage board
              </p>
            </div>
          )}

          {/* Camera Permission Denied or Unavailable */}
          {(cameraStatus === "denied" ||
            cameraStatus === "unsupported" ||
            cameraStatus === "insecure" ||
            cameraStatus === "unavailable") && (
            <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center space-y-3 bg-[#0B1220]">
              <div className="w-12 h-12 rounded-2xl bg-amber-950/40 border border-amber-800/80 text-amber-400 flex items-center justify-center text-xl">
                📷
              </div>
              <h3 className="text-sm font-bold text-white">Camera Access Required</h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs">
                {cameraErrorMessage}
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-[#DE4B31] hover:bg-[#DE4B31]/90 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Upload QR Photo
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualInput(true)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Enter Code
                </button>
              </div>
            </div>
          )}

          {/* Non-blocking Scan Alert Toast */}
          {scanAlert && (
            <div className="absolute bottom-4 inset-x-4 p-3 rounded-2xl bg-amber-950/90 border border-amber-700/80 text-amber-200 text-xs shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 flex items-center gap-2">
              <span className="text-sm">⚠️</span>
              <p className="leading-tight flex-1">{scanAlert}</p>
            </div>
          )}
        </div>

        {/* Fallback Drawer: Manual Code Input */}
        {showManualInput && (
          <div className="p-4 border-t border-zinc-800 bg-[#0f172a] space-y-3 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono uppercase">
                Enter Location Code
              </span>
              <button
                type="button"
                onClick={() => setShowManualInput(false)}
                className="text-[10px] text-zinc-400 hover:text-white font-mono"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => {
                    setManualCode(e.target.value);
                    setManualError(null);
                  }}
                  placeholder="e.g. block-1, gate-1, B1..."
                  className="flex-1 h-9 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#DE4B31]"
                  autoFocus
                />
                <button
                  type="submit"
                  data-testid="manual-code-submit"
                  className="h-9 px-4 rounded-xl bg-[#DE4B31] hover:bg-[#DE4B31]/90 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Go
                </button>
              </div>
              {manualError && (
                <p className="text-[10px] text-rose-400 font-mono">{manualError}</p>
              )}
            </form>
          </div>
        )}

        {/* Bottom Fallback Controls */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>📁</span>
            <span>Upload Photo</span>
          </button>

          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-[#DE4B31] hover:underline font-mono text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <SearchIcon className="w-3.5 h-3.5" />
            <span>{showManualInput ? "Hide Code Input" : "Type Code"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
