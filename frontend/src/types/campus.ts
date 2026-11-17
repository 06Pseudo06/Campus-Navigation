export type LocationCategory =
  | "all"
  | "building"
  | "room"
  | "landmark"
  | "gate"
  | "service"
  | "hostel";

export interface CampusCoordinates {
  lat: number; // GPS latitude (WGS84)
  lng: number; // GPS longitude (WGS84)
  x?: number;  // Projected/Vector coordinate (0-1000)
  y?: number;  // Projected/Vector coordinate (0-700)
}

export interface CampusLocation {
  id: string;
  name: string;
  code: string;
  category: "building" | "room" | "landmark" | "gate" | "service" | "hostel";
  parentBuildingId?: string;
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
  slug?: string;
  nodeId?: string;
}

export interface RouteWaypoint {
  lat?: number;
  lng?: number;
  x?: number;
  y?: number;
  label?: string;
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

export type MapLayerMode = "standard" | "dark" | "satellite" | "streets" | "blueprint";
export type SidebarTab = "explore" | "routes" | "saved" | "help";
