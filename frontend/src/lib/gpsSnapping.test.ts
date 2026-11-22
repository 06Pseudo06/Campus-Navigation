import { describe, it, expect } from "vitest";
import {
  snapGpsToGraphNode,
  distancePointToSegmentMeters,
  distanceToRoutePolyline,
  shouldRecomputeRoute,
  SpatialNodeIndex,
  MAX_SNAP_DISTANCE_METERS,
} from "./gpsSnapping";
import { BackendNode } from "@/services/locationService";

const MOCK_NODES: BackendNode[] = [
  {
    id: "node-gate-1",
    location_id: "loc-gate-1",
    node_type: "gate",
    latitude: 31.26128,
    longitude: 75.70014,
    is_accessible: true,
    is_active: true,
    survey_id: "G1",
  },
  {
    id: "node-block-1",
    location_id: "loc-block-1",
    node_type: "building",
    latitude: 31.260565,
    longitude: 75.706815,
    is_accessible: true,
    is_active: true,
    survey_id: "B1",
  },
  {
    id: "node-spine-1",
    location_id: null,
    node_type: "junction",
    latitude: 31.2585,
    longitude: 75.7042,
    is_accessible: true,
    is_active: true,
    survey_id: "J1",
  },
];

describe("gpsSnapping utilities", () => {
  describe("SpatialNodeIndex", () => {
    it("indexes nodes and finds neighborhood candidates", () => {
      const index = new SpatialNodeIndex(MOCK_NODES);
      const candidates = index.getCandidates(31.2605, 75.7068);
      expect(candidates.some((n) => n.id === "node-block-1")).toBe(true);
    });
  });

  describe("snapGpsToGraphNode", () => {
    it("snaps coordinate within 50m to nearest node", () => {
      // 10m away from Block 1
      const coords = { latitude: 31.26058, longitude: 75.70682, accuracy: 12 };
      const res = snapGpsToGraphNode(coords, MOCK_NODES);

      expect(res.status).toBe("snapped");
      expect(res.snappedNode?.id).toBe("node-block-1");
      expect(res.distanceMeters).toBeLessThan(15);
    });

    it("rejects fixes with accuracy worse than 50 meters", () => {
      const coords = { latitude: 31.260565, longitude: 75.706815, accuracy: 65 };
      const res = snapGpsToGraphNode(coords, MOCK_NODES);

      expect(res.status).toBe("low_accuracy");
      expect(res.snappedNode).toBeNull();
    });

    it("rejects points farther than max snap distance (150m)", () => {
      // Far off coordinate
      const coords = { latitude: 31.275, longitude: 75.72, accuracy: 10 };
      const res = snapGpsToGraphNode(coords, MOCK_NODES);

      expect(res.status).toBe("out_of_range");
      expect(res.snappedNode).toBeNull();
      expect(res.distanceMeters).toBeGreaterThan(MAX_SNAP_DISTANCE_METERS);
    });

    it("handles empty nodes array gracefully", () => {
      const res = snapGpsToGraphNode({ latitude: 31.26, longitude: 75.7 }, []);
      expect(res.status).toBe("no_nodes");
      expect(res.snappedNode).toBeNull();
    });
  });

  describe("distancePointToSegmentMeters", () => {
    it("calculates perpendicular distance to a line segment", () => {
      // Point directly on segment midpoint
      const d = distancePointToSegmentMeters(
        31.2605,
        75.705,
        31.2605,
        75.700,
        31.2605,
        75.710
      );
      expect(d).toBeCloseTo(0, 0);
    });
  });

  describe("distanceToRoutePolyline", () => {
    it("measures distance to closest segment in a polyline", () => {
      const waypoints = [
        { lat: 31.260, lng: 75.700 },
        { lat: 31.260, lng: 75.710 },
      ];
      // Point slightly north of segment
      const dist = distanceToRoutePolyline({ lat: 31.2602, lng: 75.705 }, waypoints);
      expect(dist).toBeGreaterThan(15);
      expect(dist).toBeLessThan(30);
    });
  });

  describe("shouldRecomputeRoute", () => {
    it("returns false for minimal movements under 15m on route", () => {
      const prev = { latitude: 31.260565, longitude: 75.706815 };
      const next = { latitude: 31.26057, longitude: 75.70682 }; // ~1 meter
      const waypoints = [
        { lat: 31.260, lng: 75.706 },
        { lat: 31.261, lng: 75.707 },
      ];

      expect(shouldRecomputeRoute(prev, next, waypoints)).toBe(false);
    });

    it("returns true when movement exceeds 15m", () => {
      const prev = { latitude: 31.260565, longitude: 75.706815 };
      const next = { latitude: 31.2608, longitude: 75.707 }; // ~30 meters

      expect(shouldRecomputeRoute(prev, next)).toBe(true);
    });

    it("returns true when user deviates > 25m off the active route polyline", () => {
      const prev = { latitude: 31.260, longitude: 75.705 };
      const next = { latitude: 31.2601, longitude: 75.705 }; // small move ~11m
      const waypoints = [
        { lat: 31.261, lng: 75.700 },
        { lat: 31.261, lng: 75.710 }, // 100m north of next point
      ];

      expect(shouldRecomputeRoute(prev, next, waypoints)).toBe(true);
    });
  });
});
