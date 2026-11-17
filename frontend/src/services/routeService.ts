import { CampusRoute, CampusLocation, RouteWaypoint, RouteStep } from "@/types/campus";
import { locationService, BackendNode } from "@/services/locationService";
import {
  projectGpsToSvg,
  VERIFIED_DATASET_C_NODES,
  VERIFIED_DATASET_C_SEGMENTS,
} from "@/data/campusData";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RoutingSegmentResponse {
  source_node_id?: string;
  target_node_id?: string;
  instruction?: string | null;
  distance_m: number;
  path_type?: string;
}

interface RoutingResponse {
  origin_node_id?: string;
  destination_node_id?: string;
  path_nodes: string[];
  segments: RoutingSegmentResponse[];
  total_distance_m: number;
  estimated_duration_min?: number | null;
  accessible?: boolean;
}

// In-memory cache of graph nodes
let _nodesCache: BackendNode[] | null = null;

async function getNodesCache(): Promise<BackendNode[]> {
  if (!_nodesCache || _nodesCache.length === 0) {
    _nodesCache = await locationService.getNodes();
  }
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

const MAX_NODE_SNAP_DISTANCE_METERS = 150;

function resolveNearbyNode(
  nodes: BackendNode[],
  location: CampusLocation,
  label: string
): BackendNode {
  // 1. Check if a node is explicitly linked to this location ID or slug
  const linkedNodes = nodes.filter(
    (node) => node.location_id === location.id || (node.survey_id && location.slug && node.survey_id.toLowerCase().includes(location.slug))
  );
  if (linkedNodes.length > 0) {
    return linkedNodes[0];
  }

  // 2. Fall back to GPS proximity snap
  const { lat, lng } = location.coordinates;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error(`${label} (${location.name}) does not have verified map coordinates.`);
  }

  const nearest = findClosestNode(nodes, lat, lng);
  if (!nearest) {
    throw new Error("No campus walking paths are available yet.");
  }
  const distance = haversineMeters(lat, lng, nearest.latitude, nearest.longitude);
  if (distance > MAX_NODE_SNAP_DISTANCE_METERS) {
    throw new Error(`${label} is not connected to a nearby verified walking path.`);
  }
  return nearest;
}

/**
 * Client-side Dijkstra pathfinding fallback across verified Dataset C graph.
 * Used if backend server is unreachable.
 */
function clientSideDijkstra(
  originNodeId: string,
  destNodeId: string,
  nodes: BackendNode[]
): RoutingResponse | null {
  if (originNodeId === destNodeId) {
    return {
      path_nodes: [originNodeId],
      segments: [],
      total_distance_m: 0,
      estimated_duration_min: 0,
      accessible: true,
    };
  }

  // Build adjacency graph from Dataset C segments
  const nodeMap = new Map<string, BackendNode>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
    if (n.survey_id) nodeMap.set(n.survey_id, n);
  }

  const adj = new Map<string, Array<{ target: string; dist: number; path_type: string }>>();
  for (const n of nodes) {
    adj.set(n.id, []);
  }

  for (const seg of VERIFIED_DATASET_C_SEGMENTS) {
    const srcNode = nodes.find((n) => n.survey_id === seg.from || n.id === seg.from);
    const tgtNode = nodes.find((n) => n.survey_id === seg.to || n.id === seg.to);
    if (srcNode && tgtNode) {
      adj.get(srcNode.id)?.push({ target: tgtNode.id, dist: seg.distance_m, path_type: "footpath" });
      adj.get(tgtNode.id)?.push({ target: srcNode.id, dist: seg.distance_m, path_type: "footpath" });
    }
  }

  // Dijkstra search
  const dist = new Map<string, number>();
  const prev = new Map<string, { prevNode: string; dist: number; path_type: string }>();
  const visited = new Set<string>();

  for (const n of nodes) {
    dist.set(n.id, Infinity);
  }
  dist.set(originNodeId, 0);

  while (visited.size < nodes.length) {
    let u: string | null = null;
    let minDist = Infinity;
    for (const [nodeId, d] of dist.entries()) {
      if (!visited.has(nodeId) && d < minDist) {
        minDist = d;
        u = nodeId;
      }
    }

    if (!u || minDist === Infinity || u === destNodeId) {
      break;
    }

    visited.add(u);

    const neighbors = adj.get(u) || [];
    for (const edge of neighbors) {
      if (visited.has(edge.target)) continue;
      const alt = dist.get(u)! + edge.dist;
      if (alt < dist.get(edge.target)!) {
        dist.set(edge.target, alt);
        prev.set(edge.target, { prevNode: u, dist: edge.dist, path_type: edge.path_type });
      }
    }
  }

  if (!prev.has(destNodeId)) {
    return null;
  }

  // Backtrack path
  const path: string[] = [];
  const segments: RoutingSegmentResponse[] = [];
  let curr = destNodeId;
  while (curr !== originNodeId) {
    path.push(curr);
    const p = prev.get(curr)!;
    segments.push({
      source_node_id: p.prevNode,
      target_node_id: curr,
      distance_m: p.dist,
      instruction: `Walk ${Math.round(p.dist)}m along ${p.path_type}`,
      path_type: p.path_type,
    });
    curr = p.prevNode;
  }
  path.push(originNodeId);
  path.reverse();
  segments.reverse();

  const totalDist = dist.get(destNodeId) || 0;
  return {
    path_nodes: path,
    segments,
    total_distance_m: Math.round(totalDist * 10) / 10,
    estimated_duration_min: Math.max(1, Math.round(totalDist / 75)),
    accessible: false,
  };
}

