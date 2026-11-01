# CampusWay Backend Architecture Audit & Baseline Report

**Project**: CampusWay — Campus Navigation System for Lovely Professional University (LPU), Punjab, India  
**Repository**: `06Pseudo06/Campus-Navigation`  
**Audit Date**: November 2026  
**Auditor**: Lead Backend Architect & Senior FastAPI Engineer  

---

## 1. Executive Summary

This audit assesses the state of the CampusWay backend service, establishing the exact baseline before completing the production-ready navigation and campus intelligence engine.

The backend is built with **FastAPI**, **SQLAlchemy ORM (2.0)**, **Pydantic v2**, and **PostgreSQL (with Neon cloud database support and local Docker Compose)**. The existing core database schema and primary API routing structure are in place. However, key modules remain placeholders or prototypes:
- Dedicated pathfinding algorithms (`routing/algorithms.py`) and turn direction generators (`routing/directions.py`) are unlinked stubs.
- In-memory graph loading (`routing/graph.py`) has an empty stub while Dijkstra pathfinding was embedded directly inside `graph_service.py` with unbounded priority queue state.
- Authentication relies on hardcoded static API keys and header UUID injection without full credential management, secure token lifecycles, or provider integration interfaces.
- Visitor assistance (`/api/v1/assistance`) is a single placeholder endpoint.
- Location verification has no separate staging or provenance-tracking pipeline for external campus map data (OpenStreetMap/GeoJSON).

The existing test suite passes with **27 passed, 5 warnings** in ~1.84s using SQLite in-memory isolation.

---

## 2. Baseline Test Execution

```text
============================= test session starts =============================
platform win32 -- Python 3.13.1, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\Users\KK\Desktop\Projects\Campus Navigation\backend
plugins: anyio-4.15.1
collected 27 items

tests\test_api_integration.py ..........                                 [ 37%]
tests\test_main.py ..                                                    [ 44%]
tests\test_migrations.py ..                                              [ 51%]
tests\test_models.py ........                                            [ 81%]
tests\test_schemas.py .....                                              [100%]

============================== warnings summary ===============================
1. StarletteDeprecationWarning: Using `httpx` with `starlette.testclient` is deprecated.
2. SAWarning: transaction already deassociated from connection (conftest.py transaction rollback on failed constraint tests).
3. SAWarning: New instance <Favorite> with identity key conflicts with persistent instance (test_models.py).
======================= 27 passed, 5 warnings in 1.84s ========================
```

---

## 3. Detailed Component Audit

### 3.1 Database & ORM Layer
- **Models**:
  - `User`, `UserIdentity`: Covers basic profiles and OAuth identities. Lacks password storage or hashed secret credentials for direct user login.
  - `Location`, `LocationAlias`: Well-designed parent-child relationship with slug generation, normalized search alias, and coordinate range checks.
  - `Node`, `Edge`: Models navigation graph vertices and directed/bidirectional edges with distance and accessibility flags.
  - `Favorite`, `LocationReport`: Models bookmarks and user reports.
- **Migrations**:
  - `001_initial_schema_v1.py` establishes the baseline tables. Single head revision verified.
  - Schema requires an incremental migration for import staging/provenance and visitor assistance models.
- **Safety Policy**:
  - Neon shared cloud database must never be subjected to destructive migrations or table drops. Local SQLite/PostgreSQL instances will be used for testing and validation.

### 3.2 Authentication & Authorization (Milestone 3 Target)
- **Current State**:
  - `require_admin_role`: Verifies static `X-Admin-Key` or `Authorization: Bearer <ADMIN_API_KEY>`.
  - `get_current_user_id`: Directly parses `X-User-ID` or `Bearer <UUID>`.
- **Gaps**:
  - No user registration, password hashing (e.g. PBKDF2/bcrypt/HMAC-SHA256), or JWT authentication flow.
  - No `/auth/login`, `/auth/register`, `/auth/me`, or `/auth/logout` endpoints.
  - External identity interfaces (Google OAuth, Phone OTP) need explicit interface definitions, test mocks, and configuration validation.

### 3.3 Location Management Service (Milestone 4 Target)
- **Current State**:
  - Supports CRUD, search by partial/exact name or normalized alias, hierarchical ancestors and children, and cycle detection.
- **Gaps**:
  - `is_verified` can currently be toggled during standard creation/update. A dedicated administrative verification workflow is required.
  - Search ranking can be optimized for exact match precedence vs alias/partial matches.
  - Parent deactivation policy with active children needs consistent cascading protection.

### 3.4 Location Provenance & Map Import Foundation (Milestone 5 Target)
- **Current State**:
  - Not implemented. No models or endpoints exist to stage external map data (OSM, GeoJSON) or track provenance.
- **Gaps**:
  - Need `MapImportBatch` and `StagedLocation` / `LocationProvenance` schemas and tables.
  - Need deduplication detection against existing canonical locations and external IDs.
  - Need administrative review workflow: stage -> review -> promote to canonical / reject.

### 3.5 Navigation Graph & Routing Engine (Milestone 6 Target)
- **Current State**:
  - `graph_service.py` implements Dijkstra directly, but stores path lists and segment lists inside the priority queue tuple `(cost, current, path, segments)`, which increases memory complexity.
  - `routing/algorithms.py` and `routing/directions.py` raise `NotImplementedError`.
  - `routing/graph.py` contains an incomplete `load_graph` stub.
- **Gaps**:
  - Refactor pathfinding to `routing/algorithms.py` using predecessor map tracking.
  - Implement walking time estimation with realistic, configurable walking speeds (e.g. ~1.3 m/s).
  - Implement natural direction generation in `routing/directions.py` (bearing changes, turn instructions, corridor/pathway guidance).

