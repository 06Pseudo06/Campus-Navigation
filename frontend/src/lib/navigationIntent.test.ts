import { describe, it, expect } from "vitest";
import { resolveNavigationIntent } from "./navigationIntent";
import { VERIFIED_DATASET_C_LOCATIONS } from "@/data/campusData";
import { BackendLocation } from "@/services/locationService";

const gate1 = VERIFIED_DATASET_C_LOCATIONS.find((l) => l.slug === "gate-1") as BackendLocation;

describe("navigationIntent resolver", () => {
  it("resolves valid URL with both destination and origin to ready", () => {
    const result = resolveNavigationIntent({
      payload: "https://campusway.lpu.in/navigate?to=block-1&from=gate-1",
      catalog: VERIFIED_DATASET_C_LOCATIONS,
    });

    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.destination.slug).toBe("block-1");
      expect(result.origin.slug).toBe("gate-1");
      expect(result.isGpsOrigin).toBe(false);
    }
  });

  it("resolves prefixed place: and lpu: payloads", () => {
    const res1 = resolveNavigationIntent({
      payload: "place:block-2?from=gate-1",
      catalog: VERIFIED_DATASET_C_LOCATIONS,
    });
    expect(res1.status).toBe("ready");
    if (res1.status === "ready") {
      expect(res1.destination.slug).toBe("block-2");
      expect(res1.origin.slug).toBe("gate-1");
    }

    const res2 = resolveNavigationIntent({
      payload: "lpu:gate-1",
      catalog: VERIFIED_DATASET_C_LOCATIONS,
    });
    // Without GPS, it asks for origin
    expect(res2.status).toBe("needs_origin");
    if (res2.status === "needs_origin") {
      expect(res2.destination.slug).toBe("gate-1");
      expect(res2.message).toBe("Where are you starting from?");
    }
  });

  it("resolves destination without origin using live snapped GPS within 45m", () => {
    // Gate 1 coordinates: ~31.260565, 75.706815
    const gate1Coords = {
      latitude: gate1.latitude!,
      longitude: gate1.longitude!,
      accuracy: 10,
    };

    const result = resolveNavigationIntent({
      payload: "block-2",
      catalog: VERIFIED_DATASET_C_LOCATIONS,
      gpsCoords: gate1Coords,
    });

    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.destination.slug).toBe("block-2");
      expect(result.origin.slug).toBe("gate-1");
      expect(result.isGpsOrigin).toBe(true);
      expect(result.toastMessage).toContain("Starting from your current location");
    }
  });

  it("prompts for origin when user has no GPS fix", () => {
    const result = resolveNavigationIntent({
      payload: "block-1",
      catalog: VERIFIED_DATASET_C_LOCATIONS,
      gpsCoords: null,
    });

    expect(result.status).toBe("needs_origin");
    if (result.status === "needs_origin") {
      expect(result.destination.slug).toBe("block-1");
      expect(result.message).toBe("Where are you starting from?");
    }
  });

  it("prompts for origin when user GPS is further than 45m from nearest place", () => {
    // Distant coordinates (far outside campus)
    const distantCoords = {
      latitude: 31.3500,
      longitude: 75.8000,
      accuracy: 15,
    };

    const result = resolveNavigationIntent({
      payload: "block-1",
      catalog: VERIFIED_DATASET_C_LOCATIONS,
      gpsCoords: distantCoords,
    });

    expect(result.status).toBe("needs_origin");
  });

  it("handles edge case: to === from (scanned place matches origin)", () => {
    const result = resolveNavigationIntent({
      payload: "/navigate?to=gate-1&from=gate-1",
      catalog: VERIFIED_DATASET_C_LOCATIONS,
    });

    expect(result.status).toBe("same_location");
    if (result.status === "same_location") {
      expect(result.destination.slug).toBe("gate-1");
      expect(result.message).toContain("already at Gate 1");
    }
  });

  it("handles edge case: to === from when snapped GPS matches scanned destination", () => {
    const gate1Coords = {
      latitude: gate1.latitude!,
      longitude: gate1.longitude!,
      accuracy: 5,
    };

    const result = resolveNavigationIntent({
      payload: "gate-1",
      catalog: VERIFIED_DATASET_C_LOCATIONS,
      gpsCoords: gate1Coords,
    });

    expect(result.status).toBe("same_location");
    if (result.status === "same_location") {
      expect(result.message).toContain("already at Gate 1");
    }
  });

  it("rejects unknown or invalid QR codes", () => {
    const result = resolveNavigationIntent({
      payload: "random-invalid-qr-string-12345",
      catalog: VERIFIED_DATASET_C_LOCATIONS,
    });

    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.error).toContain("Unknown QR code");
    }
  });

  it("debounces rapid double-scans within 1500ms", () => {
    const now = Date.now();
    const result = resolveNavigationIntent({
      payload: "https://campusway.lpu.in/navigate?to=block-1&from=gate-1",
      catalog: VERIFIED_DATASET_C_LOCATIONS,
      lastScanTimestamp: now - 500, // 500ms ago (< 1500ms)
    });

    expect(result.status).toBe("debounced");
  });

  it("allows scans after the debounce window has elapsed", () => {
    const now = Date.now();
    const result = resolveNavigationIntent({
      payload: "https://campusway.lpu.in/navigate?to=block-1&from=gate-1",
      catalog: VERIFIED_DATASET_C_LOCATIONS,
      lastScanTimestamp: now - 2000, // 2000ms ago (> 1500ms)
    });

    expect(result.status).toBe("ready");
  });
});
