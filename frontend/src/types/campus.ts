export type LocationCategory = "all" | "building" | "room" | "landmark" | "gate" | "service";

export interface CampusCoordinates {
  x: number; // Percentage 0-100 across map width
  y: number; // Percentage 0-100 across map height
}

export interface CampusLocation {
  id: string;
  name: string;
  code: string;
  category: "building" | "room" | "landmark" | "gate" | "service";
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
  accessibility: string;
  popular?: boolean;
}

export interface RouteWaypoint {
  x: number;
  y: number;
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

export type MapLayerMode = "standard" | "blueprint" | "satellite" | "accessibility";
export type SidebarTab = "explore" | "routes" | "saved" | "help";
