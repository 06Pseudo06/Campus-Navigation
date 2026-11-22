import { describe, it, expect, beforeEach } from "vitest";
import {
  SESSION_VIEWPORT_KEY,
  getDefaultViewport,
  getStoredViewport,
  saveStoredViewport,
  clearStoredViewport,
  getResponsiveMapPadding,
  calculateRouteBounds,
  haversineMeters,
  getRouteFitBoundsZoomCap,
  isWithinCampusBounds,
  LPU_CAMPUS_BOUNDS,
  LPU_MIN_ZOOM,
  LPU_MAX_ZOOM,
} from "./mapViewport";

describe("mapViewport", () => {
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
  };

  beforeEach(() => {
    store.clear();
    // @ts-expect-error Mocking browser globals for Node test environment
    globalThis.sessionStorage = mockStorage;
    // @ts-expect-error Mocking browser window for Node test environment
    globalThis.window = { sessionStorage: mockStorage };
  });

  it("returns default viewport when sessionStorage is empty", () => {
    const vp = getStoredViewport();
    expect(vp).toEqual(getDefaultViewport());
    expect(vp.zoom).toBe(16.5);
    expect(vp.latitude).toBeCloseTo(31.260565);
    expect(vp.longitude).toBeCloseTo(75.706815);
  });

  it("saves and retrieves viewport from sessionStorage", () => {
    saveStoredViewport({
      latitude: 31.258,
      longitude: 75.708,
      zoom: 17.2,
      pitch: 50,
      bearing: 15,
    });

    const stored = getStoredViewport();
    expect(stored.latitude).toBe(31.258);
    expect(stored.longitude).toBe(75.708);
    expect(stored.zoom).toBe(17.2);
    expect(stored.pitch).toBe(50);
    expect(stored.bearing).toBe(15);
  });

  it("clamps zoom within LPU min/max zoom limits", () => {
    saveStoredViewport({ zoom: 5 }); // Too low
    let stored = getStoredViewport();
    expect(stored.zoom).toBe(LPU_MIN_ZOOM);

    saveStoredViewport({ zoom: 25 }); // Too high
    stored = getStoredViewport();
    expect(stored.zoom).toBe(LPU_MAX_ZOOM);
  });

  it("clears stored viewport", () => {
    saveStoredViewport({ zoom: 18 });
    expect(mockStorage.getItem(SESSION_VIEWPORT_KEY)).not.toBeNull();

    clearStoredViewport();
    expect(mockStorage.getItem(SESSION_VIEWPORT_KEY)).toBeNull();
    expect(getStoredViewport()).toEqual(getDefaultViewport());
  });

  it("calculates responsive padding for desktop vs mobile", () => {
    const desktopPadding = getResponsiveMapPadding(false, true);
    expect(desktopPadding.right).toBe(420); // Accounts for desktop right panel
    expect(desktopPadding.left).toBe(80);

    const mobilePadding = getResponsiveMapPadding(true, true);
    expect(mobilePadding.bottom).toBe(320); // Accounts for mobile bottom sheet
    expect(mobilePadding.right).toBe(20);
  });

  it("calculates route bounding box correctly", () => {
    const waypoints = [
      { lat: 31.26, lng: 75.705 },
      { lat: 31.265, lng: 75.71 },
      { lat: 31.258, lng: 75.707 },
    ];

    const bounds = calculateRouteBounds(waypoints);
    expect(bounds).not.toBeNull();
    const [[minLng, minLat], [maxLng, maxLat]] = bounds!;
    expect(minLng).toBe(75.705);
    expect(maxLng).toBe(75.71);
    expect(minLat).toBe(31.258);
    expect(maxLat).toBe(31.265);
  });

  it("enforces LPU bounds configuration", () => {
    const [[swLng, swLat], [neLng, neLat]] = LPU_CAMPUS_BOUNDS;
    expect(swLng).toBeLessThan(neLng);
    expect(swLat).toBeLessThan(neLat);
    expect(swLng).toBeCloseTo(75.692);
    expect(neLat).toBeCloseTo(31.272);
  });

  it("calculates haversine distance in meters", () => {
    // 31.260565, 75.706815 to nearby point
    const dist = haversineMeters(31.260565, 75.706815, 31.261, 75.707);
    expect(dist).toBeGreaterThan(40);
    expect(dist).toBeLessThan(70);
  });

  it("caps fitBounds maxZoom to 17.5 for short routes (<80m span)", () => {
    // Two points roughly 50m apart
    const shortBounds: [[number, number], [number, number]] = [
      [75.7068, 31.2605],
      [75.7071, 31.2608],
    ];
    expect(getRouteFitBoundsZoomCap(shortBounds)).toBe(17.5);

    // Two points roughly 500m apart
    const longBounds: [[number, number], [number, number]] = [
      [75.700, 31.255],
      [75.705, 31.260],
    ];
    expect(getRouteFitBoundsZoomCap(longBounds)).toBe(18.5);
  });

  it("checks whether coordinate is inside LPU campus bounds", () => {
    // Inside LPU campus (near Block 1)
    expect(isWithinCampusBounds(31.260565, 75.706815)).toBe(true);

    // Well outside LPU campus (e.g. Jalandhar city center)
    expect(isWithinCampusBounds(31.326, 75.576)).toBe(false);

    // Invalid coordinate values
    expect(isWithinCampusBounds(NaN, 75.706)).toBe(false);
  });
});
