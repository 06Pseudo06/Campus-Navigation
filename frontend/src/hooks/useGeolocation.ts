"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { isWithinCampusBounds } from "@/lib/mapViewport";
import { FEATURE_GPS } from "@/lib/featureFlags";

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  altitude?: number | null;
  timestamp: number;
}

export type GeolocationStatus = "idle" | "requesting" | "watching" | "error";
export type GeolocationPermission = "prompt" | "granted" | "denied" | "unsupported";

export interface GeolocationError {
  code?: number;
  message: string;
  type: "denied" | "timeout" | "unavailable" | "unsupported" | "insecure" | "disabled";
}

export interface UseGeolocationReturn {
  coordinates: GeoCoordinates | null;
  status: GeolocationStatus;
  permissionState: GeolocationPermission;
  error: GeolocationError | null;
  isInsideCampus: boolean;
  isAccuracySufficient: boolean;
  isMocked: boolean;
  requestLocation: () => Promise<void>;
  stopWatching: () => void;
  clearError: () => void;
  setMockCoordinates: (coords: Partial<GeoCoordinates> | null) => void;
}

export const ACCURACY_THRESHOLD_METERS = 50;

/**
 * Pure helper to verify if a coordinate is inside LPU campus boundaries.
 */
export function isPositionInsideCampus(lat: number, lng: number): boolean {
  return isWithinCampusBounds(lat, lng);
}

/**
 * Pure helper to verify if a GPS accuracy estimate meets the 50m threshold for snapping.
 */
export function isAccuracyAcceptable(accuracy: number): boolean {
  return Number.isFinite(accuracy) && accuracy > 0 && accuracy <= ACCURACY_THRESHOLD_METERS;
}

/**
 * Pure helper to map Geolocation API error codes to human-readable error messages and types.
 */
export function formatGeolocationError(code: number): { type: GeolocationError["type"]; message: string } {
  switch (code) {
    case 1: // PERMISSION_DENIED
      return {
        type: "denied",
        message: "Location access was denied. Click the lock/site settings icon in your browser address bar to allow location access.",
      };
    case 2: // POSITION_UNAVAILABLE
      return {
        type: "unavailable",
        message: "Campus GPS signal is currently unavailable. Ensure your device GPS/Location Services is switched on.",
      };
    case 3: // TIMEOUT
      return {
        type: "timeout",
        message: "Location request timed out. Please try locating again.",
      };
    default:
      return {
        type: "unavailable",
        message: "Unable to retrieve your location.",
      };
  }
}

