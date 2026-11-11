/**
 * CampusWay Favorite Locations Service
 * 
 * Manages user bookmarks with dual-mode storage:
 * - Authenticated: Persisted to PostgreSQL via /api/v1/favorites
 * - Guest: Persisted to browser localStorage under "campusway_guest_favorites"
 */

import { FavoriteCreate, FavoriteRead } from "@/types/api";

const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");

const GUEST_FAVORITES_KEY = "campusway_guest_favorites";
const TOKEN_KEY = "campusway_access_token";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export const favoriteService = {
  /**
   * Fetch all bookmarked locations for the current authenticated user session
   */
  async getMyFavorites(): Promise<FavoriteRead[]> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required to access saved favorites.");
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/favorites/mine`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.detail || `Failed to fetch favorites (HTTP ${response.status})`);
    }

    return (await response.json()) as FavoriteRead[];
  },

  /**
   * Add a location bookmark for an authenticated user in PostgreSQL
   */
  async addFavorite(userId: string, locationId: string): Promise<FavoriteRead> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required to save favorites.");
    }

    const payload: FavoriteCreate = {
      user_id: userId,
      location_id: locationId,
    };

    const response = await fetch(`${API_BASE_URL}/api/v1/favorites/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.detail || `Failed to add favorite (HTTP ${response.status})`);
    }

    return (await response.json()) as FavoriteRead;
  },

  /**
   * Remove a location bookmark for an authenticated user from PostgreSQL
   */
  async removeFavorite(userId: string, locationId: string): Promise<boolean> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required to remove favorites.");
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/favorites/${encodeURIComponent(userId)}/${encodeURIComponent(locationId)}`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 204) {
      return true;
    }

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.detail || `Failed to remove favorite (HTTP ${response.status})`);
    }

    return true;
  },

  /**
   * Retrieve guest bookmark location IDs from localStorage
   */
  getGuestFavorites(): string[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(GUEST_FAVORITES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  /**
   * Add a guest bookmark location ID to localStorage
   */
  addGuestFavorite(locationId: string): string[] {
    if (typeof window === "undefined") return [];
    const current = this.getGuestFavorites();
    if (!current.includes(locationId)) {
      const updated = [...current, locationId];
      localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    }
    return current;
  },

  /**
   * Remove a guest bookmark location ID from localStorage
   */
  removeGuestFavorite(locationId: string): string[] {
    if (typeof window === "undefined") return [];
    const current = this.getGuestFavorites();
    const updated = current.filter((id) => id !== locationId);
    localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify(updated));
    return updated;
  },

  /**
   * Clear guest bookmarks from localStorage
   */
  clearGuestFavorites(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(GUEST_FAVORITES_KEY);
  },

  /**
   * Safely sync any unsaved guest favorites to the authenticated user account without overwriting.
   * Only clears guest bookmarks that are confirmed present or successfully added to the user's account.
   */
  async syncGuestFavoritesToUser(userId: string, existingUserLocationIds: string[]): Promise<string[]> {
    const guestIds = this.getGuestFavorites();
    if (guestIds.length === 0) return existingUserLocationIds;

    const newlyAdded: string[] = [];
    const remainingGuestIds: string[] = [];

    for (const locId of guestIds) {
      if (!existingUserLocationIds.includes(locId)) {
        try {
          await this.addFavorite(userId, locId);
          newlyAdded.push(locId);
        } catch {
          // Retain unsynced bookmark so API failures do not discard local favorites
          remainingGuestIds.push(locId);
        }
      }
    }

    if (remainingGuestIds.length === 0) {
      this.clearGuestFavorites();
    } else {
      localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify(remainingGuestIds));
    }

    return [...existingUserLocationIds, ...newlyAdded];
  },
};

