/**
 * Map Viewport Utilities — LPU Campus Bounding Box, Responsive Padding, and Session Persistence.
 */

export const SESSION_VIEWPORT_KEY = "campusway_map_viewport";

export const DATASET_C_INITIAL_CENTER = {
  latitude: 31.260565,
  longitude: 75.706815,
};

export const DEFAULT_ZOOM = 16.5;
export const LPU_MIN_ZOOM = 14.5;
export const LPU_MAX_ZOOM = 19.5;

// LPU Campus Bounding Box with ~1.5km buffer to prevent stray panning
export const LPU_CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [75.692, 31.248], // South-West [lng, lat]
  [75.722, 31.272], // North-East [lng, lat]
];

export interface MapViewportState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

export function getDefaultViewport(): MapViewportState {
  return {
    longitude: DATASET_C_INITIAL_CENTER.longitude,
    latitude: DATASET_C_INITIAL_CENTER.latitude,
    zoom: DEFAULT_ZOOM,
    pitch: 40,
    bearing: 0,
  };
}

export function getStoredViewport(): MapViewportState {
  if (typeof window === "undefined") {
    return getDefaultViewport();
  }
  try {
    const raw = sessionStorage.getItem(SESSION_VIEWPORT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        Number.isFinite(parsed.longitude) &&
        Number.isFinite(parsed.latitude) &&
        Number.isFinite(parsed.zoom)
      ) {
        return {
          longitude: parsed.longitude,
          latitude: parsed.latitude,
          zoom: Math.min(LPU_MAX_ZOOM, Math.max(LPU_MIN_ZOOM, parsed.zoom)),
          pitch: Number.isFinite(parsed.pitch) ? parsed.pitch : 40,
          bearing: Number.isFinite(parsed.bearing) ? parsed.bearing : 0,
        };
      }
    }
  } catch {
    // Ignore error and fall back
  }
  return getDefaultViewport();
}

export function saveStoredViewport(vp: Partial<MapViewportState>): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredViewport();
    const updated: MapViewportState = {
      longitude: Number.isFinite(vp.longitude) ? vp.longitude! : current.longitude,
      latitude: Number.isFinite(vp.latitude) ? vp.latitude! : current.latitude,
      zoom: Number.isFinite(vp.zoom) ? vp.zoom! : current.zoom,
      pitch: Number.isFinite(vp.pitch) ? vp.pitch! : current.pitch,
      bearing: Number.isFinite(vp.bearing) ? vp.bearing! : current.bearing,
    };
    sessionStorage.setItem(SESSION_VIEWPORT_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota error
  }
}

export function clearStoredViewport(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_VIEWPORT_KEY);
  } catch {
    // Ignore
  }
}

export interface MapPadding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Calculates asymmetric viewport padding taking into account desktop sidebar (420px)
 * versus mobile bottom drawer/sheet (320px).
 */
export function getResponsiveMapPadding(
  isMobile: boolean,
  isDrawerOpen: boolean = true
): MapPadding {
  if (isMobile) {
    return {
      top: 80,
      bottom: isDrawerOpen ? 320 : 60,
      left: 20,
      right: 20,
    };
  }
  return {
    top: 70,
    bottom: 70,
    left: 80,
    right: isDrawerOpen ? 420 : 70,
  };
}

/**
 * Computes bounding box [[minLng, minLat], [maxLng, maxLat]] for a list of waypoints.
 */
export function calculateRouteBounds(
  waypoints: Array<{ lat?: number; lng?: number }>
): [[number, number], [number, number]] | null {
  const valid = waypoints.filter(
    (wp) => Number.isFinite(wp.lat) && Number.isFinite(wp.lng)
  );
  if (valid.length < 2) return null;

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const wp of valid) {
    if (wp.lng! < minLng) minLng = wp.lng!;
    if (wp.lng! > maxLng) maxLng = wp.lng!;
    if (wp.lat! < minLat) minLat = wp.lat!;
    if (wp.lat! > maxLat) maxLat = wp.lat!;
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

/**
 * Calculate Haversine distance in meters between two lat/lng pairs.
 */
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns the maximum zoom cap for route framing.
 * If the route bounding box diagonal span is < 80 meters, caps zoom to 17.5 to prevent over-zooming.
 */
export function getRouteFitBoundsZoomCap(bounds: [[number, number], [number, number]]): number {
  const [[swLng, swLat], [neLng, neLat]] = bounds;
  const span = haversineMeters(swLat, swLng, neLat, neLng);
  return span < 80 ? 17.5 : 18.5;
}

/**
 * Checks whether a given GPS coordinate is inside the LPU campus bounds (with an optional buffer).
 */
export function isWithinCampusBounds(
  latitude: number,
  longitude: number,
  bufferDegrees: number = 0.005
): boolean {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  const [[swLng, swLat], [neLng, neLat]] = LPU_CAMPUS_BOUNDS;
  return (
    latitude >= swLat - bufferDegrees &&
    latitude <= neLat + bufferDegrees &&
    longitude >= swLng - bufferDegrees &&
    longitude <= neLng + bufferDegrees
  );
}


