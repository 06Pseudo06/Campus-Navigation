"use client";

import { BackendLocation, BackendNode, BackendEdge } from "./locationService";
import { UserProfile } from "@/types/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000";

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    students: number;
    admins: number;
    moderators: number;
  };
  locations: {
    total: number;
    verified: number;
    unverified: number;
    active: number;
    by_category: Record<string, number>;
  };
  routing: {
    total_nodes: number;
    active_nodes: number;
    accessible_nodes: number;
    total_edges: number;
    active_edges: number;
    accessible_edges: number;
  };
  assistance: {
    total: number;
    pending: number;
    assigned: number;
    resolved: number;
  };
  reports: {
    total: number;
    pending: number;
    reviewing: number;
    resolved: number;
  };
  system: {
    project_name: string;
    environment: string;
    is_production: boolean;
    database_connected: boolean;
    database_type: string;
    google_auth_configured: boolean;
    api_v1_path: string;
  };
  recent_activity: AuditLogItem[];
}

export interface AuditLogItem {
  id: string;
  actor_id?: string | null;
  actor_email?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details?: string | null;
  ip_address?: string | null;
  created_at: string;
}

export interface UserListResult {
  users: UserProfile[];
  total: number;
  skip: number;
  limit: number;
}

export interface AssistanceRequestItem {
  id: string;
  requester_name?: string | null;
  contact_phone?: string | null;
  assistance_type: string;
  description?: string | null;
  status: "pending" | "acknowledged" | "assigned" | "resolved" | "cancelled";
  resolution_notes?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

export interface LocationReportItem {
  id: string;
  reporter_id?: string | null;
  location_id?: string | null;
  node_id?: string | null;
  edge_id?: string | null;
  report_type: string;
  description?: string | null;
  status: "pending" | "reviewing" | "resolved" | "rejected";
  resolution_notes?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

export interface GraphValidationResult {
  total_nodes: number;
  active_nodes: number;
  total_edges: number;
  active_edges: number;
  disconnected_active_nodes: Array<{ id: string; node_type: string; latitude: number; longitude: number }>;
  disconnected_count: number;
  dangling_edges: string[];
  self_loops: string[];
  is_valid: boolean;
}

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    let detail = `Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) detail = errJson.detail;
    } catch {}
    throw new Error(detail);
  }

  return response.json();
}

export const adminService = {
  // 1. Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return adminFetch<DashboardStats>("/api/v1/admin/dashboard");
  },

  // 2. Users
  async listUsers(params: {
    search?: string;
    role?: string;
    is_active?: boolean;
    skip?: number;
    limit?: number;
  } = {}): Promise<UserListResult> {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.role) q.set("role", params.role);
    if (params.is_active !== undefined) q.set("is_active", String(params.is_active));
    if (params.skip !== undefined) q.set("skip", String(params.skip));
    if (params.limit !== undefined) q.set("limit", String(params.limit));

    const qs = q.toString() ? `?${q.toString()}` : "";
    return adminFetch<UserListResult>(`/api/v1/admin/users${qs}`);
  },

  async updateUserRole(userId: string, role: string): Promise<UserProfile> {
    return adminFetch<UserProfile>(`/api/v1/admin/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  },

