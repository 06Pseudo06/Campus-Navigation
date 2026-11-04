# CampusWay — Post-Delivery Verification & Integration Readiness Report

**Project**: CampusWay — Campus Navigation & Wayfinding Service for Lovely Professional University (LPU), Punjab, India  
**Repository**: `06Pseudo06/Campus-Navigation`  
**Verification Date**: November 4, 2026  
**Auditor**: Independent Senior Software Architect & Security Verification Engineer  
**Baseline Verification Commit**: `3bbad2c` (Local HEAD)  
**Remote Head Under Audit**: `2be5721` (`origin/main`)  

---

## 1. Executive Summary

This report delivers an independent, empirical verification of the reported backend completion mandate for CampusWay. The previous delivery claimed a fully complete backend with 66 passing tests, robust authentication, an active routing graph engine, map import provenance staging, and 12 milestone commits pushed to `main`.

Our independent audit confirms that the core backend engineering mandate completed at commit `3bbad2c` is **genuine, robust, and verified with 66 passing tests (0 failures, 1 deprecation warning)** running in ~3.03s. The routing algorithms (Dijkstra and A*), turn-by-turn instruction generator, walking time calculator, location hierarchy, duplicate detection, and tamper-proof HMAC-SHA256 QR wayfinding tokens are all mathematically sound and fully tested.

However, our investigation uncovered **two critical findings**:
1. **Remote Repository Divergence & Regression on `origin/main`**: An uncoordinated merge commit (`f8b8dfd`) followed by commits `43d73a9` and `2be5721` was pushed to `origin/main` by another contributor on Nov 2, 2026. This merge introduced a severe regression on the remote branch by overwriting `backend/app/main.py` with an auth-only stub (stripping out `/locations`, `/routing`, `/assistance`, `/favorites`, `/reports`, and `/import`), and establishing a conflicting second Alembic tree (`backend/alembic/versions`). The authentic 12-milestone delivery remains intact at commit `3bbad2c`.
2. **External Connectivity & Mocked Integrations**: The shared Neon PostgreSQL cloud instance (`ep-misty-block-azpqi807-pooler`) timed out during read-only inspection (port 5432 unreachable/paused). External integrations for Google OAuth and Twilio SMS OTP are intentionally structured mockable interfaces that return HTTP 503 when unconfigured. There is currently no active rate-limiting middleware in the FastAPI application.

---

## 2. Repository Verification

### 2.1 Git Synchronization & Commit History
- **Local HEAD**: `3bbad2c` (`docs(backend): finalize architecture setup and integration guides`).
- **Remote `origin/main`**: Advanced to `2be5721` (`feat(auth): auth connected to database neon`).
- **Synchronization Status**: Diverged. Local `main` at `3bbad2c` is 4 commits behind `origin/main`:
  - `a92d5b1`: feat: implement persistent authentication and session security
  - `f8b8dfd`: merge: resolve conflicts across frontend, gitignore, docs, and backend models
  - `43d73a9`: feat(auth): auth is created
  - `2be5721`: feat(auth): auth connected to database neon

### 2.2 Milestone Commits Audit
All 12 reported milestone commits exist in the repository history:
1. `b8fb6c7` — **M1**: `docs(backend): record baseline audit and implementation roadmap`
2. `3bf66ef` — **M2**: `refactor(backend): strengthen database and configuration foundation`
3. `5097192` — **M3**: `feat(auth): complete secure authentication and authorization flows`
4. `1885953` — **M4**: `feat(locations): complete searchable hierarchical location service`
5. `f78673e` — **M5**: `feat(import): add provenance-aware campus location import pipeline`
6. `08648e6` — **M6**: `feat(routing): complete campus graph and shortest-path engine`
7. `5b3fc70` — **M7**: `feat(assistance): complete visitor navigation assistance workflows`
8. `3852293` & `fc7d3c1` — **M8**: `feat(favorites): complete user location favorites` / `feat(reports): implement map issue reporting and review workflow`
9. `dcc48da` — **M9**: `docs(api): publish complete frontend integration contract`
10. `852524d` — **M10**: `test(backend): expand backend unit and integration coverage`
11. `f142473` — **M11**: `chore(deploy): harden backend Docker and runtime configuration`
12. `3bbad2c` — **M12**: `docs(backend): finalize architecture setup and integration guides`

