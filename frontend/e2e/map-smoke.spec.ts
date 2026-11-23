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

    // Verify Stage 3 Route Summary HUD and Panel
    await expect(page.getByTestId("route-summary-hud")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("route-summary-panel")).toBeVisible({ timeout: 10_000 });

    // Verify Stage 2 Reset View button is visible and clickable
    const resetBtn = page.getByTestId("reset-view-button");
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // Verify Stage 4 Locate Me button is visible and clickable
    const locateBtn = page.getByTestId("locate-button");
    await expect(locateBtn).toBeVisible();
    await locateBtn.click();

    // Verify Stage 5 QR Code generation modal
    const qrBtn = page.getByTestId("destination-qr-button");
    await expect(qrBtn).toBeVisible();
    await qrBtn.click();

    const qrModal = page.getByTestId("qr-code-modal");
    await expect(qrModal).toBeVisible();
    await expect(page.getByTestId("qr-code-svg-container")).toBeVisible({ timeout: 10_000 });

    // Close modal
    await page.keyboard.press("Escape");
    await expect(qrModal).not.toBeVisible();
  });

  test("resolves deep links and shows handoff or 404", async ({ page }) => {
    // 1. Valid destination deep link
    await page.goto("/navigate?to=block-1&from=gate-1");
    await expect(page.getByTestId("navigate-handoff-card")).toBeVisible({ timeout: 10_000 });

    // 2. Unknown destination deep link
    await page.goto("/navigate?to=nonexistent-block-xyz");
    await expect(page.getByTestId("navigate-not-found")).toBeVisible({ timeout: 10_000 });
  });

  test("opens QR scanner modal, supports manual code entry and keyboard dismiss", async ({
    page,
  }) => {
    await page.goto("/explore");
    const scanBtn = page.getByTestId("topbar-scan-qr-button");
    await expect(scanBtn).toBeVisible({ timeout: 15_000 });
    await scanBtn.click();

    const scannerModal = page.getByTestId("qr-scanner-modal");
    await expect(scannerModal).toBeVisible();

    // Verify Fallback Type Code input
    await page.getByText("Type Code").click();
    const input = page.getByPlaceholder("e.g. block-1, gate-1, B1...");
    await expect(input).toBeVisible();
    await input.fill("block-2");
    await scannerModal.getByTestId("manual-code-submit").click();

    // Modal closes and Block 2 destination is focused
    await expect(scannerModal).not.toBeVisible();
    await expect(page.getByText("Block 2").first()).toBeVisible();
  });

  test("preserves original typography and font hierarchy", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // 1. Assert body font family includes Inter Tight / sans-serif
    const bodyFont = await page.evaluate(() =>
      window.getComputedStyle(document.body).fontFamily
    );
    expect(bodyFont.toLowerCase()).toMatch(/inter tight|font-sans|sans-serif/);

    // 2. Assert mono labels use JetBrains Mono / monospace
    const monoLabel = page.locator(".font-mono, [class*='font-mono']").first();
    await expect(monoLabel).toBeVisible();
    const monoFont = await monoLabel.evaluate((el) =>
      window.getComputedStyle(el).fontFamily
    );
    expect(monoFont.toLowerCase()).toMatch(/jetbrains mono|font-mono|monospace/);
  });

  test("toggles light, dark, and auto theme and persists preference", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Click theme toggle button in navbar
    const themeBtn = page.getByRole("button", { name: "Change theme" }).first();
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();

    // Select Light Mode
    const lightOption = page.getByRole("button", { name: "Light Mode" }).first();
    await expect(lightOption).toBeVisible();
    await lightOption.click();

    // Verify html tag receives light attributes
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    const storedTheme = await page.evaluate(() => localStorage.getItem("campusway-theme"));
    expect(storedTheme).toBe("light");

    // Click theme toggle again and select Dark Mode
    await themeBtn.click();
    const darkOption = page.getByRole("button", { name: "Dark Mode" }).first();
    await expect(darkOption).toBeVisible();
    await darkOption.click();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const storedDark = await page.evaluate(() => localStorage.getItem("campusway-theme"));
    expect(storedDark).toBe("dark");

    // Reload page to verify persistence without flash
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("allows natural wheel scrolling on directions panel without scrolling window", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 700 });
    await page.goto("/explore");

    const panel = page.getByTestId("destination-panel-scroll");
    await expect(panel).toBeVisible({ timeout: 15_000 });

    // Wait for location items to load and populate the panel list
    const firstLocationItem = page.locator("[data-testid^='location-item-']").first();
    await expect(firstLocationItem).toBeVisible({ timeout: 10_000 });

    // Assert scroll container can overflow
    const canScroll = await panel.evaluate((el) => el.scrollHeight > el.clientHeight);
    expect(canScroll).toBe(true);

    // Assert initial scrollTop is 0
    const initialScrollTop = await panel.evaluate((el) => el.scrollTop);
    expect(initialScrollTop).toBe(0);

    // Hover over panel and dispatch mouse wheel scroll
    await panel.hover();
    await page.mouse.wheel(0, 300);

    // Wait for scroll to update
    await page.waitForTimeout(400);

    // Assert scrollTop has increased
    const scrolledTop = await panel.evaluate((el) => el.scrollTop);
    expect(scrolledTop).toBeGreaterThan(0);

    // Assert window itself did not scroll (overflow contained)
    const windowScrollY = await page.evaluate(() => window.scrollY);
    expect(windowScrollY).toBe(0);
  });
});
