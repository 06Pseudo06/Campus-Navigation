/**
 * CampusWay Route Planning Service
 * 
 * Interacts with FastAPI backend routing endpoints:
 * - GET /api/v1/routing/nodes
 * - POST /api/v1/routing/calculate
 */

import { apiRequest } from "./apiClient";
import { NodeRead, RouteQuery, RouteResponse } from "@/types/api";
import { CampusLocation, CampusRoute, RouteStep, RouteWaypoint } from "@/types/campus";

export const routeService = {
  /**
   * Fetch active nodes for a specific location.
   */
  async getNodesForLocation(locationId: string, signal?: AbortSignal): Promise<NodeRead[]> {
    return apiRequest<NodeRead[]>(`/api/v1/routing/nodes?location_id=${locationId}`, { signal });
  },

  /**
   * Fetch all active graph navigation nodes (cached where applicable).
   */
  async getAllNodes(signal?: AbortSignal): Promise<NodeRead[]> {
    return apiRequest<NodeRead[]>("/api/v1/routing/nodes", { signal });
  },

  /**
   * Submit shortest path calculation to the backend graph solver (Dijkstra or A*).
   */
  async calculateRoute(
    originNodeId: string,
    destinationNodeId: string,
    accessibleOnly: boolean = false,
    algorithm: "dijkstra" | "astar" = "dijkstra",
    signal?: AbortSignal
  ): Promise<RouteResponse> {
    const payload: RouteQuery = {
      origin_node_id: originNodeId,
      destination_node_id: destinationNodeId,
      accessible_only: accessibleOnly,
      algorithm,
    };

    return apiRequest<RouteResponse>("/api/v1/routing/calculate", {
      method: "POST",
      body: JSON.stringify(payload),
      signal,
    });
  },

  /**
   * Format backend RouteResponse into UI-ready CampusRoute model.
   */
  formatRouteModel(
    fromLocation: CampusLocation,
    toLocation: CampusLocation,
    routeResp: RouteResponse,
    nodeMap?: Map<string, NodeRead>
  ): CampusRoute {
    // 1. Build steps from segments
    const steps: RouteStep[] = routeResp.segments.map((seg) => {
      const isInferred = seg.path_type.startsWith("inferred");
      let direction: RouteStep["direction"] = "straight";
      const instLower = (seg.instruction || "").toLowerCase();

      if (instLower.includes("left")) {
        direction = "left";
      } else if (instLower.includes("right")) {
        direction = "right";
      } else if (instLower.includes("u-turn") || instLower.includes("uturn")) {
        direction = "uturn";
      } else if (instLower.includes("enter") || instLower.includes("door")) {
        direction = "enter";
      }

      // Add clear warning note if segment is an inferred edge
      let instructionText = seg.instruction || `Walk along ${seg.path_type} for ${Math.round(seg.distance_m)}m`;
      if (isInferred) {
        instructionText = `[Inferred Connection] ${instructionText} (Pending survey)`;
      }

      return {
        instruction: instructionText,
        distanceMeters: Math.round(seg.distance_m * 10) / 10,
        direction,
        pathType: seg.path_type,
        isInferred,
      };
    });

    // 2. Build waypoints from path nodes (using real GPS coordinates if available in nodeMap)
    const waypoints: RouteWaypoint[] = [];
    if (nodeMap && routeResp.path_nodes.length > 0) {
      for (const nodeId of routeResp.path_nodes) {
        const node = nodeMap.get(nodeId);
        if (node) {
          waypoints.push({
            x: node.longitude,
            y: node.latitude,
            lat: node.latitude,
            lon: node.longitude,
            nodeId: node.id,
            label: node.node_type,
          });
        }
      }
    }

    return {
      id: `route-${routeResp.origin_node_id}-${routeResp.destination_node_id}`,
      fromLocationId: fromLocation.id,
      fromName: fromLocation.name,
      fromNodeId: routeResp.origin_node_id,
      toLocationId: toLocation.id,
      toName: toLocation.name,
      toNodeId: routeResp.destination_node_id,
      distanceMeters: Math.round(routeResp.total_distance_m * 10) / 10,
      estimatedWalkingMinutes: routeResp.estimated_duration_min
        ? Math.round(routeResp.estimated_duration_min * 10) / 10
        : Math.max(1, Math.round(routeResp.total_distance_m / 80)),
      isAccessible: routeResp.accessible,
      waypoints,
      steps,
      isDemonstrationData: true,
      pathNodes: routeResp.path_nodes,
      rawSegments: routeResp.segments,
    };
  },
};
