"use client";

/**
 * Location API Service — Fetches the verified Dataset C catalog from the backend.
 */

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
  created_at: string;
}

export const locationService = {
  /**
   * Fetch all active campus locations with optional search and type filter.
   */
  async getLocations(
    query?: string,
    locationType?: string
  ): Promise<BackendLocation[]> {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (locationType && locationType !== "all")
      params.set("location_type", locationType);
    // Public map and routing should use only administrator-verified places.
    params.set("is_verified", "true");
    params.set("limit", "100");

    try {
      const res = await fetch(`${API_BASE}/api/v1/locations/?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn("[locationService] Failed to fetch verified locations:", err);
      return [];
    }
  },

  /**
   * Fetch a single location by ID (includes children and aliases).
   */
  async getLocationById(id: string): Promise<BackendLocation | null> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/locations/${id}`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Fetch all graph nodes (for map pin rendering and route coordinate lookup).
   */
  async getNodes(): Promise<BackendNode[]> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/routing/nodes`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },
};
