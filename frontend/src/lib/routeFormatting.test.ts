import { describe, it, expect } from "vitest";
import {
  formatDistance,
  estimateSteps,
  formatSteps,
  getDirectionIcon,
  getAccessibilityBadge,
} from "./routeFormatting";

describe("routeFormatting utilities", () => {
  describe("formatDistance", () => {
    it("handles 0 and negative or non-finite inputs", () => {
      expect(formatDistance(0)).toBe("0 m");
      expect(formatDistance(-15)).toBe("0 m");
      expect(formatDistance(NaN)).toBe("0 m");
    });

    it("formats distances under 1000 meters in meters", () => {
      expect(formatDistance(45)).toBe("45 m");
      expect(formatDistance(250.4)).toBe("250 m");
      expect(formatDistance(999)).toBe("999 m");
    });

    it("formats distances >= 1000 meters in kilometers with one decimal place", () => {
      expect(formatDistance(1000)).toBe("1.0 km");
      expect(formatDistance(1250)).toBe("1.3 km");
      expect(formatDistance(2500)).toBe("2.5 km");
      expect(formatDistance(10550)).toBe("10.6 km");
    });
  });

  describe("estimateSteps", () => {
    it("estimates steps based on 0.75m average pedestrian stride length", () => {
      expect(estimateSteps(0)).toBe(0);
      expect(estimateSteps(-10)).toBe(0);
      expect(estimateSteps(75)).toBe(100);
      expect(estimateSteps(750)).toBe(1000);
      expect(estimateSteps(1500)).toBe(2000);
    });
  });

  describe("formatSteps", () => {
    it("formats steps with tilde prefix and locale thousands separator", () => {
      expect(formatSteps(0)).toBe("~0 steps");
      expect(formatSteps(750)).toBe("~1,000 steps");
      expect(formatSteps(3000)).toBe("~4,000 steps");
    });
  });

  describe("getDirectionIcon", () => {
    it("maps direction keywords to appropriate navigation icons", () => {
      expect(getDirectionIcon("left")).toBe("↰");
      expect(getDirectionIcon("Left")).toBe("↰");
      expect(getDirectionIcon("right")).toBe("↱");
      expect(getDirectionIcon("Right")).toBe("↱");
      expect(getDirectionIcon("enter")).toBe("🚪");
      expect(getDirectionIcon("straight")).toBe("↑");
      expect(getDirectionIcon()).toBe("↑");
      expect(getDirectionIcon("unknown")).toBe("↑");
    });
  });

  describe("getAccessibilityBadge", () => {
    it("returns step-free metadata for accessible routes", () => {
      const badge = getAccessibilityBadge(true);
      expect(badge.isAccessible).toBe(true);
      expect(badge.icon).toBe("♿");
      expect(badge.badgeText).toBe("♿ Step-Free Route");
    });

    it("returns warning metadata for routes that may include stairs", () => {
      const badge = getAccessibilityBadge(false);
      expect(badge.isAccessible).toBe(false);
      expect(badge.icon).toBe("⚠️");
      expect(badge.badgeText).toBe("⚠️ Stairs");
    });
  });
});
