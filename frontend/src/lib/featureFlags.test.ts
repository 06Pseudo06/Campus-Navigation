import { describe, expect, it } from "vitest";
import { FEATURE_GPS, FEATURE_QR } from "./featureFlags";

describe("feature flags", () => {
  it("defaults GPS and QR flags to enabled", () => {
    expect(FEATURE_GPS).toBe(true);
    expect(FEATURE_QR).toBe(true);
  });
});
