"use client";

/**
 * Location API Service — Fetches the verified Dataset C catalog from the backend.
 * Features in-memory caching with Stale-While-Revalidate (SWR) semantics and request deduplication.
 * Falls back to verified survey dataset if API endpoint is unreachable.
 */

import { VERIFIED_DATASET_C_LOCATIONS, VERIFIED_DATASET_C_NODES, VERIFIED_DATASET_C_SEGMENTS } from "@/data/campusData";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface BackendLocation {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  location_type: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  address_details: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BackendNode {
  id: string;
  location_id: string | null;
  node_type: string;
  latitude: number;
  longitude: number;
  is_accessible: boolean;
  is_active: boolean;
  created_at?: string;
  survey_id?: string;
}

export interface BackendEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  distance_m: number;
  path_type: string;
  is_bidirectional: boolean;
  is_accessible: boolean;
  is_active: boolean;
}

export interface BackendGraph {
  nodes: BackendNode[];
  edges: BackendEdge[];
}

// In-memory cache store
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const inflightPromises = new Map<string, Promise<unknown>>();
let _locationsAbortController: AbortController | null = null;

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes max age
const STALE_THRESHOLD_MS = 60 * 1000; // 1 minute fresh window

function getCached<T>(key: string): { hit: boolean; data?: T; isStale: boolean } {
  const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return { hit: false, isStale: false };
  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL_MS) {
    memoryCache.delete(key);
    return { hit: false, isStale: false };
  }
  return { hit: true, data: entry.data, isStale: age > STALE_THRESHOLD_MS };
}

function setCached<T>(key: string, data: T): void {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

export const locationService = {
  /**
   * Fetch all active campus locations with optional search and type filter.
   * Utilizes stale-while-revalidate caching and request deduplication.
   */
  async getLocations(
    query?: string,
    locationType?: string
  ): Promise<BackendLocation[]> {
    const cacheKey = `locations:${query || ""}:${locationType || ""}`;
    const cached = getCached<BackendLocation[]>(cacheKey);

    if (cached.hit && cached.data) {
      if (cached.isStale && !inflightPromises.has(cacheKey)) {
        // Trigger background revalidation
        this._fetchLocationsNetwork(query, locationType, cacheKey).catch(() => {});
      }
      return cached.data;
    }

    if (inflightPromises.has(cacheKey)) {
      return inflightPromises.get(cacheKey) as Promise<BackendLocation[]>;
    }

    const promise = this._fetchLocationsNetwork(query, locationType, cacheKey);
    inflightPromises.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      inflightPromises.delete(cacheKey);
    }
  },

  async _fetchLocationsNetwork(
    query?: string,
    locationType?: string,
    cacheKey?: string
  ): Promise<BackendLocation[]> {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (locationType && locationType !== "all") {
      params.set("location_type", locationType);
    }
    params.set("is_verified", "true");
    params.set("limit", "100");

    // Cancel prior query search to avoid race conditions and stale response overwrite
    if (query) {
      if (_locationsAbortController) {
        _locationsAbortController.abort();
      }
      _locationsAbortController = new AbortController();
    }
    const signal = query ? _locationsAbortController?.signal : undefined;

    try {
      const res = await fetch(`${API_BASE}/api/v1/locations/?${params.toString()}`, {
        credentials: "include",
        signal,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        if (cacheKey) setCached(cacheKey, data);
        return data;
      }
      return VERIFIED_DATASET_C_LOCATIONS;
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return (cacheKey && getCached<BackendLocation[]>(cacheKey)?.data) || VERIFIED_DATASET_C_LOCATIONS;
      }
      console.warn("[locationService] API unavailable, using verified Dataset C survey fallback:", err);
      return VERIFIED_DATASET_C_LOCATIONS;
    }
  },

  /**
   * Fetch a single location by ID (includes children and aliases).
   */
  async getLocationById(id: string): Promise<BackendLocation | null> {
    const cacheKey = `location:${id}`;
    const cached = getCached<BackendLocation>(cacheKey);
    if (cached.hit && cached.data) return cached.data;

    try {
      const res = await fetch(`${API_BASE}/api/v1/locations/${id}`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      const data = await res.json();
      setCached(cacheKey, data);
      return data;
    } catch {
      return (
        VERIFIED_DATASET_C_LOCATIONS.find((l) => l.id === id || l.slug === id) || null
      );
    }
  },

  /**
   * Fetch all graph nodes (for map pin rendering and route coordinate lookup).
   */
  async getNodes(): Promise<BackendNode[]> {
    const cacheKey = "nodes:all";
    const cached = getCached<BackendNode[]>(cacheKey);

    if (cached.hit && cached.data) {
      if (cached.isStale && !inflightPromises.has(cacheKey)) {
        this._fetchNodesNetwork(cacheKey).catch(() => {});
      }
      return cached.data;
    }

    if (inflightPromises.has(cacheKey)) {
      return inflightPromises.get(cacheKey) as Promise<BackendNode[]>;
    }

    const promise = this._fetchNodesNetwork(cacheKey);
    inflightPromises.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      inflightPromises.delete(cacheKey);
    }
  },

  async _fetchNodesNetwork(cacheKey: string): Promise<BackendNode[]> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/routing/nodes`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setCached(cacheKey, data);
        return data;
      }
      return VERIFIED_DATASET_C_NODES;
    } catch {
      return VERIFIED_DATASET_C_NODES;
    }
  },

  /**
   * Fetch complete graph (nodes and edges) in a single compact call.
   */
  async getGraph(): Promise<BackendGraph> {
    const cacheKey = "graph:full";
    const cached = getCached<BackendGraph>(cacheKey);
    if (cached.hit && cached.data) return cached.data;

    try {
      const res = await fetch(`${API_BASE}/api/v1/routing/graph`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCached(cacheKey, data);
        return data;
      }
    } catch {
      // Fallback
    }

    // Default fallback from Dataset C constants
    const fallback: BackendGraph = {
      nodes: VERIFIED_DATASET_C_NODES,
      edges: VERIFIED_DATASET_C_SEGMENTS.map((s, idx) => ({
        id: `seg-${idx}`,
        source_node_id: s.from,
        target_node_id: s.to,
        distance_m: s.distance_m,
        path_type: "footpath",
        is_bidirectional: true,
        is_accessible: true,
        is_active: true,
      })),
    };
    setCached(cacheKey, fallback);
    return fallback;
  },

  /**
   * Clear in-memory cache (e.g. for testing or forced refresh).
   */
  clearCache(): void {
    memoryCache.clear();
    inflightPromises.clear();
  },
};
