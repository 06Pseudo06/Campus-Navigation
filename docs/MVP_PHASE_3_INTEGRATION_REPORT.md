# CampusWay — Phase 3: Frontend–Backend Integration & Acceptance Audit Report

**Project:** CampusWay — Campus Navigation & Wayfinding  
**Target Branch:** `demo/submission-mvp`  
**Milestone:** Phase 3 — Real API Integration and Functional Navigation  
**Audit Date:** November 2026  
**Status:** COMPLETED & VERIFIED (Evidence-Based Acceptance Audit Passed)

---

## 1. Executive Summary & Database Reconciliation

In Phase 3, CampusWay achieved full end-to-end integration between the Next.js 15 App Router frontend and the FastAPI/PostgreSQL backend routing engine.

Prior to this phase, the frontend operated with synthetic delays and 18 hardcoded mock locations. This milestone connects the real database and pathfinding algorithms.

### 1.1 Resolution of the Database Count Discrepancy
The authoritative Phase 2B.2 ingestion report recorded:
- **Locations:** 48
- **Aliases:** 89
- **Graph Nodes:** 1,957
- **Graph Edges:** 2,049
- **Routable Locations:** 47/48

An investigation was conducted regarding a statement in an earlier draft of this report mentioning *"335 pedestrian graph nodes, and 432 bidirectional routing edges"*.
Direct inspection of the active local PostgreSQL database on port 5434 (`campusway_db`) confirmed:
- **Exact Node Count in Database:** **1,957** (`path`: 1,907, `synthetic_access`: 35, `entrance`: 15)
- **Exact Edge Count in Database:** **2,049** (`footpath`: 2,009, `inferred_access`: 35, `inferred_connector`: 5)
- **Exact Location Count:** **48**
- **Exact Alias Count:** **89**
- **Routable Locations:** **47** (97.9%)
- **Unroutable Locations:** **1** (*Social Sciences Research Building*)

**Conclusion on Discrepancy:** The numbers 335 and 432 do not represent a database filter, pagination limit, or distinct database. They were an erroneous draft narrative figure. The backend and frontend operate on the complete, unabridged **1,957 nodes** and **2,049 edges**.

---

## 2. Map Data Provenance & Geometry Verification

An audit of [`CarletonDemoMap.tsx`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/components/dashboard/CarletonDemoMap.tsx) was conducted to delineate real source geospatial data from illustrative vector styling:

### 2.1 Actual Source Geospatial Data
1. **Building Centroid Coordinates:** Sourced directly from `locations.latitude` and `locations.longitude` in PostgreSQL (WGS84 EPSG:4326).
2. **Pedestrian Route Waypoints:** Sourced directly from `nodes.latitude` and `nodes.longitude` via backend graph calculations (`POST /api/v1/routing/calculate`).
3. **Coordinate Projection:** Both building centroids and route waypoints are transformed via the exact same mathematical projection functions:
   $$\text{toSvgX}(\text{lon}) = \text{paddingX} + \frac{\text{lon} - \text{minLon}}{\text{maxLon} - \text{minLon}} \times (\text{svgWidth} - 2 \cdot \text{paddingX})$$
   $$\text{toSvgY}(\text{lat}) = \text{paddingY} + \frac{\text{maxLat} - \text{lat}}{\text{maxLat} - \text{minLat}} \times (\text{svgHeight} - 2 \cdot \text{paddingY})$$
   Because both layers share identical bounds and linear scaling, route lines and building markers are 100% geographically and mathematically aligned.

### 2.2 Illustrative Visual Geometry
1. **Building Marker Shapes:** The displayed building blocks are **uniform schematic architectural markers ($44\text{px} \times 28\text{px}$)** centered on the real GPS centroids, labeled with official native building acronyms (`ML`, `PA`, `AH`, etc.). They are *not* raw multi-vertex OpenStreetMap polygon footprints.
2. **Waterway Flanks:** The Rideau River / canal path in the canvas background (`M 960 50 C 850 180...`) is an **illustrative stylized SVG curve** providing visual geographic context, not an OSM water polygon.
3. **Campus Boundary:** A rounded rectangular boundary derived from the dataset's coordinate bounding box with padding.

---

## 3. Topology Handling & Ground-Truth Wording

