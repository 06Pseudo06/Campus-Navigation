# CampusWay — Motion & Visual Upgrade Changelog

## Overview
This document outlines the architectural motion and editorial visual redesign applied to CampusWay on branch `demo/submission-mvp`. The design follows the specification **"Brutalist-editorial architecture meets warm sunset"** modeled after the target design reference `CampusWay — Navigate Further`.

---

## Round 4: Final Polish, Full-Stack Auth, Editorial About, Curated Atlas & Error Boundaries

### 1. Explore Page Palette Tuning & Visual Bug Fixes (Workstream A)
- **Ink Navy Depth:** Dark surfaces refined from flat black to deep ink-navy (`#0F141F` to `#151B28`) with high-contrast `#B4BCCB` muted labels and pure white tabular metrics.
- **Floating Rounded Left Rail:** Upgraded rail container to a floating rounded card (`rounded-[22px]`), featuring soft 8% background map scrim upon expansion and smooth icon transitions.
- **Constant Screen-Size Node Chips:** Node labels wrapped in dynamic inverse zoom scaling (`transform: scale(1 / zoom)`), maintaining uniform 11px sans-semibold readability across all zoom levels without shrinking into microscopic dots or ballooning.
- **Route Midpoint Pill Ordering:** Positioned the active route midpoint chip (`133.9 m · ~1.7 min`) strictly after building nodes in SVG render hierarchy, guaranteeing top z-order stacking with permanent readability.
- **Sun Disc Boundary Cleanup:** Positioned clean 130px cropped radial sun disc behind the university selector chip, eliminating rectangular overflow clipping.
- **Scrollbar Elimination:** Enforced `overflow-x-clip` and `h-[100svh]` root layout, permanently eradicating unintended horizontal and vertical page scrollbars across desktop and mobile browsers.

### 2. Compact Destination List & Turn-by-Turn Humanization (Workstream B)
- **Compact 48-Destination Rows:** Reduced destination rows to compact 44px single-line tiles (`h-11`) with 36px monogram icons, 13px semibold names, category suffixes, and hover bookmark / route-to affordances.
- **Initial 6-Row View:** Defaults to the first 6 destinations sorted by selection and alphabetical order, with an animated "Show all 48 destinations ↓" / "Show less ↑" expander.
- **Turn-by-Turn Step Expander:** Long turn lists (e.g., 44 navigation steps) now collapse into an initial 4-step preview with an interactive "Show all steps ↓" toggle inside the `#0F141F` result card.
- **Humanized Guidance Strings:** Replaced internal synthetic edge names (such as `inferred_access` or raw coordinates) with natural campus phrases (e.g., `inferred connector`, `pedestrian concourse`), spaced metric distances (`0.9 m`), and synthetic connector indicator badges.

### 3. Routes View Photographic Headers & Route SVGs (Workstream C)
- **High-Resolution Architectural Headers:** Integrated three 2752×1536 photographic route headers:
  - `01_graph_solver.png` for MacOdrum Library (ML) → Paterson Hall (PA)
  - `02_step_free_paths.png` for ARISE Complex (AR) → Architecture Building (AH)
  - `03_instant_access.png` for Mackenzie Complex (ME) → River Building (RB)
- **Route Preview Polyline Chips:** Added floating SVG route preview overlays at the bottom-left of each photographic card, displaying an active orange path, start/end node markers, and verified wayfinding status.
- **Micro-Interactions:** Implemented subtle hover lift (`-translate-y-0.5`) and smooth 1.05x image scale transitions.

### 4. Editorial Architecture & About Page Rebuild (Workstream D)
- **Design Parity:** Rebuilt `/about` from scratch in the warm editorial paper theme (`#F7F3EC`), grotesque display headlines, and burnt orange accents.
- **Interactive Counters:** Key numbers section featuring live telemetry counters (48 Buildings, 12 Accessible Corridors, 0.4s Graph Solver, 100% Zero-Login).
- **Self-Drawing SVG Flowchart:** Created an animated graph flow diagram demonstrating graph traversal: Location Pin → Spatial R-Tree Index → Dijkstra / A* Solver → Turn-by-Turn Directions, accompanied by a technical Dijkstra vs A* algorithmic breakdown.
- **Full Architecture Stack Grid:** 10-card modular breakdown detailing Next.js 15, FastAPI, NetworkX, PostgreSQL, PostGIS, Tailwind CSS, GSAP, Lenis, and Docker.
- **Lead Developer Attribution:** Created `content/developer.ts` and integrated a developer profile card honoring Kalyani Mahajan (Full-Stack Architecture & Design Lead).
- **Academic & Open-Source Credits:** Complete OpenStreetMap (ODbL) and Carleton University demonstration dataset disclaimers.