### 2.3 Working Copy Hygiene & Secret Leak Prevention
- **Working Tree**: Completely clean (`nothing to commit, working tree clean`).
- **Secret Tracking**: Checked git history across all commits for `backend/.env`. The live environment file was never committed to git.
- **Example Configuration**: `backend/.env.example` contains only benign placeholders and localhost configurations.
- **Artifacts**: Ignored directories (`.pytest_cache`, `__pycache__`, `venv`, `.next`) are properly handled by `.gitignore`.

---

## 3. Security Verification

| Component | Implementation Details | Operational Status | Production Requirement |
| :--- | :--- | :--- | :--- |
| **Password Hashing** | PBKDF2-HMAC-SHA256 with 100,000 iterations and 16-byte random salt (`secrets.token_hex(16)`). Constant-time verification with `hmac.compare_digest`. | **Operational** | Ready for production. |
| **JWT Access Tokens** | Stateless HS256 tokens with base64url encoding, signed with `JWT_SECRET_KEY`. Validates structure, signature (`hmac.compare_digest`), expiration (`exp`), and claims (`sub`, `role`, `email`). | **Operational** | Requires a 32+ character random secret in production `.env`. |
| **Administrative Authorization** | Protected endpoints check `X-Admin-Key` against `ADMIN_API_KEY` or JWT with `role="admin"`. Missing auth returns HTTP 401; invalid returns HTTP 403. | **Operational** | Ready for production. Rotate secret key. |
| **User Identity Isolation** | Endpoints (`/favorites/mine`, `/favorites/{user_id}`, `/reports/my-reports`) enforce JWT `sub` user UUID matching the target resource owner. | **Operational** | Ready for production. |
| **QR Wayfinding Signposts** | HMAC-SHA256 signed `CWQR.<payload>.<sig>` tokens. Verifies signature, expiration, active location state, and route topology readiness. | **Operational** | Ready for physical campus sign deployment. |
| **Google OAuth SSO** | `GoogleAuthProvider` verifies tokens against `oauth2.googleapis.com/tokeninfo` and validates `aud == GOOGLE_CLIENT_ID`. Checks `is_configured()`. | **Mocked Interface** | **Requires configuration**: Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Google Cloud Console. |
| **Mobile Phone OTP** | `PhoneOTPProvider` interfaces with Twilio Verify API. Checks `is_configured()`. | **Mocked Interface** | **Requires configuration**: Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_SERVICE_SID`. |
| **Rate Limiting** | No rate-limiting middleware (e.g. SlowAPI / Redis token bucket) is attached to `/api/v1/auth/login` or `/auth/register`. | **Missing / Gap** | **Action needed**: Implement rate limiting prior to public deployment to prevent credential brute-forcing. |
| **CORS Middleware** | Configured with `allow_credentials=True`, origins parsed from `settings.CORS_ORIGINS` (defaults to `["http://localhost:3000"]`). | **Operational** | Ready. Whitelist production domain upon deployment. |

---

## 4. Database Verification

### 4.1 Migration Chain & Downgrade Safety
Inspected `database/migrations/versions/`:
- `001_initial_schema_v1` (Revises: `None`)
  - Creates: `users`, `user_identities`, `locations`, `location_aliases`, `nodes`, `edges`, `favorites`, `location_reports`.
  - Downgrade: Drops tables in strict reverse-dependency order.
- `002_map_import_provenance` (Revises: `001_initial_schema_v1`)
  - Creates: `map_import_batches`, `staged_locations` with unique constraint on `(source_provider, external_element_id)`.
  - Downgrade: Drops `staged_locations` then `map_import_batches`.
- `003_assistance_requests` (Revises: `002_map_import_provenance`)
  - Creates: `assistance_requests` with foreign keys to `users`, `locations`, and `nodes`.
  - Downgrade: Drops `assistance_requests`.
- `004_report_resolution_notes` (Revises: `003_assistance_requests`)
  - Adds: `resolution_notes` text column to `location_reports`.
  - Downgrade: Drops column `resolution_notes`.

The migration chain is strictly linear, single-headed (`004_report_resolution_notes`), and has been verified for non-destructive downgrade and re-upgrade on an isolated SQLite instance (`test_migrations.py` PASSED).

### 4.2 SQLAlchemy ORM Model Alignment
- All SQLAlchemy models in `backend/app/models/` map 1:1 to the migration definitions.
- Local password authentication stores hashed passwords in `UserIdentity` where `provider="password"` and `provider_subject=<hash>`, decoupling authentication credentials from the core `User` profile without requiring schema alterations.
- UUID server defaults (`gen_random_uuid()`) and foreign key constraints (`ON DELETE CASCADE` / `ON DELETE SET NULL`) are correctly aligned between Python models and SQL DDL.

### 4.3 Neon Cloud Database State (Read-Only Inspection)
- A non-destructive, read-only inspection script was executed against the configured Neon PostgreSQL endpoint:
  `ep-misty-block-azpqi807-pooler.c-3.ap-southeast-1.aws.neon.tech:5432`
- **Result**: Connection timed out after multiple attempts (`psycopg2.OperationalError: connection to server ... port 5432 failed: timeout expired`).
- **Conclusion**: Either the free-tier compute instance is suspended, or outbound port 5432 is restricted by network firewall rules.
- **Safety**: In strict adherence to instructions, **zero migrations were run and zero writes or drops were attempted on the remote database**.

---

## 5. Routing Engine Verification

### 5.1 Algorithmic Correctness
1. **Dijkstra's Algorithm**:
   - Implemented with Python's `heapq` storing tuples of `(cost, node_id)`.
   - Uses predecessor back-pointers (`predecessors[node] = (prev_node, edge_data)`) rather than pushing route arrays into the heap. This maintains optimal $O(V \log V + E)$ time and $O(V + E)$ space complexity.
   - Guarded against zero or negative edge weights (`if edge_dist <= 0: continue`).
   - Identical origin-destination edge case returns 0.0m distance and single-node path without executing search loops.
   - Unreachable destinations cleanly return `None`.

2. **A\* Pathfinding & Admissibility**:
   - Uses Haversine distance heuristic (`_haversine_meters`) between intermediate nodes and the destination coordinate.
   - **Admissibility Proof**: In physical spherical space, great-circle distance is the geometric infimum of any walkable path between two points. Hence, $h(n) \le d(n, \text{dest})$ always holds **if and only if edge weights represent true physical metric distances**.
   - If coordinates are missing on nodes, the heuristic safely returns `0.0`, gracefully degrading to standard Dijkstra without breaking admissibility.

3. **Graph Topology Handling**:
   - **Directed vs Bidirectional**: Directed edges populate forward adjacency only; bidirectional edges populate both directions symmetrically.
   - **Accessibility Filtering**: If `accessible_only=True`, nodes with `is_accessible=False` and edges with `is_accessible=False` are purged during graph loading (`CampusGraph.load_from_db`) and skipped during traversal.
   - **Inactive Isolation**: Inactive nodes (`is_active=False`) and inactive edges are completely excluded from the in-memory graph. Edges connecting to an inactive node are pruned.

### 5.2 Walking-Time & Turn Calculations
- **Walking Time**: Evaluated using $t = d / v$ where default speed $v = 1.3\text{ m/s}$ (~4.7 km/h, configurable via `DEFAULT_WALKING_SPEED_MPS`). Outputs both seconds and rounded minutes.
- **Turn Directions**: Computes initial geographic bearings $[0, 360)^\circ$ between successive waypoint coordinates.
  - $\Delta \in [45^\circ, 135^\circ]$: `"Turn right onto <path_type>"`
  - $\Delta \in (135^\circ, 225^\circ]$: `"Make a U-turn onto <path_type>"`
  - $\Delta \in (225^\circ, 315^\circ]$: `"Turn left onto <path_type>"`
  - Otherwise: `"Continue straight along <path_type>"`
- **Path Types**: Human-friendly instructions for stairs (`"Use the staircase"`), ramps (`"Take the accessible ramp"`), corridors, and walkways.

### 5.3 Geometry & Real Campus Map Assumptions
The routing engine currently assumes:
1. **Non-coincident Waypoints**: If two adjacent nodes have identical lat/lon coordinates (e.g. elevator shaft or vertical stairwell on the same building footprint), $\Delta\text{bearing}$ evaluates to $0^\circ$. Vertical navigation requires floor-level guidance rather than compass bearings.
2. **True Metric Edge Weights**: Edge `distance_m` must accurately reflect actual ground distance. If an edge distance is entered lower than the Haversine distance between its nodes, A* admissibility is violated.
3. **Collinear Node Density**: Dense GPS point traces on curved roads without curve simplification (e.g. Ramer-Douglas-Peucker) may trigger repeated turn instructions.

---

## 6. Map Import & Staging Verification

An end-to-end synthetic GeoJSON test fixture was executed to verify the import pipeline without contaminating canonical data.

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {"id": "osm_node_101", "name": "LPU Block 34", "building": "university"},
      "geometry": {"type": "Point", "coordinates": [75.7050, 31.2530]}
    },
    {
      "type": "Feature",
      "properties": {"id": "osm_node_102", "name": "Highway Dhaba Outside Campus", "amenity": "restaurant"},
      "geometry": {"type": "Point", "coordinates": [75.7500, 31.2900]}
    }
  ]
}
```

