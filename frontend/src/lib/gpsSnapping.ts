/**
 * GPS Snapping Utilities — Spatial indexing, nearest graph node snapping, and dynamic live re-route triggers.
 */

import { haversineMeters } from "./mapViewport";
import { BackendNode } from "@/services/locationService";
import { CampusLocation } from "@/types/campus";

export interface SnapResult {
  snappedNode: BackendNode | null;
  distanceMeters: number;
  status: "snapped" | "low_accuracy" | "out_of_range" | "no_nodes";
}

export const MAX_SNAP_DISTANCE_METERS = 75; // Stage 4: 75m graph coverage boundary
export const ACCURACY_SNAP_THRESHOLD_METERS = 50;
export const RECOMPUTE_MOVE_THRESHOLD_METERS = 15;
export const RECOMPUTE_OFF_ROUTE_THRESHOLD_METERS = 25;

export interface NearestSurveyedPlace {
  id: string;
  name: string;
  slug?: string;
  distanceMeters: number;
  bearingDegrees: number;
  compassDirection: string;
  location: CampusLocation;
}

/**
 * Calculates initial bearing in degrees (0-360) from point 1 to point 2.
 */
export function calculateBearingDegrees(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const φ1 = (fromLat * Math.PI) / 180;
  const φ2 = (toLat * Math.PI) / 180;
  const Δλ = ((toLng - fromLng) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return (Math.round((θ * 180) / Math.PI) + 360) % 360;
}

/**
 * Converts a bearing in degrees to an 8-point cardinal compass string (e.g. North, North-East).
 */
export function bearingToCompass(degrees: number): string {
  const directions = [
    "North",
    "North-East",
    "East",
    "South-East",
    "South",
    "South-West",
    "West",
    "North-West",
  ];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

/**
 * Computes the top N nearest verified campus locations with distance and compass direction.
 */
export function getNearestSurveyedPlaces(
  coords: { latitude: number; longitude: number },
  locations: CampusLocation[],
  limit: number = 3
): NearestSurveyedPlace[] {
  const withDistance = locations
    .filter(
      (loc) =>
        loc.coordinates &&
        Number.isFinite(loc.coordinates.lat) &&
        Number.isFinite(loc.coordinates.lng)
    )
    .map((loc) => {
      const dist = haversineMeters(
        coords.latitude,
        coords.longitude,
        loc.coordinates.lat,
        loc.coordinates.lng
      );
      const bearing = calculateBearingDegrees(
        coords.latitude,
        coords.longitude,
        loc.coordinates.lat,
        loc.coordinates.lng
      );
      return {
        id: loc.id,
        name: loc.name,
        slug: loc.slug,
        distanceMeters: Math.round(dist),
        bearingDegrees: bearing,
        compassDirection: bearingToCompass(bearing),
        location: loc,
      };
    });

  withDistance.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return withDistance.slice(0, limit);
}

/**
 * 2D Spatial Grid Index for fast O(1) graph node queries.
 */
export class SpatialNodeIndex {
  private cellSize: number;
  private grid: Map<string, BackendNode[]> = new Map();

  constructor(nodes: BackendNode[], cellSizeDegrees: number = 0.001) {
    this.cellSize = cellSizeDegrees;
    for (const node of nodes) {
      if (Number.isFinite(node.latitude) && Number.isFinite(node.longitude)) {
        const key = this.getKey(node.latitude, node.longitude);
        const cell = this.grid.get(key) || [];
        cell.push(node);
        this.grid.set(key, cell);
      }
    }
  }

  private getKey(lat: number, lng: number): string {
    const r = Math.floor(lat / this.cellSize);
    const c = Math.floor(lng / this.cellSize);
    return `${r}:${c}`;
  }

  /**
   * Find candidate nodes in the cell and immediate 8-neighbor cells.
   */
  public getCandidates(lat: number, lng: number): BackendNode[] {
    const r = Math.floor(lat / this.cellSize);
    const c = Math.floor(lng / this.cellSize);
    const results: BackendNode[] = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const key = `${r + dr}:${c + dc}`;
        const cell = this.grid.get(key);
        if (cell) {
          results.push(...cell);
        }
      }
    }
    return results;
  }
}

