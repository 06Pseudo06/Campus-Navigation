# CampusWay — Performance Baseline (Stage 0)

> Recorded: 2026-11-22  
> Branch: `feature/map-gps-qr`  
> Environment: Local Next.js Turbopack dev/build (`localhost:3000`) & FastAPI SQLite local engine (`127.0.0.1:8000`)

---

## 1. System Architecture Baseline Summary

- **Map Library in Use**:
  - Primary Engine: `mapbox-gl` (v3.11.0) via `react-map-gl/mapbox` (v8.1.3), using Mapbox Dark v11 style (`mapbox://styles/mapbox/dark-v11`).
  - Fallback Engine: `CampusVectorMap` custom 2D SVG vector canvas fallback when WebGL/tokens are unavailable.
- **Map Component Structure**:
  - Main container: `CampusMap.tsx` in `frontend/src/components/dashboard/CampusMap.tsx`.
  - Driven by `frontend/src/app/explore/page.tsx` (`ExploreDashboardPage`).
  - Markers rendered as individual DOM `<Marker>` elements per location.
  - Active routes rendered via GeoJSON `<Source>` and `<Layer type="line">` on Mapbox, or SVG `<polyline>` on canvas.
- **Routing API Endpoints**:
  - `GET /api/v1/locations/`: Campus locations with query/type/verification filters.
  - `GET /api/v1/locations/{id}`: Single location details with aliases.
  - `GET /api/v1/routing/nodes`: Active navigation waypoints and coordinates.
  - `GET /api/v1/routing/edges`: Active walkable graph segments.
  - `POST /api/v1/routing/calculate`: Shortest path calculation (Dijkstra / A*).
- **Graph Data Shape**:
  - 27 Nodes (waypoints): `id` (UUID), `location_id`, `node_type`, `latitude`, `longitude`, `is_accessible`, `is_active`, `survey_id` (e.g. `G1-ENTRY`, `J-001` through `J-012`, `BLOCK-1-FASHION-DESIGN`).
  - 29 Edges (walkways): `id`, `source_node_id`, `target_node_id`, `distance_m`, `path_type`, `is_accessible`, `is_active`, `bidirectional`.
  - Coordinate space: LPU Dataset C WGS84 bounding box (Lat: 31.2558–31.2610, Lng: 75.7054–75.7090).
- **Destination Data Location**:
  - Server database: `locations` table seeded from `database/seeds/seed_surveyed_dataset_c.py`.
  - Client static fallback: `frontend/src/data/campusData.ts` (`VERIFIED_DATASET_C_LOCATIONS`).

---

## 2. Frontend Map & Page Loading Metrics

Captured via Playwright Chromium instrumentation on `http://localhost:3000/explore`:

| Metric | Measured Baseline | Target (Stage 1+) | Status |
| :--- | :--- | :--- | :--- |
| **TTFB (Time to First Byte)** | **85 ms** | < 100 ms | Baseline |
| **First Contentful Paint (FCP)** | **788 ms** | < 800 ms | Baseline |
| **DOM Interactive (TTI Proxy)** | **122 ms** | < 200 ms | Baseline |
| **DOM Content Loaded** | **122 ms** | < 200 ms | Baseline |
| **Page Load Event** | **369 ms** | < 500 ms | Baseline |
| **Map First Render Time** | **1,512.0 ms** | < 1,500 ms | Baseline |
| **Total Static JS Bundle Size** | **3,015.3 KiB** (3,087,710 B) | Optimized chunks | Baseline |

---

## 3. Backend API Response Times (20 Requests per Endpoint)

Measured over 20 consecutive HTTP calls against `http://127.0.0.1:8000`:

| Endpoint | Method | Attempts | Successes | p50 (ms) | p95 (ms) | Min (ms) | Max (ms) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `/api/v1/locations/?query=block` | GET | 20 | 20 (100%) | **4.75 ms** | **9.48 ms** | 3.37 ms | 15.88 ms |
| `/api/v1/routing/nodes` | GET | 20 | 20 (100%) | **3.24 ms** | **4.28 ms** | 3.06 ms | 4.46 ms |
| `/api/v1/routing/calculate` | POST | 20 | 20 (100%) | **4.63 ms** | **6.73 ms** | 4.11 ms | 6.99 ms |

---

## 4. Route Calculation Time for 5 Typical Origin-Destination Pairs

Tested origin-destination pairs spanning Gate 1 (North) to South Campus (Hostels/Blocks):

| Origin | Destination | API Latency (ms) | Client Dijkstra (ms) | Route Distance |
| :--- | :--- | :---: | :---: | :---: |
| **Gate 1 (`gate-1`)** | **Block 1 (`block-1`)** | **6.25 ms** | **0.085 ms** | ~407.5 m |
| **Gate 1 (`gate-1`)** | **Block 2 (`block-2`)** | **6.08 ms** | **0.031 ms** | ~368.8 m |
| **Block 1 (`block-1`)** | **CC Food Court (`cc-food-court`)** | **6.08 ms** | **0.031 ms** | ~283.4 m |
| **Block 8 (`block-8`)** | **GH-2 (`gh-2`)** | **4.65 ms** | **0.018 ms** | ~147.2 m |
| **Main Gate Parking (`visitor-parking`)** | **University Hospital (`uni-hospital`)** | **4.51 ms** | **0.016 ms** | ~215.4 m |

---

## 5. Automated Safety Net Smoke Test

- Test suite: `frontend/e2e/map-smoke.spec.ts`
- Automation command: `npm --prefix frontend run test:e2e:smoke`
- Validated workflow:
  1. Navigates to `/explore`.
  2. Asserts `[data-testid="campus-map"]` renders within timeout.
  3. Fills `[data-testid="destination-search"]` with `"Block 1"`.
  4. Selects `[data-testid="location-item-block-1"]`.
  5. Asserts `[data-testid="route-polyline"]` is rendered on the map.
- Baseline Result: **1 passed (4.4s)**.
