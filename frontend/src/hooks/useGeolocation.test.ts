import { describe, it, expect } from "vitest";
import {
  isPositionInsideCampus,
  isAccuracyAcceptable,
  formatGeolocationError,
  ACCURACY_THRESHOLD_METERS,
} from "./useGeolocation";

describe("useGeolocation pure helpers & error mapping", () => {
  describe("isPositionInsideCampus", () => {
    it("returns true for coordinates inside LPU campus", () => {
      // Near Block 1
      expect(isPositionInsideCampus(31.260565, 75.706815)).toBe(true);
      // Near Gate 1
      expect(isPositionInsideCampus(31.26128, 75.70014)).toBe(true);
      // Near Central Spine / Block 30
      expect(isPositionInsideCampus(31.2585, 75.7042)).toBe(true);
    });

    it("returns false for coordinates clearly outside LPU campus", () => {
      // Jalandhar city center
      expect(isPositionInsideCampus(31.326, 75.576)).toBe(false);
      // New Delhi
      expect(isPositionInsideCampus(28.6139, 77.209)).toBe(false);
      // Non-finite
      expect(isPositionInsideCampus(NaN, 75.706)).toBe(false);
    });
  });

  describe("isAccuracyAcceptable", () => {
    it("returns true for accuracy <= 50 meters", () => {
      expect(isAccuracyAcceptable(5)).toBe(true);
      expect(isAccuracyAcceptable(15)).toBe(true);
      expect(isAccuracyAcceptable(ACCURACY_THRESHOLD_METERS)).toBe(true);
    });

    it("returns false for low accuracy fixes > 50 meters or invalid values", () => {
      expect(isAccuracyAcceptable(51)).toBe(false);
      expect(isAccuracyAcceptable(150)).toBe(false);
      expect(isAccuracyAcceptable(0)).toBe(false);
      expect(isAccuracyAcceptable(-10)).toBe(false);
      expect(isAccuracyAcceptable(NaN)).toBe(false);
    });
  });

  describe("formatGeolocationError", () => {
    it("maps permission denied (code 1)", () => {
      const err = formatGeolocationError(1);
      expect(err.type).toBe("denied");
      expect(err.message).toContain("Location access was denied");
    });

    it("maps position unavailable (code 2)", () => {
      const err = formatGeolocationError(2);
      expect(err.type).toBe("unavailable");
      expect(err.message).toContain("GPS signal is currently unavailable");
    });

    it("maps timeout (code 3)", () => {
      const err = formatGeolocationError(3);
      expect(err.type).toBe("timeout");
      expect(err.message).toContain("Location request timed out");
    });

    it("maps unknown codes to fallback unavailable", () => {
      const err = formatGeolocationError(999);
      expect(err.type).toBe("unavailable");
    });
  });
});
