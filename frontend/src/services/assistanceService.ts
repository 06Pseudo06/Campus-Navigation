/**
 * CampusWay Visitor Assistance Service
 * 
 * Submits genuine assistance inquiries and wayfinding requests to FastAPI:
 * POST /api/v1/assistance/requests
 * 
 * Supports both unauthenticated guests (user_id = null) and authenticated users.
 */

import { AssistanceRequestCreate, AssistanceRequestRead } from "@/types/api";

const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");

const TOKEN_KEY = "campusway_access_token";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export const assistanceService = {
  /**
   * Submit an assistance request to the backend.
   * If a user session is active, the Bearer token is automatically attached.
   */
  async submitAssistanceRequest(
    payload: AssistanceRequestCreate
  ): Promise<AssistanceRequestRead> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/assistance/requests`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorDetail = `Assistance request failed with status ${response.status}`;
        try {
          const errData = await response.json();
          if (typeof errData.detail === "string") {
            errorDetail = errData.detail;
          } else if (Array.isArray(errData.detail)) {
            errorDetail = errData.detail.map((d: { msg: string }) => d.msg).join(", ");
          }
        } catch {
          // ignore non-json error
        }
        throw new Error(errorDetail);
      }

      return (await response.json()) as AssistanceRequestRead;
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          throw new Error("Request timed out connecting to the campus assistance desk.");
        }
        throw err;
      }
      throw new Error("Unable to submit assistance request. Please try again.");
    } finally {
      clearTimeout(timeoutId);
    }
  },
};

