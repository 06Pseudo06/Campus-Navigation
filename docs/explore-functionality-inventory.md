# CampusWay Explore Page — Functionality & Feature Inventory

This document serves as the ground-truth specification of all existing controls, states, data flows, and interactions on `/explore`. Every item documented here must be preserved during the architectural editorial redesign.

---

## 1. Views & Tab Routing (`SidebarTab`)

### 1.1 Explore Tab (`currentTab === "explore"`)
- **Central Map Canvas:** Real SVG GPS projection of Carleton University campus with 48 buildings, WGS84 bounding box calculation, zoom controls, compass reset, legend, and dynamic active route polyline rendering.
- **Right Destination Panel:** Full origin/destination selection, search, category filters (All / Buildings / Landmarks), pathfinding algorithm selector (Dijkstra vs A*), route calculation trigger, step-by-step turn guidance drawer, and 48-location listing with real-time selection.
- **Mobile Responsive Drawer:** On `< 1024px`, the destination panel collapses into a responsive drawer/sheet toggled via topbar or map action.

### 1.2 Predefined Routes Tab (`currentTab === "routes"`)
- Curated campus corridors between key landmarks:
  - MacOdrum Library (`ML`) $\rightarrow$ Paterson Hall (`PA`) (2 min, 134m)
  - ARISE Building (`AB`) $\rightarrow$ Alumni Hall (`AH`) (20 min, 1582m)
  - Mackenzie Complex (`ME`) $\rightarrow$ Richcraft Hall (`RB`) (4 min, 310m)
- Clicking a route sets `originLocation` and `selectedLocation`, computes the shortest path via `calculateRoutePath`, switches tab back to `explore`, and draws the animated route on the map.

### 1.3 Saved Locations Tab (`currentTab === "saved"`)
- Lists all bookmarked destinations matching IDs in `savedIds`.
- Persistence indicator: "PostgreSQL Synced" (when authenticated) or "Guest Local Storage" (when unauthenticated visitor).
- Card items show building code, name, category, and "View on Map" / "Navigate" buttons.
- Remove bookmark button removes ID and updates `savedCount` badge on sidebar in real time.
- Empty state: Friendly message when no locations are bookmarked.

### 1.4 Visitor Assistance / Help Tab (`currentTab === "help"`)
- Form to submit an assistance request ticket:
  - Assistance Type: Lost / Directions, Accessibility Escort, Facility Access, Emergency / Urgent.
  - Name (defaults to user name if authenticated).
  - Contact phone number.
  - Target destination dropdown (populated with campus locations).
  - Description / notes.
- Submits to `assistanceService.submitAssistanceRequest` (`POST /api/v1/assistance/request`).
- Success confirmation banner displaying generated ticket ID and status.
- Campus Emergency Contacts quick-reference list (Campus Safety Services, Student Health, IT Service Desk, Accessibility Services).

---

## 2. Global State & Data Lifecycle

### 2.1 Campus Destinations & Graph Topology Fetching
- Fetches `locationService.getVisitorDestinations()` and `routeService.getAllNodes()` in parallel on mount.
- Deduplicated and protected against race conditions and React StrictMode using `AbortController` and `isFetchingLocationsRef`.
- Maps response into `CampusLocation[]` and populates `nodeMapRef` (`Map<string, NodeRead>`).
- Fallback: Gracefully falls back to canonical `CARLETON_DEMO_LOCATIONS` if backend is unreachable or returns empty.
- Initial defaults: MacOdrum Library (`ML`) as origin, Paterson Hall (`PA`) as destination.

### 2.2 Bookmarks & Guest Storage Synchronization
- Guest bookmarks stored in `localStorage` (`campusway_guest_favorites`).
- Authenticated bookmarks synchronized via `favoriteService.getMyFavorites()`, with automatic migration of any guest bookmarks created prior to login.
- Optimistic UI updates with automatic rollback upon API failure.

### 2.3 Authentication Integration
- `useAuth()` provides `user` and `authLoading`.
- Displays topbar user menu with avatar initials, name/email, and logout trigger.
- Detects `?auth=success` query parameter from Google OAuth redirect, shows toast notification, and cleans up URL history without page reload.

