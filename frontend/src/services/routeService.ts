import { CampusRoute, CampusLocation } from "@/types/campus";
import { locationService, BackendNode } from "@/services/locationService";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RoutingSegmentResponse {
  instruction?: string | null;
  distance_m: number;
}

interface RoutingResponse {
  path_nodes: string[];
  segments: RoutingSegmentResponse[];
  total_distance_m: number;
  estimated_duration_min?: number | null;
  accessible: boolean;
}

// Cache of graph nodes (fetched once, reused for route coordinate lookup)
let _nodesCache: BackendNode[] | null = null;

async function getNodesCache(): Promise<BackendNode[]> {
  if (!_nodesCache?.length) _nodesCache = await locationService.getNodes();
  return _nodesCache;
}

/**
 * Calculate Haversine distance in meters between two lat/lng pairs.
 */
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
 * Find the closest graph node to a given GPS coordinate.
 */
function findClosestNode(nodes: BackendNode[], lat: number, lng: number): BackendNode | null {
  if (!nodes || nodes.length === 0) return null;
  let closest: BackendNode | null = null;
  let minDistance = Infinity;

  for (const node of nodes) {
    const dist = haversineMeters(lat, lng, node.latitude, node.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      closest = node;
    }
  }
  return closest;
}

const MAX_NODE_SNAP_DISTANCE_METERS = 100;

function resolveNearbyNode(
  nodes: BackendNode[],
  location: CampusLocation,
  label: string
): BackendNode {
  const linkedNodes = nodes.filter((node) => node.location_id === location.id);
  const linkedNode =
    linkedNodes.find((node) => ["entrance", "gate", "room_door"].includes(node.node_type)) ||
    linkedNodes[0];
  if (linkedNode) return linkedNode;

  const { lat, lng } = location.coordinates;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error(`${label} has no verified map coordinates.`);
  }

  const nearest = findClosestNode(nodes, lat, lng);
  if (!nearest) throw new Error("No campus walking paths are available yet.");
  const distance = haversineMeters(lat, lng, nearest.latitude, nearest.longitude);
  if (distance > MAX_NODE_SNAP_DISTANCE_METERS) {
    throw new Error(`${label} is not connected to a nearby verified walking path.`);
  }
  return nearest;
}

/**
 * Route Service Client
 *
 * Calculates optimal walking paths between any two campus locations
 * using the backend Dijkstra / A* routing engine.
 */
export const routeService = {
  /**
   * Calculate walking route between two campus locations.
   */
  async calculateRoute(
    fromLocation: CampusLocation,
    toLocation: CampusLocation
  ): Promise<CampusRoute> {
    // 1. Fetch graph nodes
    const nodes = await getNodesCache();
    if (nodes.length === 0) throw new Error("No campus walking paths are available yet.");

    // Resolve explicit entrance nodes first; only snap to a nearby graph node.
    const originNode = resolveNearbyNode(nodes, fromLocation, "Starting point");
    const destNode = resolveNearbyNode(nodes, toLocation, "Destination");

    // 2. Call backend Dijkstra pathfinding API
    const res = await fetch(`${API_BASE}/api/v1/routing/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        origin_node_id: originNode.id,
        destination_node_id: destNode.id,
        algorithm: "dijkstra",
        accessible_only: false,
      }),
    });

    if (res.status === 404) throw new Error("No walkable route connects these locations.");
    if (!res.ok) throw new Error("The route service is temporarily unavailable.");

    const data = (await res.json()) as RoutingResponse;

    // 3. Build waypoints from backend path nodes
    const waypoints = data.path_nodes
      .map((nodeId: string) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return null;
        return { lat: node.latitude, lng: node.longitude };
      })
      .filter((point: { lat: number; lng: number } | null): point is { lat: number; lng: number } => point !== null);

    // 4. Build turn-by-turn steps
    const steps = data.segments.map((seg) => ({
      instruction: seg.instruction || "Continue walking along the path",
      distanceMeters: Math.round(seg.distance_m),
      direction: (seg.instruction?.toLowerCase().includes("left")
        ? "left"
        : seg.instruction?.toLowerCase().includes("right")
        ? "right"
        : "straight") as "straight" | "left" | "right" | "enter",
    }));

    return {
      id: `route-${fromLocation.id}-${toLocation.id}`,
      fromLocationId: fromLocation.id,
      fromName: fromLocation.name,
      toLocationId: toLocation.id,
      toName: toLocation.name,
      distanceMeters: Math.round(data.total_distance_m),
      estimatedWalkingMinutes: Math.max(
        1,
        Math.round(data.estimated_duration_min || data.total_distance_m / 75)
      ),
      isAccessible: data.accessible,
      waypoints,
      steps,
      isDemonstrationData: false,
    };
  },
};
