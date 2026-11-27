/**
 * CampusWay Unified API Configuration
 * 
 * Provides centralized, environment-aware API URL resolution and user-facing
 * status messaging across development, test, and production (Vercel/Render).
 */

/** Canonical production backend deployed on Render */
export const PRODUCTION_BACKEND_URL = "https://campusway-api-c9q8.onrender.com";

/** Development fallback backend */
export const DEVELOPMENT_BACKEND_URL = "http://localhost:8000";

/**
 * Returns true if running in production mode.
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Resolves the backend API base URL based on environment variables and runtime target.
 *
 * Invariant: Never defaults to localhost:8000 in production runtime.
 *
 * Hierarchy:
 * 1. NEXT_PUBLIC_API_URL (canonical public backend override)
 * 2. NEXT_PUBLIC_API_BASE_URL (legacy / alias override)
 * 3. If NODE_ENV === "production": PRODUCTION_BACKEND_URL (Render)
 * 4. Otherwise: DEVELOPMENT_BACKEND_URL (http://localhost:8000)
 *
 * @param options.preferRelative - In browser production, return "" to route via Next.js /api rewrites
 */
export function getApiBaseUrl(options?: { preferRelative?: boolean }): string {
  const envUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL;

  if (envUrl && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/+$/, "");
  }

  if (isProduction()) {
    if (options?.preferRelative && typeof window !== "undefined") {
      return "";
    }
    return PRODUCTION_BACKEND_URL;
  }

  return DEVELOPMENT_BACKEND_URL;
}

/**
 * Generates environment-aware user notices for backend connectivity issues.
 * Production notices never expose internal ports (e.g. 8000) or suggest developer CLI commands.
 */
export function getBackendErrorMessage(
  reason: "offline" | "waking_up" | "google_unconfigured" | "generic_error",
  detail?: string
): string {
  const prod = isProduction();

  switch (reason) {
    case "waking_up":
      return prod
        ? "Backend service is waking up. Cloud instances may take up to 20 seconds to resume. Please retry in a few moments."
        : "FastAPI backend is starting up or waking up on port 8000.";

    case "offline":
      return prod
        ? "Backend service is currently unreachable. The server may be waking up or temporarily unavailable. Please retry shortly."
        : "FastAPI backend is offline (port 8000). Please run 'npm run dev' in your project root to run both backend and frontend.";

    case "google_unconfigured":
      return prod
        ? "Google sign-in is temporarily unavailable. Please sign in with your email and password."
        : "Google OAuth is not configured in backend/.env. Please verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.";

    case "generic_error":
    default:
      return prod
        ? (detail || "Unable to communicate with the authentication service. Please check your connection and retry.")
        : (detail || "Unable to communicate with the backend on port 8000.");
  }
}