---

## 3. Pathfinding & Route Calculation Engine

### 3.1 Endpoint & Method
- Triggered by `calculateRoutePath(origin, destination, algorithm)`.
- Rejects invalid requests:
  - Origin == Destination: Error banner `"Origin and destination cannot be the same building."`
  - Unverified topology (`hasRouteTopology === false`): Error banner `"Routing topology unavailable: ... access connection requires verification."`
- Resolves `nearestNodeId` for origin and destination.
- Submits calculation to `routeService.calculateRoute()` (`POST /api/v1/routing/calculate`).
- Caches and cancels pending requests using `routeAbortControllerRef` and monotonic `routeRequestIdRef`.

### 3.2 Algorithm Selection
- Segmented control toggles `selectedAlgorithm`:
  - `dijkstra`: Dijkstra's exact shortest path algorithm.
  - `astar`: A* heuristic graph traversal algorithm.

### 3.3 Output Model (`CampusRoute`)
- Formatted via `routeService.formatRouteModel()`:
  - `fromId`, `toId`, `fromName`, `toName`.
  - `distanceMeters`, `estimatedWalkingMinutes`.
  - `algorithmUsed` (`dijkstra` or `astar`).
  - `steps`: Turn-by-turn guidance segments with direction icons (`left`, `right`, `straight`, `enter`, `uturn`), distance, and `isInferred` synthetic badges.
  - `waypoints`: GPS coordinate sequence `[{ x: lon, y: lat }, ...]` used by SVG map renderer.

---

## 4. Map Canvas Controls & Interactions

### 4.1 Projection & Bounding Box
- Dynamic WGS84 coordinate projection (`toSvgX`, `toSvgY`) mapping latitude/longitude to a `1000 × 700` SVG viewBox with adaptive padding.
- Geographic landmarks: Rideau River contour path, campus perimeter boundary dashed border.

### 4.2 Map Manipulation
- Zoom In (`+0.25`, max 2.5×).
- Zoom Out (`-0.25`, min 0.75×).
- Reset View / Compass (resets zoom to 1.0× and centers).
- Smooth keyboard / mouse wheel zooming and panning.

### 4.3 Node & Building Elements
- Interactive building blocks with code stamp (e.g. `ML`, `PA`).
- Visual state variants: Normal routable, Hovered, Origin (`A` green badge + halo), Destination (`B` orange badge + halo), Unroutable warning (`!`).
- Hover tooltip displaying full building name.
- Click building triggers `onSelectLocation()`.

### 4.4 Route Display
- Glowing polyline connecting waypoints with dashed animated walking path.
- Toggle button to show / hide route preview on the map without discarding calculated route state.
- Floating route summary pill (From $\rightarrow$ To, distance, estimated minutes).

### 4.5 Legend
- Walkway connectivity legend (Physical Walkways vs Inferred Synthetic Connections vs Origin A vs Destination B).

---

## 5. Destination Panel Controls

- **Search Input:** Filters 48 locations by name, code, or description in real time with instant clear button. Keyboard shortcut `/` to focus, `Escape` to clear.
- **Filter Chips:** `All` / `Buildings` / `Landmarks`.
- **Origin Select:** Dropdown to switch start location, clearly indicating topology availability.
- **Destination Select / Card:**
  - Building code pill, category, name, description.
  - Pedestrian access point verification status pill.
  - Bookmark toggle button with success toast.
- **Swap Button:** Swaps origin and destination with a single click.
- **Calculate Route CTA Button:**
  - Disabled when origin == destination or topology unverified.
  - Shows spinner and `"Calculating Optimal Path..."` during execution.
- **Calculated Route Drawer:**
  - Total distance and estimated walking time.
  - Full list of turn-by-turn instructions with distance tags and synthetic connection warning badges.
  - Show / Hide route on map button.
- **All Destinations Listing:**
  - 48 locations with code pill, name, category, and selected/origin state indicators.
  - Clicking any location sets destination and highlights it on the map.
