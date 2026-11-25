/**
 * Navigation Intent Resolver — Centralized business logic for processing QR scans,
 * deep links, origin resolution, GPS snapping, debounce, and auto-routing dispatch.
 */

import { CampusLocation } from "@/types/campus";
import { BackendLocation, BackendNode } from "@/services/locationService";
import { VERIFIED_DATASET_C_LOCATIONS, mapBackendToFrontend } from "@/data/campusData";
import { parseScannedQrPayload, validateLocationIdentifier } from "./qrNavigation";
import { snapGpsToGraphNode, getNearestSurveyedPlaces } from "./gpsSnapping";

export const DEFAULT_DEBOUNCE_MS = 1500;
export const GPS_SNAPPED_ORIGIN_THRESHOLD_METERS = 45;

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface NavigationIntentOptions {
  /** Raw text payload from QR code scan or deep link parameter */
  payload: string;
  /** Verified catalog of campus locations (defaults to Dataset C) */
  catalog?: (CampusLocation | BackendLocation)[];
  /** Live user GPS coordinate fix if available */
  gpsCoords?: GpsCoordinates | null;
  /** Campus navigation graph nodes for spatial snapping */
  graphNodes?: BackendNode[];
  /** Timestamp of the last processed scan for debounce protection */
  lastScanTimestamp?: number;
  /** Debounce window in milliseconds (default: 1500ms) */
  debounceMs?: number;
}

export type NavigationIntentOutcome =
  | {
      status: "debounced";
      message: string;
      timestamp: number;
    }
  | {
      status: "invalid";
      error: string;
      timestamp: number;
    }
  | {
      status: "same_location";
      destination: CampusLocation;
      origin: CampusLocation;
      message: string;
      timestamp: number;
    }
  | {
      status: "needs_origin";
      destination: CampusLocation;
      message: string;
      timestamp: number;
    }
  | {
      status: "ready";
      destination: CampusLocation;
      origin: CampusLocation;
      isGpsOrigin: boolean;
      toastMessage?: string;
      timestamp: number;
    };

/**
 * Resolves a scanned or deep-linked navigation intent into a concrete routing action.
 * Enforces validation, origin resolution (explicit -> GPS snapped <= 45m -> origin prompt),
 * duplicate scan debounce, and `to === from` edge cases.
 */
export function resolveNavigationIntent(
  options: NavigationIntentOptions
): NavigationIntentOutcome {
  const now = Date.now();
  const debounceWindow = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;

  // 1. Rapid double-scan debounce guard
  if (
    options.lastScanTimestamp &&
    now - options.lastScanTimestamp < debounceWindow
  ) {
    return {
      status: "debounced",
      message: "Ignored rapid duplicate scan",
      timestamp: options.lastScanTimestamp,
    };
  }

  const catalog = (options.catalog && options.catalog.length > 0
    ? options.catalog
    : VERIFIED_DATASET_C_LOCATIONS) as CampusLocation[];

  // 2. Parse payload using enhanced QR parser
  const parsed = parseScannedQrPayload(options.payload, catalog);
  if (!parsed.valid || !parsed.destination) {
    return {
      status: "invalid",
      error: parsed.error || "Unknown QR code — not a recognized CampusWay location",
      timestamp: now,
    };
  }

  const destination = parsed.destination as CampusLocation;
  let origin: CampusLocation | null = null;
  let isGpsOrigin = false;
  let toastMessage: string | undefined = undefined;

  // 3. Resolve origin
  if (parsed.origin) {
    if (parsed.origin.toLowerCase() === "gps") {
      // User explicitly requested GPS origin in payload
      const snappedGpsOrigin = resolveSnappedGpsOrigin(
        options.gpsCoords,
        options.graphNodes,
        catalog,
        GPS_SNAPPED_ORIGIN_THRESHOLD_METERS
      );
      if (snappedGpsOrigin) {
        origin = snappedGpsOrigin;
        isGpsOrigin = true;
        toastMessage = `Starting from your current location (${origin.name})`;
      } else {
        return {
          status: "needs_origin",
          destination,
          message: "Where are you starting from?",
          timestamp: now,
        };
      }
    } else {
      // Named origin provided in payload (e.g. 'gate-1', 'block-1')
      const matched = validateLocationIdentifier(parsed.origin, catalog);
      if (matched) {
        origin = matched as CampusLocation;
      } else {
        return {
          status: "needs_origin",
          destination,
          message: "Where are you starting from?",
          timestamp: now,
        };
      }
    }
  } else {
    // No origin provided in QR payload -> attempt automatic GPS snapping (distance <= 45m)
    const snappedGpsOrigin = resolveSnappedGpsOrigin(
      options.gpsCoords,
      options.graphNodes,
      catalog,
      GPS_SNAPPED_ORIGIN_THRESHOLD_METERS
    );
    if (snappedGpsOrigin) {
      origin = snappedGpsOrigin;
      isGpsOrigin = true;
      toastMessage = `Starting from your current location (${origin.name})`;
    } else {
      // No GPS fix or outside 45m threshold -> do not fail silently, ask user for origin
      return {
        status: "needs_origin",
        destination,
        message: "Where are you starting from?",
        timestamp: now,
      };
    }
  }

  // 4. Edge Case: User scans the same place they are at (to === from)
  if (
    origin &&
    (origin.id === destination.id ||
      (origin.slug && destination.slug && origin.slug.toLowerCase() === destination.slug.toLowerCase()))
  ) {
    return {
      status: "same_location",
      destination,
      origin,
      message: `You are already at ${destination.name}!`,
      timestamp: now,
    };
  }

  // 5. Ready for immediate route calculation
  return {
    status: "ready",
    destination,
    origin,
    isGpsOrigin,
    toastMessage,
    timestamp: now,
  };
}

/**
 * Snaps live GPS coordinates to the nearest verified campus location
 * provided the distance is within thresholdMeters (<= 45m).
 */
export function resolveSnappedGpsOrigin(
  coords: GpsCoordinates | null | undefined,
  nodes: BackendNode[] | undefined,
  catalog: (CampusLocation | BackendLocation)[],
  thresholdMeters: number = GPS_SNAPPED_ORIGIN_THRESHOLD_METERS
): CampusLocation | null {
  if (!coords || !Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)) {
    return null;
  }

  // Ensure locations have .coordinates for spatial calculations
  const mappedCatalog: CampusLocation[] = catalog.map((loc) => {
    if ("coordinates" in loc && loc.coordinates) return loc as CampusLocation;
    return mapBackendToFrontend(loc as BackendLocation);
  });

  // Check 1: Find nearest surveyed campus location directly
  const nearestPlaces = getNearestSurveyedPlaces(coords, mappedCatalog, 1);
  if (nearestPlaces.length > 0 && nearestPlaces[0].distanceMeters <= thresholdMeters) {
    const matched = mappedCatalog.find((c) => c.id === nearestPlaces[0].id) || nearestPlaces[0].location;
    return matched;
  }

  // Check 2: If nodes exist, snap to nearest graph node and find associated location
  if (nodes && nodes.length > 0) {
    const snap = snapGpsToGraphNode(coords, nodes);
    if (snap.status === "snapped" && snap.snappedNode && snap.distanceMeters <= thresholdMeters) {
      // Find campus location matching snapped node or its associated location_id
      const matchingLoc = mappedCatalog.find(
        (loc) =>
          loc.id === snap.snappedNode?.id ||
          loc.id === snap.snappedNode?.location_id
      );
      if (matchingLoc) return matchingLoc;
    }
  }

  return null;
}
