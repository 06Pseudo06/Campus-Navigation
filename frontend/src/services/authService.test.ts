import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { authService } from "./authService";

describe("authService.checkBackendHealth", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns isOnline: true and googleConfigured: true when health endpoint responds 200", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        status: "healthy",
        service: "CampusWay Route Intelligence Service",
        version: "1.0.0",
        google_auth_configured: true,
        environment: "production",
      }),
    } as Response);

    const result = await authService.checkBackendHealth();
    expect(result.isOnline).toBe(true);
    expect(result.googleConfigured).toBe(true);
  });

  it("returns googleConfigured: false when backend reports false", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        status: "healthy",
        google_auth_configured: false,
      }),
    } as Response);

    const result = await authService.checkBackendHealth();
    expect(result.isOnline).toBe(true);
    expect(result.googleConfigured).toBe(false);
  });

  it("handles HTTP 503 service unavailable during cold start / maintenance", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ status: "unavailable" }),
    } as Response);

    const result = await authService.checkBackendHealth();
    expect(result.isOnline).toBe(false);
    expect(result.isWakingUp).toBe(true);
    expect(result.message).not.toContain("port 8000");
    expect(result.message).not.toContain("npm run dev");
  });

  it("does not leak port 8000 or npm run dev to production users on network failure", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Failed to fetch"));

    const result = await authService.checkBackendHealth();
    expect(result.isOnline).toBe(false);
    expect(result.message).not.toContain("port 8000");
    expect(result.message).not.toContain("npm run dev");
    expect(result.message).toContain("Backend service is currently unreachable");
  });

  it("provides actionable developer guidance in development mode", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));

    const result = await authService.checkBackendHealth();
    expect(result.isOnline).toBe(false);
    expect(result.message).toContain("port 8000");
    expect(result.message).toContain("npm run dev");
  });
});

describe("authService.getGoogleLoginUrl", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("resolves to Render backend in production when env is unconfigured", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;

    const url = authService.getGoogleLoginUrl();
    expect(url).toBe("https://campusway-api-c9q8.onrender.com/api/v1/auth/google/login");
  });

  it("resolves to custom configured URL when NEXT_PUBLIC_API_URL is set", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://custom-auth.example.com");
    const url = authService.getGoogleLoginUrl();
    expect(url).toBe("https://custom-auth.example.com/api/v1/auth/google/login");
  });
});
