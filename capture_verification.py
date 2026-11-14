import time
import os
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\KK\.gemini\antigravity\brain\fb7f0586-9047-471d-9f4b-f0c1235789b6"

def run_tests():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(channel="chrome", headless=True)

        # ---------------------------------------------------------
        # TEST 1: 1440x900 Desktop Viewport (Full Scroll & Verification)
        # ---------------------------------------------------------
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("Navigating to http://localhost:3000 at 1440x900...")
        page.goto("http://localhost:3000", wait_until="networkidle")

        # Wait for PageIntro to finish or dismiss
        page.wait_for_timeout(2000)

        # Ensure ScrollTrigger is refreshed
        page.evaluate("""() => {
            if (window.ScrollTrigger) {
                window.ScrollTrigger.refresh();
            }
        }""")
        page.wait_for_timeout(500)

        # 1. Hero 0%
        print("Capturing Hero 0%...")
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(600)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "hero-00.png"))

        # 2. Hero 30%
        print("Capturing Hero 30%...")
        page.evaluate("window.scrollTo(0, 300)")
        page.wait_for_timeout(600)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "hero-30.png"))

        # 3. Hero 60%
        print("Capturing Hero 60%...")
        page.evaluate("window.scrollTo(0, 600)")
        page.wait_for_timeout(600)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "hero-60.png"))

        # 4. Marquee + Stats
        print("Capturing Marquee + Stats...")
        page.evaluate("""() => {
            const el = document.getElementById('section-02');
            if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
            window.scrollBy(0, -500);
        }""")
        page.wait_for_timeout(800)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "marquee-stats.png"))

        # 5. Section 03 Bottom
        print("Capturing Section 03 bottom...")
        page.evaluate("""() => {
            const el = document.getElementById('section-03');
            if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
        }""")
        page.wait_for_timeout(800)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "sec03-bottom.png"))

        # 6. Section 04: Four Steps
        print("Capturing Section 04 Steps 1-4...")
        sec4_box = page.locator("#section-04").bounding_box()
        # Scroll to section 4 top
        page.evaluate("""() => {
            const el = document.getElementById('section-04');
            if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        }""")
        page.wait_for_timeout(600)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "sec04-step1.png"))

        # Step 2
        page.evaluate("window.scrollBy(0, 800)")
        page.wait_for_timeout(600)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "sec04-step2.png"))

        # Step 3
        page.evaluate("window.scrollBy(0, 800)")
        page.wait_for_timeout(600)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "sec04-step3.png"))

        # Step 4
        page.evaluate("window.scrollBy(0, 800)")
        page.wait_for_timeout(600)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "sec04-step4.png"))

        # 7. Section 05: Gallery
        print("Capturing Section 05 Gallery...")
        page.evaluate("""() => {
            const el = document.getElementById('section-05');
            if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        }""")
        page.wait_for_timeout(800)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "sec05-gallery.png"))

        # 8. Section 06: CTA
        print("Capturing Section 06 CTA...")
        page.evaluate("""() => {
            const el = document.getElementById('section-06');
            if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        }""")
        page.wait_for_timeout(800)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "sec06-cta.png"))

        # 9. Footer End
        print("Capturing Footer End...")
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(800)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "footer-end.png"))

        # Test bidirectional scroll: scroll bottom to top
        print("Testing scroll bottom to top...")
        page.evaluate("""() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }""")
        page.wait_for_timeout(1500)

        # Test jump to middle and scroll both ways
        print("Testing jump to middle and scroll both ways...")
        page.evaluate("""() => {
            window.scrollTo(0, document.body.scrollHeight / 2);
        }""")
        page.wait_for_timeout(800)
        page.evaluate("window.scrollBy(0, -300)")
        page.wait_for_timeout(500)
        page.evaluate("window.scrollBy(0, 600)")
        page.wait_for_timeout(500)

        context.close()

        # ---------------------------------------------------------
        # TEST 2: 390x844 Mobile Viewport
        # ---------------------------------------------------------
        print("Testing 390x844 Mobile Viewport...")
        mobile_ctx = browser.new_context(
            viewport={"width": 390, "height": 844},
            is_mobile=True,
            has_touch=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
        )
        m_page = mobile_ctx.new_page()
        m_page.goto("http://localhost:3000", wait_until="networkidle")
        m_page.wait_for_timeout(2000)

        # Hero Mobile
        print("Capturing mobile hero...")
        m_page.evaluate("window.scrollTo(0, 0)")
        m_page.wait_for_timeout(500)
        m_page.screenshot(path=os.path.join(ARTIFACT_DIR, "mobile-hero.png"))

        # Section 05 Mobile
        print("Capturing mobile section 05...")
        m_page.evaluate("""() => {
            const el = document.getElementById('section-05');
            if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        }""")
        m_page.wait_for_timeout(800)
        m_page.screenshot(path=os.path.join(ARTIFACT_DIR, "mobile-sec05.png"))

        # Footer Mobile
        print("Capturing mobile footer...")
        m_page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        m_page.wait_for_timeout(800)
        m_page.screenshot(path=os.path.join(ARTIFACT_DIR, "mobile-footer.png"))

        mobile_ctx.close()

        # ---------------------------------------------------------
        # TEST 3: 1920x1080 Wide Desktop
        # ---------------------------------------------------------
        print("Testing 1920x1080 Viewport...")
        wide_ctx = browser.new_context(viewport={"width": 1920, "height": 1080})
        w_page = wide_ctx.new_page()
        w_page.goto("http://localhost:3000", wait_until="networkidle")
        w_page.wait_for_timeout(2000)

        w_page.screenshot(path=os.path.join(ARTIFACT_DIR, "hero-1920.png"))
        w_page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        w_page.wait_for_timeout(800)
        w_page.screenshot(path=os.path.join(ARTIFACT_DIR, "footer-1920.png"))
        wide_ctx.close()

        # ---------------------------------------------------------
        # TEST 4: 1280x720 Laptop Viewport
        # ---------------------------------------------------------
        print("Testing 1280x720 Viewport...")
        laptop_ctx = browser.new_context(viewport={"width": 1280, "height": 720})
        l_page = laptop_ctx.new_page()
        l_page.goto("http://localhost:3000", wait_until="networkidle")
        l_page.wait_for_timeout(2000)

        l_page.screenshot(path=os.path.join(ARTIFACT_DIR, "hero-1280.png"))
        l_page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        l_page.wait_for_timeout(800)
        l_page.screenshot(path=os.path.join(ARTIFACT_DIR, "footer-1280.png"))
        laptop_ctx.close()

        browser.close()
        print("All visual tests and screenshots completed successfully!")

if __name__ == "__main__":
    run_tests()
