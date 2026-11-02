# CampusWay | Campus Navigation & Wayfinding System

> **Campus Wayfinding Engine for Lovely Professional University (LPU), Punjab, India**<br />
> Solves the numbered block navigation challenge (e.g., *"Which Block is 34?"*) through topological pedestrian graph routing, turn directions, gate QR integrations, and visitor assistance.

---

## 1. System Status & Verification

CampusWay is a full-stack, production-grade navigation platform combining an architectural Next.js frontend with an async FastAPI backend and cloud PostgreSQL database:

- **Frontend Application**: Next.js 16 (App Router), React 19, and Tailwind CSS v4 with full client/server component separation, dynamic authentication state rendering, and zero-flash loading skeletons.
- **Backend Architecture**: FastAPI with asynchronous SQLAlchemy 2.0, connection pooling, and strict database transaction boundaries.
- **Authentication & Security**: Argon2id password hashing, Google OAuth 2.0 SSO, server-side revocable session storage with SHA-256 token hashing, and hardened HttpOnly cookie management -- fully connected and verified with Neon Cloud PostgreSQL.
- **Database (Neon Cloud)**: Serverless PostgreSQL 16 on Neon with connection pooling, asyncpg driver, and single-head Alembic migrations (`001_initial_schema_v1` through `003_add_user_sessions` and `004_report_resolution_notes`).
- **Pathfinding**: Predecessor-based Dijkstra & A* algorithms, cardinal bearing calculation, and configurable walking time estimation.
- **Map Ingestion**: Provenance-aware OpenStreetMap & GeoJSON staging pipeline with duplicate detection and administrative review.
- **Docker**: Hardened multi-stage container build with unprivileged execution (`appuser`), service health checks, and compose orchestration.

---

## 2. High-Level Architecture

```mermaid
graph TD
    subgraph Clients["Frontend Clients & Touchpoints"]
        WebClient["Next.js 16 Web Application"]
        MobileClient["Mobile & Responsive PWA"]
        QRKiosk["Signpost QR Wayfinding"]
    end

    subgraph Backend_Gateway["FastAPI Gateway (/api/v1)"]
        Auth["/auth (Argon2id / Google OAuth / Sessions)"]
        Loc["/locations (Catalog & Search)"]
        Route["/routing (Dijkstra / A*)"]
        Import["/import (Map Provenance)"]
        Assist["/assistance (Visitor & QR)"]
        UserModules["/favorites & /reports"]
    end

    subgraph Core_Services["Domain Logic & Engines"]
        Pathfinding["RoutingEngine (Dijkstra, A*, Turns)"]
        Provenance["ImportService (GeoJSON Staging)"]
        Hierarchy["LocationService (Cycle Guard)"]
        Security["Security (Argon2id, SHA-256 Tokens)"]
    end

    subgraph Storage["Persistence Layer"]
        Postgres[("PostgreSQL / Neon Cloud DB")]
    end

    Clients --> Backend_Gateway
    Backend_Gateway --> Core_Services
    Core_Services --> Storage
```

---

## 3. Key Capabilities & Core Modules

### 1. Authentication & Session Security (`/api/v1/auth`)
- **Argon2id Password Hashing**: Compliant with OWASP recommended memory and time parameters.
- **Google OAuth 2.0 SSO**: Secure authorization code exchange with state parameter CSRF validation.
- **Database-Backed Sessions**: Server-side revocable sessions with SHA-256 token hashing; tokens are validated against database state on every authenticated request.
- **Configurable Lifetimes**: Standard sessions expire in 24 hours; "Remember Me" sessions persist for 30 days.
- **Immediate Server-Side Revocation**: Logouts instantly invalidate sessions in the database.

### 2. Topological Pedestrian Routing Engine (`/api/v1/routing`)
- Point-to-point shortest walking paths using optimized Dijkstra & A* pathfinding.
- Forward azimuth bearing calculation generating natural turn instructions (*"Turn right onto the corridor"*, *"Take the ramp"*).
- Wheelchair and mobility accessibility constraints (`accessible_only=true`).
- Dynamic walking duration estimation based on configurable pedestrian speeds (~1.3 m/s).

### 3. Hierarchical Location Catalog (`/api/v1/locations`)
- Multi-tier spatial hierarchy (Campus -> Building -> Floor -> Room).
- Cycle prevention and safe cascading soft-deactivation.
- Dual-mode search ranking exact matches above partial and normalized alias matches.
- Dedicated administrative verification workflow (`/verify`) maintaining clear provenance boundaries.

### 4. Interactive Frontend Dashboard (`frontend/src/`)
- Responsive dark-theme architectural magazine UI.
- Interactive campus exploration dashboard (`/explore`) with Block 34 navigation, popular route teasers, and saved destinations.
- Context-driven hero CTAs that react to user authentication status in real time.

