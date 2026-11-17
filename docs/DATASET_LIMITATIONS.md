# LPU Surveyed Route Graph (Dataset C) — Known Limitations & Survey Specifications

**Document Version:** 1.0.0  
**Effective Date:** 2026-11-16  
**Status:** Canonical Reference  
**Associated Dataset:** `database/surveys/lpu_verified_survey.json`  
**Target Branch:** `integrate/team-consolidation`

---

## 1. Overview & Provenance

Dataset C captures the ground-surveyed pedestrian network of Lovely Professional University (LPU), Phagwara, Punjab. The dataset was supplied by the project team following field observations conducted on 2026-11-12 and 2026-11-13.

The dataset contains:
- **27 Verified Nodes:** Comprising 12 routing junctions (`J-001` through `J-012`) and 15 destination access points.
- **29 Verified Segments:** Bidirectional pedestrian pathways connecting entrance gates, academic blocks, residential facilities, and dining squares.
- **15 Canonical Locations:** Primary campus points of interest with unique slugs and categorized entity types.

In accordance with architectural guidelines, this dataset is adopted **in its entirety without synthetic data fabrication or coordinate modification**. This document catalogs the known limitations, approximations, and pending survey requirements.

---

## 2. Missing Location Analysis: Block 34 (Problem Statement P10)

### 2.1 Problem Description
Problem Statement P10 (*"Which Block Is 34?"*) addresses a common student navigation challenge: locating Block 34, an academic facility frequently inquired about by students and visitors.

### 2.2 Survey Status
- **Finding:** Block 34 is **not included** in Dataset C (`lpu_verified_survey.json`).
- **Architectural Policy:** In accordance with our consolidation guidelines, **no synthetic or estimated coordinates have been fabricated** for Block 34. Introducing estimated or unverified coordinates into the canonical database would compromise routing reliability and fail production validation.
- **Impact:** The location search service and routing graph will not return Block 34 until verified ground survey data is collected.

### 2.3 Remediation Plan
1. Conduct an on-site physical survey to capture:
   - Entrance coordinates (WGS84 decimal degrees, 6 decimal places minimum).
   - Nearest connecting junction node along the central pedestrian spine.
   - Pathway surface type, distance in meters, and accessibility characteristics.
2. Submit coordinates as an incremental survey revision (Dataset C.1) following the standard map import workflow.

---

## 3. Geometric & Distance Approximations

### 3.1 Straight-Line Haversine Geometry
- **Methodology:** Each of the 29 pathway segments is defined as a straight line directly connecting source and target node coordinates.
- **Limitation:** Actual campus footpaths follow curves, architectural alignments, landscaping buffers, and pedestrian crossings. Straight-line geometries do not reflect the physical curvature of the walkways.
- **Distance Estimation:** Segment distance (`distance_m`) was computed using the great-circle Haversine formula on WGS84 coordinates. These values are mathematical approximations rather than physical pedometer or measuring-wheel surveys. Real walking distances are estimated to be 10–25% greater along curved pathways.

### 3.2 Coordinate Format & Conversion
- Original field measurements provided in Degrees-Minutes-Seconds (DMS) format were converted to standard decimal degrees (WGS84).
- High precision (up to 10 decimal places in certain raw values) reflects mathematical conversion rather than sub-millimeter GPS accuracy. Effective ground accuracy is approximately $\pm 3\text{ meters}$.

---

## 4. Graph Density & Spatial Coverage

### 4.1 Campus Coverage Boundaries
The 27-node graph covers the primary central academic and residential corridor from Gate 1 (North) southward to GH-2 and MB Food Square.

**Unmapped Campus Areas:**
- Eastern and western academic blocks beyond the main central spine.
- Sports stadiums, indoor sports complexes, and recreational fields.
- University agricultural and research farmlands.
- Uni-Mall interior retail navigation.
- Boys' hostel complexes (BH-1 through BH-8) and distant residential towers.

### 4.2 Single-Level Outdoor Navigation
Dataset C models a 2-dimensional outdoor planar graph. The following are currently out of scope:
- Multi-floor indoor wayfinding (elevators, staircases, floor plans).
- Bridge connections and covered skywalks between blocks.
- Basement parking facilities.

---

## 5. Physical Accessibility Status

- **Accessibility Flag:** All 29 segments in Dataset C are currently stored with `is_accessible = False`.
- **Reason:** While the paths represent paved pedestrian walkways, physical audits for wheelchair accessibility (curb ramps, tactile paving, surface smoothness, step-free access, slope gradient compliance under RPwD Act 2016) have not been formally completed.
- **Routing Engine Implication:** Routing requests with `accessible_only=True` will not find traversable paths until accessibility verification is completed. Standard pedestrian routing operates normally.

---

## 6. Shared Access Points & Entity Mapping

- **Block 8 (8A & 8B):** Blocks 8A and 8B share a single ground entrance waypoint (`BLOCK-8`, coordinates `31.2569166667, 75.7070833333`). In the data model, this maps to a unified location slug `block-8`. Sub-block differentiation will require indoor sub-node mapping.
- **Junction Nodes:** The 12 junction nodes (`J-001` through `J-012`) are pure navigation graph vertices (`location_id = NULL`). They represent intersection points and do not appear in user-facing destination search queries.

---

## 7. Quality Assurance Checklist for Future Surveys

When preparing future survey datasets (e.g. Dataset D):
- [ ] Physical verification of Block 34 entrance coordinates.
- [ ] Wheelchair accessibility audit per segment (step count, ramp presence, maximum slope).
- [ ] Measured walking distance calibration using calibrated pedometer or distance wheel.
- [ ] Intermediate waypoints along curved paths to improve polyline rendering in Mapbox.
- [ ] Indoor entrance-to-lobby waypoints for multi-department blocks.
