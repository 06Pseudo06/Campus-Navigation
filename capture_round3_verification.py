import os
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\KK\.gemini\antigravity\brain\fb7f0586-9047-471d-9f4b-f0c1235789b6"

def run_round3_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)

        # -------------------------------------------------------------
        # 1440x900 DESKTOP VIEWPORT
        # -------------------------------------------------------------
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("\n--- Navigating to http://localhost:3000/explore at 1440x900 ---")
        page.goto("http://localhost:3000/explore", wait_until="networkidle")
        page.wait_for_timeout(1500)

        # Ensure page rendered
        page.wait_for_selector("#panel-scroll", timeout=10000)

        # 1. Capture Explore Initial View
        print("1. Capturing Explore initial view (1440x900)...")
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "round3-1440-explore-initial.png"))

        # TEST: Map Overlay Controls Clickability
        print("TEST: Testing map controls clickability...")
        scale_before = page.locator("text=/\\d+\\s*m/").first.inner_text()
        print(f"Initial scale bar: {scale_before}")
        
        # Click Zoom In button
        page.locator('button[aria-label="Zoom In"]').click()
        page.wait_for_timeout(300)
        scale_after = page.locator("text=/\\d+\\s*m/").first.inner_text()
        print(f"Scale bar after + click: {scale_after}")
        assert scale_before != scale_after, "Zoom in button click did not change scale meters!"

        # Click Zoom Out button
        page.locator('button[aria-label="Zoom Out"]').click()
        page.wait_for_timeout(300)

        # Click Legend toggle pill
        legend_btn = page.locator('button[aria-label="Expand map legend"]')
        legend_btn.click()
        page.wait_for_timeout(400)
        # Verify legend expanded
        legend_expanded = page.locator('text=Walkway Connectivity').is_visible()
        print(f"Legend expanded after click: {legend_expanded}")
        assert legend_expanded, "Legend did not expand after clicking Legend pill!"

        # Close legend
        page.locator('text=Walkway Connectivity').locator("xpath=..").locator("button").click()
        page.wait_for_timeout(300)

        # TEST: Panel Scroller Wheel Scroll & min-height: 0
        print("TEST: Testing panel scroll container...")
        scroll_info = page.evaluate("""() => {
            const scroller = document.getElementById('panel-scroll');
            if (!scroller) return null;
            return {
                scrollHeight: scroller.scrollHeight,
                clientHeight: scroller.clientHeight,
                scrollTop: scroller.scrollTop
            };
        }""")
        print(f"Scroller dimensions: {scroll_info}")
        assert scroll_info and scroll_info["scrollHeight"] > scroll_info["clientHeight"], "Panel scroller does not have overflow!"

        # Perform wheel event over panel
        page.hover("#panel-scroll")
        page.mouse.wheel(0, 300)
        page.wait_for_timeout(500)
        scroll_top_after = page.evaluate("() => document.getElementById('panel-scroll').scrollTop")
        print(f"Scroller scrollTop after wheel: {scroll_top_after}")
        assert scroll_top_after > 0, "Panel did not scroll on wheel event!"

        # Reset panel scroll to top
        page.evaluate("() => document.getElementById('panel-scroll').scrollTop = 0")
        page.wait_for_timeout(300)

        # TEST: Route Calculation & Result Auto-Scroll
        print("TEST: Testing Route Calculation...")
        # Select Paterson Hall as destination
        page.locator('text="Paterson Hall"').first.click()
        page.wait_for_timeout(300)

        # Click Calculate CTA in docked bottom bar
        calc_btn = page.locator('button:has-text("Calculate Route")').first
        calc_btn.click()
        page.wait_for_timeout(1500)

        # Verify route result card is visible
        route_card = page.locator('text=WALKING TIME').first
        assert route_card.is_visible(), "Route result card is not visible!"

        # Verify docked bottom bar is still visible
        assert calc_btn.is_visible(), "Docked calculate button disappeared!"

        # 2. Capture Explore Route Calculated View
        print("2. Capturing Explore route calculated (1440x900)...")
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "round3-1440-explore-route.png"))

        # 3. Scroll to bottom of panel and capture
        print("3. Capturing Explore scrolled to bottom of panel (1440x900)...")
        page.evaluate("() => { const s = document.getElementById('panel-scroll'); s.scrollTop = s.scrollHeight; }")
        page.wait_for_timeout(500)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "round3-1440-explore-bottom.png"))

        # Reset scroll to top before testing search input
        page.evaluate("() => { const s = document.getElementById('panel-scroll'); s.scrollTop = 0; }")
        page.wait_for_timeout(300)

        # TEST: Cursor mode verification
        print("TEST: Testing custom cursor states...")
        calc_btn.hover()
        page.wait_for_timeout(200)
        mode_on_button = page.evaluate("() => document.getElementById('custom-cursor')?.getAttribute('data-cursor-mode')")
        print(f"Cursor mode on button: {mode_on_button}")
        assert mode_on_button == "button", f"Expected button cursor mode, got {mode_on_button}"

        page.locator('input[placeholder*="Search destination by name"]').first.hover()
        page.wait_for_timeout(200)
        mode_on_input = page.evaluate("() => document.getElementById('custom-cursor')?.getAttribute('data-cursor-mode')")
        print(f"Cursor mode on input: {mode_on_input}")
        assert mode_on_input == "hidden", f"Expected hidden cursor mode, got {mode_on_input}"

        # Hover over Map surface -> cursor should show DRAG ring
        page.locator('#mapPanSurface').hover(position={"x": 100, "y": 100})
        page.wait_for_timeout(200)
        mode_on_map = page.evaluate("() => document.getElementById('custom-cursor')?.getAttribute('data-cursor-mode')")
        print(f"Cursor mode on map: {mode_on_map}")
        assert mode_on_map == "map", f"Expected map cursor mode, got {mode_on_map}"

        # 4. Routes View
        print("4. Capturing Routes View (1440x900)...")
        routes_nav = page.locator('aside[aria-label="Campus navigation modes"] button[data-tab="routes"]')
        routes_nav.click()
        page.wait_for_timeout(600)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "round3-1440-routes.png"))

        # 5. Saved View (empty state)
        print("5. Capturing Saved View Empty (1440x900)...")
        saved_nav = page.locator('aside[aria-label="Campus navigation modes"] button[data-tab="saved"]')
        saved_nav.click()
        page.wait_for_timeout(600)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "round3-1440-saved-empty.png"))

        # Add saved item by pressing 's' on Paterson Hall in Explore
        print("Testing bookmarking via keyboard shortcut 's'...")
        page.locator('aside[aria-label="Campus navigation modes"] button[data-tab="explore"]').click()
        page.wait_for_timeout(400)
        page.keyboard.press("s")
        page.wait_for_timeout(600)

        # Switch to Saved View -> now populated!
        saved_nav.click()
        page.wait_for_timeout(600)
        print("6. Capturing Saved View With Items (1440x900)...")
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "round3-1440-saved-items.png"))

        # 7. Help View
        print("7. Capturing Help View (1440x900)...")
        help_nav = page.locator('aside[aria-label="Campus navigation modes"] button[data-tab="help"]')
        help_nav.click()
        page.wait_for_timeout(600)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "round3-1440-help.png"))

        # -------------------------------------------------------------
        # 1920x1080 DESKTOP VIEWPORT
        # -------------------------------------------------------------
        context_1080 = browser.new_context(viewport={"width": 1920, "height": 1080})
        page_1080 = context_1080.new_page()
        print("\n--- Capturing 1920x1080 Viewports ---")
        page_1080.goto("http://localhost:3000/explore", wait_until="networkidle")
        page_1080.wait_for_timeout(1000)
        page_1080.screenshot(path=os.path.join(ARTIFACT_DIR, "round3-1920-explore.png"))

        page_1080.locator('aside[aria-label="Campus navigation modes"] button[data-tab="routes"]').click()
        page_1080.wait_for_timeout(400)
        page_1080.screenshot(path=os.path.join(ARTIFACT_DIR, "round3-1920-routes.png"))

        page_1080.locator('aside[aria-label="Campus navigation modes"] button[data-tab="saved"]').click()
        page_1080.wait_for_timeout(400)
        page_1080.screenshot(path=os.path.join(ARTIFACT_DIR, "round3-1920-saved.png"))

        page_1080.locator('aside[aria-label="Campus navigation modes"] button[data-tab="help"]').click()
        page_1080.wait_for_timeout(400)
        page_1080.screenshot(path=os.path.join(ARTIFACT_DIR, "round3-1920-help.png"))

        # -------------------------------------------------------------
        # 1280x720 LAPTOP VIEWPORT
        # -------------------------------------------------------------
        context_720 = browser.new_context(viewport={"width": 1280, "height": 720})
        page_720 = context_720.new_page()
        print("\n--- Capturing 1280x720 Viewports ---")
        page_720.goto("http://localhost:3000/explore", wait_until="networkidle")
        page_720.wait_for_timeout(1000)
        page_720.screenshot(path=os.path.join(ARTIFACT_DIR, "round3-1280-explore.png"))

        page_720.locator('aside[aria-label="Campus navigation modes"] button[data-tab="routes"]').click()
        page_720.wait_for_timeout(400)
        page_720.screenshot(path=os.path.join(ARTIFACT_DIR, "round3-1280-routes.png"))

        page_720.locator('aside[aria-label="Campus navigation modes"] button[data-tab="saved"]').click()
        page_720.wait_for_timeout(400)
        page_720.screenshot(path=os.path.join(ARTIFACT_DIR, "round3-1280-saved.png"))

        page_720.locator('aside[aria-label="Campus navigation modes"] button[data-tab="help"]').click()
        page_720.wait_for_timeout(400)
        page_720.screenshot(path=os.path.join(ARTIFACT_DIR, "round3-1280-help.png"))

        # -------------------------------------------------------------
        # 390x844 MOBILE VIEWPORT
        # -------------------------------------------------------------
        context_mobile = browser.new_context(
            viewport={"width": 390, "height": 844},
            is_mobile=True,
            has_touch=True
        )
        page_mobile = context_mobile.new_page()
        print("\n--- Capturing 390x844 Mobile Viewports ---")
        page_mobile.goto("http://localhost:3000/explore", wait_until="networkidle")
        page_mobile.wait_for_timeout(1000)

        # Peek state
        print("Capturing Mobile Peek...")
        page_mobile.screenshot(path=os.path.join(ARTIFACT_DIR, "round3-mobile-peek.png"))

        # Half state (click draggable handle to cycle peek -> half)
        print("Capturing Mobile Half...")
        handle = page_mobile.locator('div[aria-label="Toggle drawer height"]')
        if handle.is_visible():
            handle.click()
        page_mobile.wait_for_timeout(500)
        page_mobile.screenshot(path=os.path.join(ARTIFACT_DIR, "round3-mobile-half.png"))

        # Full state (click draggable handle to cycle half -> full)
        print("Capturing Mobile Full...")
        if handle.is_visible():
            handle.click()
        page_mobile.wait_for_timeout(500)
        page_mobile.screenshot(path=os.path.join(ARTIFACT_DIR, "round3-mobile-full.png"))

        # Mobile Help
        print("Capturing Mobile Help...")
        page_mobile.goto("http://localhost:3000/explore?tab=help", wait_until="networkidle")
        page_mobile.wait_for_timeout(800)
        page_mobile.screenshot(path=os.path.join(ARTIFACT_DIR, "round3-mobile-help.png"))

        browser.close()
        print("\nAll Round 3 verification tests and screenshots completed successfully!")

if __name__ == "__main__":
    run_round3_tests()
