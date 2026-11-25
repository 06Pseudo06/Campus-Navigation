import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const ARTIFACTS_DIR = "C:/Users/KK/.gemini/antigravity/brain/fb7f0586-9047-471d-9f4b-f0c1235789b6";
const PUBLIC_DIR = path.resolve(process.cwd(), "public/screenshots");

function ensureDirs() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }
}

async function saveScreenshot(locatorOrPage: any, filename: string) {
  ensureDirs();
  const publicPath = path.join(PUBLIC_DIR, filename);
  const artifactPath = path.join(ARTIFACTS_DIR, filename);

  await locatorOrPage.screenshot({ path: publicPath });
  try {
    fs.copyFileSync(publicPath, artifactPath);
  } catch (e) {
    console.warn("Could not copy to artifact dir:", e);
  }
}

test.describe("capture UI before/after screenshots", () => {
  test("captures dark mode screenshots for hero, feature cards, and help callout", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Ensure dark theme
    await page.addInitScript(() => {
      localStorage.setItem("campusway-theme", "dark");
    });

    await page.goto("/?intro=1", { waitUntil: "domcontentloaded" });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(800);

    // 1. Hero Resting (Dark)
    const hero = page.locator("#section-01");
    await expect(hero).toBeVisible();
    await saveScreenshot(hero, "hero-resting-dark.png");

    // 2. Feature Cards Revealed (Dark)
    const section02 = page.locator("#section-02");
    await section02.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await saveScreenshot(section02, "features-revealed-dark.png");

    // 3. Help Callout (Dark)
    await page.goto("/help", { waitUntil: "domcontentloaded" });
    const callout = page.locator("#emergency-callout");
    await expect(callout).toBeVisible();
    await callout.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await saveScreenshot(callout, "help-callout-dark.png");
  });

  test("captures light mode screenshots for hero, feature cards, and help callout", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Ensure light theme
    await page.addInitScript(() => {
      localStorage.setItem("campusway-theme", "light");
    });

    await page.goto("/?intro=1", { waitUntil: "domcontentloaded" });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(800);

    // 1. Hero Resting (Light)
    const hero = page.locator("#section-01");
    await expect(hero).toBeVisible();
    await saveScreenshot(hero, "hero-resting-light.png");

    // 2. Feature Cards Revealed (Light)
    const section02 = page.locator("#section-02");
    await section02.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await saveScreenshot(section02, "features-revealed-light.png");

    // 3. Help Callout (Light)
    await page.goto("/help", { waitUntil: "domcontentloaded" });
    const callout = page.locator("#emergency-callout");
    await expect(callout).toBeVisible();
    await callout.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await saveScreenshot(callout, "help-callout-light.png");
  });
});
