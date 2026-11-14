# CampusWay — Image Credits & Asset Inventory

All architectural photography and assets utilized in the CampusWay editorial interface are cataloged below with their functional roles, locations, and optimization notes.

---

## 1. Primary Hero Artwork
- **Source File:** `frontend/public/images/Modern Concrete Building with Sunset Disc.png` (1671 × 941).
- **Optimized Cutouts:**
  - `frontend/public/images/hero-curved-fullbleed.webp` (WebP, alpha-transparent, 95% quality).
  - `frontend/public/images/hero-curved-fullbleed.png` (PNG fallback).
- **Subject:** Modern brutalist curved university building with concrete piers, glowing sunset disc, concentric arc, and warm autumn foliage.
- **Processing:** Precision alpha keying eliminating exterior checkerboard artifacts, with anti-aliased edge smoothing and preservation of internal sparkle crosshairs.

---

## 2. Atmospheric & Foreground Accents
- `frontend/public/images/hero-foliage-top-left.png`:
  - Soft-focus depth-of-field botanical silhouette framing the top-left hero viewport.
  - Implemented with radial/linear CSS gradient mask, `mix-blend-mode: multiply`, and subtle sway animation.

---

## 3. Section Photographic Elements

### Section 03: Real Routes & Live Map
- `frontend/public/images/arch-real_campus.jpg`:
  - **Role:** Framed architectural concourse elevation positioned above the section headline (`CAMPUS_QUAD // ARCHITECTURAL ELEVATION • LAT 45.3850° N`).

### Section 04: How It Works (Four Steps)
- `frontend/public/images/274ded964923f03b879a9c9f7d2f9b2c.jpg`: Step 01 (SEARCH) — River & academic quadrangle exterior view.
- `frontend/public/images/arch-navigate.jpg`: Step 02 (ROUTE) — Covered concrete colonnade and landscaped pedestrian path.
- `frontend/public/images/arch-real_campus.jpg`: Step 03 (WALK) — Illuminated concourse arcade with student pedestrians.
- `frontend/public/images/arch-save.jpg`: Step 04 (SAVE) — Multi-story university atrium with central staircase and seating.

### Section 06: Final Call to Action
- `frontend/public/images/closing-architecture.jpg`:
  - **Role:** Dusk illuminated academic colonnade and arcade backdrop with slow scrubbed parallax.

---

## 4. Architectural Atlas Gallery (`src/data/gallery.ts` & `CampusGallerySection.tsx`)
Curated 6-plate justified architectural atlas (5+4+3 / 3+4+5 12-column composite):
1. `arch-gallery_1.jpg` — **01 Dunton Tower Academic Wing**: Brutalist concrete cantilever study (1972).
2. `arch-gallery_2.jpg` — **02 MacOdrum Quadrangle Elevation**: Curved concourse elevation and facade rhythm (1985).
3. `arch-gallery_3.jpg` — **03 Richcraft Hall River Atrium**: High-performance curtain glass and solar glazing (2012).
4. `arch-gallery_5.jpg` — **04 Paterson Hall North Arcade**: Pedestrian concourse and loggia covered arcade (1978).
5. `arch-discover.jpg` — **05 ARISE Advanced Research Complex**: Illuminated modern academic colonnade (2018).
6. `arch-navigate.jpg` — **06 University Centre Main Concourse**: Main campus pedestrian circulation artery with portal crop (1970).

---

## 5. Explore Routes View Photographic Assets (`src/components/explore/ExploreRoutesView.tsx`)
1. `01_graph_solver.png` (2752 × 1536) — **MacOdrum Library (ML) → Paterson Hall (PA)**: High-resolution architectural route solver visualization showing quadrangle traversal, node pathing, and verified wayfinding telemetry.
2. `02_step_free_paths.png` (2752 × 1536) — **ARISE Complex (AR) → Architecture Building (AH)**: Barrier-free step-free corridor path rendering ramp grades, elevator connections, and smooth navigation.
3. `03_instant_access.png` (2752 × 1536) — **Mackenzie Complex (ME) → River Building (RB)**: Direct all-weather academic artery traversing campus perimeter and river concourse.

---

## 6. Authentication Visual Panel (`src/components/auth/AuthSplitLayout.tsx`)
- `arch-navigate.jpg` (1024 × 1536): Architectural elevation panel rendered with mouse-responsive parallax, deep ink overlay, terracotta sun disc, rotating circular badge, and ✦ benefit markers.
