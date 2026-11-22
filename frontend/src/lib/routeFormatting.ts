/**
 * Route Formatting Utilities — distances, step estimation, turn directions, and accessibility badges.
 */

/**
 * Format distance in meters to a human-readable string.
 * < 1000m: `${meters} m` (e.g. "450 m")
 * ≥ 1000m: `${(meters/1000).toFixed(1)} km` (e.g. "1.2 km")
 */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) {
    return "0 m";
  }
  const rounded = Math.round(meters);
  if (rounded < 1000) {
    return `${rounded} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Estimate walking step count based on an average pedestrian stride length of 0.75m.
 */
export function estimateSteps(meters: number): number {
  if (!Number.isFinite(meters) || meters <= 0) {
    return 0;
  }
  return Math.round(meters / 0.75);
}

/**
 * Format walking step count with a tilde prefix and locale thousands separator.
 * e.g. 750m -> "~1,000 steps"
 */
export function formatSteps(meters: number): string {
  const steps = estimateSteps(meters);
  return `~${steps.toLocaleString()} steps`;
}

/**
 * Direction icon mapping for turn-by-turn navigation steps.
 * turn left -> ↰
 * turn right -> ↱
 * enter -> 🚪
 * straight / default -> ↑
 */
export function getDirectionIcon(direction?: string): string {
  if (!direction) return "↑";
  const normalized = direction.toLowerCase().trim();
  switch (normalized) {
    case "left":
      return "↰";
    case "right":
      return "↱";
    case "enter":
      return "🚪";
    case "straight":
    default:
      return "↑";
  }
}

export interface AccessibilityBadgeInfo {
  label: string;
  badgeText: string;
  icon: string;
  isAccessible: boolean;
}

/**
 * Return accessibility badge metadata for a route.
 */
export function getAccessibilityBadge(isAccessible: boolean): AccessibilityBadgeInfo {
  if (isAccessible) {
    return {
      label: "Step-Free Accessible Route",
      badgeText: "♿ Step-Free Route",
      icon: "♿",
      isAccessible: true,
    };
  }
  return {
    label: "Route includes stairs or curbs",
    badgeText: "⚠️ Stairs",
    icon: "⚠️",
    isAccessible: false,
  };
}