  async updateUserStatus(userId: string, is_active: boolean): Promise<UserProfile> {
    return adminFetch<UserProfile>(`/api/v1/admin/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ is_active }),
    });
  },

  // 3. Locations
  async listLocations(params: {
    query?: string;
    location_type?: string;
    is_verified?: boolean;
    is_active?: boolean;
    skip?: number;
    limit?: number;
  } = {}): Promise<BackendLocation[]> {
    const q = new URLSearchParams();
    if (params.query) q.set("query", params.query);
    if (params.location_type) q.set("location_type", params.location_type);
    if (params.is_verified !== undefined) q.set("is_verified", String(params.is_verified));
    if (params.is_active !== undefined) q.set("is_active", String(params.is_active));
    if (params.skip !== undefined) q.set("skip", String(params.skip));
    if (params.limit !== undefined) q.set("limit", String(params.limit));

    const qs = q.toString() ? `?${q.toString()}` : "";
    return adminFetch<BackendLocation[]>(`/api/v1/locations/${qs}`);
  },

  async createLocation(payload: Partial<BackendLocation>): Promise<BackendLocation> {
    return adminFetch<BackendLocation>("/api/v1/locations/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateLocation(locationId: string, payload: Partial<BackendLocation>): Promise<BackendLocation> {
    return adminFetch<BackendLocation>(`/api/v1/locations/${locationId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async verifyLocation(locationId: string, is_verified: boolean): Promise<BackendLocation> {
    return adminFetch<BackendLocation>(`/api/v1/locations/${locationId}/verify`, {
      method: "POST",
      body: JSON.stringify({ is_verified }),
    });
  },

  async deactivateLocation(locationId: string): Promise<BackendLocation> {
    return adminFetch<BackendLocation>(`/api/v1/locations/${locationId}`, {
      method: "DELETE",
    });
  },

  // 4. Routing Graph
  async listNodes(): Promise<BackendNode[]> {
    return adminFetch<BackendNode[]>("/api/v1/routing/nodes?is_active=all");
  },

  async createNode(payload: Partial<BackendNode>): Promise<BackendNode> {
    return adminFetch<BackendNode>("/api/v1/routing/nodes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateNode(nodeId: string, payload: Partial<BackendNode>): Promise<BackendNode> {
    return adminFetch<BackendNode>(`/api/v1/routing/nodes/${nodeId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deactivateNode(nodeId: string): Promise<BackendNode> {
    return adminFetch<BackendNode>(`/api/v1/routing/nodes/${nodeId}`, {
      method: "DELETE",
    });
  },

  async listEdges(): Promise<BackendEdge[]> {
    return adminFetch<BackendEdge[]>("/api/v1/routing/edges?is_active=all");
  },

  async createEdge(payload: Partial<BackendEdge>): Promise<BackendEdge> {
    return adminFetch<BackendEdge>("/api/v1/routing/edges", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateEdge(edgeId: string, payload: Partial<BackendEdge>): Promise<BackendEdge> {
    return adminFetch<BackendEdge>(`/api/v1/routing/edges/${edgeId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deactivateEdge(edgeId: string): Promise<BackendEdge> {
    return adminFetch<BackendEdge>(`/api/v1/routing/edges/${edgeId}`, {
      method: "DELETE",
    });
  },

  async validateGraph(): Promise<GraphValidationResult> {
    return adminFetch<GraphValidationResult>("/api/v1/routing/graph/validate");
  },

  // 5. Reports & Assistance
  async listAssistanceRequests(status?: string): Promise<AssistanceRequestItem[]> {
    const qs = status ? `?status=${status}` : "";
    return adminFetch<AssistanceRequestItem[]>(`/api/v1/assistance/requests${qs}`);
  },

  async updateAssistanceRequest(
    requestId: string,
    payload: { status?: string; resolution_notes?: string }
  ): Promise<AssistanceRequestItem> {
    return adminFetch<AssistanceRequestItem>(`/api/v1/assistance/requests/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async listReports(status?: string): Promise<LocationReportItem[]> {
    const qs = status ? `?status=${status}` : "";
    return adminFetch<LocationReportItem[]>(`/api/v1/reports/${qs}`);
  },

  async updateReport(
    reportId: string,
    payload: { status?: string; resolution_notes?: string }
  ): Promise<LocationReportItem> {
    return adminFetch<LocationReportItem>(`/api/v1/reports/${reportId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  // 6. Audit Logs
  async listAuditLogs(params: {
    action?: string;
    entity_type?: string;
    actor_email?: string;
    skip?: number;
    limit?: number;
  } = {}): Promise<AuditLogItem[]> {
    const q = new URLSearchParams();
    if (params.action) q.set("action", params.action);
    if (params.entity_type) q.set("entity_type", params.entity_type);
    if (params.actor_email) q.set("actor_email", params.actor_email);
    if (params.skip !== undefined) q.set("skip", String(params.skip));
    if (params.limit !== undefined) q.set("limit", String(params.limit));

    const qs = q.toString() ? `?${q.toString()}` : "";
    return adminFetch<AuditLogItem[]>(`/api/v1/admin/audit-logs${qs}`);
  },

  // 7. Settings & System
  async getSettings(): Promise<Record<string, any>> {
    return adminFetch<Record<string, any>>("/api/v1/admin/settings");
  },

  async clearCache(): Promise<{ success: boolean; message: string }> {
    return adminFetch<{ success: boolean; message: string }>("/api/v1/admin/cache/clear", {
      method: "POST",
    });
  },
};
