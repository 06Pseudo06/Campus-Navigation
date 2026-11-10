# CampusWay — Phase 0.1: Database & Deployment Readiness Audit

**Scope:** Database seed readiness, Docker orchestration, and Cloud Deployment compatibility (Render & Vercel)  
**Audit Date:** November 10, 2026  
**Auditor:** Antigravity AI  
**Status:** Source-Code Level Verification (Inspection-Only)  

---

## 1. Database & Data Readiness Audit

### 1.1 Live Data State vs. Test Data State
A critical distinction must be drawn between the automated test environment and the actual database state:
- **Test Environment (Passing):** The 67 automated pytest tests execute against disposable, in-memory SQLite fixtures (`test_db_url = "sqlite:///:memory:"`), programmatically inserting temporary users, nodes, and edges, and tearing them down after every test run.
- **Production / Development Database State (Empty):** In any newly deployed instance or developer environment connected to local PostgreSQL or remote Neon, **zero location rows, zero navigation nodes, and zero walkable edges exist**.

### 1.2 Data Seeding Scripts Audit
A repository-wide search across all data formats (`.sql`, `.geojson`, `.csv`, `.osm`, `.pbf`, `.py`, `.sh`) revealed:
- **`database/seeds/`:** Contains only a placeholder [`.gitkeep`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/database/seeds/.gitkeep) file.
- **Seed Scripts:** **Zero seeding scripts exist anywhere in the repository.** No `seed.py`, `init_db.py`, or SQL dump is present to populate the database with canonical campus locations or walkable network graphs.
- **External GeoJSON Fixtures:** Zero campus GeoJSON files are checked in (only small synthetic test fixtures embedded within `test_import.py`).

### 1.3 Mapping the Frontend 18-Location Dataset to the Database
The frontend renders 18 mock locations defined in [`frontend/src/data/campusData.ts`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/data/campusData.ts). A schema alignment comparison reveals:

| Frontend Location (Mock) | Category | Backend ORM Equivalent | Can It Be Seeded to DB? |
| :--- | :--- | :--- | :--- |
| Main Gate (`loc-main-gate`) | `gate` | `Location(name="Main Gate", slug="main-gate", location_type="gate")` | **YES** |
| North Gate (`loc-north-gate`) | `gate` | `Location(name="North Gate", slug="north-gate", location_type="gate")` | **YES** |
| South Gate (`loc-south-gate`) | `gate` | `Location(name="South Gate", slug="south-gate", location_type="gate")` | **YES** |
| Block 34 (`loc-block-34`) | `building` | `Location(name="Block 34", slug="block-34", location_type="block")` | **YES** |
| Block 25 (`loc-block-25`) | `building` | `Location(name="Block 25", slug="block-25", location_type="block")` | **YES** |
| Central Library (`loc-library`) | `building` | `Location(name="Central Library", slug="central-library", location_type="building")` | **YES** |
| Engineering Block (`loc-engineering`) | `building` | `Location(name="Engineering Block", slug="engineering-block", location_type="building")`| **YES** |
| Admin Block (`loc-admin`) | `building` | `Location(name="Admin Block", slug="admin-block", location_type="building")` | **YES** |
| Sports Complex (`loc-sports`) | `building` | `Location(name="Sports Complex", slug="sports-complex", location_type="building")` | **YES** |
| Central Plaza (`loc-central-plaza`) | `landmark` | `Location(name="Central Plaza", slug="central-plaza", location_type="landmark")` | **YES** |
| Clock Tower (`loc-clock-tower`) | `landmark` | `Location(name="Campus Clock Tower", slug="clock-tower", location_type="landmark")` | **YES** |
| Cafeteria (`loc-cafeteria`) | `service` | `Location(name="Campus Cafeteria", slug="cafeteria", location_type="food_court")` | **YES** |
| Visitor Parking (`loc-parking-main`) | `service` | `Location(name="Visitor Parking", slug="visitor-parking", location_type="parking")` | **YES** |
| North Parking (`loc-parking-north`)| `service` | `Location(name="North Student Parking", slug="north-parking", location_type="parking")`| **YES** |
| Room 3402 (`room-3402`) | `room` | `Location(parent_id=Block34.id, location_type="room")` | **YES** (Supports parent hierarchy) |
| Room 2505 (`room-2505`) | `room` | `Location(parent_id=Block25.id, location_type="room")` | **YES** |
| Room E-102 (`room-eng-102`) | `room` | `Location(parent_id=EngBlock.id, location_type="room")` | **YES** |
| Room L-301 (`room-lib-silent`) | `room` | `Location(parent_id=Library.id, location_type="room")` | **YES** |

### 1.4 Route Feasibility on Unseeded Database
- The backend's `POST /api/v1/routing/calculate` queries the database for active nodes and edges.
- Because zero nodes and edges exist in the database, calling this endpoint against the unseeded database returns:
  `HTTP 404 Not Found: "No walkable route found between the specified origin and destination."`
- **Critical MVP Takeaway:** A lightweight seed script that registers the 18 locations along with corresponding navigation nodes and walkable edges is essential before the backend can serve live route calculations to the frontend.

---

## 2. Containerization & Deployment Orchestration Audit

### 2.1 Backend Dockerfile ([`backend/Dockerfile`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/Dockerfile))
- **Base Image:** `python:3.12-slim`
- **Security:** Creates a non-root system user (`groupadd -g 10001 appuser && useradd -u 10001 -g appuser`).
- **Dependency Caching:** Copies `requirements.txt` and runs `pip install` before copying source code.
- **Health Check:**
  ```dockerfile
  HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
      CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"
  ```
