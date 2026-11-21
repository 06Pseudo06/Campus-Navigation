/**
 * CampusWay — Motion & Animation Utilities
 * Lightweight native CSS/JS transitions with strict reduced-motion support.
 */

export function isReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
