# CAMPUSWAY — MVP PHASE 0: REPOSITORY DISCOVERY & TECHNICAL ASSESSMENT

**Project:** CampusWay — Intelligent Campus Navigation & Wayfinding Web Application  
**Target Submission Window:** 3 Days (Functional Demonstration MVP)  
**Branch:** `demo/submission-mvp` (Synchronized with `origin/demo/submission-mvp` at `138b7c4`)  
**Assessment Date:** November 10, 2026  
**Status:** Inspection Only (No Application Code Modified)  

---

## 1. Executive Summary & Current Project State

### A. Git & Working Tree Verification
- **Current Active Branch:** `demo/submission-mvp`
- **Synchronization:** Perfectly aligned with `origin/demo/submission-mvp` (Commit [`138b7c4`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/docs/GIT_RECONCILIATION_REPORT.md)).
- **Working Tree:** Pristine with zero uncommitted code modifications. Only untracked audit documents exist.
- **Git History Integrity:** Preserved without modification or rebasing.

### B. High-Level Architectural State
CampusWay is structured as a decoupled full-stack monorepo:
1. **Backend (`/backend`):** High-readiness FastAPI application with 41 OpenAPI endpoints, complete pedestrian routing engine (Dijkstra and A*), visitor assistance, QR token verification, location hierarchy management, map staging pipeline, and 67 passing unit tests.
2. **Frontend (`/frontend`):** Next.js 16.4.2 App Router application with React 19.3.0, TypeScript 5, and Tailwind CSS v4. The visual shell, dark theme, interactive SVG campus canvas, and authentication pages are largely designed, but currently rely on local mock datasets and simulated delays rather than live backend API consumption.
3. **Database (`/database`):** PostgreSQL / Neon serverless architecture backed by a unified Alembic linear migration chain (001 -> 005) with zero competing revision trees.

---

## 2. Frontend Inspection

### A. Directory Structure & Organization
The Next.js frontend has an active source root under `frontend/src/`. An earlier project iteration left empty scaffold folders at the `frontend/` root (`components/`, `hooks/`, `lib/api/`, `types/`), but the actual operational application resides in `frontend/src/`:

```text
frontend/
├── .env.example               # Declares NEXT_PUBLIC_API_URL and NEXT_PUBLIC_APP_NAME
├── Dockerfile                 # Node 20 container definition (currently CMD npm run dev)
├── next.config.ts             # Next.js config with Turbopack rules and remote image patterns
├── package.json               # Next.js 16.4.2, React 19.3.0, Tailwind CSS v4
├── tsconfig.json              # Path alias "@/": ["./src/*"]
├── types/index.ts             # Backend-aligned TypeScript schemas (User, Node, Edge, Route)
└── src/
    ├── app/                   # App Router pages and layouts
    │   ├── layout.tsx         # Root layout with Geist fonts & AuthProvider
    │   ├── globals.css        # Tailwind v4 theme, custom dark palette & scrollbars
    │   ├── page.tsx           # Public landing page with dusk campus photography & CTAs
    │   ├── about/page.tsx     # Project architectural stack & description page
    │   ├── explore/page.tsx   # Authenticated core dashboard & map navigation view
    │   ├── login/page.tsx     # Sign-in portal (Email/Password, Phone OTP, Google OAuth)
    │   └── signup/page.tsx    # User registration portal
    ├── components/
    │   ├── auth/              # AuthCard, LoginForm, SignupForm, PhoneOtpForm, GoogleButton
    │   ├── dashboard/         # CampusMap, Sidebar, Topbar, DestinationPanel, RoutesTab, SavedTab, HelpTab, DashboardIcons
    │   ├── home/              # HeroCta buttons
    │   ├── icons/             # Custom SVG Icon suite (CampusWayLogo, Spinner, GoogleIcon, etc.)
    │   └── layout/            # Navbar, CampusBranding
    ├── context/
    │   └── AuthContext.tsx    # Global session provider querying /api/v1/auth/me
    ├── data/
    │   └── campusData.ts      # 18-location demonstration dataset & simulated route generator
    ├── services/
    │   ├── authService.ts     # HTTP client for login, register, OTP, health, and sessions
    │   └── routeService.ts    # Route client currently stubbed to campusData.ts
    └── types/
        ├── auth.ts            # Form and API payload interfaces
        └── campus.ts          # UI-specific location, coordinates, and route step interfaces
```

### B. Existing Routes & Pages
| Route | Type | Implementation Status | Description |
| :--- | :---: | :---: | :--- |
| `/` | Server Component | **Complete** | Responsive landing page with hero copy, architectural teasers, and CTA buttons. |
| `/about` | Server Component | **Complete** | Explains the CampusWay wayfinding mission, stack details, and navigation links. |
| `/login` | Client/Server | **Complete UI** | Tabbed/structured auth card with email/password, forgot password modal, Google OAuth trigger, and error handling. |
| `/signup` | Client/Server | **Complete UI** | Registration form validating input length, matching passwords, and posting to backend. |
| `/explore` | Client Component | **Functional Demo** | Master dashboard hosting `CampusMap`, `DestinationPanel`, search queries, layer toggles, and tab routing. Guarded by `AuthContext`. |

