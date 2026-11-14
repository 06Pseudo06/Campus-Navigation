# CampusWay — Motion & Visual Upgrade Changelog

## Overview
This document outlines the architectural motion and editorial visual redesign applied to CampusWay on branch `demo/submission-mvp`. The design follows the specification **"Brutalist-editorial architecture meets warm sunset"** modeled after the target design reference `CampusWay — Navigate Further`.

---

## Round 3: Explore (Map) Page Editorial Redesign (Completed)

### 1. Full Design Language Parity
- **Editorial Paper Theme:** Completely redesigned the front-end of the Explore page (`/explore`) from the old dark dashboard into the warm editorial architectural identity:
  - Base: Warm ivory/cream paper (`#F7F3EC`)
  - Typography: Near-black ink (`#111111`) with bold grotesk uppercase and italic sunset-orange (`#E8542F`) accent words
  - Accents: Terracotta/sunset orange (`#E8542F`), soft sage/teal river curves (`#A9C6C9`), and cream concrete building tones
  - Hairlines: Fine architectural gridlines, ✦ star annotations, and mono uppercase micro-labels
- **Full Viewport App Shell:** Configured full-viewport `100svh` layout with zero window scrolling and Lenis smooth scroll safely disabled on interactive elements (`data-lenis-prevent`).
- **Algorithm & Graph Preservation:** Retained 100% of underlying graph models, Dijkstra and A* pathfinding solvers, GPS waypoint coordinates, and API data contracts without modification.

### 2. Fixed Editorial Navbar & User Session Slot
- **Fixed App Navbar Mode (`EditorialNavbar.tsx`):** Added `isFixedApp` prop to freeze the navbar at 72px without hide-on-scroll behavior, highlighting `/explore` with an active orange underline.
- **Visitor User Chip (`ExploreUserMenu.tsx`):** Embedded an avatar chip in the navbar CTA slot (`[CE]` avatar, "Campus Explorer · Visitor") with a restyled dropdown for signing in, guest privileges, and session management.

### 3. Editorial Toolbar Row (`ExploreToolbar.tsx`)
- **Visual Composition:** 88px high toolbar featuring section label `CAMPUS ATLAS / LIVE GRAPH ———`, headline **"Explore Your *Campus.*"**, and a decorative architectural sun disc (~120px) positioned behind.
- **Global Search:** Pill search input with `/` keyboard focus shortcut and Esc clear behavior.
- **University Crest Chip:** Carleton University crest badge displaying live graph node count and `DEMO DATA` pill.

### 4. Collapsible Left Rail & Mobile Tab Bar (`ExploreRail.tsx`)
- **Expandable Icon Rail:** Desktop 72px collapsed rail that expands smoothly to 220px overlay on hover/focus without shifting adjacent grid or map elements.
- **Navigation Modes:** Four dedicated tabs (Explore, Predefined Routes, Bookmarked Places with live count badge, and Visitor Assistance).
- **Bottom Status:** Architectural mini-card (`✦ Navigate • Belong / Prototype • Phase 3`).
- **Mobile Bottom Navigation Bar (< 1024px):** Fixed 64px tab bar with 44px+ touch targets and active state indicators.

### 5. Architectural Light Map Card (`ExploreMapCard.tsx`)
- **Editorial Map Ground:** Light SVG canvas (`#F1ECE2`) with fine 4% architectural coordinate grid, Rideau River soft teal curves, and greenspace park washes.
- **Concrete Building Footprints:** 48 verified Carleton University buildings rendered as rounded concrete monoliths with mono codes and hover elevations.
- **Waypoint & Origin/Destination Pins:**
  - Origin (A): Forest-green pin with animated pulsing halo.
  - Destination (B): Sunset-orange pin with pulsing halo.
  - Shift-click node interaction to quickly reassign Origin.
- **Self-Drawing Route Path:** 5px sunset-orange active path enclosed in 9px cream casing with SVG dasharray draw-in animation.
- **Interactive Step Segment Highlighting:** Hovering any turn guidance step in the route panel dynamically illuminates the corresponding path segment on the map in warm gold (`#FFBF29`).
- **Map Controls & Popovers:**
  - Campus Masterplan dropdown popover with individual layer switches (Buildings, Surveyed Walkways, Inferred Connectors, Terrain).
  - Floating compass reset button and zoom in/out controls (+ / -).
  - Collapsible walkway connectivity legend with physical vs. inferred indicators.
  - Architectural scale bar (meters adaptive to zoom level) and north arrow.

### 6. Interactive Route & Destination Panel (`ExploreRoutePanel.tsx`)
- **Paper Panel Shell:** 400px desktop right card (`#FBF8F2`, `rounded-[28px]`, hairline border) with header `▬ PLAN A ROUTE / 01`, **"Where *to?*"**, and live API status pill.
- **Search & Filter Chips:** Fast destination filtering by name or code, with category filter pills (`All`, `Buildings`, `Landmarks`).
- **Connected Stepper:** Origin (A) and Destination (B) select dropdowns connected by a vertical dotted line, complete with a 180° animated swap button.
- **Destination Feature Card:** Architectural photo thumbnail, bookmark toggle with pop toast feedback, and verified pedestrian access point status.
- **Solver Engine Selector:** Segmented toggle between Dijkstra and A* (Heuristic) solvers.
- **Primary CTA:** Magnetic orange calculate button with loading spinner and topology fallback state.
- **Auto-Scrolling Route Summary Card:** Smoothly scrolls into view upon calculation, featuring large walking time and distance numerals, accessible badges, latency metrics, and turn-by-turn guidance list.
- **Destinations Listing:** 48-location scrollable directory with mono category tags.

### 7. Integrated Sub-Views
- **Predefined Routes (`ExploreRoutesView.tsx`):** Curated high-traffic corridors (Central Quad, Research Artery, Engineering Corridor) with verified distance, walking time, and one-click execution.
- **Saved Places (`ExploreSavedView.tsx`):** Personal atlas displaying bookmarked locations with guest local storage sync, one-click navigate button, and ✦ empty state.
- **Visitor Assistance (`ExploreHelpView.tsx`):** Assistance request dispatch form (escort, directions, access), emergency contact directory, and keyboard navigation cheatsheet.

### 8. Tablet & Mobile Bottom Sheet Drawer (< 1024px)
- **Three-Stage Gesture Drawer:** Fluid snap heights: peek (112px), half (55svh), and full (90svh) with draggable pill handle.
- **Touch-Optimized:** Full access to route calculation, destination search, and turn guidance on mobile devices.

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
