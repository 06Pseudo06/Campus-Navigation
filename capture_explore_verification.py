import time
import os
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\KK\.gemini\antigravity\brain\fb7f0586-9047-471d-9f4b-f0c1235789b6"

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)

        # -------------------------------------------------------------
        # TEST 1: 1440x900 Desktop Viewport
        # -------------------------------------------------------------
        print("Testing 1440x900 Desktop Viewport...")
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Clear localStorage so saved places starts empty
        page.goto("http://localhost:3000/explore", wait_until="networkidle")
        page.evaluate("() => localStorage.clear()")
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(1500)

        # 1. Initial Load
        print("Capturing 1440x900 Initial Load...")
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "explore-1440-initial.png"))

        # 2. Hover over a building node
        print("Capturing 1440x900 Node Hover...")
        node = page.locator("svg g[role='button']").first
        if node.count() > 0:
            node.hover()
            page.wait_for_timeout(500)
            page.screenshot(path=os.path.join(ARTIFACT_DIR, "explore-1440-hover.png"))

        # 3. Calculate Route with Dijkstra
        print("Capturing 1440x900 Route Calculated (Dijkstra)...")
        calc_btn = page.locator("button:has-text('Calculate Route')").first
        if calc_btn.count() > 0:
            calc_btn.click()
            page.wait_for_timeout(1500)
            page.screenshot(path=os.path.join(ARTIFACT_DIR, "explore-1440-dijkstra.png"))

        # 4. Hover over first turn guidance step (highlight segment)
        print("Capturing 1440x900 Route Step Hover (Segment Highlight)...")
        guidance_step = page.locator("div.space-y-1\\.5 > div").first
        if guidance_step.count() > 0:
            guidance_step.hover()
            page.wait_for_timeout(500)
            page.screenshot(path=os.path.join(ARTIFACT_DIR, "explore-1440-step-hover.png"))

        # 5. Switch Algorithm to A* and Recalculate
        print("Capturing 1440x900 Route Calculated (A*)...")
        astar_btn = page.locator("button:has-text('A* (Heuristic)')").first
        if astar_btn.count() > 0:
            astar_btn.click()
            page.wait_for_timeout(500)
            calc_btn = page.locator("button:has-text('Calculate Route')").first
            if calc_btn.count() > 0:
                calc_btn.click()
                page.wait_for_timeout(1500)
            page.screenshot(path=os.path.join(ARTIFACT_DIR, "explore-1440-astar.png"))

        # 6. Switch to Saved Tab (Empty State)
        print("Capturing 1440x900 Saved Tab (Empty State)...")
        page.locator("aside").first.hover()
        page.wait_for_timeout(350)
        page.locator("button[data-tab='saved']").first.click()
        page.wait_for_timeout(800)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "explore-1440-saved-empty.png"))

        # 7. Switch back to Explore, bookmark a location, then check Saved Tab with Items
        print("Bookmarking location and testing Saved Tab (with items)...")
        page.locator("aside").first.hover()
        page.wait_for_timeout(350)
        page.locator("button[data-tab='explore']").first.click()
        page.wait_for_timeout(600)
        bookmark_btn = page.locator("button[aria-label*='bookmark'], button[aria-label*='Bookmark']").first
        if bookmark_btn.count() > 0:
            bookmark_btn.click()
            page.wait_for_timeout(500)

        page.locator("aside").first.hover()
        page.wait_for_timeout(350)
        page.locator("button[data-tab='saved']").first.click()
        page.wait_for_timeout(800)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "explore-1440-saved-items.png"))

        # 8. Switch to Routes Tab
        print("Capturing 1440x900 Routes Tab...")
        page.locator("aside").first.hover()
        page.wait_for_timeout(350)
        page.locator("button[data-tab='routes']").first.click()
        page.wait_for_timeout(800)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "explore-1440-routes.png"))

        # 9. Switch to Help Tab
        print("Capturing 1440x900 Help Tab...")
        page.locator("aside").first.hover()
        page.wait_for_timeout(350)
        page.locator("button[data-tab='help']").first.click()
        page.wait_for_timeout(800)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "explore-1440-help.png"))

        # 10. Test Route Calculation Failure / API Error State
        print("Capturing 1440x900 API / Route Error State...")
        page.locator("aside").first.hover()
        page.wait_for_timeout(350)
        page.locator("button[data-tab='explore']").first.click()
        page.wait_for_timeout(600)
        page.route("**/api/v1/routes/calculate**", lambda route: route.abort("failed"))
        calc_btn = page.locator("button:has-text('Calculate Route')").first
        if calc_btn.count() > 0:
            calc_btn.click()
            page.wait_for_timeout(1000)
            page.screenshot(path=os.path.join(ARTIFACT_DIR, "explore-api-error.png"))
        page.unroute("**/api/v1/routes/calculate**")

        context.close()

        # -------------------------------------------------------------
        # TEST 2: 1920x1080 Wide Desktop Viewport
        # -------------------------------------------------------------
        print("Testing 1920x1080 Viewport...")
        wide_ctx = browser.new_context(viewport={"width": 1920, "height": 1080})
        w_page = wide_ctx.new_page()
        w_page.goto("http://localhost:3000/explore", wait_until="networkidle")
        w_page.wait_for_timeout(1500)
        w_page.screenshot(path=os.path.join(ARTIFACT_DIR, "explore-1920.png"))
        wide_ctx.close()

        # -------------------------------------------------------------
        # TEST 3: 1280x720 Laptop Viewport
        # -------------------------------------------------------------
        print("Testing 1280x720 Viewport...")
        l_ctx = browser.new_context(viewport={"width": 1280, "height": 720})
        l_page = l_ctx.new_page()
        l_page.goto("http://localhost:3000/explore", wait_until="networkidle")
        l_page.wait_for_timeout(1500)
        l_page.screenshot(path=os.path.join(ARTIFACT_DIR, "explore-1280.png"))
        l_ctx.close()

        # -------------------------------------------------------------
        # TEST 4: 1024x768 Tablet Viewport
        # -------------------------------------------------------------
        print("Testing 1024x768 Viewport...")
        t_ctx = browser.new_context(viewport={"width": 1024, "height": 768})
        t_page = t_ctx.new_page()
        t_page.goto("http://localhost:3000/explore", wait_until="networkidle")
        t_page.wait_for_timeout(1500)
        t_page.screenshot(path=os.path.join(ARTIFACT_DIR, "explore-1024.png"))
        t_ctx.close()

        # -------------------------------------------------------------
        # TEST 5: 390x844 Mobile Viewport (Bottom Sheet Snaps)
        # -------------------------------------------------------------
        print("Testing 390x844 Mobile Viewport...")
        m_ctx = browser.new_context(
            viewport={"width": 390, "height": 844},
            is_mobile=True,
            has_touch=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
        )
        m_page = m_ctx.new_page()
        m_page.goto("http://localhost:3000/explore", wait_until="networkidle")
        m_page.wait_for_timeout(1500)

        # Snap 1: Peek
        print("Capturing Mobile Sheet Peek...")
        m_page.screenshot(path=os.path.join(ARTIFACT_DIR, "explore-mobile-peek.png"))

        # Snap 2: Half
        print("Capturing Mobile Sheet Half...")
        handle = m_page.locator("div[aria-label='Toggle drawer height']").first
        if handle.count() > 0:
            handle.click()
            m_page.wait_for_timeout(600)
            m_page.screenshot(path=os.path.join(ARTIFACT_DIR, "explore-mobile-half.png"))

            # Snap 3: Full
            print("Capturing Mobile Sheet Full...")
            handle.click()
            m_page.wait_for_timeout(600)
            m_page.screenshot(path=os.path.join(ARTIFACT_DIR, "explore-mobile-full.png"))

        m_ctx.close()
        browser.close()
        print("All Explore visual tests completed successfully!")

if __name__ == "__main__":
    run_tests()
