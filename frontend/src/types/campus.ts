export type LocationCategory = "all" | "building" | "room" | "landmark" | "gate" | "service";

export interface CampusCoordinates {
  x: number;
  y: number;
}

export interface CampusLocation {
  id: string;
  name: string;
  code: string;
  category: "building" | "room" | "landmark" | "gate" | "service";
  parentBuildingId?: string; // For rooms
  description: string;
  coordinates: CampusCoordinates;
  latitude?: number;
  longitude?: number;
  nearestNodeId?: string | null;
  hasRouteTopology?: boolean;
  visitorGuidance?: string;
  isAccessible?: boolean;
  buildingShape?: {
    x: number;
    y: number;
    width: number;
    height: number;
    radius?: number;
    color?: string;
  };
  floors?: string;
  operatingHours?: string;
  facilities?: string[];
  departments?: string[];
  accessibility?: string;
  popular?: boolean;
  isDemonstrationData?: boolean;
}

export interface RouteWaypoint {
  x: number;
  y: number;
  lat?: number;
  lon?: number;
  nodeId?: string;
  label?: string;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  direction?: "straight" | "left" | "right" | "enter" | "uturn";
  pathType?: "footpath" | "inferred_access" | "inferred_connector" | string;
  isInferred?: boolean;
}

export interface CampusRoute {
  id: string;
  fromLocationId: string;
  fromName: string;
  fromNodeId?: string;
  toLocationId: string;
  toName: string;
  toNodeId?: string;
  distanceMeters: number;
  estimatedWalkingMinutes: number;
  isAccessible: boolean;
  waypoints: RouteWaypoint[];
  steps: RouteStep[];
  isDemonstrationData: boolean;
  pathNodes?: string[];
  rawSegments?: Array<{
    source_node_id: string;
    target_node_id: string;
    distance_m: number;
    path_type: string;
    instruction?: string | null;
  }>;
}

export type MapDisplayMode = "carleton_demo" | "lpu_concept";
export type MapLayerMode = "standard" | "blueprint" | "satellite" | "accessibility";
export type SidebarTab = "explore" | "routes" | "saved" | "help";