### 5. Full-Stack Authentication Architecture (Workstream E)
- **Zero-Login First Principle:** Guest exploration remains 100% accessible with no login walls. Guest bookmarks stored in `localStorage` seamlessly synchronize into PostgreSQL upon user authentication.
- **Auth Inventory & Setup Docs:** Published `docs/auth-inventory.md` and `docs/auth-setup.md` documenting credential management, database schemas, and migration steps.
- **Next.js API Rewrites:** Configured `next.config.ts` rewrites routing `/api/:path*` and `/auth/:path*` directly to FastAPI on `127.0.0.1:8000`, enabling first-party cookie transmission without cross-origin blocking.
- **Split-Screen Layout (`AuthSplitLayout.tsx`):** Shared responsive split-screen with paper form left, and dark architectural elevation right featuring mouse-responsive parallax, sunset disc, rotating badge, and ✦ benefit markers.
- **Split-Screen Sign In (`/login`):** Features Google OAuth CTA (52px), sliding Email | Phone OTP tabs, 6-box OTP entry, remember-me checkbox, and prominent "Continue as guest →" button.
- **3-Step Sign Up Wizard (`/signup`):** Step 1 (Details & Live 4-bar Password Strength Meter) → Step 2 (6-digit Email Verification Simulation) → Step 3 (Welcome & Home Building Selector).
- **Password Recovery & Reset (`/forgot-password` & `/reset-password`):** Secure token dispatch flow, strength meter scoring, and match validation.
- **Legal Architecture (`/privacy` & `/terms`):** Full editorial privacy policy and terms of service emphasizing local storage and data minimization.

### 6. Section 05: Campus Architectural Atlas Rebuild (Workstream F)
- **Strict 6-Plate Composition:** Reduced the masonry clutter to exactly 6 high-impact architectural plates (`src/data/gallery.ts` & `CampusGallerySection.tsx`).
- **Justified 12-Column Grid:** Structured as two complementary rows:
  - Row 1: 5 cols (Cantilever) + 4 cols (Arcade) + 3 cols (River Atrium) = 12 columns.
  - Row 2: 3 cols (Covered Loggia) + 4 cols (Illuminated Portal) + 5 cols (Concourse Artery) = 12 columns.
- **Zero Blank Space:** Both rows mathematically span 100% container width with uniform 380px heights, corner plate stamps (`01 / CONCRETE FORMWORK`), year tags, and terracotta offset blocks.
- **Interactive Lightbox:** Modal navigation supporting next/previous arrows, keyboard shortcuts (`ArrowLeft`, `ArrowRight`, `Escape`), and image counter (`[01 / 06]`).

### 7. Global Resilience & Unified Navigation (Workstream G)
- **Unified Navigation (`EditorialNavbar.tsx`):** Dynamic session status across all pages (`/`, `/explore`, `/about`, `/login`, `/signup`, 404) with `useAuth()` hook.
- **Unified Footer (`EditorialFooter.tsx`):** Consistent architectural typography, active links, campus status badge, and copyright notices.
- **Editorial 404 (`not-found.tsx`):** Broken corridor visualization with animated concentric rings and quick return buttons.
- **Runtime Error Boundary (`error.tsx`):** Friendly error catch with diagnostic digest and one-click view recovery.
- **Asset Attribution (`IMAGE_CREDITS.md`):** Complete inventory of all visual assets and architectural photography.

---

---

## Round 3 (Pass 2): Fixes, Colour Overhaul & Polish ("Concrete, Ink & Sunset")

### 1. Colour Overhaul — Concrete, Ink & Sunset (60/30/10 Rule)
- **Ambient Canvas Ground:** Replaced flat beige with `--app-bg` (`#EFEDE8`) featuring two soft ambient radial glows (sunset orange `rgba(232,84,47,0.10)` at top-right and deep teal `rgba(15,110,115,0.07)` at bottom-left) to give the application atmosphere and depth.
- **Card Surfaces:** White cards (`#FFFFFF`) with 20px radius and crisp `#E1DDD3` borders that lift cleanly off the canvas.
- **Deep Ink Anchors:** Converted the left navigation rail, bottom stats strip, and route result card to deep ink-900 (`#0E1118`) with white/10 borders, creating strong visual contrast and anchor points.
- **Sunset Accents:** High-impact sunset orange (`#E8542F`) reserved for active tiles, primary CTAs, active route polylines, and grotesk italic accent words.
- **Removed Giant Beige Wrapper:** Eliminated the monolithic beige wrapper around Routes, Saved, and Help views, rendering white cards directly on `--app-bg`.

