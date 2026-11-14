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
1. `arch-gallery_1.jpg` — **01 Dunton Tower Academic Wing**: Brutalist concrete cantilever study (1972).
2. `arch-gallery_2.jpg` — **02 MacOdrum Quadrangle Arcade**: Concourse elevation and facade rhythm (1985).
3. `arch-gallery_3.jpg` — **03 Richcraft Hall River Atrium**: High-performance curtain glass and solar glazing (2012).
4. `arch-gallery_4.jpg` — **04 Mackenzie Engineering Complex**: Precast concrete facade structural grid (1968).
5. `arch-gallery_5.jpg` — **05 Paterson Hall North Arcade**: Pedestrian concourse and loggia covered arcade (1978).
6. `arch-discover.jpg` — **06 ARISE Advanced Research Complex**: Illuminated modern academic colonnade (2018).
7. `arch-navigate.jpg` — **07 University Centre Main Concourse**: Main campus pedestrian circulation artery with portal crop (1970).
8. `arch-save.jpg` — **08 Loeb Building Social Sciences Wing**: Brutalist vertical core stairwell and lightwell (1964).
9. `campus-bg.jpg` — **09 Southam Hall Central Courtyard**: Expansive university quadrangle vista and walkways (1965).
10. `b99eba43cf2e7a5874209dfdc92c03e1.jpg` — **10 Nicol Building Business School**: Curved mass timber ribs and sunlit multi-story atrium (2021).
11. `0e286636028cdfb2a01a78a877ed7c44.jpg` — **11 Azrieli Pavilion Architecture Studio**: Interior academic pedestrian street with skylights (2002).
12. `450819b60419d7a8dee99a8834e29f80.jpg` — **12 St. Patrick's Academic Building**: Sculptural concrete portico and entrance colonnade (1975).
