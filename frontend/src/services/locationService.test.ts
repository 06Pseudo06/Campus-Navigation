import { describe, it, expect, beforeEach, vi } from "vitest";
import { locationService } from "./locationService";

describe("locationService", () => {
  beforeEach(() => {
    locationService.clearCache();
    vi.restoreAllMocks();
  });

  it("fetches locations and caches them in memory", async () => {
    const mockLocations = [
      {
        id: "loc-1",
        parent_id: null,
        name: "Block 1",
        slug: "block-1",
        location_type: "building",
        description: "Academic building",
        latitude: 31.261,
        longitude: 75.707,
        address_details: null,
        is_verified: true,
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ];

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockLocations,
    } as Response);

    // First call triggers network fetch
    const firstResult = await locationService.getLocations();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(firstResult).toHaveLength(1);
    expect(firstResult[0].slug).toBe("block-1");

    // Second immediate call should hit cache without another fetch
    const secondResult = await locationService.getLocations();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(secondResult).toEqual(firstResult);
  });

  it("deduplicates concurrent in-flight requests", async () => {
    let resolveNetwork: (val: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveNetwork = resolve;
    });

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockReturnValue(
      pendingPromise.then(() => ({
        ok: true,
        json: async () => [{ id: "loc-gate", name: "Main Gate" }],
      })) as Promise<Response>
    );

    const call1 = locationService.getLocations();
    const call2 = locationService.getLocations();

    resolveNetwork!(true);

    const [res1, res2] = await Promise.all([call1, call2]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(res1).toEqual(res2);
  });

  it("falls back to verified Dataset C survey data when API fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network connection refused"));

    const locations = await locationService.getLocations();
    expect(Array.isArray(locations)).toBe(true);
    expect(locations.length).toBeGreaterThan(0);
    expect(locations.some((l) => l.slug === "gate-1")).toBe(true);
  });
});