### 3.1 Social Sciences Research Building (SSRB)
In the Carleton dataset, the Social Sciences Research Building has no surveyed OSM entrance. During Phase 2A ETL, its nearest pedestrian path node was calculated at **51.92m**, exceeding the ETL's 35m proximity threshold. Consequently, no synthetic access edge was generated.

- **Backend Response:** `has_route_topology: false`, `nearest_node_id: null`.
- **Approved UI & Report Wording:**
  > *"Routing topology unavailable — access connection requires verification. Nearest surveyed pedestrian path exceeds 35m distance threshold."*
- **Integrity Rule:** The UI and documentation state that the routing topology is unavailable pending verification, without asserting that no physical walkway exists in the physical world.

---

## 4. API Service Layer Architecture

### 4.1 Backend Contract Schemas (`frontend/src/types/api.ts`)
Mirrored all Pydantic v2 schemas from `backend/app/schemas/` to strict TypeScript interfaces:
- `LocationRead`: Complete location record with bounding box and address details.
- `VisitorDestinationCard`: Destination card with `nearest_node_id`, `has_route_topology`, and `visitor_guidance`.
- `NodeRead`: Graph node with WGS84 coordinates, floor level, and accessibility flag.
- `PathSegment`: Individual routing step with `path_type`, `distance_m`, and directional `instruction`.
- `RouteQuery`: Payload for `/api/v1/routing/calculate` (`origin_node_id`, `destination_node_id`, `accessible_only`, `algorithm`).
- `RouteResponse`: Computed path containing `origin_node_id`, `destination_node_id`, `total_distance_m`, `accessible`, `path_nodes`, `segments`, `estimated_duration_s`, `estimated_duration_min`.
- `ApiErrorResponse`: Standardized FastAPI/HTTPException error response format.

### 4.2 Central HTTP Client (`frontend/src/services/apiClient.ts`)
- Configured with `NEXT_PUBLIC_API_URL` environment variable, defaulting to `http://localhost:8000`.
- Configurable timeout abort controllers (default 10s).
- Unified error interceptor that extracts backend detail messages (`HTTP 404: No path found`, `HTTP 422: Validation error`).

### 4.3 Location Service (`frontend/src/services/locationService.ts`)
- `getVisitorDestinations(query, category, limit)`: Fetches enriched destination cards.
- `searchLocations(query, locationType, limit)`: Searches locations using backend query matching.
- `getLocationById(locationId)`: Detailed location metadata lookup.
- `mapDestinationToCampusLocation(card)`: Transforms backend destination records to frontend UI models, parsing native codes (`ML`, `PA`, `AH`, `ME`, `RB`) from JSON `address_details`.

### 4.4 Routing Service (`frontend/src/services/routeService.ts`)
- `calculateRoute(originNodeId, destinationNodeId, accessibleOnly, algorithm)`: Executes live pathfinding via Dijkstra or A*.
- `getAllNodes()` & `getNodesForLocation(locationId)`: Retrieves graph nodes for coordinate projection and entrance resolution.
- `formatRouteModel(fromLoc, toLoc, routeResp, nodeMap)`: Converts raw backend segments into turn-by-turn guidance, calculating estimated walking minutes, identifying direction icons (`straight`, `left`, `right`, `enter`), and flagging synthetic inferred edges.

---

## 5. Inferred Connection Disclosure

Synthetic access edges generated by the ETL (`inferred_access` and `inferred_connector`) are explicitly surfaced in the UI:
- **Visual Badge:** Amber pill `Synthetic Access Connection`
- **Step Text:** `[Inferred Connection] Walk along inferred_access for 6.2m (Pending survey)`
- **Safety Policy:** Users are explicitly informed when a segment is an inferred connector rather than a surveyed physical door.

---

## 6. End-to-End Acceptance Verification Evidence

The full verification suite was executed against the live local PostgreSQL instance (port 5434), running FastAPI backend (port 8000), and running Next.js frontend (port 3000):

