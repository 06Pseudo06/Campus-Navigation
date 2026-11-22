import { test, expect } from "@playwright/test";

test.describe("map smoke", () => {
  test("loads map, searches a block, and renders a route polyline", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const navStart = Date.now();
    await page.goto("/explore");

    const map = page.getByTestId("campus-map");
    await expect(map).toBeVisible({ timeout: 20_000 });
    const mapFirstRenderMs = Date.now() - navStart;
    const nav = await page.evaluate(() => {
      const entry = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      return {
        ttfb: entry ? entry.responseStart - entry.requestStart : null,
        domContentLoaded: entry
          ? entry.domContentLoadedEventEnd - entry.startTime
          : null,
        load: entry ? entry.loadEventEnd - entry.startTime : null,
      };
    });
    test.info().annotations.push({
      type: "perf",
      description: JSON.stringify({ ...nav, mapFirstRenderMs }),
    });

    const destinationSearch = page.getByTestId("destination-search");
    await expect(destinationSearch).toBeVisible();
    await destinationSearch.fill("Block 1");

    const block1 = page.getByTestId("location-item-block-1");
    await expect(block1).toBeVisible();
    await block1.click();

    await expect(page.getByTestId("route-polyline")).toBeVisible({
      timeout: 20_000,
    });

    // Verify Stage 2 Reset View button is visible and clickable
    const resetBtn = page.getByTestId("reset-view-button");
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
  });
});