### 5. Provenance-Aware Map Import Pipeline (`/api/v1/import`)
- Ingestion of external OpenStreetMap ways/nodes and surveyor GeoJSON FeatureCollections.
- Spatial proximity and name similarity duplicate candidate detection against canonical records.
- Staging lifecycle with administrative review approval and promotion into canonical locations.

### 6. Visitor Assistance & Signpost QR Wayfinding (`/api/v1/assistance`)
- Interactive visitor destination cards indicating walking route topology availability.
- Visitor assistance request ticketing workflow (`pending` -> `assigned` -> `resolved`).
- Tamper-proof HMAC-SHA256 signpost QR code generation and resolution.

### 7. Favorites & Community Map Reports (`/api/v1/favorites`, `/api/v1/reports`)
- Bookmarked user destinations with ownership enforcement.
- Pathway blockage, accessibility issue, and map feature problem reporting with resolution notes.

---

## 4. Documentation Index

Comprehensive technical documentation is maintained in the [`docs/`](docs/) directory:

- [Frontend Integration Contract (`docs/API_INTEGRATION.md`)](docs/API_INTEGRATION.md) — Endpoint specifications, TypeScript interfaces, request/response bodies, and status codes.
- [Backend Architecture (`docs/BACKEND_ARCHITECTURE.md`)](docs/BACKEND_ARCHITECTURE.md) — System design, data flow diagrams, security model, and component breakdown.
- [Database Schema (`docs/DATABASE_SCHEMA.md`)](docs/DATABASE_SCHEMA.md) — Entity-Relationship diagram, table definitions, indexes, and Alembic migration history.
- [Routing Engine Specification (`docs/ROUTING_ENGINE.md`)](docs/ROUTING_ENGINE.md) — Dijkstra & A* pathfinding, bearing mathematics, turn instructions, and complexity analysis.
- [Map Import & Surveyor Guide (`docs/MAP_IMPORT_GUIDE.md`)](docs/MAP_IMPORT_GUIDE.md) — GeoJSON schemas, staging workflow, duplicate detection, and surveyor instructions.
- [Local Environment Setup (`docs/ENVIRONMENT_SETUP.md`)](docs/ENVIRONMENT_SETUP.md) — Step-by-step developer onboarding and environment variable reference.
- [Testing & Quality Assurance (`docs/TESTING.md`)](docs/TESTING.md) — Test architecture, module breakdown, coverage, and execution commands.
- [Production Deployment Guide (`docs/DEPLOYMENT.md`)](docs/DEPLOYMENT.md) — Docker Compose, Neon Cloud database tuning, SSL mode, and security checklists.
- [Backend Audit & Roadmap (`docs/BACKEND_AUDIT.md`)](docs/BACKEND_AUDIT.md) — Baseline audit and milestone delivery records.

---

## 5. Quick Start (Local Development)

### 5.1 Prerequisites
- **Node.js**: 18+ (tested on Node v20/v22/v24)
- **Python**: 3.12+ (tested on Python 3.12/3.13)
- **PostgreSQL**: Neon Cloud PostgreSQL or local PostgreSQL 16+

---

### 5.2 One-Command Startup (Concurrent)
From the repository root, start both the FastAPI backend and Next.js frontend together:
```bash
npm run dev
```

- **Web Application**: [http://localhost:3000](http://localhost:3000)
- **Sign In Portal**: [http://localhost:3000/login](http://localhost:3000/login)
- **Interactive Campus Dashboard**: [http://localhost:3000/explore](http://localhost:3000/explore)
- **Backend Interactive Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

### 5.3 Running Services Individually

#### Option A: Next.js Frontend
```bash
# From frontend/
npm install
npm run dev
```

#### Option B: FastAPI Backend
```powershell
# From backend/ (Windows PowerShell)
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

---

### 5.4 Environment Configuration

#### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

#### Backend (`backend/.env`)
```env
# Database
DATABASE_URL=postgresql://user:password@ep-sample-pooler.region.aws.neon.tech/neondb?sslmode=require

# Security Secrets (min 32 characters in production)
SESSION_SECRET=campusway-dev-secret-key-must-be-changed-in-production-min-32-chars
ENVIRONMENT=development

# Google OAuth 2.0 Credentials (https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

# Client URLs
FRONTEND_URL=http://localhost:3000
```

---

## 6. Testing & Quality Assurance

### Frontend Builds and Linting
```bash
# Build production bundle
npm --prefix frontend run build

# Run TypeScript type check
npm --prefix frontend run type-check

# Run linter
npm --prefix frontend run lint
```

### Backend Automated Test Suite
```powershell
# Run all async backend tests
backend\venv\Scripts\pytest backend/tests -v
```

---

## 7. Docker Deployment

Launch the full stack (PostgreSQL, FastAPI Backend, and Next.js Frontend) using Docker Compose:

```bash
docker compose up -d --build
```

- Backend API: `http://localhost:8000/api/v1`
- Frontend Web App: `http://localhost:3000`
