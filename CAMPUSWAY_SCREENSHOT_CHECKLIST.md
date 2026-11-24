# CampusWay — Academic Report Screenshot Checklist & Figure Guide
**Project:** CampusWay (LPU Smart Campus Navigation System)  
**Academic Reference:** DOC-FIG-2026-V1  
**Audit Date:** November 24, 2026  
**Auditor:** Senior Full-Stack Engineering Architect & Technical Documentation Specialist  

---

## 1. Executive Summary & Figure Organization

This document establishes the canonical visual evidence catalogue required for the university final-year project report. Each entry specifies the exact application state, route, prerequisites, step-by-step reproduction instructions, and key technical elements to annotate in the report figures.

---

## 2. Comprehensive Screenshot Matrix

| Figure ID | Chapter / Section | Suggested Figure Caption | Route / Target | State / Preconditions |
|---|---|---|---|---|
| **FIG-01** | Chap 4: System Architecture | High-Level Multi-Tier Architectural Topology | `System Diagram` | Rendered from ARCH-DIAG-01 |
| **FIG-02** | Chap 5: Implementation (UI) | Homepage Architectural Kinetic Hero Section | `/` | Desktop viewport (1440x900), Initial page load |
| **FIG-03** | Chap 5: Implementation (UI) | Kinetic Atlas 4-Plate Wayfinding Section | `/#atlas` | Scrolled to Plate 02 (Step-Free Paths) |
| **FIG-04** | Chap 5: Implementation (UI) | Stats Strip with Animated Odometer Digits | `/#stats` | In-view viewport, counters settled at target values |
| **FIG-05** | Chap 5: Implementation (Explore) | CampusWay Explore Map Interface (Dark Mode) | `/explore` | Mapbox GL basemap, dark navy (#070B14) theme |
| **FIG-06** | Chap 5: Implementation (Explore) | CampusWay Explore Map Interface (Light Mode) | `/explore` | Warm off-white (#F6F4EF) theme, streets style |
| **FIG-07** | Chap 5: Implementation (Routing) | Shortest-Path Route Calculation & Polyline | `/explore` | Origin: Gate 1, Destination: Block 34 |
| **FIG-08** | Chap 5: Implementation (Routing) | Turn-by-Turn Navigation HUD & Route Panel | `/explore` | Route active, step direction cards visible |
| **FIG-09** | Chap 5: Implementation (Routing) | Step-Free Accessible Route Variant | `/explore` | Toggle "Wheelchair Accessible Paths Only" active |
| **FIG-10** | Chap 5: Implementation (GPS) | Real-Time GPS Blue Dot Marker & Heading Cone | `/explore` | Browser Geolocation granted, accuracy circle <15m |
| **FIG-11** | Chap 5: Implementation (GPS) | Developer GPS Mock Controller & Waypoint Selector | `/explore` | Dev Mock Drawer open, Block 34 waypoint injected |
| **FIG-12** | Chap 5: Implementation (GPS) | Unsurveyed Area Alert with Cardinal Compass | `/explore` | Coordinates set 100m outside surveyed graph |
| **FIG-13** | Chap 5: Implementation (QR) | QR Code Modal with Dynamic Destination Encoding | `/explore` | POI details card -> Click "Share / QR Signage" |
| **FIG-14** | Chap 5: Implementation (QR) | In-App Camera QR Code Scanner with Torch Control | `/explore` | Header scanner icon -> Scanner modal active |
| **FIG-15** | Chap 5: Implementation (QR) | Printable Campus Signpost QR Sheet | `/admin/qr` | Print layout view with verified POI QR cards |
| **FIG-16** | Chap 5: Implementation (Auth) | User Authentication & Session Login Dialog | `/login` | Email/password form with Google OAuth option |
| **FIG-17** | Chap 5: Implementation (Profile) | User Profile Dropdown & Preferences Workspace | `/profile` | Authenticated user, saved destinations list |
| **FIG-18** | Chap 5: Implementation (Admin) | Operations Command Dashboard & Telemetry | `/admin` | Authenticated Administrator, live KPI cards |
| **FIG-19** | Chap 5: Implementation (Admin) | User Account Management & RBAC Role Elevation | `/admin/users` | Users table, "Assign Role" modal open |
| **FIG-20** | Chap 5: Implementation (Admin) | Campus Location POI Repository & Dataset C Badges | `/admin/locations` | Locations table with "DATASET C" verified pills |
| **FIG-21** | Chap 5: Implementation (Admin) | Routing Graph Connectivity Diagnostics Console | `/admin/routes` | Diagnostics tab showing connected active topology |
| **FIG-22** | Chap 5: Implementation (Admin) | Visitor Assistance & Map Issue Triage Queue | `/admin/reports` | Assistance tickets list, resolution modal active |
| **FIG-23** | Chap 5: Implementation (Admin) | Immutable Administrative Activity Audit Ledger | `/admin/audit-logs` | Chronological activity log with inspect drawer |
| **FIG-24** | Chap 5: Implementation (Security) | Non-Admin 403 Forbidden Access Denied Card | `/admin` | Logged in as student@campusway.lpu.in |
| **FIG-25** | Chap 6: Testing & Quality | Vitest Unit Test Suite Execution Terminal | `CLI` | `npm run test:unit` execution output (69 passing) |
| **FIG-26** | Chap 6: Testing & Quality | Pytest Backend Test Suite Execution Terminal | `CLI` | `pytest backend/tests` execution (109 passing) |

---

## 3. Detailed Capture Protocol & Step-by-Step Instructions

### FIG-02: Homepage Architectural Kinetic Hero Section
- **URL**: `http://localhost:3000/`
- **Viewport**: Desktop (1440 × 900 px)
- **Preconditions**: Dev server running (`npm run dev`).
- **Steps**:
  1. Navigate to `/`.
  2. Allow intro animation (kinetic timeline: loader $\rightarrow$ badge spin $\rightarrow$ headline reveal) to settle (~3 seconds).
  3. Ensure vermilion (#E8452C) geometric sphere backdrop, Inter Tight display typography, and CTA button "Start Campus Navigation" are visible.
- **Key Callouts for Report**: Tight-tracked display grotesk, high-contrast Vermilion/Navy branding, floating kinetic badge.

### FIG-05 & FIG-06: Explore Map Interface (Dark vs Light Themes)
- **URL**: `http://localhost:3000/explore`
- **Viewport**: Desktop (1440 × 900 px)
- **Preconditions**: Dark mode active (default).
- **Steps for FIG-05**:
  1. Open `/explore`.
  2. Mapbox GL loads `mapbox://styles/mapbox/dark-v11`.
  3. Sidebar search and map markers for Block 34, UniMall, and Central Library visible.
- **Steps for FIG-06**:
  1. Click the Sun icon in the top bar to toggle Light Theme.
  2. Observe instant transition to warm off-white surface tokens (`#F6F4EF`) and `streets-v12` basemap.
- **Key Callouts for Report**: Semantic CSS token switching, basemap synchronization without flashing.

### FIG-07 & FIG-08: Shortest-Path Route Calculation & Turn-by-Turn HUD
- **URL**: `http://localhost:3000/explore`
- **Viewport**: Desktop (1440 × 900 px)
- **Steps**:
  1. Search for "Gate 1 (Main Gate)" as origin.
  2. Search for "Block 34" as destination.
  3. Click "Get Directions".
  4. Capture map showing illuminated route polyline connecting nodes P-001 through P-029.
  5. Capture right-side Route Summary HUD displaying total metric distance (e.g. 842m), estimated walk duration (10.8 mins), and turn-by-turn cards.
- **Key Callouts for Report**: Dual-layer polyline glow, walking time formula ($d / 1.3\text{ m/s}$), bearing-calculated turn modifiers ("Turn right onto footpath").

### FIG-11: Developer GPS Mock Controller & Waypoint Selector
- **URL**: `http://localhost:3000/explore`
- **Viewport**: Desktop (1440 × 900 px)
- **Steps**:
  1. Click "Dev GPS Mock" button in bottom-right corner.
  2. Drawer expands showing coordinate inputs, accuracy slider, and waypoint dropdown.
  3. Select "Block 34 Entrance (Surveyed)" from dropdown.
  4. Click "Inject GPS Coordinates".
  5. Capture the active blue dot snapping precisely to node `B34-ENTRY` with a 10m green accuracy ring.
- **Key Callouts for Report**: Synthetic testing harness, real-time Haversine nearest-node snapping (<75m threshold).

### FIG-14: In-App Camera QR Code Scanner with Torch Control
- **URL**: `http://localhost:3000/explore`
- **Viewport**: Mobile Viewport (390 × 844 px or responsive view)
- **Steps**:
  1. Tap the QR scanner icon in the top search bar.
  2. Modal opens displaying camera viewport, scan reticle animation, torch toggle button, and "Upload Image" / "Enter Code" tabs.
- **Key Callouts for Report**: `Html5Qrcode` integration, hardware torch access API, deep-link parameter extraction.

### FIG-18: Operations Command Dashboard & Telemetry
- **URL**: `http://localhost:3000/admin`
- **Viewport**: Desktop (1440 × 900 px)
- **Preconditions**: Signed in as `admin@campusway.lpu.in` / `Admin@CampusWay2026!`.
- **Steps**:
  1. Navigate to `/admin`.
  2. Dashboard displays 4 KPI metric cards:
     - Locations: 15 Total, Verified
     - Spatial Graph: 27 Nodes, 29 Active Edges
     - Directory: Registered Users, Active vs Suspended
     - Assistance & Issues: Pending Triage Queue
  3. Telemetry bar displays: Database: POSTGRESQL / SQLITE, Status: HEALTHY, Env: PRODUCTION.
  4. Recent Activity ledger displays recent audit events.
- **Key Callouts for Report**: Unified telemetry dashboard, non-mock live data integration, cache purge button.

### FIG-19: User Account Management & RBAC Role Elevation
- **URL**: `http://localhost:3000/admin/users`
- **Viewport**: Desktop (1440 × 900 px)
- **Steps**:
  1. Navigate to `/admin/users`.
  2. Table displays user email, role badges (`STUDENT`, `MODERATOR`, `ADMIN`), active status, and last login.
  3. Click "Change Role" on a user.
  4. Modal appears showing the 3 permission tiers and the warning guard: "Cannot demote the last active administrator".
- **Key Callouts for Report**: Least-privilege RBAC model, safety invariants preventing admin lockout.

### FIG-21: Routing Graph Connectivity Diagnostics Console
- **URL**: `http://localhost:3000/admin/routes`
- **Viewport**: Desktop (1440 × 900 px)
- **Steps**:
  1. Navigate to `/admin/routes`.
  2. "Graph Diagnostics" tab is selected.
  3. Green banner displays: "Campus Routing Network is Fully Connected — Every active spatial node has pathfinding continuity across Dijkstra / A* routing engines".
  4. Active nodes count (27) and active edges count (29) verified.
- **Key Callouts for Report**: Automated graph integrity validation, topological loop and orphan node detection.

### FIG-24: Non-Admin 403 Forbidden Access Denied Card
- **URL**: `http://localhost:3000/admin`
- **Viewport**: Desktop (1440 × 900 px)
- **Preconditions**: Signed in as student account (`student@campusway.lpu.in`).
- **Steps**:
  1. Navigate to `/admin`.
  2. Access is intercepted by `AdminGuard`.
  3. Clean error card displays: "Administrative Privileges Required — Your account is assigned the role STUDENT. The CampusWay Administrative Workspace is restricted to verified campus operators."
  4. Buttons provided: "Return to Public CampusWay" and "Sign In with Administrator Account".
- **Key Callouts for Report**: Defense-in-depth security, strict role segregation between public users and campus operators.