### 3.6 Visitor Assistance (Milestone 7 Target)
- **Current State**:
  - Bare placeholder `/assistance/help-request` returning a dummy dict.
- **Gaps**:
  - Visitor destination lookup and accessibility queries.
  - Assistance requests with lifecycle status tracking (pending, acknowledged, resolved).
  - Secure QR-code reference token creation and resolution for physical wayfinding signs.

### 3.7 Favorites & Reports (Milestone 8 Target)
- **Current State**:
  - Basic favorites and report creation exist.
- **Gaps**:
  - Ownership enforcement on report modifications.
  - Edge and node reference reporting consistency and moderator notes.

### 3.8 Frontend Integration & API Documentation (Milestone 9 Target)
- **Current State**:
  - Frontend TypeScript types in `frontend/types/index.ts` match core contracts.
- **Gaps**:
  - Comprehensive API documentation in `docs/API_INTEGRATION.md` detailing every endpoint, payload, query parameter, error code, and example.

### 3.9 Testing, Docker & Deployment (Milestones 10-12)
- **Gaps**:
  - Expand test coverage to cover all new modules (auth, staging/import, algorithms, directions, visitor assistance).
  - Resolve SAWarning and deprecation warnings in test fixtures.
  - Hardened multi-stage Docker build, health check, and environment setup documentation.

---

## 4. Implementation Roadmap

| Milestone | Scope | Deliverables | Commit Message |
|---|---|---|---|
| **M1** | Repository Audit & Baseline | `docs/BACKEND_AUDIT.md` | `docs(backend): record baseline audit and implementation roadmap` |
| **M2** | Core Architecture & DB Integrity | Database lifecycle, session hygiene, config validation, test fixture cleanups | `refactor(backend): strengthen database and configuration foundation` |
| **M3** | Authentication & Authorization | Password hashing, JWT auth, user registration/login, `/auth/me`, auth interfaces | `feat(auth): complete secure authentication and authorization flows` |
| **M4** | Location Management Service | Admin verification workflow, enhanced ranking search, hierarchy lineage | `feat(locations): complete searchable hierarchical location service` |
| **M5** | Location Provenance & Map Import | Import batch models, staging tables, OSM/GeoJSON staging, admin review pipeline | `feat(import): add provenance-aware campus location import pipeline` |
| **M6** | Navigation Graph & Routing Engine | Predecessor Dijkstra, walking time estimation, turn/bearing directions | `feat(routing): complete campus graph and shortest-path engine` |
| **M7** | Visitor Assistance | Assistance request lifecycle, destination lookup, QR wayfinding token engine | `feat(assistance): complete visitor navigation assistance workflows` |
| **M8** | Favorites & Reports | Report moderation enhancements, resolution notes, user ownership validations | `feat(reports): enhance map reporting and user favorites workflows` |
| **M9** | API Quality & Frontend Integration | Complete endpoint contracts, `docs/API_INTEGRATION.md`, error model consistency | `docs(api): publish complete frontend integration contract` |
| **M10** | Testing & Reliability | Full unit & integration test suite expansion, warning-free test runs | `test(backend): expand backend unit and integration coverage` |
| **M11** | Docker & Deployment Readiness | Production Dockerfile, health checks, entrypoints, container security | `chore(deploy): harden backend Docker and runtime configuration` |
| **M12** | Final Documentation | Architecture docs, setup guides, ER diagrams, routing engine specs | `docs(backend): finalize architecture setup and integration guides` |

---

## 5. Final Audit & Implementation Outcomes

Every planned milestone in this audit has been executed, tested, committed, and pushed to the remote repository (`main` branch):

1. **Architecture & Database**: Database connection pooling, session hygiene, single-head Alembic migrations (`001_initial_schema_v1` through `004_report_resolution_notes`), and in-memory test isolation.
2. **Authentication & Authorization**: Stateless HS256 JWT, PBKDF2 password hashing, registration, login, `/auth/me`, logout, Google SSO and Phone OTP provider adapters with test mocks.
3. **Location Hierarchy & Search**: Exact-vs-partial ranking, duplicate sibling prevention, cycle detection, dedicated `/verify` workflow, ancestor chains, and children queries.
4. **Map Import Pipeline**: Full provenance-aware staging for external OSM and GeoJSON data (`MapImportBatch`, `StagedLocation`), duplicate candidate detection, and admin review approval/rejection.
5. **Routing & Pathfinding**: Predecessor-based Dijkstra and A* pathfinding, cardinal bearing calculation, human turn directions, and configurable walking time estimation.
6. **Visitor Assistance & QR**: Ticketing workflow (`pending` -> `assigned` -> `resolved`), visitor destination cards with route topology checks, and tamper-proof HMAC-SHA256 signpost QR codes.
7. **Favorites & Reports**: User ownership enforcement, duplicate bookmark prevention, and administrative issue resolution notes.
8. **Testing & Reliability**: Test suite expanded from **27 passed** to **66 passed, 0 failures**.
9. **Docker & Runtime**: Hardened multi-stage Dockerfile with non-root user (`appuser:appuser`), service health checks on `/health`, and dependent service synchronization in `docker-compose.yml`.
10. **Integration Contracts**: Complete documentation delivered across `docs/API_INTEGRATION.md`, `docs/BACKEND_ARCHITECTURE.md`, `docs/DATABASE_SCHEMA.md`, `docs/ROUTING_ENGINE.md`, `docs/ENVIRONMENT_SETUP.md`, `docs/TESTING.md`, and `docs/DEPLOYMENT.md`.

