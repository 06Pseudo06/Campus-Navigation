import { describe, it, expect } from "vitest";
import {
  parseNavigateParams,
  validateLocationIdentifier,
  buildNavigateUrl,
  isSafeRedirectTarget,
} from "./qrNavigation";
import { VERIFIED_DATASET_C_LOCATIONS } from "@/data/campusData";

describe("qrNavigation utilities", () => {
  describe("parseNavigateParams", () => {
    it("parses canonical 'to' and 'from' from URLSearchParams", () => {
      const search = new URLSearchParams("to=block-1&from=gate-1");
      const res = parseNavigateParams(search);
      expect(res.to).toBe("block-1");
      expect(res.from).toBe("gate-1");
    });

    it("supports aliases 'destination' and 'origin'", () => {
      const search = new URLSearchParams("destination=block-30&origin=unimall");
      const res = parseNavigateParams(search);
      expect(res.to).toBe("block-30");
      expect(res.from).toBe("unimall");
    });

    it("parses from plain object", () => {
      const res = parseNavigateParams({ to: "block-32", from: "gate-1" });
      expect(res.to).toBe("block-32");
      expect(res.from).toBe("gate-1");
    });

    it("sanitizes dangerous characters", () => {
      const search = new URLSearchParams("to=<script>alert(1)</script>&from=normal");
      const res = parseNavigateParams(search);
      expect(res.to).toBeNull();
      expect(res.from).toBe("normal");
    });

    it("handles missing parameters", () => {
      const search = new URLSearchParams("");
      const res = parseNavigateParams(search);
      expect(res.to).toBeNull();
      expect(res.from).toBeNull();
    });
  });

  describe("validateLocationIdentifier", () => {
    it("matches valid slug in Dataset C", () => {
      const match = validateLocationIdentifier("gate-1", VERIFIED_DATASET_C_LOCATIONS);
      expect(match).not.toBeNull();
      expect(match?.name).toContain("Gate 1");
    });

    it("matches case-insensitively", () => {
      const match = validateLocationIdentifier("BLOCK-1", VERIFIED_DATASET_C_LOCATIONS);
      expect(match).not.toBeNull();
      expect(match?.slug).toBe("block-1");
    });

    it("matches by UUID", () => {
      const gate1 = VERIFIED_DATASET_C_LOCATIONS[0];
      const match = validateLocationIdentifier(gate1.id, VERIFIED_DATASET_C_LOCATIONS);
      expect(match).not.toBeNull();
      expect(match?.id).toBe(gate1.id);
    });

    it("returns null for non-existent identifiers (e.g. Block 34)", () => {
      const match = validateLocationIdentifier("block-34", VERIFIED_DATASET_C_LOCATIONS);
      expect(match).toBeNull();
    });

    it("returns null for null, undefined, or empty string", () => {
      expect(validateLocationIdentifier(null)).toBeNull();
      expect(validateLocationIdentifier(undefined)).toBeNull();
      expect(validateLocationIdentifier("   ")).toBeNull();
    });
  });

  describe("buildNavigateUrl", () => {
    it("builds canonical navigation relative URL with 'to'", () => {
      const url = buildNavigateUrl({ to: "block-1" });
      expect(url).toBe("/navigate?to=block-1");
    });

    it("includes 'from' when provided", () => {
      const url = buildNavigateUrl({ to: "block-1", from: "gate-1" });
      expect(url).toBe("/navigate?to=block-1&from=gate-1");
    });

    it("combines with origin if trusted", () => {
      const url = buildNavigateUrl({
        to: "block-1",
        from: "gate-1",
        origin: "https://campusway.lpu.in",
      });
      expect(url).toBe("https://campusway.lpu.in/navigate?to=block-1&from=gate-1");
    });
  });

  describe("isSafeRedirectTarget", () => {
    it("accepts relative paths", () => {
      expect(isSafeRedirectTarget("/explore")).toBe(true);
      expect(isSafeRedirectTarget("/navigate?to=block-1")).toBe(true);
    });

    it("rejects protocol-relative URLs", () => {
      expect(isSafeRedirectTarget("//attacker.com")).toBe(false);
      expect(isSafeRedirectTarget("/\\attacker.com")).toBe(false);
    });

    it("rejects javascript: and data: URIs", () => {
      expect(isSafeRedirectTarget("javascript:alert(1)")).toBe(false);
      expect(isSafeRedirectTarget("data:text/html,<script>alert(1)</script>")).toBe(false);
    });

    it("accepts trusted hosts", () => {
      expect(isSafeRedirectTarget("http://localhost:3000/explore")).toBe(true);
      expect(isSafeRedirectTarget("https://campusway.lpu.in/navigate")).toBe(true);
    });

    it("rejects untrusted external domains", () => {
      expect(isSafeRedirectTarget("https://evil-phishing-site.com")).toBe(false);
    });
  });
});