### 6.1 Verified Pipeline Capabilities
- **Feature Parsing**: Successfully extracts coordinates (Point coordinates and Polygon centroid averaging), properties, and tags.
- **Provenance Preservation**: Source provider (`osm`), external ID (`osm_node_101`), source URL, and full raw tags JSON are recorded in `staged_locations`.
- **Deduplication**: `detect_canonical_duplicates` checks exact name matches and coordinate proximity within a 60-meter radius.
- **Administrative Staging**: Records enter as `verification_status="pending"`. They do not appear in public `/locations/` searches until reviewed.
- **Administrative Review Workflow**:
  - `approve`: Promotes staged record to a canonical `Location` row with `is_verified=True`, records `verified_by` and timestamp, and increments batch `promoted_records`.
  - `reject`: Flags staged record as `rejected` with `rejection_reason` (e.g., `"Off-campus commercial establishment outside LPU university perimeter"`), and increments batch `rejected_records`.
- **Batch Lifecycle**: Transitions automatically from `pending` -> `processing` -> `completed` when all staged records are resolved.

### 6.2 Campus Boundary Security Finding
**Critical Observation**: The staging layer currently does not have an automatic geographic polygon geofence bounding the LPU campus. If an operator uploads a large regional OpenStreetMap extract, surrounding off-campus buildings are accepted into `staged_locations`. Although administrative review prevents unapproved records from becoming canonical, an automated polygon bounding box (approx. Lat: $[31.24, 31.26]$, Lon: $[75.69, 75.72]$) should be added to reject off-campus features during initial parsing.

