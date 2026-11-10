# CampusWay — MVP Phase 2B.1: Local Database Ingestion Readiness Report

**Document Version:** 1.0.0  
**Target Branch:** `demo/submission-mvp`  
**Status:** **GO FOR PHASE 2B.2 INGESTION**  
**Date:** November 2026  

---

## 1. Executive Summary

This report establishes the local database ingestion readiness for Phase 2B.2 of the CampusWay MVP. The objective is to safely ingest the transformed Carleton University dataset into an isolated local PostgreSQL database and verify that all downstream CampusWay backend APIs can consume the ingested records.

### Readiness Status: **GO** (with Mandatory Operational Guardrails)

The technical assessment confirms that CampusWay is fully prepared for Phase 2B.2 ingestion, provided the following two operational safety protocols are strictly enforced:

1. **Neon Cloud Isolation Protocol:**  
   The file `backend/.env` contains active credentials pointing to a Neon Cloud PostgreSQL instance. To prevent catastrophic data leakage or unintended remote modifications, every command (Alembic migrations, ETL ingestion, and local backend startup) **must** supply an explicit local database URL or set `$env:DATABASE_URL` in the executing session. Furthermore, the ETL pipeline's built-in remote URL guard (`etl_carleton.py`) will automatically abort execution if any remote host (e.g. `*.neon.tech`, AWS, GCP, Azure) is detected.

