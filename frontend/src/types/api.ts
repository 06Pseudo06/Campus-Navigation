/**
 * CampusWay API Types & Assistance Models
 */

export type AssistanceStatus =
  | "pending"
  | "acknowledged"
  | "assigned"
  | "resolved"
  | "cancelled";

export type AssistanceType =
  | "lost"
  | "mobility_support"
  | "medical"
  | "general_inquiry"
  | string;

export interface AssistanceRequestCreate {
  requester_name?: string | null;
  contact_phone?: string | null;
  current_location_id?: string | null;
  current_node_id?: string | null;
  target_location_id?: string | null;
  assistance_type: AssistanceType;
  description?: string | null;
}

export interface AssistanceRequestRead {
  id: string; // UUID
  requester_name?: string | null;
  contact_phone?: string | null;
  user_id?: string | null;
  current_location_id?: string | null;
  current_node_id?: string | null;
  target_location_id?: string | null;
  assistance_type: string;
  description?: string | null;
  status: AssistanceStatus | string;
  assigned_to?: string | null;
  resolution_notes?: string | null;
  created_at: string;
  resolved_at?: string | null;
}