export const routeService = {
  /**
   * Calculate walking route between two campus locations.
   * Calls FastAPI backend Dijkstra/A* routing with automatic client-side fallback.
   */
  async calculateRoute(
    fromLocation: CampusLocation,
    toLocation: CampusLocation
  ): Promise<CampusRoute> {
    const nodes = await getNodesCache();
    if (!nodes || nodes.length === 0) {
      throw new Error("No campus walking paths are available yet.");
    }

    const originNode = resolveNearbyNode(nodes, fromLocation, "Starting point");
    const destNode = resolveNearbyNode(nodes, toLocation, "Destination");

    let data: RoutingResponse | null = null;

    try {
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

      if (res.status === 404) {
        throw new Error("No walkable route connects these locations.");
      }
      if (res.ok) {
        data = (await res.json()) as RoutingResponse;
      }
    } catch (apiErr) {
      console.warn("[routeService] Backend calculation call failed, running local Dijkstra solver:", apiErr);
    }

    // Run client-side Dijkstra fallback if backend call failed or was offline
    if (!data) {
      data = clientSideDijkstra(originNode.id, destNode.id, nodes);
      if (!data) {
        throw new Error("No walkable route connects these locations. Check campus survey connectivity.");
      }
    }

    // Build waypoints with dual GPS (lat, lng) and SVG (x, y) coordinates
    const waypoints: RouteWaypoint[] = [];
    for (const nodeId of data.path_nodes) {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        const svg = projectGpsToSvg(node.latitude, node.longitude);
        waypoints.push({
          lat: node.latitude,
          lng: node.longitude,
          x: svg.x,
          y: svg.y,
          label: node.node_type === "junction" ? undefined : node.node_type,
        });
      }
    }

    // Build human-friendly step instructions
    const steps: RouteStep[] = data.segments.map((seg) => {
      const inst = seg.instruction || `Continue walking (${Math.round(seg.distance_m)}m)`;
      let direction: RouteStep["direction"] = "straight";
      const lower = inst.toLowerCase();
      if (lower.includes("left")) direction = "left";
      else if (lower.includes("right")) direction = "right";
      else if (lower.includes("enter")) direction = "enter";

      return {
        instruction: inst,
        distanceMeters: Math.round(seg.distance_m),
        direction,
      };
    });

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
      isAccessible: Boolean(data.accessible),
      waypoints,
      steps,
      isDemonstrationData: false,
    };
  },
};
