/**
 * CampusWay Shared Frontend Domain and API Models
 * Aligned with Database Schema v1 and FastAPI backend contracts.
 */

export type UserRole = 'student' | 'admin' | 'moderator';

export interface User {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserIdentity {
  id: string;
  user_id: string;
  provider: string;
  provider_subject: string;
  created_at: string;
}

export type LocationType =
  | 'campus_area'
  | 'block'
  | 'building'
  | 'floor'
  | 'room'
  | 'gate'
  | 'department'
  | 'food_court'
  | 'parking'
  | 'landmark'
  | string;

export interface LocationAlias {
  id: string;
  location_id: string;
  alias: string;
  normalized_alias: string;
  created_at: string;
}

export interface CampusLocation {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  location_type: LocationType;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  address_details: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocationDetail extends CampusLocation {
  aliases: LocationAlias[];
  children: CampusLocation[];
}

export interface LocationHierarchy {
  location: CampusLocation;
  ancestors: CampusLocation[];
  children: CampusLocation[];
}

export type NodeType =
  | 'entrance'
  | 'junction'
  | 'intersection'
  | 'pedestrian_crossing'
  | 'staircase'
  | 'ramp'
  | 'pathway_connection'
  | string;

export interface NavigationNode {
  id: string;
  location_id: string | null;
  node_type: NodeType;
  latitude: number;
  longitude: number;
  is_accessible: boolean;
  is_active: boolean;
  created_at: string;
}

export type PathType = 'footpath' | 'road_crossing' | 'stairs' | 'ramp' | string;

export interface WalkableEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  distance_m: number;
  path_type: PathType;
  is_bidirectional: boolean;
  is_accessible: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FavoriteLocation {
  user_id: string;
  location_id: string;
  created_at: string;
  location?: CampusLocation;
}

export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'rejected';

export interface LocationReport {
  id: string;
  reporter_id: string | null;
  location_id: string | null;
  node_id: string | null;
  edge_id: string | null;
  report_type: string;
  description: string | null;
  status: ReportStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface PathSegment {
  source_node_id: string;
  target_node_id: string;
  distance_m: number;
  path_type: string;
  instruction: string | null;
}

export interface RouteResponse {
  origin_node_id: string;
  destination_node_id: string;
  total_distance_m: number;
  accessible: boolean;
  path_nodes: string[];
  segments: PathSegment[];
}
