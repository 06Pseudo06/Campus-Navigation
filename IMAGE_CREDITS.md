# CampusWay — Image Credits & Asset Inventory

All architectural photography and assets utilized in the CampusWay editorial interface are cataloged below with their functional roles and optimization notes.

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

---

## 3. Section Photographic Elements
- `frontend/public/images/arch-real_campus.jpg`:
  - **Role:** Architectural elevation and quadrangle concourse accent in Section 03 (`Live Routing`).
- `frontend/public/images/arch-cta_bg.jpg` / `closing-architecture.jpg`:
  - **Role:** Dusk illuminated colonnade and arcade utilized in Section 06 (`Closing CTA`).

---

## 4. Architectural Atlas Gallery (`CampusGallerySection.tsx`)
- `arch-gallery_1.jpg` (Dunton Tower Cantilever): Concrete brutalist cantilever study.
- `arch-gallery_2.jpg` (MacOdrum Concourse Quad): Concourse elevation and facade.
- `arch-gallery_3.jpg` (Richcraft Hall Atrium): Curtain glass mullions and architectural framing.
- `arch-gallery_4.jpg` (Mackenzie Engineering Complex): Precast concrete facade grid.
- `arch-gallery_5.jpg` (Paterson Hall North Arcade): Pedestrian concourse and loggia arcade.
- `arch-discover.jpg` (ARISE Academic Colonnade): Illuminated academic colonnade.

---

## 5. Architectural Process Diagrams (`HowItWorksSection.tsx`)
- Architectural isometric perspectives and line drawings representing the 4 workflow phases: `SEARCH`, `ROUTE`, `WALK`, and `SAVE`.
