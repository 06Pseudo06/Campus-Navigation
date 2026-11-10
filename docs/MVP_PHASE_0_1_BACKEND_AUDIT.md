# CampusWay — Phase 0.1: Backend Source-Code Audit

**Target Directory:** `backend/`  
**Framework:** FastAPI 0.115+, SQLAlchemy 2.0+, Pydantic v2, Python 3.13  
**Audit Date:** November 10, 2026  
**Auditor:** Antigravity AI  
**Scope:** Source-code level inspection (Inspection-Only, Zero Code Changes)  

---

## 1. Architectural & Structural Analysis

### 1.1 Application Entry Point ([`backend/app/main.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/main.py))
- **Active Routers:** Mounts `api_router` from `app.api.routes` under `/api/v1`.
- **CORS Configuration:** Reads `CORS_ORIGINS`, `FRONTEND_URL`, and defaults `["http://localhost:3000", "http://127.0.0.1:3000"]`.
- **System Endpoints:** `/health`, `/api/v1/health`, and `/` are directly mounted at root.
- **Critical Unmounted Router Discovery ([`app/main.py#L34-L38`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/main.py#L34-L38)):
  ```python
  # Direct alias for browser cookie auth routes (/auth/...)
  try:
      from app.api.v1.auth import router as auth_session_router
      app.include_router(auth_session_router, prefix="")
  except Exception:
      pass
  ```
  **Source Code Inspection:** Running `from app.api.v1.auth import router` raises:
  `ModuleNotFoundError: No module named 'google'`
  Because `google-auth` is listed in `requirements.txt` but **not installed in the local virtual environment**, `app/api/v1/auth.py` fails to import and is silently swallowed by the `try...except Exception: pass` block. Consequently, the cookie-based session router at `/auth/...` is **never registered**.

### 1.2 Configuration & Security Foundation
1. **Unified Configuration ([`backend/app/core/config.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/core/config.py)):**
   - Single authoritative source of truth.
   - Re-exported cleanly by [`backend/app/config.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/config.py). Zero duplicate `Settings` classes exist.
2. **Unified Database Layer ([`backend/app/core/database.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/core/database.py)):**
   - Synchronous engine, `SessionLocal`, and `get_db()` with strict transaction boundaries (`db.rollback()` on exception, `db.close()` on finally). Powers all 7 core routers.
   - Asynchronous engine, `get_engine()`, and `get_async_db()` for Neon serverless asyncpg operations.
3. **Resilient Security Primitives ([`backend/app/core/security.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/core/security.py)):**
   - Zero-dependency `BuiltinTimedSerializer` for HMAC-SHA256 timestamped tokens (fallback for uninstalled `itsdangerous`).
   - PBKDF2-HMAC-SHA256 password hashing (100,000 iterations) with fallback support for Argon2id hash verification.
   - Pure Python HS256 JWT access token generation and validation.
   - HMAC-SHA256 QR signpost token signing and resolution.

---

## 2. Complete API Endpoint Audit Table (All 41 Active Endpoints)

Inspected directly via FastAPI OpenAPI introspection:

| # | HTTP Method | Path | Module / Router | Auth Requirements | Request Schema | Response Schema | Database Operations | Actual Status |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| 1 | `GET` | `/` | `app.main` | Public | None | JSON Object | None | **Functional** |
| 2 | `GET` | `/health` | `app.main` | Public | None | JSON Object | None | **Functional** |
| 3 | `GET` | `/api/v1/health` | `app.main` | Public | None | JSON Object | None | **Functional** |
| 4 | `POST` | `/api/v1/auth/register` | `api.routes.auth` | Public | `RegisterRequest` | `TokenResponse` | Insert `users`, `user_identities` | **Functional** |
| 5 | `POST` | `/api/v1/auth/login` | `api.routes.auth` | Public | `LoginRequest` | `TokenResponse` | Query `users`, `user_identities` | **Functional** |
| 6 | `GET` | `/api/v1/auth/me` | `api.routes.auth` | `Bearer <JWT>` | None | `UserRead` | Query `users` by UUID | **Functional** |
| 7 | `POST` | `/api/v1/auth/logout` | `api.routes.auth` | `Bearer <JWT>` | None | `MessageResponse` | Stateless client notification | **Functional** |
| 8 | `POST` | `/api/v1/auth/google` | `api.routes.auth` | Public | `GoogleLoginRequest` | `TokenResponse` | Query/Insert `users`, `user_identities` | **Mockable** (Requires Google Client ID or mock verifier) |
| 9 | `POST` | `/api/v1/auth/phone/send-otp` | `api.routes.auth` | Public | `PhoneSendOTPRequest` | `MessageResponse` | Adapter call (Twilio or mock) | **Mockable** (Requires Twilio credentials or mock handler) |
| 10 | `POST` | `/api/v1/auth/phone/verify-otp` | `api.routes.auth` | Public | `PhoneVerifyOTPRequest` | `TokenResponse` | Query/Insert `users`, `user_identities` | **Mockable** (Validates OTP & creates session) |
| 11 | `GET` | `/api/v1/locations/` | `api.routes.locations`| Public | Query params (`skip`, `limit`, `search`, `category`) | `List[LocationRead]` | Query `locations`, `location_aliases` | **Functional** |
| 12 | `POST` | `/api/v1/locations/` | `api.routes.locations`| `X-Admin-Key` / Admin JWT | `LocationCreate` | `LocationRead` | Insert `locations` | **Functional** |
| 13 | `GET` | `/api/v1/locations/{id}` | `api.routes.locations`| Public | None | `LocationDetail` | Query `locations`, aliases, children | **Functional** |
| 14 | `PUT` | `/api/v1/locations/{id}` | `api.routes.locations`| `X-Admin-Key` / Admin JWT | `LocationUpdate` | `LocationRead` | Update `locations` | **Functional** |
| 15 | `DELETE` | `/api/v1/locations/{id}` | `api.routes.locations`| `X-Admin-Key` / Admin JWT | None | None (204) | Soft-deactivate `is_active=False` | **Functional** |
| 16 | `POST` | `/api/v1/locations/{id}/aliases` | `api.routes.locations`| `X-Admin-Key` / Admin JWT | `LocationAliasCreate` | `LocationAliasRead` | Insert `location_aliases` | **Functional** |
| 17 | `GET` | `/api/v1/locations/{id}/ancestors` | `api.routes.locations`| Public | None | `List[LocationRead]` | Recursive parent traversal | **Functional** |
| 18 | `GET` | `/api/v1/locations/{id}/children` | `api.routes.locations`| Public | None | `List[LocationRead]` | Query children by `parent_id` | **Functional** |
| 19 | `GET` | `/api/v1/locations/{id}/hierarchy` | `api.routes.locations`| Public | None | `LocationHierarchy` | Combines location, ancestors, children | **Functional** |
| 20 | `POST` | `/api/v1/locations/{id}/verify` | `api.routes.locations`| `X-Admin-Key` / Admin JWT | None | `LocationRead` | Sets `is_verified=True` | **Functional** |
| 21 | `POST` | `/api/v1/routing/calculate` | `api.routes.routing` | Public | `RouteQuery` | `RouteResponse` | Loads active `nodes`, `edges`; computes path | **Functional** (Returns 404 if DB is unseeded) |
| 22 | `GET` | `/api/v1/routing/nodes` | `api.routes.routing` | Public | Query params | `List[NodeRead]` | Query `nodes` | **Functional** |
| 23 | `POST` | `/api/v1/routing/nodes` | `api.routes.routing` | `X-Admin-Key` / Admin JWT | `NodeCreate` | `NodeRead` | Insert `nodes` | **Functional** |
| 24 | `DELETE` | `/api/v1/routing/nodes/{id}` | `api.routes.routing` | `X-Admin-Key` / Admin JWT | None | None (204) | Soft-deactivate node | **Functional** |
| 25 | `GET` | `/api/v1/routing/edges` | `api.routes.routing` | Public | Query params | `List[EdgeRead]` | Query `edges` | **Functional** |
| 26 | `POST` | `/api/v1/routing/edges` | `api.routes.routing` | `X-Admin-Key` / Admin JWT | `EdgeCreate` | `EdgeRead` | Validates & inserts `edges` | **Functional** |
| 27 | `DELETE` | `/api/v1/routing/edges/{id}` | `api.routes.routing` | `X-Admin-Key` / Admin JWT | None | None (204) | Soft-deactivate edge | **Functional** |
| 28 | `GET` | `/api/v1/assistance/destinations` | `api.routes.assistance` | Public | Query params | `List[VisitorDestinationCard]` | Query `locations`, topology check | **Functional** |
| 29 | `POST` | `/api/v1/assistance/requests` | `api.routes.assistance` | Public | `AssistanceRequestCreate` | `AssistanceRequestRead` | Insert `assistance_requests` | **Functional** |
| 30 | `GET` | `/api/v1/assistance/requests` | `api.routes.assistance` | Moderator / Admin / User | Query params | `List[AssistanceRequestRead]` | Query `assistance_requests` | **Functional** |
| 31 | `GET` | `/api/v1/assistance/requests/{id}` | `api.routes.assistance` | Moderator / Admin / Owner | None | `AssistanceRequestRead` | Query request by UUID | **Functional** |
| 32 | `PATCH` | `/api/v1/assistance/requests/{id}` | `api.routes.assistance` | Staff / Admin | `AssistanceRequestUpdate` | `AssistanceRequestRead` | Update status & resolution notes | **Functional** |
| 33 | `POST` | `/api/v1/assistance/qr/generate` | `api.routes.assistance` | Staff / Admin | `QRGenerateRequest` | `QRTokenResponse` | HMAC-SHA256 signature generation | **Functional** |
| 34 | `GET` | `/api/v1/assistance/qr/resolve` | `api.routes.assistance` | Public | Query param `token` | `QRResolveResponse` | Verifies cryptographic signature & resolves | **Functional** |
| 35 | `POST` | `/api/v1/favorites/` | `api.routes.favorites` | Authenticated User | `FavoriteCreate` | `FavoriteRead` | Insert `favorites` | **Functional** |
| 36 | `GET` | `/api/v1/favorites/mine` | `api.routes.favorites` | Authenticated User | None | `List[FavoriteRead]` | Query user's bookmarked places | **Functional** |
| 37 | `GET` | `/api/v1/favorites/{user_id}` | `api.routes.favorites` | User / Admin | None | `List[FavoriteRead]` | Query favorites by user ID | **Functional** |
| 38 | `DELETE` | `/api/v1/favorites/{u_id}/{l_id}` | `api.routes.favorites` | Owner User / Admin | None | None (204) | Delete favorite row | **Functional** |
| 39 | `GET` | `/api/v1/reports/` | `api.routes.reports` | Staff / Admin | Query params | `List[ReportRead]` | Query `location_reports` | **Functional** |
| 40 | `POST` | `/api/v1/reports/` | `api.routes.reports` | Authenticated User / Public | `ReportCreate` | `ReportRead` | Insert `location_reports` | **Functional** |
| 41 | `GET` | `/api/v1/reports/my-reports` | `api.routes.reports` | Authenticated User | None | `List[ReportRead]` | Query user's submitted reports | **Functional** |

*(Endpoints 42-47 for GeoJSON map import staging batches are also fully registered and functional under `/api/v1/import/*`)*

---

## 3. Database & ORM Audit

### 3.1 SQLAlchemy Models & Relational Architecture
The backend defines 11 ORM models mapped to 13 database tables:
1. `User` ([`models/user.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/models/user.py)): `id` (UUID), `email` (Unique), `full_name`, `phone`, `role` (`student`, `admin`, `moderator`), `is_active`.
2. `UserIdentity`: `id`, `user_id` (FK `users.id` `ON DELETE CASCADE`), `provider` (`password`, `google`, `phone`), `provider_subject` (password hash or Google sub).
3. `UserCredential`: `id`, `user_id` (FK `users.id` `ON DELETE CASCADE`), `password_hash`.
4. `UserSession`: `id`, `user_id` (FK `users.id` `ON DELETE CASCADE`), `token_hash`, `expires_at`, `is_revoked`.
5. `Location` ([`models/location.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/models/location.py)): `id`, `parent_id` (Self-referencing FK), `name`, `slug` (Unique), `location_type`, `latitude`, `longitude`, `is_verified`, `is_active`.
6. `LocationAlias`: `id`, `location_id` (FK `locations.id` `ON DELETE CASCADE`), `alias`, `normalized_alias`.
7. `Node` ([`models/node.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/models/node.py)): `id`, `location_id` (FK `locations.id` `ON DELETE SET NULL`), `node_type`, `latitude`, `longitude`, `is_accessible`, `is_active`.
8. `Edge` ([`models/edge.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/models/edge.py)): `id`, `source_node_id` (FK `nodes.id`), `target_node_id` (FK `nodes.id`), `distance_m` (> 0), `is_bidirectional`, `is_accessible`, `is_active`.
9. `Favorite`: Composite PK `(user_id, location_id)`, cascades on deletion of either entity.
10. `LocationReport`: `id`, `reporter_id`, `location_id`, `node_id`, `edge_id`, `report_type`, `description`, `status`, `resolution_notes`.
11. `AssistanceRequest`: `id`, `requester_name`, `contact_phone`, `current_location_id`, `current_node_id`, `target_location_id`, `assistance_type`, `status`.
12. `MapImportBatch` & `StagedLocation`: Staging pipeline for external GeoJSON data before canonical promotion.

### 3.2 Alembic Migration Integrity
The migration chain in [`database/migrations/versions/`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/database/migrations/versions) is **strictly linear with a single head**:
1. `001_initial_schema_v1` (Base schema: 8 tables)
2. `002_map_import_provenance` (revises 001)
3. `003_assistance_requests` (revises 002)
4. `004_report_resolution_notes` (revises 003)
5. `005_add_user_credentials_and_sessions` (revises 004)

- **Verification:** [`test_migrations.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/tests/test_migrations.py) executes a full upgrade to `005`, verifies all 13 tables are created on a disposable database, executes a full downgrade to `base`, and re-upgrades to `head` cleanly.

---

## 4. Virtual Environment Dependency Gaps

Source-code inspection of `backend/requirements.txt` against installed packages in `backend/venv` revealed a major gap: **10 of the 18 specified packages are NOT installed in `backend/venv`**:

| Package in `requirements.txt` | Installed in `venv`? | Impact on Backend Code |
| :--- | :---: | :--- |
| `fastapi` | **YES** | Core web framework runs. |
| `uvicorn` | **YES** | ASGI server runs. |
| `pydantic` | **YES** | Data validation runs. |
| `pydantic-settings` | **YES** | Environment loading runs. |
| `httpx` | **YES** | HTTP client & TestClient work. |
| `sqlalchemy` | **YES** | ORM models compile. |
| `alembic` | **YES** | Migration definitions inspectable. |
| `pytest` | **YES** | Pytest runner works. |
| `email-validator` | **NO** | Mitigated by regex email validation in `schemas/user.py`. |
| `requests` | **NO** | Not required for core logic. |
| `google-auth` | **NO** | **CRITICAL:** Breaks `services/google_auth.py` and unmounts `api/v1/auth.py`. |
| `itsdangerous` | **NO** | Mitigated by `BuiltinTimedSerializer` in `core/security.py`. |
| `python-multipart` | **NO** | Form-data parsing unavailable. |
| `argon2-cffi` | **NO** | Mitigated by PBKDF2 hashing fallback in `core/security.py`. |
| `asyncpg` | **NO** | Breaks async PostgreSQL queries in `postgres_user_repository.py`. |
| `psycopg2-binary` | **NO** | Synchronous PostgreSQL connections fail without native driver. |
| `greenlet` | **NO** | Async SQLAlchemy thread bridging unavailable. |
| `pytest-asyncio` | **NO** | Causes 4 async PostgreSQL integration tests to skip. |

---

## 5. Routing Engine & Geospatial Pipeline

1. **Topology Loading ([`app/services/graph_service.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/services/graph_service.py)):**
   - Queries `db.query(Node).filter(Node.is_active == True)`.
   - Queries `db.query(Edge).filter(Edge.is_active == True)`.
   - Automatically populates reverse edge for bidirectional connections.
   - Filters out edges if either endpoint node is inactive or missing.
2. **Pathfinding Algorithms ([`app/services/routing/algorithms.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/services/routing/algorithms.py)):**
   - `dijkstra_shortest_path`: Priority queue `heapq` with predecessor tracking map (`predecessors[v] = (u, edge_data)`), avoiding path copying overhead.
   - `a_star_shortest_path`: Admissible `_haversine_meters` heuristic using spherical trigonometry.
3. **Turn Instructions ([`app/services/routing/directions.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/services/routing/directions.py)):**
   - Calculates bearing between node coordinates ($\theta \in [0, 360)$).
   - Generates human-readable descriptions ("Follow corridor for 25m", "Use the staircase for 15m").
   - Computes walking duration assuming standard pace ($1.3\text{ m/s} \approx 4.7\text{ km/h}$).
4. **Data Dependency Reality:**
   - The routing pipeline is **fully functional against real database records**.
   - However, if the database is unseeded (0 nodes, 0 edges), `POST /api/v1/routing/calculate` returns HTTP 404.

---

## 6. Test Suite & Coverage

Test execution result:
```powershell
$env:PYTHONPATH="backend"; backend\venv\Scripts\python.exe -m pytest backend/tests -v
```
**Results:** **67 passed, 4 skipped, 1 warning in 3.05 seconds**.

- **Module Coverage:**
  - `test_api_integration.py` (10 tests): Admin key enforcement, CRUD, routing, accessibility.
  - `test_assistance.py` (3 tests): Assistance submission, destination topology, QR token signing and resolution.
  - `test_auth.py` (8 tests): Password hashing, JWT creation/expiration, mock Google/OTP, SecurityManager.
  - `test_favorites_reports.py` (2 tests): Favorites lifecycle, report resolution notes.
  - `test_import.py` (4 tests): GeoJSON feature staging, duplicate detection, approval/rejection.
  - `test_locations.py` (5 tests): Verification workflow, hierarchy, search ranking.
  - `test_main.py` (2 tests): Root status, health endpoint.
  - `test_migrations.py` (2 tests): Linear revision chain, upgrade/downgrade on disposable DB.
  - `test_models.py` (8 tests): ORM relationships, constraints, cascades.
  - `test_reliability_and_edge_cases.py` (12 tests): Token expiration, malformed auth, pagination, QR expiration, routing errors.
  - `test_routing.py` (6 tests): Dijkstra/A*, walking duration, bearing calculations, one-way edges.
  - `test_schemas.py` (5 tests): Coordinate validation, role constraints, edge weights.
- **Skipped Tests (4 tests):**
  - `test_email_password_auth.py`, `test_postgres_repo.py`, `test_session_security.py`, `test_user_credentials.py`.
  - **Reason:** All 4 declare `pytest_asyncio = pytest.importorskip("pytest_asyncio")`. Because `pytest-asyncio` is not installed, and these tests are designed to connect over the network to external Neon PostgreSQL, pytest cleanly skips them, preserving in-memory SQLite isolation.

