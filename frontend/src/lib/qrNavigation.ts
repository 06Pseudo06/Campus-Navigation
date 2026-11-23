import { CampusLocation } from "@/types/campus";
import { BackendLocation } from "@/services/locationService";
import { VERIFIED_DATASET_C_LOCATIONS } from "@/data/campusData";

export interface NavigateParams {
  to: string | null;
  from: string | null;
}

/**
 * Parses navigation parameters from URLSearchParams or query object.
 * Supports canonical 'to' and 'from' as well as friendly aliases.
 */
export function parseNavigateParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>
): NavigateParams {
  let to: string | null = null;
  let from: string | null = null;

  if (params instanceof URLSearchParams) {
    to = params.get("to") || params.get("destination") || params.get("dest") || null;
    from = params.get("from") || params.get("origin") || params.get("start") || null;
  } else {
    const rawTo = params["to"] || params["destination"] || params["dest"];
    const rawFrom = params["from"] || params["origin"] || params["start"];
    to = Array.isArray(rawTo) ? rawTo[0] : rawTo || null;
    from = Array.isArray(rawFrom) ? rawFrom[0] : rawFrom || null;
  }

  // Sanitize: trim whitespace, strip control characters, limit length
  const sanitize = (val: string | null): string | null => {
    if (!val) return null;
    const trimmed = val.trim().substring(0, 100);
    // Disallow dangerous protocols or HTML entities
    if (/[<>"'`\\]/.test(trimmed)) return null;
    return trimmed.length > 0 ? trimmed : null;
  };

  return {
    to: sanitize(to),
    from: sanitize(from),
  };
}

/**
 * Validates a location identifier against known Dataset C locations.
 * Matches against ID (UUID), slug, code, or name (case-insensitive).
 */
export function validateLocationIdentifier(
  identifier: string | null | undefined,
  catalog: (CampusLocation | BackendLocation)[] = VERIFIED_DATASET_C_LOCATIONS
): (CampusLocation | BackendLocation) | null {
  if (!identifier || typeof identifier !== "string") return null;

  const needle = identifier.trim().toLowerCase();
  if (!needle) return null;

  // 1. Exact match on slug
  const bySlug = catalog.find((loc) => loc.slug && loc.slug.toLowerCase() === needle);
  if (bySlug) return bySlug;

  // 2. Exact match on ID (e.g. UUID)
  const byId = catalog.find((loc) => loc.id && loc.id.toLowerCase() === needle);
  if (byId) return byId;

  // 3. Match on code (for CampusLocation)
  const byCode = catalog.find((loc) => {
    const code = "code" in loc && typeof loc.code === "string" ? loc.code.toLowerCase() : null;
    return code === needle || code?.replace(/\s+/g, "-") === needle;
  });
  if (byCode) return byCode;

  // 4. Match on name
  const byName = catalog.find((loc) => loc.name && loc.name.toLowerCase() === needle);
  if (byName) return byName;

  return null;
}

/**
 * Builds a canonical navigation URL.
 * Defaults to relative path '/navigate?to=...'
 */
export function buildNavigateUrl(options: {
  to: string;
  from?: string | null;
  origin?: string | null;
}): string {
  const toSlug = options.to.trim();
  const search = new URLSearchParams();
  search.set("to", toSlug);

  if (options.from && options.from.trim()) {
    search.set("from", options.from.trim());
  }

  const path = `/navigate?${search.toString()}`;

  if (options.origin && isSafeRedirectTarget(options.origin)) {
    try {
      const base = new URL(options.origin);
      return `${base.origin}${path}`;
    } catch {
      return path;
    }
  }

  return path;
}

/**
 * Validates whether a URL or path is safe to navigate to, preventing open redirects.
 */
export function isSafeRedirectTarget(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();

  // Relative path starting with / (not // which is scheme-relative)
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.startsWith("/\\")) {
    return true;
  }

  // Absolute URL: verify host matches current window origin or trusted campus domains
  try {
    const parsed = new URL(trimmed);
    const trustedHosts = [
      "localhost",
      "127.0.0.1",
      "campusway.lpu.in",
      "campusway.dev",
    ];

    if (typeof window !== "undefined") {
      trustedHosts.push(window.location.hostname);
    }

    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      trustedHosts.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`))
    );
  } catch {
    return false;
  }
}