### C. Shared Components & Layouts
1. [`Navbar.tsx`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/components/layout/Navbar.tsx): Clean glassmorphic header supporting responsive hamburger navigation, campus branding logo, links to Home, Explore, About, and dynamic Auth CTA (Sign In vs Dashboard avatar).
2. [`AuthProvider`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/context/AuthContext.tsx): Context wrapper that mounts at root layout, queries `authService.getCurrentUser()`, and propagates session state or redirects unauthenticated visitors from `/explore` to `/login?error=session_required`.
3. [`Icons.tsx`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/components/icons/Icons.tsx) & [`DashboardIcons.tsx`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/components/dashboard/DashboardIcons.tsx): Fully self-contained SVG icon system (over 30 icons including Compass, Walking, Route, Layers, Accessibility, Check, Eye, Search, Pin, Close, etc.) eliminating the need for bulky third-party icon packages.

### D. Styling & Design System
- **Framework:** Tailwind CSS v4 (`@import "tailwindcss";` in `globals.css`).
- **Color Palette:**
  - Base Dark Background: `#0a0a0a` / `#0d131f` / `#0a0f1d`
  - Brand Primary Accent: Terracotta Orange (`#DE4B31` / `#C84B31`)
  - Accent Secondary: Emerald Green (`#10b981`), Cobalt Blue (`#3B82F6`), Amethyst Purple (`#8B5CF6`)
  - Neutral Borders: Zinc (`#27272a` / `#3f3f46`)
- **Typography:** Next.js Google Fonts (`Geist` variable sans and `Geist Mono`).

---

## 3. Map and Dataset Inspection

### A. Geospatial Dependencies Search
A comprehensive codebase audit for mapping libraries revealed:
- **Leaflet / React-Leaflet:** Not installed.
- **Mapbox GL / React-Map-GL:** Not installed.
- **MapLibre GL:** Not installed.
- **OpenLayers / Cesium:** Not installed.

### B. Existing Map Implementation: Interactive SVG Vector Canvas
Rather than embedding heavy third-party raster/tile mapping libraries, CampusWay implements a lightweight, zero-dependency **Custom SVG Vector Canvas** in [`frontend/src/components/dashboard/CampusMap.tsx`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/components/dashboard/CampusMap.tsx):
- **Coordinate Space:** ViewBox `0 0 1000 700` mapped from percentage coordinates (`x: 0..100`, `y: 0..100`).
- **Layers Supported:**
  1. *Campus Standard:* Ground gradient, pedestrian avenues, manicured lawns, water fountain, athletic track.
  2. *CAD Blueprint:* Dark blueprint theme with cyan coordinate grid (`<pattern id="blueprintGrid">`).
  3. *Satellite Tint:* High-contrast dark satellite aesthetic.
  4. *Accessibility Ramps:* Promotes wheelchair accessible entrances and tactile ground paths.
- **Interactive Capabilities:**
  - Dynamic zoom (+25% increments up to 2.0x, zoom out to 0.75x) with smooth CSS transforms.
  - Reset View & Compass re-centering.
  - Interactive clickable building footprints with custom fill colors, rounded corners, hover states, and tooltips.
  - Waypoint and route polyline rendering with animated pulsing stroke (`strokeDasharray`, glowing SVG filter).
  - Floating Route Preview card displaying origin, destination, estimated walking time, metric distance, and step-free accessibility badge.

### C. Repository Dataset Audit
A file search across all extensions (`.geojson`, `.osm`, `.pbf`, `.csv`, `.kml`, `.gpx`, `.json`) confirmed:
- **Zero raw external geospatial files** (no `.geojson`, `.osm`, or `.pbf` files exist in the repository).
- **Existing Demonstration Dataset ([`frontend/src/data/campusData.ts`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/data/campusData.ts)):**
  - Contains **18 structured campus entities**:
    - **Gates:** Main Gate (`GATE-01`), North Gate (`GATE-02`), South Gate (`GATE-03`).
    - **Academic Buildings:** Block 34 (`B-34`), Block 25 (`B-25`), Central Library (`LIB-01`), Engineering Block (`ENG-01`), Admin Block (`ADM-01`).
    - **Facilities & Services:** Campus Cafeteria (`CAF-01`), Sports Complex (`SPT-01`), Visitor Parking (`PKG-01`), North Student Parking (`PKG-02`).
    - **Landmarks:** Central Plaza (`PLZ-01`), Historic Clock Tower (`TWR-01`).
    - **Rooms / Sub-locations:** Room 3402 (Main Seminar Hall), Room 2505 (AI Lab), Room E-102 (CAD Studio), Room L-301 (Silent Study).
  - Contains **`generateDemonstrationRoute()`**: Computes synthetic multi-segment pedestrian routes with turn instructions ("Depart north along central pedestrian boulevard", "Turn right toward walkway", "Arrive at entrance").