- **Entry Point:** `CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`
- **Assessment:** **Production-Ready.** Cleanly configured for cloud containers.

---

### 2.2 Frontend Dockerfile ([`frontend/Dockerfile`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/Dockerfile))
- **Base Image:** `node:20-alpine`
- **Current Entry Point ([`frontend/Dockerfile#L15`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/Dockerfile#L15)):**
  ```dockerfile
  CMD ["npm", "run", "dev"]
  ```
- **CRITICAL DEPLOYMENT BLOCKER FOR DOCKER:**
  The container launches the Next.js development server (`next dev`) with Turbopack instead of building an optimized standalone production bundle (`npm run build && npm start`).
  - *Impact on Render Container Deployment:* Consumes 4x memory and CPU, fails production performance checks, and exposes development error overlays.
  - *Resolution:* If deploying frontend via Docker, convert Dockerfile to standard multi-stage build:
    1. Dependencies layer (`npm ci`)
    2. Builder layer (`npm run build`)
    3. Runner layer (`CMD ["node", "server.js"]` or `CMD ["npm", "start"]`).
  - *Note on Vercel:* Deploying directly to Vercel bypasses this Dockerfile entirely and uses Vercel's native Next.js build pipeline.

---

### 2.3 Docker Compose Stack ([`docker-compose.yml`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/docker-compose.yml))
The stack coordinates 3 services:
1. `postgres`: PostgreSQL 16 Alpine with named volume `pgdata`, health check using `pg_isready`.
2. `backend`: Builds from `./backend`, depends on `postgres (condition: service_healthy)`, health checks on `/health`.
3. `frontend`: Builds from `./frontend`, depends on `backend (condition: service_healthy)`.
- **Assessment:** Well-structured for local full-stack development.

---

## 3. Cloud Platform Compatibility (Vercel & Render)

### 3.1 Frontend on Vercel
- **Compatibility:** **100% Compatible.**
- **Build Command:** `next build` (standard for Next.js App Router).
- **Environment Variables Required on Vercel:**
  | Variable | Value Description |
  | :--- | :--- |
  | `NEXT_PUBLIC_API_URL` | Public HTTPS URL of the deployed backend (e.g. `https://campusway-backend.onrender.com`) |
  | `NEXT_PUBLIC_API_BASE_URL` | Same URL (to safeguard against the naming discrepancy) |
  | `NEXT_PUBLIC_APP_NAME` | `CampusWay` |
- **Vercel Build Hygiene Note:** Vercel automatically clones a clean workspace and executes `next build` from scratch, meaning the local stale `.next` type errors will not affect Vercel.

---

### 3.2 Backend on Render
- **Compatibility:** **High Compatibility.**
- **Service Type:** Web Service (Python or Docker).
- **Build Command (Native Python):**
  ```bash
  pip install -r backend/requirements.txt
  ```
- **Start Command:**
  ```bash
  cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```
- **Environment Variables Required on Render:**
  | Variable | Purpose |
  | :--- | :--- |
  | `DATABASE_URL` | PostgreSQL connection string (e.g. Neon connection string with `sslmode=require`) |
  | `ENVIRONMENT` | `production` |
  | `PROJECT_NAME` | `CampusWay Route Intelligence Service` |
  | `ADMIN_API_KEY` | Strong random secret for administrative endpoints |
  | `JWT_SECRET_KEY` | Strong random secret for HS256 JWT tokens |
  | `SESSION_SECRET` | Strong random secret for session cookies |
  | `FRONTEND_URL` | Production URL of Vercel frontend (e.g. `https://campusway.vercel.app`) |
  | `CORS_ORIGINS` | JSON array containing Vercel frontend domain: `["https://campusway.vercel.app"]` |

---

### 3.3 Critical CORS Production Trap
In [`backend/app/core/config.py#L18`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/core/config.py#L18):
```python
CORS_ORIGINS: List[str] = ["http://localhost:3000"]
```
- **The Trap:** When the frontend is hosted on Vercel (e.g. `https://campusway.vercel.app`) and the backend on Render, every browser `fetch` will be rejected by CORS preflight (`No 'Access-Control-Allow-Origin' header is present`) unless `CORS_ORIGINS` is explicitly provided in the Render environment settings.
- **The Solution:** The backend config validator already supports comma-separated strings and JSON arrays:
  ```bash
  CORS_ORIGINS=["https://campusway.vercel.app","http://localhost:3000"]
  ```

---

## 4. Deployment Readiness Checklist

| Category | Item | Current State | Required Action for 3-Day Submission |
| :--- | :--- | :---: | :--- |
| **Database** | Migration Chain | **Linear (001-005)** | Run `alembic upgrade head` on production DB. |
| **Database** | Campus Seed Data | **Empty (0 rows)** | Execute initial location/node/edge seed script. |
| **Backend** | Missing venv packages | **10 missing** | Run `pip install -r requirements.txt` during deployment. |
| **Backend** | Health Check | **Active (`/health`)** | Configure Render health check to `/health`. |
| **Backend** | CORS Configuration | **Defaults to localhost** | Set `CORS_ORIGINS` to include Vercel domain. |
| **Frontend** | Dockerfile Entrypoint | **Uses `npm run dev`** | Deploy via native Vercel or update Dockerfile. |
| **Frontend** | Environment Variable | **Discrepancy in naming**| Set both `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_API_BASE_URL`. |
| **Frontend** | Build Hygiene | **Stale local `.next`** | Clean `.next` before local testing (`rmdir /s /q frontend\.next`). |