/**
 * Snap a GPS coordinate fix to the nearest walkable graph node in Dataset C.
 * Enforces accuracy threshold (<= 50m) and snap radius (<= 150m).
 */
export function snapGpsToGraphNode(
  coords: { latitude: number; longitude: number; accuracy?: number },
  nodes: BackendNode[]
): SnapResult {
  if (!nodes || nodes.length === 0) {
    return { snappedNode: null, distanceMeters: Infinity, status: "no_nodes" };
  }

  if (coords.accuracy !== undefined && coords.accuracy > ACCURACY_SNAP_THRESHOLD_METERS) {
    return { snappedNode: null, distanceMeters: Infinity, status: "low_accuracy" };
  }

  const index = new SpatialNodeIndex(nodes);
  let candidates = index.getCandidates(coords.latitude, coords.longitude);
  if (candidates.length === 0) {
    // Fall back to full scan if spatial index neighbor cells had no points
    candidates = nodes;
  }

  let closest: BackendNode | null = null;
  let minDistance = Infinity;

  for (const node of candidates) {
    const dist = haversineMeters(coords.latitude, coords.longitude, node.latitude, node.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      closest = node;
    }
  }

  if (!closest || minDistance > MAX_SNAP_DISTANCE_METERS) {
    return { snappedNode: null, distanceMeters: minDistance, status: "out_of_range" };
  }

  return {
    snappedNode: closest,
    distanceMeters: Math.round(minDistance * 10) / 10,
    status: "snapped",
  };
}

/**
 * Calculate distance from point P to line segment AB in meters.
 */
export function distancePointToSegmentMeters(
  pLat: number,
  pLng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const dAB = haversineMeters(aLat, aLng, bLat, bLng);
  if (dAB === 0) {
    return haversineMeters(pLat, pLng, aLat, aLng);
  }

  // Vector projection parameter t
  const dx = bLng - aLng;
  const dy = bLat - aLat;
  const t = Math.max(0, Math.min(1, ((pLng - aLng) * dx + (pLat - aLat) * dy) / (dx * dx + dy * dy)));

  const projLat = aLat + t * dy;
  const projLng = aLng + t * dx;

  return haversineMeters(pLat, pLng, projLat, projLng);
}

/**
 * Calculate the minimum perpendicular distance from a GPS point to an active route polyline.
 */
export function distanceToRoutePolyline(
  point: { lat: number; lng: number },
  waypoints: Array<{ lat?: number; lng?: number }>
): number {
  const valid = waypoints.filter(
    (wp): wp is { lat: number; lng: number } =>
      Number.isFinite(wp.lat) && Number.isFinite(wp.lng)
  );

  if (valid.length === 0) return Infinity;
  if (valid.length === 1) {
    return haversineMeters(point.lat, point.lng, valid[0].lat, valid[0].lng);
  }

  let minDistance = Infinity;
  for (let i = 0; i < valid.length - 1; i++) {
    const d = distancePointToSegmentMeters(
      point.lat,
      point.lng,
      valid[i].lat,
      valid[i].lng,
      valid[i + 1].lat,
      valid[i + 1].lng
    );
    if (d < minDistance) {
      minDistance = d;
    }
  }

  return minDistance;
}

/**
 * Determines whether a new GPS fix necessitates recalculating the active route:
 * - User moved > 15m from previous calculation coordinate, OR
 * - User deviated > 25m away from the active route polyline.
 */
export function shouldRecomputeRoute(
  prevCoords: { latitude: number; longitude: number },
  newCoords: { latitude: number; longitude: number },
  routeWaypoints?: Array<{ lat?: number; lng?: number }>
): boolean {
  const moveDist = haversineMeters(
    prevCoords.latitude,
    prevCoords.longitude,
    newCoords.latitude,
    newCoords.longitude
  );

  if (moveDist >= RECOMPUTE_MOVE_THRESHOLD_METERS) {
    return true;
  }

  if (routeWaypoints && routeWaypoints.length >= 2) {
    const offRouteDist = distanceToRoutePolyline(
      { lat: newCoords.latitude, lng: newCoords.longitude },
      routeWaypoints
    );
    if (offRouteDist >= RECOMPUTE_OFF_ROUTE_THRESHOLD_METERS) {
      return true;
    }
  }

  return false;
}
