# CampusWay — Motion & Visual Upgrade Changelog

## Overview
This document outlines the architectural motion and editorial visual redesign applied to CampusWay on branch `demo/submission-mvp`. The design follows the specification **"Brutalist-editorial architecture meets warm sunset"** modeled after the target design reference `CampusWay — Navigate Further`.

---

## Round 2: Polish & Bug-Fix Pass (Completed)

### 1. Section Numbering & Global Side Timeline Index
- **Unified Section Numbering:** Labeled consistently across all badges, chips, headings, and the side index:
  - `01 / HERO`
  - `02 / WHAT YOU CAN DO`
  - `03 / REAL ROUTES • LIVE MAP`
  - `04 / HOW IT WORKS • FOUR STEPS`
  - `05 / CAMPUS ARCHITECTURAL ATLAS`
  - `06 / START EXPLORING`
  - Unnumbered Editorial Footer
- **Single Global Timeline (`ScrollProgress.tsx`):**
  - Left vertical timeline index (`hidden lg:flex`) pinned at `left: clamp(16px, 2.2vw, 40px); top: 50%; transform: translateY(-50%)`.
  - Removed duplicate hero-local side navigation (`sideNavRef`) to eliminate numbering and collision conflicts.
  - Interactive smooth scrolling via `lenis.scrollTo(el, { duration: 1.4, offset: -80 })`.
  - Hover slide-out pill with section name (`HERO`, `CAPABILITIES`, `LIVE ROUTES`, `HOW IT WORKS`, `GALLERY`, `START`).
  - High-contrast color adaptation on dark sections (`06`) via `isDark` detection.
  - Added `.section-gutter` utility class (`padding-left: clamp(56px, 6vw, 96px)` on $\ge 1024$px) ensuring zero overlap between the left side index and section content.

### 2. Section 01: Architectural Hero Refinements
- **Foliage Integration:** Top-left foliage element masked using soft radial/linear CSS gradients with `mix-blend-mode: multiply` and slow organic sway rotation (`±1.5°`, 10s, yoyo), eliminating hard rectangular cut edges.
- **Symmetrical Scrubbed Headline Fade:** Single reversible timeline scrubbed against hero scroll (`start: "top top", end: "bottom 35%", scrub: 0.6`).
  - Progress 0.00 – 0.35: 100% opaque and locked in place.
  - Progress 0.35 – 1.00: Translates upward by 8% and fades out in a staggered, reversible sequence.
- **Scroll Badge & Bottom Stats Relocation:**
  - Rotating circular badge repositioned to `right: clamp(24px, 4vw, 64px); bottom: clamp(88px, 12svh, 140px);` (92px).
  - Bottom stats row ("48 CAMPUS BUILDINGS • 1,957 VERTICES • ZERO LOGIN REQUIRED") placed at bottom-left beside "SCROLL TO EXPLORE".
  - ScrollTrigger timeline fades out both badge and bottom stats synchronously at 10% page scroll to prevent collision.

### 3. Marquee & Metric Counters
- **Scaled Marquee Typography:** Font size reduced to `clamp(1.75rem, 3.4vw, 3.25rem)` with vertical padding `clamp(14px, 2vw, 28px)`.
- **Velocity Dynamics:** Base velocity slowed by ~25% (0.75) with scroll acceleration capped at 3.0.
- **Centered 4-Column Stats Grid:** Re-aligned to a clean 4-column desktop layout (2x2 under 768px) with `tabular-nums` formatting.
- **ScrollTrigger Number Count-Up:** Fires when scrolled into view (`start: "top 85%"`), animates values over 1.6s with `power2.out`, replays on `onEnter`/`onEnterBack`, and resets on `onLeave`/`onLeaveBack`.

### 4. Section 03: Real Routes • Live Map
- **Eliminated Glitchy Bottom Cutout:** Deleted the awkward rotated cutout at `-bottom-10 -left-10` that bled across section boundaries.
- **Framed Concourse Elevation:** Framed architectural concourse photograph positioned directly above the heading with mono caption `CAMPUS_QUAD // ARCHITECTURAL ELEVATION • LAT 45.3850° N`.
- **Padding Polish:** Maintained clean ivory background spacing above Section 04.

### 5. Section 04: How It Works (Four Steps)
- **Real Architectural Photography:** Replaced all wireframe placeholder sketches with 4 real architectural photographs (`274ded96...jpg`, `arch-navigate.jpg`, `arch-real_campus.jpg`, `arch-save.jpg`).
- **Horizontal Scroll Pinning Fix:** Set pinning distance proportional to panel count (`end: () => "+=" + Math.round(window.innerHeight * 3.8) + "px"`), soft snapping (`snapTo: 1/3`), `pinSpacing: true`, and added a `pb-[12vh]` bottom breathing cushion.

### 6. Section 05: Campus Architectural Atlas
- **12-Column Dense Masonry Collage Grid:** Integrated `src/data/gallery.ts` containing 12 real architectural plates.
  - Row Group A, B, and C arranged mathematically with zero holes or gaps.
  - Corner radius: `rounded-[20px]`.
  - Warm duotone transition with hairline border.
  - Mono plate stamps (`01 / CONCRETE FORMWORK`), era years, and hover button (`↗`).
  - Warm terracotta offset backing blocks behind plates 1, 5, and 10.
  - Architectural portal arch silhouette on plate 7.
- **Keyboard-Navigable Lightbox Modal:** Full-screen modal supporting Escape to close, ArrowLeft for previous plate, ArrowRight for next plate, and counter display (`[03 / 12]`).

### 7. Section 06: Start Exploring (Closing CTA)
- **Renumbered:** Updated tag chip to `06 / START EXPLORING`.
- **Decoupled Badge Placement:** Moved rotating circular badge to bottom-right (`right: 6%; bottom: 8%;` size 160px, opacity 0.40) completely out of the headline and button bounds.
- **Strict Layer Stack:** `z-0` photo backdrop, `z-1` dark vignette gradient, `z-2` badge, `z-10` content.
- **Dynamic Navbar Theme Inversion:** Registered `section-06` as `isDark: true` in `SectionContext`, automatically switching the navbar to translucent dark mode (`bg-[#0E1118]/92` with light typography) with a 250ms transition.

### 8. Editorial Footer
- **Edge-to-Edge SVG Watermark:** Replaced font-clipped wordmark with an inline SVG `<text>` watermark (`viewBox="0 0 1400 170"`, `fontSize="172px"`, `opacity="0.08"`).
- **Responsive & Unclipped:** Scales responsively with zero letter clipping on 1920px, 1440px, 1280px, 768px, and 390px viewports.
- **Rising Reveal:** ScrollTrigger animates subtle vertical entry as user reaches page bottom.

### 9. Stability & Cross-Viewport Validation
- **Hydration & Console Errors:** Resolved `CustomCursor` client-only hydration branch and safe node checking (`target instanceof Element`), ensuring zero console errors and zero Next.js dev overlay issues.
- **Automated Playwright Suite:** Executed full bidirectional scroll testing (top $\rightarrow$ bottom, bottom $\rightarrow$ top, jump to middle and scroll both ways) and captured 19 verification screenshots across 1440x900, 390x844, 1920x1080, and 1280x720 viewports.

---

## Round 1: Core Motion & Architecture (Previous Milestone)
*(Refer to git history on `demo/submission-mvp` for Round 1 foundational work)*
