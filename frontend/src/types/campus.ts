export type LocationCategory = "all" | "building" | "room" | "landmark" | "gate" | "service" | "hostel";

export interface CampusCoordinates {
  lat: number;  // GPS latitude
  lng: number;  // GPS longitude
}

export interface CampusLocation {
  id: string;
  name: string;
  code: string;
  category: "building" | "room" | "landmark" | "gate" | "service" | "hostel";
  parentBuildingId?: string; // For rooms
  description: string;
  coordinates: CampusCoordinates;
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
  // Backend-specific fields
  slug?: string;
  nodeId?: string; // Associated graph node ID for routing
}

export interface RouteWaypoint {
  lat: number;
  lng: number;
  label?: string;
  // Legacy SVG fields (kept for backward compat with RoutesTab/SavedTab)
  x?: number;
  y?: number;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  direction?: "straight" | "left" | "right" | "enter";
}

export interface CampusRoute {
  id: string;
  fromLocationId: string;
  fromName: string;
  toLocationId: string;
  toName: string;
  distanceMeters: number;
  estimatedWalkingMinutes: number;
  isAccessible: boolean;
  waypoints: RouteWaypoint[];
  steps: RouteStep[];
  isDemonstrationData: boolean;
}

export type MapLayerMode = "standard" | "dark" | "satellite" | "streets";
export type SidebarTab = "explore" | "routes" | "saved" | "help";