---

## 7. Runtime Verification

### 7.1 Pytest Suite Execution
Executed against `backend/tests` using the Python 3.13 virtual environment:
```text
======================== 66 passed, 1 warning in 3.03s ========================
```
- Total tests: **66 passed, 0 failures**.
- Coverage breakdown:
  - `test_api_integration.py`: 10 passed (Auth rejection, CRUD, hierarchy, inactive isolation, duplicates, favorites, reports).
  - `test_assistance.py`: 3 passed (Assistance tickets, destination cards, QR signing & verification).
  - `test_auth.py`: 7 passed (PBKDF2 hashing, JWT issue/decode/expire, admin keys, provider mocks).
  - `test_favorites_reports.py`: 2 passed (Favorites lifecycle, report resolution notes & ownership).
  - `test_import.py`: 4 passed (Batch staging, GeoJSON parsing, admin review, duplicate detection).
  - `test_locations.py`: 5 passed (Verification workflow, ranking search, hierarchy, deactivation safety).
  - `test_main.py`: 2 passed (Health check, root info).
  - `test_migrations.py`: 2 passed (Revision chain head, disposable DB upgrade/downgrade).
  - `test_models.py`: 8 passed (Model constraints, foreign keys, cascades, relationships).
  - `test_reliability_and_edge_cases.py`: 12 passed (Token tampering, edge validation, pagination, QR expiry).
  - `test_routing.py`: 6 passed (Walking speed, bearing angles, Dijkstra & A*, directions, one-way paths).
  - `test_schemas.py`: 5 passed (Pydantic coordinate bounds, no self-loops, role validation).

