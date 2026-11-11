/**
 * Campus Location API Service
 * 
 * Handles interaction with backend location and visitor destination endpoints:
 * - GET /api/v1/locations/
 * - GET /api/v1/assistance/destinations
 * - GET /api/v1/locations/{location_id}
 */

import { apiRequest } from "./apiClient";
import { LocationRead, VisitorDestinationCard } from "@/types/api";
import { CampusLocation } from "@/types/campus";

export const locationService = {
  /**
   * Search and filter campus locations using the backend search ranking algorithm.
   */
  async searchLocations(
    query?: string,
    locationType?: string,
    limit: number = 50
  ): Promise<LocationRead[]> {
    const params = new URLSearchParams();
    if (query && query.trim()) params.set("query", query.trim());
    if (locationType && locationType !== "all") params.set("location_type", locationType);
    params.set("limit", String(limit));

    const endpoint = `/api/v1/locations/?${params.toString()}`;
    return apiRequest<LocationRead[]>(endpoint);
  },

  /**
   * Retrieve visitor-friendly destination guide cards with pre-calculated route topology.
   */
  async getVisitorDestinations(
    query?: string,
    category?: string,
    limit: number = 50
  ): Promise<VisitorDestinationCard[]> {
    const params = new URLSearchParams();
    if (query && query.trim()) params.set("query", query.trim());
    if (category && category !== "all") params.set("category", category);
    params.set("limit", String(limit));

    const endpoint = `/api/v1/assistance/destinations?${params.toString()}`;
    return apiRequest<VisitorDestinationCard[]>(endpoint);
  },

  /**
   * Get single location details by UUID.
   */
  async getLocationById(locationId: string): Promise<LocationRead> {
    return apiRequest<LocationRead>(`/api/v1/locations/${locationId}`);
  },

  /**
   * Helper to map a backend VisitorDestinationCard to the frontend CampusLocation model.
   */
  mapDestinationToCampusLocation(card: VisitorDestinationCard): CampusLocation {
    // Extract native code from address_details if present
    let code = card.slug.toUpperCase().slice(0, 4);
    if (card.address_details) {
      try {
        const details = JSON.parse(card.address_details);
        if (Array.isArray(details.native_codes) && details.native_codes.length > 0) {
          code = details.native_codes[0];
        }
      } catch {
        // Leave default
      }
    }

    return {
      id: card.id,
      name: card.name,
      code,
      category: (card.location_type as CampusLocation["category"]) || "building",
      description: card.description || `${card.name} (Carleton Campus).`,
      // Geographic WGS84 coordinates
      coordinates: {
        x: card.longitude ?? -75.696,
        y: card.latitude ?? 45.385,
      },
      latitude: card.latitude ?? undefined,
      longitude: card.longitude ?? undefined,
      nearestNodeId: card.nearest_node_id ?? undefined,
      hasRouteTopology: card.has_route_topology,
      visitorGuidance: card.visitor_guidance ?? undefined,
      accessibility: card.is_accessible ? "Step-free verified access point" : "Ground mapping pending",
      isDemonstrationData: true,
    };
  },
};

