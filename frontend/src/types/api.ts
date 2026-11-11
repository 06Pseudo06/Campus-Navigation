/**
 * CampusWay Backend API Schema Definitions
 * 
 * Strict TypeScript types reflecting backend Pydantic models:
 * - LocationRead (app/schemas/location.py)
 * - VisitorDestinationCard (app/schemas/assistance.py)
 * - NodeRead (app/schemas/graph.py)
 * - PathSegment, RouteQuery, RouteResponse (app/schemas/graph.py)
 */

export interface LocationRead {
  id: string; // UUID
  parent_id?: string | null;
  name: string;
  slug: string;
  location_type: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address_details?: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VisitorDestinationCard {
  id: string; // UUID
  name: string;
  slug: string;
  location_type: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address_details?: string | null;
  is_accessible: boolean;
  nearest_node_id?: string | null; // UUID of entrance or synthetic access node
  has_route_topology: boolean;
  visitor_guidance?: string | null;
}

export interface NodeRead {
  id: string; // UUID
  location_id?: string | null;
  node_type: "entrance" | "synthetic_access" | "path" | "junction" | string;
  latitude: number;
  longitude: number;
  is_accessible: boolean;
  is_active: boolean;
  created_at: string;
}

export interface PathSegment {
  source_node_id: string;
  target_node_id: string;
  distance_m: number;
  path_type: "footpath" | "inferred_access" | "inferred_connector" | string;
  instruction?: string | null;
}

export interface RouteQuery {
  origin_node_id: string; // UUID
  destination_node_id: string; // UUID
  accessible_only?: boolean;
  algorithm?: "dijkstra" | "astar";
}

export interface RouteResponse {
  origin_node_id: string;
  destination_node_id: string;
  total_distance_m: number;
  accessible: boolean;
  path_nodes: string[];
  segments: PathSegment[];
  estimated_duration_s?: number | null;
  estimated_duration_min?: number | null;
}

export interface ApiErrorResponse {
  detail?: string | Array<{ msg: string; loc: string[] }>;
  message?: string;
}