*Note on Warning*: 1 benign `StarletteDeprecationWarning` regarding `httpx` with `starlette.testclient`.

### 7.2 Live Server Probing
A live instance of `uvicorn app.main:app` was spawned on `127.0.0.1:8001` and probed via HTTP:
- `GET /health` $\rightarrow$ `HTTP 200 OK`
  `{"status":"healthy","service":"CampusWay Route Intelligence Service","version":"0.1.0"}`
- `GET /` $\rightarrow$ `HTTP 200 OK`
  `{"service":"CampusWay Route Intelligence Service","docs":"/api/v1/docs","status":"online"}`
- `GET /api/v1/openapi.json` $\rightarrow$ `HTTP 200 OK`
  Confirmed **40 registered endpoint paths** across auth, locations, routing, assistance, favorites, reports, and imports.

### 7.3 Docker & Container Configuration
- **Docker CLI**: Docker version 29.8.0, Compose version 5.5.1 detected.
- **Docker Daemon**: Docker Desktop Linux Engine is not currently running on the Windows host (`failed to connect to docker API at npipe`).
- **Dockerfile Inspection**:
  - Multi-stage build on `python:3.12-slim`.
  - Non-root user execution (`appuser:appuser`, UID 10001).
  - Layer caching with independent dependency installation.
  - Built-in container health check: `CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"`.
  - `docker-compose.yml` includes healthcheck conditions (`service_healthy`) synchronizing Postgres, Backend, and Frontend.

---

## 8. Frontend Integration Preparation

### 8.1 API Configuration & Base URLs
- **Base URL**: `http://localhost:8000/api/v1`
- **Frontend Environment Variable**: `NEXT_PUBLIC_API_URL=http://localhost:8000`
- **Interactive Documentation**: `http://localhost:8000/api/v1/docs`

### 8.2 Authentication & Session Flow
```text
[User / Visitor]
       |
       +---> Anonymous: Public access to search, routing, and QR resolution
       |
       +---> Register: POST /api/v1/auth/register
       |        Body: { "email": "...", "password": "...", "full_name": "..." }
       |        Returns: { "access_token": "...", "user": { ... } }
       |
       +---> Login: POST /api/v1/auth/login
       |        Body: { "email": "...", "password": "..." }
       |        Returns: { "access_token": "...", "user": { ... } }
       |
       +---> Authenticated Request:
                Header: "Authorization: Bearer <access_token>"
```

### 8.3 Location Search Example
- **Endpoint**: `GET /api/v1/locations/`
- **Parameters**: `?query=Block%2034&is_verified=true&limit=10`
- **Response (200 OK)**:
```json
[
  {
    "id": "c393ea65-d04b-486a-bca7-8f526369527e",
    "name": "Block 34 - School of Computer Science",
    "slug": "block-34-school-of-computer-science",
    "location_type": "building",
    "description": "Department of Computer Science and Engineering",
    "latitude": 31.2531,
    "longitude": 75.7048,
    "address_details": "Central Campus Boulevard",
    "is_verified": true,
    "is_active": true,
    "parent_id": null
  }
]
```

