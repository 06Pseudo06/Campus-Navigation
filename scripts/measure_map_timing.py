import asyncio
import json
import time
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            headless=True
        )
        page = await browser.new_page(viewport={"width": 1280, "height": 800})
        t0 = time.perf_counter()
        await page.goto("http://localhost:3000/explore", wait_until="networkidle")
        await page.wait_for_selector('[data-testid="campus-map"]')
        t_map = time.perf_counter()
        
        timing = await page.evaluate("""() => {
            const nav = performance.getEntriesByType('navigation')[0];
            const paint = performance.getEntriesByType('paint');
            const fcp = paint.find(p => p.name === 'first-contentful-paint');
            return {
                ttfb: nav ? Math.round(nav.responseStart - nav.requestStart) : 0,
                domInteractive: nav ? Math.round(nav.domInteractive) : 0,
                domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : 0,
                load: nav ? Math.round(nav.loadEventEnd - nav.startTime) : 0,
                fcp: fcp ? Math.round(fcp.startTime) : 0
            };
        }""")
        timing["firstRenderTimeMs"] = round((t_map - t0) * 1000, 1)
        print("MAP_METRICS:", json.dumps(timing, indent=2))
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
