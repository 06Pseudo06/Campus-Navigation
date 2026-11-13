# CampusWay — Motion & Visual Upgrade Changelog

## Overview
This document outlines the architectural motion and editorial visual redesign applied to CampusWay on branch `demo/submission-mvp`. The design follows the specification **"Brutalist-editorial architecture meets warm sunset"** modeled after the target design reference `CampusWay — Navigate Further`.

---

## 1. Design System & Palette Tokens
- **Background:** Architectural paper/warm ivory `#F7F3EC` (`--bg-paper`).
- **Foreground / Ink:** Deep near-black `#111111` (`--text-ink`) and `#0E1118`.
- **Primary Accent:** Burnt orange / terracotta `#E8542F` (gradient `#F2793A` $\rightarrow$ `#E8542F` $\rightarrow$ `#C9411F`).
- **Muted / Secondary:** Warm gray `#5B5750`, hairlines `rgba(17, 17, 17, 0.12)`.
- **Surface Textures:**
  - 2.5% fixed film grain overlay (`.film-grain-overlay`).
  - Subtle architectural blueprint grid (~4% opacity).
  - Four-point star markers (`✦`) at section and rule intersections.

---

## 2. New Libraries & Motion Architecture
- **`lenis` (^1.3.27):** Smooth inertial scroll synchronized with the GSAP ticker.
- **`gsap` (^3.15.1) & `@gsap/react` (^2.1.2):** ScrollTrigger, timeline choreographies, entrance sequences, and parallax layers.
- **Respects `prefers-reduced-motion`:** Automatically disables inertial scroll, parallax, and heavy transforms for users requesting reduced motion.

---

## 3. Structural Sections Implemented

### Page Intro (`PageIntro.tsx`)
- Orchestrated entrance sequence displaying animated architectural arch SVG stroke.
- 00 $\rightarrow$ 100 counter over ~1.1 seconds with curved wipe-up exit.
- Caches completion in `sessionStorage` (`campusway_intro_played`) to prevent replaying on same-session navigations.

### Editorial Navbar (`EditorialNavbar.tsx`)
- Architectural arch logo with superscript `™` badge.
- Secondary descriptor: `UNIVERSITY / NAVIGATION SYSTEM`.
- Active burnt orange underline on `HOME` with hover transitions.
- Auto-hides on scroll-down, smoothly reveals on scroll-up with backdrop blur.

### Architectural Hero (`ArchitecturalHero.tsx`)
- Full-bleed brutalist concrete university building with high-resolution glowing sunset disc and concentric hairline arc.
- Soft depth-of-field foliage overlay at top-left and bottom-right edges.
- Bold display typography: `FIND YOUR PLACE. NAVIGATE FURTHER.`
- Primary magnetic button `EXPLORE CAMPUS ↗` and interactive `WATCH OVERVIEW` modal.
- Left vertical progress indicator (`01`, `02`, `03`) and bottom scroll indicator.
- Rotating circular SVG scroll badge with key statistics pill.

### Marquee & Metric Counters (`MarqueeSection.tsx`)
- Continuous velocity-reactive marquee running `DISCOVER ✦ NAVIGATE ✦ SAVE ✦ WAYFINDING ✦ CAMPUS`.
- 4 animated metric counters:
  - 48 Buildings Indexed
  - 1,957 Graph Vertices
  - 1.8ms Solver Latency
  - 0 Logins Required

### What You Can Do (`InteractiveFeaturesSection.tsx`)
- Clean 3-card editorial row partitioned by fine hairlines:
  - **01 Discover:** "Find buildings, departments and key facilities across campus." $\rightarrow$ `/explore`
  - **02 Navigate:** "Get the shortest, accessible walking routes in real time." $\rightarrow$ `/explore?tab=routes`
  - **03 Save:** "Keep your frequent destinations handy for quick access." $\rightarrow$ `/explore?tab=saved`
- Micro-interactions: Custom SVG icons, hover background tint, and corner accent indicators.

### Live Routing (`MapPreviewSection.tsx`)
- Warm cream background with bottom-left decorative architectural building facade.
- Headline: `REAL ROUTES. REAL CAMPUS.` with primary CTA `TRY THE LIVE MAP ↗`.
- Dark floating 3D map card (`#161922`):
  - Interactive route chips: `ML→PA`, `AR→AH`, `ME→RB`.
  - From / To dropdown selectors.
  - Duration, distance, and accessible route toggle button.
  - Isometric 3D quadrangle buildings with illuminated route polyline and pulsing traveling dot.
  - Fullscreen expansion toggle.
  - Step-by-step turn guidance drawer.

### How It Works (`HowItWorksSection.tsx`)
- Pinned horizontal scroll timeline detailing the 4 core steps: `SEARCH` $\rightarrow$ `ROUTE` $\rightarrow$ `WALK` $\rightarrow$ `SAVE`.
- Architectural line drawings and step metadata.

### Campus Architectural Atlas (`CampusGallerySection.tsx`)
- Staggered 3-column architectural photography grid.
- Hover zoom, monochrome-to-color shift, and full-screen lightbox modal with escape key support.

### Closing Call to Action (`ClosingCtaSection.tsx`)
- Dark dusk architectural colonnade background with slow parallax scrolling.
- Headline: `EVERY PLACE HAS A WAY. FIND YOURS TODAY.`
- Terracotta magnetic CTA button linking directly to `/explore`.

### Editorial Footer (`EditorialFooter.tsx`)
- Boxed editorial layout with hairline dividers and `✦` corner accents.
- Campusway dispatch email subscription input with feedback validation.
- Comprehensive platform taxonomy and navigation links.
- Giant cropped `CAMPUSWAY` wordmark with smooth back-to-top scroll anchor.

---

## 4. How to Swap Images or Tune Motion

### Swapping Images
- Hero building cutout: Replace `frontend/public/images/hero-curved-fullbleed.webp`.
- Gallery photographs: Place files in `frontend/public/images/` and update `GALLERY_ITEMS` array in `CampusGallerySection.tsx`.
- Dusk CTA background: Replace `frontend/public/images/arch-cta_bg.jpg`.

### Tuning Motion & Timings
- Open `frontend/src/lib/motion.ts` to adjust global durations and eases:
  - `durations.fast`, `durations.normal`, `durations.slow`.
  - `eases.editorial` (`cubic-bezier(0.22, 1, 0.36, 1)`).
- Hero parallax speed: Modify `scrub` and `y` offsets in `ArchitecturalHero.tsx` lines 125–140.
- Marquee speed: Adjust `baseSpeed` in `MarqueeSection.tsx`.