### 8.4 Route Calculation Example
- **Endpoint**: `POST /api/v1/routing/calculate`
- **Request Body**:
```json
{
  "origin_node_id": "a1b2c3d4-0000-0000-0000-000000000001",
  "destination_node_id": "a1b2c3d4-0000-0000-0000-000000000004",
  "accessible_only": false,
  "algorithm": "dijkstra"
}
```
- **Response (200 OK)**:
```json
{
  "origin_node_id": "a1b2c3d4-0000-0000-0000-000000000001",
  "destination_node_id": "a1b2c3d4-0000-0000-0000-000000000004",
  "total_distance_m": 125.5,
  "accessible": true,
  "estimated_duration_s": 96.5,
  "estimated_duration_min": 1.6,
  "path_nodes": [
    "a1b2c3d4-0000-0000-0000-000000000001",
    "a1b2c3d4-0000-0000-0000-000000000002",
    "a1b2c3d4-0000-0000-0000-000000000004"
  ],
  "segments": [
    {
      "source_node_id": "a1b2c3d4-0000-0000-0000-000000000001",
      "target_node_id": "a1b2c3d4-0000-0000-0000-000000000002",
      "distance_m": 50.0,
      "path_type": "footpath",
      "instruction": "Follow footpath for 50.0m"
    },
    {
      "source_node_id": "a1b2c3d4-0000-0000-0000-000000000002",
      "target_node_id": "a1b2c3d4-0000-0000-0000-000000000004",
      "distance_m": 75.5,
      "path_type": "corridor",
      "instruction": "Turn right onto corridor for 75.5m"
    }
  ]
}
```

### 8.5 Visitor Assistance & Signpost QR Example
- **QR Scanned Token**: `CWQR.<base64url_payload>.<signature>`
- **Resolve Endpoint**: `GET /api/v1/assistance/qr/resolve?token=CWQR...`
- **Response (200 OK)**:
```json
{
  "valid": true,
  "qr_type": "destination",
  "destination": {
    "id": "c393ea65-d04b-486a-bca7-8f526369527e",
    "name": "Block 34",
    "slug": "block-34",
    "location_type": "building",
    "description": "School of Computer Science",
    "latitude": 31.2531,
    "longitude": 75.7048,
    "is_accessible": true,
    "has_route_topology": true,
    "visitor_guidance": "Verified walking route available to destination."
  },
  "suggested_target_node_id": "a1b2c3d4-0000-0000-0000-000000000001",
  "has_route_topology": true,
  "routing_available": true,
  "status_message": "Wayfinding destination resolved with active route topology."
}
```

### 8.6 Error Handling Contracts
All error payloads follow FastAPI's standard RFC 7807 JSON structure:
```json
{
  "detail": "Human-readable explanation of error or constraint failure."
}
```
HTTP status codes used:
- `400 Bad Request`: Input validation, cyclic location parent, duplicate edge, or self-loop.
- `401 Unauthorized`: Missing authentication token, invalid session, or missing admin key.
- `403 Forbidden`: Insufficient role permissions or incorrect admin key.
- `404 Not Found`: Location, node, edge, report, or batch UUID not found.
- `422 Unprocessable Entity`: Schema/field type validation failure.
- `503 Service Unavailable`: External provider (Google OAuth, Twilio) called while unconfigured.

---

## 9. Identified Discrepancies & Blockers

1. **Remote Repository Divergence (CRITICAL)**:
   - On `origin/main`, commit `f8b8dfd` merged an external branch that truncated `backend/app/main.py` down to only mounting `/api/v1/auth`.
   - Pulling `origin/main` into local `main` would destroy the campus navigation routers and break tests.
   - **Resolution Required**: The remote branch `origin/main` must be reconciled with commit `3bbad2c` by creating a clean integration branch or force-aligning `origin/main` to preserve the 40-endpoint campus navigation API.

