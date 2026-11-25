# Pull Request: CampusWay UI Regressions & Motion Stabilization

**Base branch**: `feature/map-gps-qr`  
**Compare branch**: `fix/ui-regressions`  
**Direct PR Link**: [Compare & Open PR on GitHub](https://github.com/06Pseudo06/Campus-Navigation/compare/feature/map-gps-qr...fix/ui-regressions?expand=1)  
**Status**: Ready for Review & Testing (**Do NOT merge to `main` until approved**)

---

## 1. Executive Summary

This pull request resolves five critical UI regressions, visual artifacts, and animation conflicts in CampusWay on the `fix/ui-regressions` branch. The fixes eliminate animation judder, clip boundary bleed, synchronize section reveals directly with user scroll progression, restore full class-based Light/Dark semantic theming under Tailwind CSS v4, and align the campus safety directory with ground-truth verification standards.

All gate checks (ESLint, TypeScript `tsc --noEmit`, 84 Vitest unit tests, 20/20 Next.js static prerendered routes, and Playwright end-to-end smoke tests) pass with zero errors.

---

## 2. Five-Stage Technical Resolution Breakdown

### Stage 1: Stabilise Hero Orange Disc
- **Commit**: `e950e28` — `fix(hero): stabilise sphere animation with layered transforms`
- **Symptom**: The luminous orange sunset sphere/disc glitched and jumped when users scrolled down past the hero and back up.
- **Root Cause**: Multiple simultaneous animations competed to write to the same element's inline `transform` property:
  1. GSAP preloader intro scale/blur tween (`scale: 0.6 -> 1`, `filter: blur(20px) -> blur(0px)`)
  2. Idle mouse parallax (`gsap.quickTo` writing `translate3d(x, y, 0)`)
  3. Idle breathing animation (`gsap.to` yoyo scaling `1 <-> 1.03`)
  4. ScrollTrigger scroll-out scrub (`gsap.to` scaling to `1.1`)
  During scroll reversal, the scrubbed tween and idle loops overwrote each other's transform matrices, producing violent jumps.
- **Remedy**:
  1. **Nested Layered Architecture**: Split the disc into three isolated DOM layers where each effect strictly owns one element:
     - **Outer Layer** (`#hero-sun-disc-scroll-layer`): Owns *only* the ScrollTrigger scroll-out scrub (`scale 1 -> 1.1`).
     - **Middle Layer** (`#hero-sun-disc-parallax-layer`): Owns *only* mouse parallax (`translate x, y ±15px`).
     - **Inner Layer** (`#hero-sun-disc-breathing-layer`): Owns *only* smooth breathing scale (`scale3d(1,1,1)` to `scale3d(1.03,1.03,1)`) implemented as a pure CSS keyframe animation (`@keyframes heroDiscBreathe`), completely removed from the GSAP ticker.
     - **Innermost Element** (`#hero-sun-disc`): Holds the SVG gradient sphere, orbit ring, and sparkle crosshair.
  2. **Intro Cleanup (`clearProps`)**: On intro completion or skip, all targets clear lingering properties via `clearProps: "filter,transform"`, ensuring no inline blur or transform remains.
  3. **Deterministic Scroll Scrub & Breathing Pause**: A single unified ScrollTrigger drives the scrub (`fromTo`, `immediateRender: false`, `scrub: 0.4`, `invalidateOnRefresh: true`). When scroll progress exceeds 0.5%, `.hero-breathing-paused` is toggled so the breathing scale does not compound with scroll scaling.
  4. **GPU Composition & Offscreen Culling**: Added `contain: layout paint` and `backface-visibility: hidden` to the container. An `IntersectionObserver` dynamically sets `will-change: auto` and pauses breathing when the hero scrolls out of view.

---

### Stage 2: Clip Hero Image and Consolidate Meta Row
- **Commit**: `dc990c9` — `fix(hero): clip hero image and consolidate meta row`
- **Symptom**: A visible horizontal seam or strip appeared between the hero section and the marquee, caused by image overflow during parallax translation and competing elevation tags.
- **Root Cause**: The hero container had `overflow: visible` and bottom padding (`pb-8 lg:pb-12`), while the curved building image was positioned at `bottom: 0`. Negative y-translation from mouse parallax (`±8px`) and scroll-out scrub (`-15% yPercent`) pulled the building's bottom edge upward, exposing empty background space. Floating elevation tags ("LPU CAMPUS • DATASET C VERIFIED") duplicated information from the bottom bar.
- **Remedy**:
  1. **Clean Image Clipping**: Configured the hero `<section id="section-01">` with `overflow-hidden [overflow:clip]`, `pb-0`, and a crisp 1px boundary (`border-b border-[#0E1118]/10 dark:border-white/10`) to eliminate unintended gaps to the marquee.
  2. **Oversized Parallax Bleed**: Oversized the building image wrapper by 5% bleed (`-bottom-[5%]`, `h-[clamp(440px,88svh,940px)]`), guaranteeing that parallax translation never exposes the bottom or right image boundaries.
  3. **Consolidated Single-Line Bottom Bar**: Replaced multiple disconnected rows and floating tags with one coherent bottom bar on a subtle 48px gradient scrim (`from-[#F6F4EF]/60 to-transparent dark:from-[#070B14]/60 dark:to-transparent`):
     `LIVE SATELLITE SYNC · DATASET C VERIFIED · LPU CAMPUS`
     alongside the animated scroll indicator and campus coordinates.

---

### Stage 3: Scroll-Scrubbed Feature Cards & Stats Reveal
- **Commit**: `6f83d3e` — `feat(motion): scroll-scrubbed card reveals`
- **Symptom**: Feature cards and stats strip entered using generic time-based delays or popped in all at once, disconnected from the user's actual scroll velocity.
- **Root Cause**: Animations relied on one-shot timer delays (`delay: 1.3s`) triggered upon entering the viewport, rather than tying motion progress directly to scroll distance.
- **Remedy**:
  1. **Reusable `useScrollReveal` Hook (`motion.ts`)**: Built a generic hook orchestrating scroll-scrubbed entrance animations with GSAP ScrollTrigger:
     - `scrub: 0.8`
     - Desktop start/end: `"top 88%"` to `"top 48%"`
     - Card offsets: sequential offsets at 0%, 8%, and 16% through the scroll interval
     - Internal elements: Staggered animation of icon tile, title, body description, and CTA link via `data-reveal-child` tags
  2. **Scroll-Scrubbed Stats Strip**:
     - Top accent line draws left-to-right from 0% to 30% of scroll.
     - Vertical dividers fade in with scale from 5% to 30%.
     - Odometer rolling digit strips, suffixes, and labels enter staggered across the 4 metrics.
  3. **Mobile-Specific Triggers (<768px)**: When cards and stats stack vertically, individual ScrollTriggers (`start: "top 90%", end: "top 60%"`) drive each card independently.
  4. **Reduced Motion Guard**: Instantly sets resting state transforms and full opacity when `prefers-reduced-motion` is active.

---

### Stage 4: Light Theme & Semantic Tokens Recovery
- **Commit**: `931d6f7` — `fix(theme): working light/dark/system theme with complete tokens`
- **Symptom**: Toggling the theme in the topbar between Light, Dark, and System either had no effect or left backgrounds and text permanently dark.
- **Root Cause**: Tailwind CSS v4 defaults the `dark:` variant to `@media (prefers-color-scheme: dark)`. Because no class-based custom variant was configured, toggling `.dark` on `document.documentElement` was ignored by Tailwind's compiled CSS whenever the operating system preferred dark mode. Furthermore, several pages (`/navigate`, `/admin/qr`) had hardcoded dark hexes (`bg-[#070B14]`, `text-white`).
- **Remedy**:
  1. **Tailwind v4 Class-Based Variant**: Added `@custom-variant dark (&:where(.dark, [data-theme="dark"], .dark *, [data-theme="dark"] *));` to `globals.css`, immediately synchronizing all `dark:*` Tailwind classes with the root class.
  2. **Complete Semantic Token System**:
     - **Light**: Warm off-white background (`#F6F4EF`), dark charcoal text (`#111318`), muted text (`#5C5F68`), elevated surface (`#FFFFFF`), warm borders (`rgba(17, 19, 24, 0.12)`), and vermilion accent (`#E8452C`).
     - **Dark**: Deep architectural navy (`#070B14`), crisp light text (`#F4F6FA`), muted text (`#94A3B8`), elevated surfaces (`#0E1422`, `#141C2E`), borders (`rgba(255, 255, 255, 0.10)`), and vermilion accent (`#E8452C`).
  3. **Codebase Hex Sweep**: Replaced hardcoded `#070B14` and `#F5F7FB` occurrences across `layout.tsx`, `page.tsx`, `ArchitecturalHero.tsx`, and `navigate/page.tsx` with semantic token pairs.
  4. **Mapbox Basemap Integration**: Verified that `CampusMap.tsx` automatically swaps between `mapbox://styles/mapbox/streets-v12` (light) and `mapbox://styles/mapbox/dark-v11` (dark) when `resolvedTheme` changes.

---

### Stage 5: Help Page Emergency Callout & Verified Safety Directory
- **Commit**: `cbaa308` — `fix(help): emergency callout icon, theme tokens and verified content`
- **Symptom**: The help page featured an empty circular placeholder where an icon should be, unverified claims regarding station counts, and an un-themed blue gradient box.
- **Root Cause**: The icon slot was an empty `<span>` without SVG content, emergency facts were hardcoded without ground-truth verification flags, and the banner used non-semantic blue utility classes.
- **Remedy**:
  1. **Icon Integration**: Replaced the empty placeholder with a 20px Lucide `ShieldAlert` icon enclosed in a 32px (`w-8 h-8`) tinted tile with a subtle border.
  2. **Centralized Safety Directory (`frontend/src/lib/safety.ts`)**: Built a typed schema with `verified: boolean` and audit source citations. Downgraded unverified station counts to an honest architectural corridor description ("Emergency call stations are located along primary pedestrian corridors...").
  3. **Architectural Semantic Styling**: Restyled the callout with `bg-white/80 dark:bg-[#0E1422]`, `border-[#0E1118]/15 dark:border-white/10`, and a left vermilion accent border (`border-l-4 border-l-[#E8452C]`).
  4. **Click-to-Call Emergency Badges**: Added monospace click-to-call links (`tel:`) for Campus Security (`+91 1824 517000`), Shanti Devi Mittal Hospital (`+91 1824 517108`), and National Emergency (`112`).

---

## 3. Visual Before & After Matrix

| Section / Component | Light Mode (`#F6F4EF`) | Dark Mode (`#070B14`) |
| :--- | :--- | :--- |
| **Hero Resting State** | ![Hero Light](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/public/screenshots/hero-resting-light.png) | ![Hero Dark](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/public/screenshots/hero-resting-dark.png) |
| **Feature Cards & Stats Revealed** | ![Features Light](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/public/screenshots/features-revealed-light.png) | ![Features Dark](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/public/screenshots/features-revealed-dark.png) |
| **Help Page Emergency Callout** | ![Help Callout Light](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/public/screenshots/help-callout-light.png) | ![Help Callout Dark](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/public/screenshots/help-callout-dark.png) |

---

## 4. Manual Verification Steps

1. **Hero Disc Stability (Stage 1)**:
   - Navigate to `http://localhost:3000/?intro=1` and press `Escape` to skip intro.
   - Rapidly scroll down past the hero and back to the top 5 times.
   - Inspect the orange sphere: verify that it smoothly scales without jumping or snapping. Move mouse over hero to confirm parallax operates independently.
2. **Hero Image Clipping & Bottom Meta Row (Stage 2)**:
   - Inspect the bottom boundary between the hero and the marquee across viewports (360px, 768px, 1280px, 1920px).
   - Verify zero image bleed into the marquee and no white gap or exposed background during mouse movement.
   - Verify single consolidated bottom bar: `"LIVE SATELLITE SYNC · DATASET C VERIFIED · LPU CAMPUS"`.
3. **Scroll-Scrubbed Cards & Stats (Stage 3)**:
   - Scroll slowly from the hero towards `#section-02`.
   - Observe the stats strip: the top red line draws with scroll, and odometer counters roll progressively into place.
   - Observe feature cards 1, 2, and 3: each card rises and fades into view sequentially as you scroll.
   - On a mobile viewport (<768px), verify each stacked card reveals individually as it reaches 90% viewport height.
4. **Theme Toggle & Persistence (Stage 4)**:
   - Click the theme toggle icon in the top navbar and select **Light Mode**.
   - Verify the page background changes to warm off-white (`#F6F4EF`) and text changes to charcoal (`#111318`).
   - Refresh the page: verify the light theme persists without flashing dark.
   - Select **Dark Mode**: verify background returns to deep navy (`#070B14`).
   - Navigate to `/explore`: verify Mapbox basemap switches to Clean Streets in light mode and Dark Architectural in dark mode.
5. **Help Page Emergency Callout (Stage 5)**:
   - Visit `http://localhost:3000/help`.
   - Scroll to the Emergency Call Stations callout: verify the Lucide `ShieldAlert` icon renders inside the 32px tinted tile.
   - Verify click-to-call links (`tel:+911824517000`, `tel:+911824517108`, `tel:112`) are clickable and styled with monospace badges.

---

## 5. Ordered Commits in Branch `fix/ui-regressions`

```text
e950e28 fix(hero): stabilise sphere animation with layered transforms
dc990c9 fix(hero): clip hero image and consolidate meta row
6f83d3e feat(motion): scroll-scrubbed card reveals
931d6f7 fix(theme): working light/dark/system theme with complete tokens
cbaa308 fix(help): emergency callout icon, theme tokens and verified content
```

---

## 6. Reviewer Note

> [!IMPORTANT]
> This branch (`fix/ui-regressions`) is prepared strictly for evaluation and pull request review against `feature/map-gps-qr`. In accordance with project policy, **it must NOT be merged to `main` until explicitly reviewed and approved**.
