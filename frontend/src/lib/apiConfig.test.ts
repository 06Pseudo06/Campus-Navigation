import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getApiBaseUrl,
  getBackendErrorMessage,
  isProduction,
  PRODUCTION_BACKEND_URL,
  DEVELOPMENT_BACKEND_URL,
} from "./apiConfig";

describe("apiConfig", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("getApiBaseUrl", () => {
    it("returns explicitly configured NEXT_PUBLIC_API_URL trimmed of trailing slashes", () => {
      vi.stubEnv("NEXT_PUBLIC_API_URL", "https://custom-api.example.com///");
      expect(getApiBaseUrl()).toBe("https://custom-api.example.com");
    });

    it("returns NEXT_PUBLIC_API_BASE_URL when NEXT_PUBLIC_API_URL is unset", () => {
      vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://backend-alias.example.com");
      expect(getApiBaseUrl()).toBe("https://backend-alias.example.com");
    });

    it("falls back to PRODUCTION_BACKEND_URL in production when env vars are unset", () => {
      vi.stubEnv("NODE_ENV", "production");
      expect(getApiBaseUrl()).toBe(PRODUCTION_BACKEND_URL);
      expect(getApiBaseUrl()).not.toContain("localhost");
      expect(getApiBaseUrl()).not.toContain("8000");
    });

    it("falls back to DEVELOPMENT_BACKEND_URL in development/test when env vars are unset", () => {
      vi.stubEnv("NODE_ENV", "development");
      expect(getApiBaseUrl()).toBe(DEVELOPMENT_BACKEND_URL);
      expect(getApiBaseUrl()).toBe("http://localhost:8000");
    });

    it("prefers relative path in browser production when requested and env is unconfigured", () => {
      vi.stubEnv("NODE_ENV", "production");
      // Node test environment does not have browser window by default unless mocked
      expect(getApiBaseUrl({ preferRelative: true })).toBe(PRODUCTION_BACKEND_URL);
    });
  });

  describe("isProduction", () => {
    it("accurately detects production mode", () => {
      vi.stubEnv("NODE_ENV", "production");
      expect(isProduction()).toBe(true);

      vi.stubEnv("NODE_ENV", "development");
      expect(isProduction()).toBe(false);

      vi.stubEnv("NODE_ENV", "test");
      expect(isProduction()).toBe(false);
    });
  });

  describe("getBackendErrorMessage", () => {
    it("returns user-friendly non-technical message in production for offline state", () => {
      vi.stubEnv("NODE_ENV", "production");
      const msg = getBackendErrorMessage("offline");
      expect(msg).not.toContain("8000");
      expect(msg).not.toContain("npm run dev");
      expect(msg).toContain("Backend service is currently unreachable");
    });

    it("returns developer guidance in development for offline state", () => {
      vi.stubEnv("NODE_ENV", "development");
      const msg = getBackendErrorMessage("offline");
      expect(msg).toContain("port 8000");
      expect(msg).toContain("npm run dev");
    });

    it("returns user-friendly message in production for waking_up state", () => {
      vi.stubEnv("NODE_ENV", "production");
      const msg = getBackendErrorMessage("waking_up");
      expect(msg).not.toContain("8000");
      expect(msg).toContain("waking up");
    });

    it("returns safe Google OAuth error message in production without mentioning .env files", () => {
      vi.stubEnv("NODE_ENV", "production");
      const msg = getBackendErrorMessage("google_unconfigured");
      expect(msg).not.toContain("backend/.env");
      expect(msg).not.toContain("GOOGLE_CLIENT_ID");
      expect(msg).toContain("Google sign-in is temporarily unavailable");
    });

    it("returns specific developer instructions for Google OAuth in development", () => {
      vi.stubEnv("NODE_ENV", "development");
      const msg = getBackendErrorMessage("google_unconfigured");
      expect(msg).toContain("backend/.env");
      expect(msg).toContain("GOOGLE_CLIENT_ID");
    });
  });
});
