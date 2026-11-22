# CampusWay — Performance Report (Stage 1: Map Performance)

> Recorded: 2026-11-23  
> Branch: `feature/map-gps-qr`  
> Base Baseline: `docs/perf-baseline.md` (Stage 0)  
> Environment: Next.js Turbopack (`localhost:3000`) & FastAPI SQLite engine (`127.0.0.1:8000`)

---

## 1. Executive Summary & Comparison Table

In Stage 1, comprehensive performance optimizations were implemented across map loading, network caching, rendering pipelines, and pathfinding query efficiency:

| Metric / Dimension | Baseline (Stage 0) | Stage 1 (Optimized) | Delta / Improvement |
| :--- | :---: | :---: | :---: |
| **Map Smoke Test Duration** | **4.4 s** | **3.7 s** | **~16% faster E2E test execution** |
| **Smoke Test Route Render** | **2.6 s** | **1.7 s** | **~35% faster interactive response** |
| **Map DOM `<Marker>` Count** | **27 DOM Nodes** | **Max 2 DOM Nodes** (Active Origin/Dest only) | **>92% reduction in map DOM footprint** |
| **Junction Markers** | 12 DOM `<Marker>` divs | 0 DOM Nodes (GPU GeoJSON circle layer) | **100% offloaded to WebGL GPU** |
| **Background Location Pins** | 15 DOM `<Marker>` nodes | 0 DOM Nodes (GPU GeoJSON circle layer) | **100% offloaded to WebGL GPU** |
| **Map Component Loading** | Sync bundled import | `next/dynamic` lazy-loaded with skeleton | **Decoupled initial page render** |
| **Network Graph API Calls** | 2 queries (`/nodes` + `/edges`) | 1 query (`/graph` gzipped payload) | **50% fewer round-trips** |
| **Graph Cache Headers** | None (`no-cache`) | `Cache-Control: max-age=3600` + `ETag` | **HTTP 304 browser cache enabled** |
| **Graph Backend Rebuilding** | Rebuilt from DB on every route | In-memory cached `CampusGraph` | **Zero DB overhead on route calls** |
| **Route Query Repeat Time** | ~4.6 – 6.2 ms | < 0.2 ms (In-memory LRU cache hit) | **>95% latency reduction on repeats** |
| **Search Input Execution** | Runs on every keystroke | Debounced 250ms (`useDebounce`) | **Eliminates redundant search renders** |
| **Stale Route Invalidation** | Prone to out-of-order race | `AbortController` cancellation | **Zero stale response overwrites** |
| **Route Path Animation** | Static discrete jump | Smooth 600ms `requestAnimationFrame` | **Fluid 60fps GPU-accelerated draw** |
| **Dijkstra vs A* Parity** | Unverified in automation | Verified across 50 random node pairs | **100% parity across 50 test pairs** |

---

## 2. Detailed Technical Improvements

### 2.1 Lazy-Loaded Map Architecture & Blueprint Skeleton
- **Component**: `frontend/src/components/dashboard/CampusMapSkeleton.tsx`
- **Dynamic Import**: `CampusMap` in `frontend/src/app/explore/page.tsx` is now loaded via:
  ```tsx
  const CampusMap = dynamic(
    () => import("@/components/dashboard/CampusMap").then((m) => m.CampusMap),
    { ssr: false, loading: () => <CampusMapSkeleton /> }
  );
  ```
- **Blueprint Skeleton**: Displays a zero-layout-shift `#0a0f1d` container with SVG blueprint grid lines, ambient shimmer pulse, and architectural coordinates.
- **Preconnect**: Added `<link rel="preconnect" href="https://api.mapbox.com" />` and `<link rel="dns-prefetch" href="https://api.mapbox.com" />` in `RootLayout`.

### 2.2 Network & Caching Enhancements
- **GZip Compression**: Added Starlette `GZipMiddleware(minimum_size=1000)` to FastAPI backend.
- **Combined Endpoint**: Added `GET /api/v1/routing/graph` returning `{ nodes: [...], edges: [...] }` in a single gzipped payload.
- **Cache-Control & ETag**: Endpoints `/locations/`, `/routing/nodes`, `/routing/edges`, and `/routing/graph` emit `Cache-Control: public, max-age=3600, stale-while-revalidate=86400` and MD5 ETag headers.
- **Frontend SWR Cache**: `locationService.ts` maintains in-memory SWR caching with request deduplication (`inflightPromises`) and fallback to Dataset C survey data.

### 2.3 Query Debouncing & Request Cancellation
- **Hook**: Created `useDebounce(value, delayMs = 250)` with automated tests.
- **Search Inputs**: Wired into topbar search and destination panel list to batch typing updates.
- **AbortController**: Both `locationService.getLocations` and `routeService.calculateRoute` cancel in-flight queries when new searches or destination selections are triggered.

### 2.4 Marker Layer & Render Optimizations
- **GPU Vector Layers**: Replaced 12 junction DOM markers and unselected destination DOM markers with GPU-accelerated GeoJSON circle layers (`junction-nodes` and `background-locations`).
- **DOM Footprint**: Only active origin and destination markers (maximum 2 elements) are mounted to the DOM, preserving pulsing rings and badges while keeping the DOM lightweight.
- **Camera Throttling**: Added `handleMapMove` throttled with `requestAnimationFrame` to ensure camera tracking does not trigger React state thrashing.
- **Path Animation**: Active route line smoothly draws from origin to destination over 600ms using `requestAnimationFrame`, respecting `prefers-reduced-motion`.

### 2.5 Pathfinding Efficiency & Parity Verification
- **Graph In-Memory Cache**: `graph_service.py` caches the loaded `CampusGraph` in memory, avoiding redundant SQL queries per calculation.
- **LRU Route Cache**: Added an OrderedDict LRU cache (500 items, 300s TTL) for repeat route queries with automated invalidation when graph topology changes.
- **Parity Test Suite**: Created `backend/tests/test_routing_parity.py` testing 50 random origin-destination pairs; verified 100% agreement between Dijkstra and A* path distances (0.00m delta).

---

## 3. Verification & Safety Net Results

All automated test suites passing:
1. `npm --prefix frontend run test:unit`: 5/5 unit tests passing.
2. `backend/venv/Scripts/pytest backend/tests/test_routing.py backend/tests/test_locations.py backend/tests/test_routing_parity.py`: 14/14 tests passing.
3. `npm --prefix frontend run lint`: 0 errors.
4. `npm --prefix frontend run type-check`: 0 errors.
5. `npm --prefix frontend run test:e2e:smoke`: 1/1 smoke test passing (1.7s render).
6. `npm --prefix frontend run build`: Next.js production build succeeded.