| Audit Requirement | Verification Method | Result | Evidence / Metrics |
| :--- | :--- | :--- | :--- |
| **1. Destination Loading** | `GET /api/v1/assistance/destinations?limit=60` | **PASS (200)** | 48 destinations loaded with native codes (`ML`, `PA`, etc.) |
| **2. Search Functionality** | `GET /api/v1/locations/?query=Paterson` | **PASS (200)** | Exact match returned for *Paterson Hall* (`0b2f85ab...`) |
| **3. Node UUID Resolution** | Database ID check on origin & destination | **PASS** | Library $\rightarrow$ `d6879c80...`, Paterson $\rightarrow$ `8aecdd4e...` |
| **4. Dijkstra Pathfinding** | `POST /api/v1/routing/calculate` (dijkstra) | **PASS (200)** | Distance: **133.94m**, ETA: **1.7 min**, 10 nodes, 9 segments |
| **5. A\* Pathfinding** | `POST /api/v1/routing/calculate` (astar) | **PASS (200)** | Distance: **133.94m** (Exact match with Dijkstra) |
| **6. Waypoint Consistency** | Bounding box verification across 10 path nodes | **PASS** | All waypoints within $[-75.705, -75.690], [45.378, 45.392]$ |
| **7. Inferred Disclosure** | Segment inspection for route | **PASS** | First and last segments flagged as `inferred_access` |
| **8. SSRB Handling** | Inspection of SSRB record | **PASS** | `has_route_topology: false`, calculate button disabled |
| **9. Error Handling** | Invalid origin UUID calculation | **PASS (404)** | Meaningful detail: *"No walkable path found..."* |
| **10. Dual-Mode Switcher** | Visual mode toggle state | **PASS** | Carleton live GPS mode and LPU blueprint isolated |
| **11. Frontend Server** | `GET http://localhost:3000/explore` | **PASS (200)** | 8,127 bytes HTML returned, zero redirect loops |
| **12. Public Visitor Access** | Session-independent exploration | **PASS** | Guests explore as "Campus Explorer"; auth users shown by profile |

### Verification Methodology Distinction
- **API & Full-Stack HTTP Suite:** Verified 100% against the active PostgreSQL database (port 5434) and live FastAPI server (port 8000).
- **Browser GUI Automation:** Automated DevTools connection skipped (Chrome was not launched with `--remote-debugging-port=9222` on host). Verified via HTTP status, DOM HTML payload validation, Next.js static build traces, and manual browser accessibility.

---

## 7. Implementation Quality Review

1. **Schema Integrity:** Every frontend TypeScript interface in `src/types/api.ts` corresponds to backend Pydantic models.
2. **Environment Configuration:** Default fallback to `http://localhost:8000` via `NEXT_PUBLIC_API_URL` guarantees out-of-the-box local operation.
3. **State Management & Concurrency:**
   - Topology guard prevents calculation when either node lacks topology.
   - `isCalculatingRoute` state prevents overlapping requests.
   - Route waypoints and node coordinates are cached on mount in `nodeMap` to eliminate redundant queries.
4. **Build & Type Safety:**
   - `npm run type-check`: **0 errors**
   - `npm run lint`: **0 errors, 0 warnings**
   - `npm run build`: **9/9 pages prerendered successfully (Exit code 0)**

---

## 8. Summary of Created and Modified Files

### Created Files
- `frontend/src/types/api.ts`
- `frontend/src/services/apiClient.ts`
- `frontend/src/services/locationService.ts`
- `frontend/src/components/dashboard/CarletonDemoMap.tsx`
- `frontend/postcss.config.mjs`
- `frontend/tailwind.config.ts`
- `docs/MVP_PHASE_3_INTEGRATION_REPORT.md`

### Modified Files
- `frontend/src/services/routeService.ts`
- `frontend/src/types/campus.ts`
- `frontend/src/app/explore/page.tsx`
- `frontend/src/components/dashboard/CampusMap.tsx`
- `frontend/src/components/dashboard/DestinationPanel.tsx`
- `frontend/src/components/dashboard/RoutesTab.tsx`
- `frontend/src/components/dashboard/Topbar.tsx`
- `frontend/src/services/authService.ts`
- `frontend/src/app/globals.css`
- `frontend/src/app/layout.tsx`
- `frontend/next.config.ts`
- `frontend/eslint.config.mjs`

---

## 9. Git Working-Tree & Safety Status

- **Branch:** `demo/submission-mvp`
- **Remote Synchronization:** In sync with `origin/demo/submission-mvp`
- **Working Tree:** Cleaned of transient locks; all modifications preserved and untracked files ready for staging upon user approval.
- **Push Policy:** No commits or pushes have been performed during this acceptance audit. Awaiting explicit user approval.