2. **Neon Database Cloud Connectivity**:
   - Outbound connections on TCP port 5432 to Neon timed out. The local SQLite test harness runs warning-free, and Docker Compose provides an isolated local PostgreSQL container.
   - **Action**: Check if Neon project `ep-misty-block-azpqi807` is paused in Neon Console, or switch `.env` to local Docker Postgres (`localhost:5432`) during development.

3. **Absence of Rate Limiting**:
   - No token bucket or leaky bucket rate limiter is currently protecting `/api/v1/auth/login` or `/api/v1/auth/register`. A malicious client could flood authentication requests.

4. **Campus Geofence Bounding Polygon**:
   - The map import staging pipeline accepts any GeoJSON feature regardless of geographic coordinates. It requires an automated boundary box filter for LPU campus.

5. **Frontend Shared Types Minor Gap**:
   - `frontend/types/index.ts` in commit `3bbad2c` omitted `estimated_duration_s` and `estimated_duration_min` on the `RouteResponse` interface, as well as the visitor assistance schemas (`VisitorDestinationCard`, `QRResolveResponse`).

---

## 10. Precise Readiness Assessment

### Category 1: Verified and Ready
*These components are mathematically sound, independently tested, and ready for production consumption without architectural changes.*
- **Campus Graph Routing Engine**: Predecessor-based Dijkstra, A* with Haversine heuristic, cycle/self-loop prevention, inactive node isolation, accessible-only filtering, one-way/bidirectional edge handling.
- **Turn-by-Turn Guidance & Walking Time**: Spherical bearing delta calculations, human turn classification, and speed-based time estimation ($1.3\text{ m/s}$).
- **Hierarchical Location Management**: CRUD, parent-child ancestor lineage, cycle detection, slug generation, alias search, and administrative verification workflow.
- **Map Import Staging & Deduplication**: Batch creation, GeoJSON point/polygon parsing, provenance capture, proximity duplicate detection, and admin review (approve/reject).
- **Physical QR Wayfinding Engine**: HMAC-SHA256 signpost token issuance and resolution with route topology validation.
- **User Favorites & Map Issue Reporting**: Scoped bookmarking, report moderation, and resolution notes.
- **Alembic Database Migrations (001–004)**: Clean linear chain with verified non-destructive rollback and re-upgrade.
- **Core Test Suite**: 66 passing tests executing in ~3.03s.

### Category 2: Ready After Configuration or External Integration
*These components have operational code and test mocks, but require external credentials or infrastructure activation before deployment.*
- **Google OAuth SSO**: Code and mock handlers operational; requires real `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` registered in Google Cloud Console.
- **Mobile Phone OTP (SMS)**: Code and mock handlers operational; requires real `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_SERVICE_SID`.
- **Neon Cloud PostgreSQL**: Code operational; requires waking up or verifying firewall access to `ep-misty-block-azpqi807-pooler.c-3.ap-southeast-1.aws.neon.tech:5432`.
- **Docker Compose Deployment**: Dockerfile and compose specs verified; requires starting the Docker Desktop daemon on the host machine.
- **Rate Limiting**: Requires adding SlowAPI or Nginx reverse-proxy rate limiting to authentication endpoints.

### Category 3: Blocked by Actual Campus Map Data or Unresolved Issues
*These items cannot be finalized until real university geographic data and repository branch alignment occur.*
- **Real LPU Campus Graph Coordinates**: Node waypoints, entrance coordinates, and edge lengths currently use synthetic fixtures. Production navigation requires real surveyed GPS coordinates of LPU campus paths, gates, and blocks.
- **LPU Geofencing Boundary**: Automatic filtering of off-campus surrounding buildings requires a true polygon boundary of Lovely Professional University.
- **Git Branch Re-synchronization on `origin/main`**: Unblocking team collaboration requires reconciling `origin/main` to restore the complete 40-endpoint API router from commit `3bbad2c`.