export function useGeolocation(): UseGeolocationReturn {
  const [coordinates, setCoordinates] = useState<GeoCoordinates | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [permissionState, setPermissionState] = useState<GeolocationPermission>(() => {
    if (!FEATURE_GPS) return "unsupported";
    if (typeof window === "undefined" || !("geolocation" in navigator)) return "unsupported";
    return "prompt";
  });
  const [error, setError] = useState<GeolocationError | null>(null);
  const [isMocked, setIsMocked] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);
  const isActiveRef = useRef<boolean>(false);

  // 1. Initialise permission query if supported by the browser
  useEffect(() => {
    if (!FEATURE_GPS || typeof window === "undefined" || !("geolocation" in navigator)) {
      return;
    }

    let permissionStatus: PermissionStatus | null = null;
    const updatePerm = () => {
      if (permissionStatus) {
        if (permissionStatus.state === "granted") setPermissionState("granted");
        else if (permissionStatus.state === "denied") setPermissionState("denied");
        else setPermissionState("prompt");
      }
    };

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((perm) => {
          permissionStatus = perm;
          updatePerm();
          perm.onchange = updatePerm;
        })
        .catch(() => {
          // Permissions API query not supported for geolocation in some browsers
        });
    }

    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, []);

  // Handle position update from Geolocation API
  const handlePositionSuccess = useCallback((pos: GeolocationPosition) => {
    const coords: GeoCoordinates = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
      altitude: pos.coords.altitude,
      timestamp: pos.timestamp,
    };

    setCoordinates(coords);
    setStatus("watching");
    setPermissionState("granted");
    setError(null);
    setIsMocked(false);
  }, []);

  // Handle geolocation errors with user-friendly actionable messages
  const handlePositionError = useCallback((err: GeolocationPositionError) => {
    let type: GeolocationError["type"] = "unavailable";
    let message = "Unable to retrieve your location.";

    switch (err.code) {
      case err.PERMISSION_DENIED:
        type = "denied";
        setPermissionState("denied");
        message = "Location access was denied. Click the lock/site settings icon in your browser address bar to allow location access.";
        break;
      case err.POSITION_UNAVAILABLE:
        type = "unavailable";
        message = "Campus GPS signal is currently unavailable. Ensure your device GPS/Location Services is switched on.";
        break;
      case err.TIMEOUT:
        type = "timeout";
        message = "Location request timed out. Please try locating again.";
        break;
    }

    setError({ code: err.code, message, type });
    setStatus("error");
  }, []);

  // Core watchPosition lifecycle starter
  const startWatch = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setError({
        type: "unsupported",
        message: "Geolocation is not supported by your current browser.",
      });
      setStatus("error");
      return;
    }

    // Check secure context (localhost and HTTPS are considered secure)
    if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
      setError({
        type: "insecure",
        message: "Geolocation requires a secure HTTPS connection when accessed remotely.",
      });
      setStatus("error");
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    };

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePositionSuccess,
        handlePositionError,
        options
      );
      isActiveRef.current = true;
    } catch (e) {
      setError({
        type: "unavailable",
        message: "Failed to initialize location watch service: " + (e instanceof Error ? e.message : String(e)),
      });
      setStatus("error");
    }
  }, [handlePositionSuccess, handlePositionError]);

  // Request location triggered by user interaction (button tap)
  const requestLocation = useCallback(async () => {
    if (!FEATURE_GPS) {
      setError({
        type: "disabled",
        message: "GPS Location services are currently disabled by feature flag.",
      });
      setStatus("error");
      return;
    }

    setError(null);
    setStatus("requesting");

    // Attempt one-shot fix first to immediately respond to user tap
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handlePositionSuccess(pos);
          startWatch();
        },
        (err) => {
          handlePositionError(err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    } else {
      startWatch();
    }
  }, [handlePositionSuccess, handlePositionError, startWatch]);

  // Stop watching GPS position
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    isActiveRef.current = false;
    setStatus("idle");
  }, []);

  // Clear active error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Set mock location for developer testing without walking around campus
  const setMockCoordinates = useCallback((mock: Partial<GeoCoordinates> | null) => {
    if (!mock) {
      setCoordinates(null);
      setIsMocked(false);
      setStatus("idle");
      return;
    }

    const fullMock: GeoCoordinates = {
      latitude: mock.latitude ?? 31.260565,
      longitude: mock.longitude ?? 75.706815,
      accuracy: mock.accuracy ?? 15,
      heading: mock.heading ?? null,
      speed: mock.speed ?? null,
      altitude: mock.altitude ?? null,
      timestamp: Date.now(),
    };

    setCoordinates(fullMock);
    setIsMocked(true);
    setStatus("watching");
    setPermissionState("granted");
    setError(null);
  }, []);

  // 2. Page Visibility API: Clear watch when tab is hidden to conserve battery, resume when visible
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (watchIdRef.current !== null && typeof window !== "undefined" && "geolocation" in navigator) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      } else {
        if (isActiveRef.current && !isMocked) {
          startWatch();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (watchIdRef.current !== null && typeof window !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startWatch, isMocked]);

  const isInsideCampus = coordinates
    ? isWithinCampusBounds(coordinates.latitude, coordinates.longitude)
    : false;

  const isAccuracySufficient = coordinates
    ? coordinates.accuracy <= ACCURACY_THRESHOLD_METERS
    : false;

  return {
    coordinates,
    status,
    permissionState,
    error,
    isInsideCampus,
    isAccuracySufficient,
    isMocked,
    requestLocation,
    stopWatching,
    clearError,
    setMockCoordinates,
  };
}
