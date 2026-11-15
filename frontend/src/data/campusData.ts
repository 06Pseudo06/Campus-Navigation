import { CampusLocation } from "@/types/campus";
import { BackendLocation } from "@/services/locationService";

/**
 * Map a backend Location response to the frontend CampusLocation type.
 */
export function mapBackendToFrontend(loc: BackendLocation): CampusLocation {
  return {
    id: loc.id,
    name: loc.name,
    code: loc.slug?.replace(/-/g, " ").toUpperCase().substring(0, 8) || loc.name.substring(0, 6).toUpperCase(),
    category: loc.location_type as CampusLocation["category"],
    parentBuildingId: loc.parent_id || undefined,
    description: loc.description || "",
    coordinates: {
      // Preserve missing coordinates as invalid values so the map never plots
      // an unlocated record at (0, 0), and route resolution can reject it.
      lat: loc.latitude ?? Number.NaN,
      lng: loc.longitude ?? Number.NaN,
    },
    floors: loc.address_details || undefined,
    accessibility: "Accessible",
    popular: loc.is_verified || false,
    slug: loc.slug,
  };
}