---

## 4. Backend Integration Inspection

### A. Existing Frontend API Clients
1. [`frontend/src/services/authService.ts`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/services/authService.ts):
   - Fully implemented `fetchWithTimeout` wrapper with 5000ms abort signals.
   - Handles `POST /api/v1/auth/login` and `POST /api/v1/auth/register` with `credentials: "include"`.
   - Handles `GET /api/v1/auth/me` to populate global user state.
   - Handles `POST /api/v1/auth/logout`.
   - Handles pre-flight `GET /api/v1/health` check.
2. [`frontend/src/services/routeService.ts`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/services/routeService.ts):
   - Currently stubbed with a 150ms timeout calling `generateDemonstrationRoute()`.
3. [`frontend/lib/api/client.ts`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/lib/api/client.ts):
   - Minimal 7-line file defining `API_BASE_URL`.

### B. Configuration & URL Discrepancy
An important environment variable discrepancy was identified:
- [`frontend/.env.example`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/.env.example) and [`docker-compose.yml`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/docker-compose.yml) declare:
  `NEXT_PUBLIC_API_URL=http://localhost:8000`
- [`frontend/src/services/authService.ts`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/services/authService.ts#L17) expects:
  `NEXT_PUBLIC_API_BASE_URL`
- **Resolution Needed:** Update client utilities to fall back gracefully:
  `process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"`

### C. Endpoint & Schema Alignment Matrix

| Capability | Backend Endpoint | Frontend Consumer | Status / Gap |
| :--- | :--- | :--- | :--- |
| **Health Check** | `GET /api/v1/health` | `authService.checkBackendHealth()` | **Matched** |
| **User Sign In** | `POST /api/v1/auth/login` | `authService.login()` | **Matched** (Cookie-based session) |
| **Registration** | `POST /api/v1/auth/register` | `authService.signup()` | **Matched** |
| **Session Profile**| `GET /api/v1/auth/me` | `authService.getCurrentUser()` | **Matched** |
| **Sign Out** | `POST /api/v1/auth/logout` | `authService.logout()` | **Matched** |
| **Phone OTP Send** | `POST /api/v1/auth/phone/send-otp` | `authService.requestPhoneOtp()` | **Mismatch:** Frontend calls `/api/v1/auth/otp/send` |
| **Phone OTP Verify**| `POST /api/v1/auth/phone/verify-otp`| `authService.verifyPhoneOtp()` | **Mismatch:** Frontend calls `/api/v1/auth/otp/verify` |
| **Location Query** | `GET /api/v1/locations/` | `explore/page.tsx` | **Not Connected:** UI uses `SAMPLE_LOCATIONS` directly |
| **Destination Cards**| `GET /api/v1/assistance/destinations` | *None* | **Available:** Returns accessible destinations + nearest node IDs |
| **Route Calc** | `POST /api/v1/routing/calculate` | `routeService.calculateRoute()` | **Not Connected:** Frontend uses mock math function |
| **Saved Places** | `GET /api/v1/favorites/mine` | `SavedTab.tsx` | **Not Connected:** UI uses local React state `useState` |
| **Visitor Ticket** | `POST /api/v1/assistance/requests` | `HelpTab.tsx` | **Not Connected:** Form uses mock timeout state |
| **QR Code Wayfinding**| `GET /api/v1/assistance/qr/resolve` | *None* | **Available:** Backend ready, no frontend QR modal yet |

---

## 5. Dependency and Deployment Inspection

### A. Current Frontend Dependencies
From [`frontend/package.json`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/package.json):
```json
{
  "dependencies": {
    "next": "16.4.2",
    "react": "19.3.0",
    "react-dom": "19.3.0"
  },
  "devDependencies": {
    "@tailwindcss/turbopack": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.4.2",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```
**Assessment:** The frontend dependency profile is exceptionally lightweight and clean, with zero bloat.

### B. Environment Variables Reference
The project relies on standard, non-sensitive environment keys:
- **Frontend:**
  - `NEXT_PUBLIC_API_URL` (or `NEXT_PUBLIC_API_BASE_URL`): Backend base URL.
  - `NEXT_PUBLIC_APP_NAME`: Application brand name.
- **Backend:**
  - `PROJECT_NAME`, `API_V1_STR`, `ENVIRONMENT`, `HOST`, `PORT`, `FRONTEND_URL`, `CORS_ORIGINS`.
  - `DATABASE_URL`: Connection string (local PostgreSQL or remote Neon).
  - `ADMIN_API_KEY`, `JWT_SECRET_KEY`, `SESSION_SECRET`: Cryptographic signing keys.
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TWILIO_*`: External provider keys (optional/mockable).

### C. Deployment Configuration & Blockers

#### 1. Local Stale TypeScript Cache Blocker
- **Finding:** Running `npm --prefix frontend run type-check` (`tsc --noEmit`) fails with 24 errors referencing non-existent paths (e.g. `.next/types/app/(public)/explore/page.ts`).
- **Cause:** The repository contains a stale `.next/` build artifact from an earlier pre-restructure branch.
- **Resolution for Deployment:** On clean deployment platforms (Vercel / Render), builds start fresh without stale `.next/`. For local building, purging `.next` (`rmdir /s /q frontend\.next` or `npm run build`) regenerates fresh type declarations for `src/app/`.

#### 2. Dockerfile Development Mode Blocker
- **Finding:** [`frontend/Dockerfile`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/Dockerfile) currently ends with `CMD ["npm", "run", "dev"]`.
- **Impact:** If deployed to Render as a Web Service using Docker, it runs the resource-intensive development server with hot-reloading instead of the optimized production standalone server (`next build && next start`).
- **Resolution:** Update Dockerfile to multi-stage production build when containerizing for Render, or deploy frontend directly to Vercel (which runs `next build` natively).

#### 3. CORS Configuration on Production
- **Finding:** Backend [`backend/app/core/config.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/core/config.py#L18) defaults `CORS_ORIGINS` to `["http://localhost:3000"]`.
- **Impact:** Deploying the frontend to Vercel (e.g. `https://campusway.vercel.app`) will trigger browser CORS rejections unless the Vercel domain is added to `CORS_ORIGINS` in the backend environment.

---

## 6. Missing Components for 3-Day Functional MVP

To achieve a complete, submission-ready MVP within 3 days without undertaking a risky rewrite, the following gaps need to be bridged:

1. **Location API Consumer:**
   A dedicated `locationService.ts` that queries `GET /api/v1/locations/` and `GET /api/v1/assistance/destinations` on mount, seamlessly falling back to `SAMPLE_LOCATIONS` if the backend is unreachable.
2. **Dynamic Route Adapter:**
   Connect `routeService.ts` to `POST /api/v1/routing/calculate`. The backend accepts navigation node UUIDs (`origin_node_id`, `destination_node_id`), whereas the UI selects location IDs. A lightweight adapter that resolves location IDs to their nearest nodes (already provided by `VisitorDestinationCard.nearest_node_id`) will enable live algorithmic route planning.
3. **Favorites Persistence Bridge:**
   Connect `SavedTab.tsx` and the Destination bookmark button to `GET /api/v1/favorites/mine` and `POST /api/v1/favorites/{user_id}/{location_id}`.
4. **Visitor Assistance Bridge:**
   Connect `HelpTab.tsx` submission form to `POST /api/v1/assistance/requests`.
5. **Clean Local Build Hygiene:**
   Clean stale `.next` artifacts so local `npm run build` runs cleanly without warning.

---

## 7. Recommended Immediate Next Implementation Task

### **Task: MVP Phase 1 — Frontend Service Alignment & Live Backend Consumption**

The immediate next priority should be:
1. **Harmonize API Configuration:** Ensure `authService.ts` checks both `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_API_BASE_URL`.
2. **Correct Phone OTP Route:** Change `/api/v1/auth/otp/send` -> `/api/v1/auth/phone/send-otp` and `/verify` -> `/verify-otp`.
3. **Build `locationService.ts`:** Enable `explore/page.tsx` to fetch real locations and destination cards from `/api/v1/assistance/destinations` with instant fallback to `SAMPLE_LOCATIONS`.
4. **Connect `routeService.ts`:** Enable live algorithmic route calculation via `/api/v1/routing/calculate` while preserving the SVG vector path visualization.
5. **Test Build:** Execute a clean `npm run build` to confirm zero TypeScript and linting errors.

---

## 8. Summary Checklist

- [x] Branch confirmed as `demo/submission-mvp` synchronized with remote.
- [x] Working tree verified clean with zero uncommitted changes.
- [x] Next.js directory structure, pages, and components inventoried.
- [x] Confirmed zero external mapping libraries; identified custom SVG vector canvas.
- [x] Confirmed zero raw GeoJSON files; identified 18-location demonstration dataset.
- [x] Backend integration, schemas, and endpoint mismatches mapped.
- [x] Dependency footprint verified (lightweight zero-bloat).
- [x] Deployment blockers identified (stale `.next`, dev Dockerfile, CORS).
- [x] Immediate next task prioritized.