2. **Host Port 5432 Conflict Resolution:**  
   Host port `5432` is currently occupied by an external Docker container (`meal_db`). To prevent port binding collisions, the CampusWay PostgreSQL service must be launched with `POSTGRES_PORT=5433` using the parameterized port mapping in [docker-compose.yml](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/docker-compose.yml#L10-L11).

3. **Strict Migration-First Execution Sequence:**  
   Alembic migrations (revisions `001` through `005`) must be executed **before** running the ETL script. When `etl_carleton.py` runs with `--commit`, its internal call to `Base.metadata.create_all()` will detect existing tables and gracefully operate as a safe no-op, preserving the Alembic version tracking table (`alembic_version`).

---

## 2. Database Configuration & Security Findings

A systematic inspection of configuration files, database modules, and environment templates revealed the following architecture and potential pitfalls:

### 2.1 Configuration Sources & Precedence

- **[backend/app/core/config.py](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/core/config.py#L20-L26):**  
  The `Settings` class defines a default fallback:
  ```python
  DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/campusway_db"
  ```
  However, lines [83–88](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/core/config.py#L83-L88) configure Pydantic `SettingsConfigDict` with:
  ```python
  env_file=(_ROOT_DIR / ".env", _BACKEND_DIR / ".env", ".env")
  ```
  Under Pydantic BaseSettings rules, values loaded from `.env` override default attributes unless explicit environment variables are set in the executing OS process.

- **[backend/.env](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/.env#L6-L7):**  
  Contains a live Neon cloud connection string:
  ```ini
  DATABASE_URL=postgresql://neondb_owner:***@ep-misty-block-azpqi807-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
  ```
  > [!CAUTION]
  > **Extreme Danger of Remote Ingestion:**  
  > If a command such as `alembic upgrade head` or `uvicorn app.main:app` is executed in a terminal without an explicit `DATABASE_URL` environment variable override, it will automatically connect to and execute against the live Neon database!

- **[database/migrations/env.py](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/database/migrations/env.py#L28-L34):**  
  Alembic resolves the migration target URL via:
  ```python
  def get_url() -> str:
      url = os.getenv("ALEMBIC_DATABASE_URL") or os.getenv("DATABASE_URL") or settings.DATABASE_URL
      if url.startswith("postgresql://"):
          url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
      return url
  ```
  This confirms that setting `$env:DATABASE_URL` or `$env:ALEMBIC_DATABASE_URL` in PowerShell overrides both `settings.DATABASE_URL` and `backend/.env`.

- **[backend/app/core/database.py](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/core/database.py#L22-L41):**  
  Synchronous SQLAlchemy engine initialized with `create_engine()` using connection pooling parameters (`DB_POOL_SIZE=10`, `DB_MAX_OVERFLOW=20`, `DB_POOL_PRE_PING=True`). Replaces `postgresql://` with `postgresql+psycopg2://`.

- **[backend/scripts/etl_carleton.py](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/scripts/etl_carleton.py#L966-L985):**  
  Equipped with a strict database guard in `commit_to_database()`:
  ```python
  remote_indicators = ["neon.tech", "pooler", "aws", "azure", "gcp", "compute.com"]
  local_host_indicators = ["localhost", "127.0.0.1", "::1", "@postgres", "@campusway_postgres"]
  ```
  Any target database URL containing remote indicators or lacking local host indicators will immediately raise a `PermissionError` and terminate before connecting.

---

## 3. Migration Readiness & Schema Coexistence

### 3.1 Migration Revision Chain

Inspection of [database/migrations/versions/](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/database/migrations/versions/) confirms a complete, single-head linear revision sequence:

| Revision | Down Revision | Description | Tables Created / Modified |
| :--- | :--- | :--- | :--- |
| `001_initial_locations_and_nodes` | `None` | Core navigation topology | `locations`, `location_aliases`, `nodes`, `edges` |
| `002_user_reports_and_assistance` | `001` | Feedback and visitor support | `location_reports`, `assistance_requests` |
| `003_map_imports_and_provenance` | `002` | Batch provenance tracking | `map_import_batches` |
| `004_user_favorites_and_personalization` | `003` | User bookmarks & favorites | `user_favorites` |
| `005_add_user_credentials_and_sessions` | `004` | Newer session-based auth | `users`, `user_credentials`, `user_sessions` |

This chain was tested and validated on disposable SQLite databases in [backend/tests/test_migrations.py](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/tests/test_migrations.py). Both `test_migration_revision_chain` and `test_migration_upgrade_and_downgrade_on_disposable_db` pass with zero errors.

### 3.2 Compatibility Between Alembic and `create_all()`

In `etl_carleton.py`, the `commit_to_database()` method executes:
```python
Base.metadata.create_all(bind=engine)
```
SQLAlchemy's `create_all()` checks table existence in the database catalog before emitting `CREATE TABLE` DDL:
- **Scenario A (Alembic First — Recommended):**  
  Running `alembic upgrade head` creates all tables from revisions 001–005 and stamps the database with the current version in `alembic_version`. When the ETL subsequently calls `Base.metadata.create_all()`, SQLAlchemy detects all tables already exist and issues no DDL commands. No conflicts occur, and migration tracking remains pristine.
- **Scenario B (ETL First — Dangerous):**  
  If the ETL were executed on an empty database without running Alembic first, `create_all()` would create tables without creating `alembic_version`. Running `alembic upgrade head` afterwards would fail immediately with `DuplicateTable: relation "locations" already exists`.

> [!IMPORTANT]
> **Operational Rule:**  
> Always execute `alembic upgrade head` before running `etl_carleton.py --commit`.

---

## 4. Local PostgreSQL Environment & Port Strategy

### 4.1 Docker Compose Configuration

The project's [docker-compose.yml](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/docker-compose.yml#L1-L19) specifies:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: campusway_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres_password
      POSTGRES_DB: campusway_db
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d campusway_db"]
      interval: 5s
      timeout: 5s
      retries: 5
```

### 4.2 Port Conflict Assessment & Resolution

- **Port Status:** Host port `5432` is currently bound by an unrelated external container (`meal_db` on `0.0.0.0:5432->5432/tcp`).
- **Resolution:** By setting the environment variable `POSTGRES_PORT=5433`, Docker maps container port `5432` to host port `5433`.
- **Target Connection String for Host CLI & ETL:**
  ```text
  postgresql://postgres:postgres_password@localhost:5433/campusway_db
  ```
- **Docker Internal Network Connection String (for backend container):**
  ```text
  postgresql://postgres:postgres_password@postgres:5432/campusway_db
  ```

---

## 5. Source Dataset Verification

The Carleton University campus dataset downloaded during Phase 1A was verified on disk:

- **Location:**  
  `C:\Users\KK\.gemini\antigravity\brain\fb7f0586-9047-471d-9f4b-f0c1235789b6\scratch\gapwise_data\universities\carleton\campus.json`
- **File Size:** `1,454,910 bytes` (~1.45 MB)
- **Automatic Detection:**  
  The `find_default_dataset()` function in [backend/scripts/etl_carleton.py](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/scripts/etl_carleton.py#L996-L1016) searches the brain scratch path and project data directories. Running `python backend/scripts/etl_carleton.py` automatically detects and parses this file without requiring manual `--input` flags.

---

## 6. Downstream API Compatibility Assessment

An in-depth code audit of backend API routes and schemas was conducted to ensure that data loaded by the Carleton ETL is seamlessly consumed by existing endpoints.

### 6.1 Location Endpoints — `backend/app/api/routes/locations.py`

- **`GET /api/v1/locations/`:**
  - Consumes the `Location` table via `location_service.list_locations()`.
  - Supports query search (`query`), category filtering (`location_type`), active state (`is_active`), and pagination (`skip`, `limit`).
  - Search ranking uses a 5-tier relevance heuristic: exact name $\rightarrow$ exact alias $\rightarrow$ prefix name $\rightarrow$ substring name $\rightarrow$ substring alias.
  - Returns `List[LocationRead]`: contains `id`, `name`, `slug`, `location_type`, `description`, `latitude`, `longitude`, `address_details`, `is_verified`, `is_active`, `parent_id`, `created_at`, `updated_at`.
  - **Centroid Coordinates:** Carleton buildings have `latitude` and `longitude` populated from polygon centroids.
  - **GeoJSON Note:** `LocationRead` does not include raw GeoJSON polygon geometry. For building footprint visualization, the frontend will consume the centroid points or raw GeoJSON from import payloads.

- **`GET /api/v1/locations/{location_id}`:**
  - Returns `LocationDetailRead`, including associated search `aliases` and sub-location `children`.
  - Does not directly list `Node` objects.

### 6.2 Routing Endpoints — `backend/app/api/routes/routing.py`

- **`POST /api/v1/routing/calculate`:**
  - Accepts `RouteQuery`:
    ```json
    {
      "origin_node_id": "uuid",
      "destination_node_id": "uuid",
      "accessible_only": false,
      "algorithm": "dijkstra"
    }
    ```
  - Calculates shortest paths using graph algorithms (`dijkstra` or `astar`) via `graph_service.compute_shortest_route()`.
  - Returns `RouteResponse` with `total_distance_m`, `accessible`, `path_nodes` (ordered node UUIDs), `segments`, and estimated walking times.

- **Client Location-to-Node Resolution Gap & Solution:**
  - The route calculation endpoint expects `Node` UUIDs, not `Location` UUIDs.
  - To bridge this gap, clients use either of two existing endpoints:
    1. **Direct Node Lookup Endpoint:**  
       `GET /api/v1/routing/nodes?location_id={location_id}`  
       Returns all active nodes with `Node.location_id == location_id`. In the Carleton dataset, every building has one or more associated entrance nodes (or a synthetic access node) attached with its `location_id`.
    2. **Visitor Destination Card Endpoint (Recommended for UX):**  
       `GET /api/v1/assistance/destinations`  
       Returns `VisitorDestinationCard` objects with `nearest_node_id` pre-resolved and `has_route_topology: true`.

### 6.3 Visitor Assistance Endpoints — `backend/app/api/routes/assistance.py`

- **`GET /api/v1/assistance/destinations`:**
  - Calls `assistance_service.list_visitor_destinations()`.
  - For each active location, executes `check_location_route_topology(db, loc.id)`:
    ```python
    node = db.query(Node).filter(Node.location_id == location_id, Node.is_active.is_(True)).first()
    has_edges = db.query(Edge.id).filter(
        or_(Edge.source_node_id == node.id, Edge.target_node_id == node.id),
        Edge.is_active.is_(True)
    ).first()
    ```
  - **Verification with Carleton Dataset:**  
    Because the ETL connects all 48 buildings with entrances to the pedestrian graph via entrance access edges, and connects the entrance-less building (Robertson Hall) via a synthetic boundary node and access edge, **100% of Carleton University buildings (49/49) have `has_route_topology = True` and a valid `nearest_node_id`**.

---

## 7. Execution Plan for Phase 2B.2 Ingestion

The exact, validated command sequence for Phase 2B.2 is defined below.

```
+-----------------------------------------------------------------------------------+
|                            PHASE 2B.2 EXECUTION FLOW                             |
+-----------------------------------------------------------------------------------+
|  1. Start Postgres (Port 5433)                                                    |
|     $env:POSTGRES_PORT="5433"                                                     |
|     docker compose up -d postgres                                                 |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|  2. Apply Alembic Migrations (001 -> 005)                                         |
|     $env:DATABASE_URL="postgresql://postgres:postgres_password@localhost:5433/..." |
|     backend/venv/Scripts/alembic.exe upgrade head                                 |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|  3. Run Carleton ETL Ingestion (--commit)                                         |
|     backend/venv/Scripts/python.exe backend/scripts/etl_carleton.py --commit ...  |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|  4. SQL Verification (Record Counts & Graph Connectivity)                        |
|     Locations: 49 | Aliases: 49 | Nodes: 829 | Edges: 2,058 | Batches: 1          |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|  5. API Verification (Uvicorn against Local DB)                                   |
|     - Test /api/v1/locations/                                                     |
|     - Test /api/v1/assistance/destinations                                        |
|     - Test /api/v1/routing/calculate (Dijkstra & A*)                              |
+-----------------------------------------------------------------------------------+
```

### Detailed Command Instructions

#### Step 1: Start Isolated Local PostgreSQL Container
```powershell
$env:POSTGRES_PORT = "5433"
docker compose up -d postgres
```
*Wait 5 seconds for healthcheck confirmation:*
```powershell
docker compose ps postgres
```

#### Step 2: Run Alembic Migrations
```powershell
$env:PYTHONPATH = "backend"
$env:DATABASE_URL = "postgresql://postgres:postgres_password@localhost:5433/campusway_db"
$env:ALEMBIC_DATABASE_URL = "postgresql://postgres:postgres_password@localhost:5433/campusway_db"

backend/venv/Scripts/python.exe -m alembic -c backend/alembic.ini upgrade head
```

#### Step 3: Run Carleton ETL Ingestion
```powershell
backend/venv/Scripts/python.exe backend/scripts/etl_carleton.py `
  --db-url "postgresql://postgres:postgres_password@localhost:5433/campusway_db" `
  --commit
```

#### Step 4: Verification Queries (PostgreSQL)
Run SQL query checks against `campusway_db` to verify exact expected counts:
```sql
SELECT 'locations' as tbl, count(*) FROM locations
UNION ALL SELECT 'location_aliases', count(*) FROM location_aliases
UNION ALL SELECT 'nodes', count(*) FROM nodes
UNION ALL SELECT 'edges', count(*) FROM edges
UNION ALL SELECT 'map_import_batches', count(*) FROM map_import_batches;
```
**Expected Counts:**
- `locations`: **49**
- `location_aliases`: **49**
- `nodes`: **829** (707 path nodes + 121 entrance nodes + 1 synthetic node)
- `edges`: **2,058** (1,840 path edges + 218 entrance edges)
- `map_import_batches`: **1**

#### Step 5: Test API Endpoints Against Local Database
Start the backend server bound to local PostgreSQL:
```powershell
$env:DATABASE_URL = "postgresql://postgres:postgres_password@localhost:5433/campusway_db"
$env:PORT = "8000"
backend/venv/Scripts/python.exe -m uvicorn app.main:app --port 8000
```
Test key endpoints:
1. `GET http://localhost:8000/api/v1/locations/?query=Library` $\rightarrow$ Returns MacOdrum Library.
2. `GET http://localhost:8000/api/v1/assistance/destinations?category=building` $\rightarrow$ 49 destinations with `has_route_topology=true`.
3. `POST http://localhost:8000/api/v1/routing/calculate` $\rightarrow$ Computes shortest path between two Carleton entrance nodes.

---

## 8. Risk Assessment & Mitigation Summary

| Risk | Severity | Root Cause | Enforced Mitigation |
| :--- | :---: | :--- | :--- |
| **Accidental Ingestion to Neon Cloud** | High | `backend/.env` points to Neon by default. | ETL remote guard blocks non-local URLs. Explicit `$env:DATABASE_URL` required in shell before executing Alembic or backend. |
| **Port 5432 Collision** | Medium | Existing container (`meal_db`) occupies 5432. | Use `POSTGRES_PORT=5433` in Docker Compose and connect via port 5433. |
| **Alembic Table Collision** | High | `create_all()` executed before Alembic creates untracked tables. | Strict rule: Run `alembic upgrade head` before running ETL. `create_all()` will safely no-op. |
| **Client Routing Resolution Failure** | Medium | `/api/v1/routing/calculate` requires Node UUIDs, but client starts with Location UUID. | Frontend must query `/api/v1/routing/nodes?location_id=...` or `/api/v1/assistance/destinations` to obtain `nearest_node_id`. |
| **Footprint Rendering Limitation** | Low | `LocationRead` schema contains only centroid coordinates, not full polygon geometry. | Document that UI map uses centroid pins or reads full polygon geometry from the GeoJSON dataset. |

---

## 9. Conclusion & Phase 2B.2 Authorization

All prerequisites for local database ingestion have been inspected, tested, and verified:
- Source dataset is validated and auto-detected.
- ETL pipeline and database guard are verified with 16 passing unit tests.
- Alembic migration chain (001–005) is linear and verified.
- Downstream endpoints for locations, routing, and visitor assistance are fully compatible with Carleton records.
- Port collision avoidance and remote isolation procedures are defined.

**Phase 2B.1 is complete. Phase 2B.2 (Local Database Ingestion & API Verification) is authorized to proceed.**