### 2. Custom Cursor Precision Engine (`CustomCursor.tsx`)
- **Strict Size Hierarchy:** Default 22px ring (1.5px border, 4px dot); shrinks to 10px solid orange dot over buttons/links/controls/map controls (`[role=button]`, `data-cursor="ui"`, `summary`); hides completely over text inputs (`input, textarea, select, [contenteditable]`); 36px ring over map surface with 9px mono `DRAG` label (shrinks to 28px while dragging); 10px muted grey dot over disabled controls.
- **Innermost-First Resolution:** Resolves interactive children before map container, preventing outer `data-cursor="map"` from swallowing button/input cursor states.
- **Eliminated Stray Dots:** Permanently eliminated perceived stray orange dots (caused by old 40px cursor rendering at automated click coordinates).

### 3. Map Overlay Controls & Canvas Refinements (`ExploreMapCard.tsx`)
- **4px Drag Deadzone Threshold:** Added `Math.hypot(dx, dy) >= 4` threshold to pan gesture handler so normal mouse clicks on overlay controls are never captured as drags.
- **Click Propagation Isolation:** Map controls (+, −, compass, Masterplan pill, legend) stop pointer event propagation.
- **Collapsible Legend:** Defaulted to compact `Legend ›` pill at bottom-left to maximize map visible area.
- **Dynamic Route Framing:** Smoothly computes bounding box of active route upon calculation and automatically fits zoom and pan to frame the path.
- **Route Midpoint Pill:** Added dark ink midpoint pill (`133.9 m · ~1.7 min`) with orange border along the active path.
- **Terrain & River Geometry:** Rendered smooth diagonal Rideau river with Bézier banks (`#78B3C2`, edge `#5E9BAC`) and organic park shapes (`#CFE2BC`) with scattered tree clusters.
- **Node Collision Avoidance:** Collision detection algorithm prioritizing selected, origin, and landmark node chips at default zoom.

### 4. Route Panel Restructure & Fixed Bottom Docking (`ExploreRoutePanel.tsx`)
- **Strict Scroll & Dock Architecture:** Scroller container (`flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; slim-scrollbar`) containing header, search, category pills, stepper, destination card, result card, and 48 destinations.
- **Docked Bottom Bar:** Fixed bar (`flex: none;`) permanently holding the Dijkstra / A* solver engine segmented control and Calculate CTA button.
- **Smooth Auto-Scroll to Result:** After route calculation, smoothly scrolls the panel scroller to the result card (`scrollerRef.current.scrollTo(...)`).
- **Recent Searches & Nudge Pill:** Displays recent searches chips from `localStorage` and a bouncing "Destinations ↓" nudge pill.
- **Deep Ink Result Card:** Focal `#0E1118` route summary card with large walking time and distance numerals, accessible badges, share link copy, and solver comparison.

### 5. Contextual Toolbar Headline (`ExploreToolbar.tsx`)
- **Per-Tab Dynamic Headline:** Contextual H1 with bold grotesk uppercase and italic orange accent words ("Explore Your *Campus.*", "Curated *Corridors.*", "Your *Places.*", "Here to *Help.*") with mask-up animation.
- **Intentional Sun Disc:** 130px cropped gradient sun disc with concentric arc.
- **Single Focus Ring:** Clean 2px border with soft 6px orange glow (`.focus-ring-orange`).
- **Mobile Responsive:** Scaled typography and compact university chip on small screens.

### 6. Sub-View Layout Refinements
- **Help View (`ExploreHelpView.tsx`):** Balanced 7fr:5fr Row 1 grid with equal card heights and flexing textarea; full-width Row 2 keyboard shortcuts card evenly split across 2 columns.
- **Routes View (`ExploreRoutesView.tsx`):** Filter pills (All, Accessible, Under 5 min), mini SVG polyline previews, and full-width "Plan a custom route →" card.
- **Saved View (`ExploreSavedView.tsx`):** Centered empty state card with `✦` and white destination cards on `--app-bg` with live bookmark synchronization.

### 7. Verification & Automated Testing
- **Playwright Test Suite (`capture_round3_verification.py`):** Verified map controls (+, −, compass, legend), panel wheel scroll, route result auto-scroll, custom cursor states (button, input, map), and captured cross-viewport screenshots at 1440×900, 1920×1080, 1280×720, and 390×844.
- **Type-Check & Lint:** Zero TypeScript errors (`tsc --noEmit`) and zero ESLint errors/warnings (`next/core-web-vitals`).

---

## Round 3: Explore (Map) Page Editorial Redesign (Initial)

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
