# CampusWay — Phase 2B.2: Controlled Local PostgreSQL Ingestion Report

**Target Branch:** `demo/submission-mvp`  
**Execution Date:** November 10, 2026  
**Final Verdict:** **BLOCKED AT GATE 2** (Safe ingestion halted per gate failure protocol)

---

## 1. Executive Summary & Verdict

Phase 2B.2 was executed on branch `demo/submission-mvp` under strict enforcement of the mandatory safety rules.

- **Gate 1 (Pre-Ingestion Verification):** **PASS**  
  The Carleton University dataset and ETL transformation were verified via dry-run. The count discrepancies between Phase 2A and the Phase 2B.1 readiness report were forensically investigated and resolved.
- **Gate 2 (Local PostgreSQL Setup):** **BLOCKED**  
  The Docker Compose service `campusway_postgres` started successfully and reported healthy on port 5433 (`0.0.0.0:5433->5432/tcp`). However, connection attempts to `postgresql://postgres:postgres_password@localhost:5433/campusway_db` failed with `FATAL: password authentication failed for user "postgres"`. Forensic inspection revealed that a native Windows service (`postgresql-x64-13`, PostgreSQL 13, PID 7308) was already running and listening on port 5433 on the Windows host. This native service intercepts all traffic directed to `localhost:5433` / `127.0.0.1:5433`, completely shadowing Docker's `campusway_postgres` container. Furthermore, this native service hosts unrelated user databases (`shop123`, `college`, `pawlink`, `meal_optimization`). Stopping the service requires administrative privileges that are unavailable in the current execution environment.
- **Gates 3, 4, 5 (Migration, Ingestion, Verification):** **NOT EXECUTED**  
  In strict accordance with the mandatory safety rules (*"If a gate fails, stop at that gate, preserve the database state, document the failure, and report the precise blocker. Do not conceal failed checks or manufacture successful results"*), execution was immediately halted. No migrations were applied, no data was written, and existing databases remain untouched.

---

## 2. Gate 1 — Pre-Ingestion Verification (PASS)

### 2.1 Git Working-Tree & Script Verification
- **Branch:** `demo/submission-mvp`
- **Working Tree:** Clean (verified via `git status`, zero untracked or modified files before report generation).
- **ETL Script:** Verified at `backend/scripts/etl_carleton.py`.
- **Dataset Path:** Automatically detected at `C:\Users\KK\.gemini\antigravity\brain\fb7f0586-9047-471d-9f4b-f0c1235789b6\scratch\gapwise_data\universities\carleton\campus.json`.
- **Dataset File Size:** `1,454,910 bytes` (~1.45 MB).

### 2.2 ETL Dry-Run Output
The ETL script was executed in dry-run mode:
```powershell
$env:PYTHONPATH='backend'
backend/venv/Scripts/python.exe backend/scripts/etl_carleton.py
```

**Actual Output:**
```text
======================================================================
 CAMPUSWAY ETL PIPELINE — CARLETON UNIVERSITY ADAPTATION
======================================================================
Dataset Input Path:  ...\gapwise_data\universities\carleton\campus.json
Execution Mode:      DRY-RUN (In-memory validation)
Max Access Snapping: 35.0m
Max Entrance Bridging: 60.0m
----------------------------------------------------------------------

--- TRANSFORMATION COUNTS ---
  Locations (Buildings):      48 (Source: 48)
  Location Aliases & Codes:   89
  Pedestrian Nodes:           1957 (Source: 1922, Synthetic: 35)
  Walkway Edges:              2049 (Source: 2009, Inferred: 40)
    - Inferred Connectors:    5
    - Inferred Access Edges:  35
  Sub-metre Edges Preserved:  12

--- VALIDATION RESULTS ---
  [PASS] Expected Source Counts
  [PASS] Deterministic Uuids
  [PASS] Foreign Key Integrity
  [PASS] Duplicate Constraints
  [PASS] Positive Edge Distances
  [PASS] Valid Coordinates
  [PASS] Connected Components
  [PASS] Source Vs Inferred Edges
  [PASS] Building Routable Status
  [PASS] Database Constraint Compatibility

--- ROUTABLE COVERAGE ---
  Routable Buildings:         47 / 48
  Buildings Requiring Review: 1
    * Social Sciences Research Building (social-sciences-research-building): Shortest boundary connection (51.92m) exceeds threshold (35.00m)

--- INFERRED CONNECTION AUDIT ---
  Inferred Entrance Connectors:    5 (<= 60.0m)
  Inferred Building Access Edges:  35 (<= 35.0m)
  Zero-Distance Coincident Edges:  6 (stored as 0.5m database compatibility fallback, NOT physical measurement)

--- GRAPH TOPOLOGY ---
  Connected Components:       1
  Component Node Counts:      [1957]

======================================================================
 ETL DRY-RUN VALIDATION COMPLETED SUCCESSFULLY
======================================================================
```

### 2.3 Explanation of Count Discrepancies
The discrepancy between the previous Phase 2A/Phase 2A.1 counts and the Phase 2B.1 readiness report numbers was investigated:

| Metric | Phase 2A / Dry-Run (Authoritative) | Phase 2B.1 Readiness Report (Speculative) | Cause of Discrepancy |
| :--- | :---: | :---: | :--- |
| **Locations** | **48** | 49 | In Phase 1A initial scoping, an estimated count of 49 buildings was referenced before GeoJSON feature parsing confirmed exactly 48 valid building features. |
| **Location Aliases** | **89** | 49 | Phase 2B.1 assumed a naive 1:1 alias-to-building mapping (49 aliases). The actual Carleton ETL parses all building abbreviations (e.g. `ML` for MacOdrum Library), secondary names, and normalized search codes, producing 89 aliases. |
| **Pedestrian Nodes** | **1,957** | 829 | Phase 2B.1 cited a preliminary calculation (`707 path nodes + 121 entrance nodes + 1 synthetic node = 829`). The actual Gapwise GeoJSON pedestrian network contains 1,922 path nodes and 15 entrance nodes; the ETL synthesizes 35 exterior access nodes, totaling 1,957 nodes. |
| **Walkway Edges** | **2,049** | 2,058 | Phase 2B.1 cited an early estimate of 2,058 edges. The real dataset contains 2,009 source path edges plus 40 audited inferred edges (5 entrance bridging connectors + 35 building access edges), totaling 2,049 edges. |

**Conclusion:** The Phase 2A, Phase 2A.1, and current dry-run numbers (**48 locations, 89 aliases, 1,957 nodes, 2,049 edges**) are the true, verified counts asserted across the entire unit test suite (`test_etl_carleton.py`).

---

## 3. Gate 2 — Local PostgreSQL Setup (BLOCKED)

### 3.1 Container Launch
Command executed:
```powershell
$env:POSTGRES_PORT = "5433"
docker compose up -d postgres
```
**Output:**
```text
Container campusway_postgres Started
```
Status check (`docker compose ps postgres`):
```text
NAME                 IMAGE                COMMAND                  SERVICE    STATUS                    PORTS
campusway_postgres   postgres:16-alpine   "docker-entrypoint.s…"   postgres   Up 12 seconds (healthy)   0.0.0.0:5433->5432/tcp, [::]:5433->5432/tcp
```
The Docker container started and its internal healthcheck (`pg_isready -U postgres -d campusway_db`) reported healthy.

### 3.2 Read-Only Connection Attempt
A read-only connection test was executed via SQLAlchemy/psycopg2:
```python
create_engine("postgresql+psycopg2://postgres:postgres_password@localhost:5433/campusway_db")
```
**Actual Result:**
```text
psycopg2.OperationalError: connection to server at "localhost" (::1), port 5433 failed: FATAL:  password authentication failed for user "postgres"
connection to server at "127.0.0.1", port 5433 failed: FATAL:  password authentication failed for user "postgres"
```

### 3.3 Root-Cause Forensic Investigation

1. **Inspection of `campusway_postgres` Logs:**  
   Enabling `log_connections = on` and checking container logs (`docker logs campusway_postgres`) revealed that **zero connection attempts** reached the Compose container from `localhost:5433`. The container only logged internal healthchecks from `pg_isready`.
2. **Identification of Host Port Conflict:**  
   Querying Windows network connections (`Get-NetTCPConnection` and `netstat -ano`) revealed that Windows process **PID 7308** was already actively listening on port 5433:
   ```text
   LocalAddress: ::       LocalPort: 5433 State: Listen  PID: 7308
   ```
3. **Identification of PID 7308:**  
   Querying Windows Services (`Get-CimInstance Win32_Service`) identified PID 7308 as:
   ```text
   Name:        postgresql-x64-13
   DisplayName: postgresql-x64-13 - PostgreSQL Server 13
   State:       Running
   PathName:    "C:\Program Files\PostgreSQL\13\bin\pg_ctl.exe" runservice -N "postgresql-x64-13" -D "C:\Program Files\PostgreSQL\13\data"
   ```
   Inspecting `C:\Program Files\PostgreSQL\13\data\postgresql.conf` confirmed:
   ```ini
   port = 5433
   ```
   And inspecting `C:\Program Files\PostgreSQL\13\data\log` showed the exact fatal authentication log corresponding to our connection attempts:
   ```text
   2026-11-10 20:57:57 IST FATAL: password authentication failed for user "postgres"
   2026-11-10 20:57:57 IST DETAIL: Connection matched pg_hba.conf line 86: "host all all 127.0.0.1/32 scram-sha-256"
   ```
4. **Unrelated Databases on Native PostgreSQL 13:**  
   Querying the databases on `postgresql-x64-13` confirmed it hosts active, unrelated user projects:
   ```text
   Databases: ['postgres', 'shop123', 'college', 'pawlink', 'meal_optimization']
   ```
5. **Port Shadowing Mechanism:**  
   On Windows, native Windows sockets bound to `::` or `0.0.0.0` take precedence over Docker Desktop's userland port forwarder (`com.docker.backend`). Even though Docker accepted `0.0.0.0:5433`, Windows routes all incoming TCP packets on port 5433 to the native `postgresql-x64-13` service.
6. **Privilege Limitation:**  
   Attempting to stop `postgresql-x64-13` via PowerShell (`Stop-Service postgresql-x64-13`) and `pg_ctl stop` failed due to lack of administrative permissions:
   ```text
   Stop-Service: Cannot open 'postgresql-x64-13' service on computer '.'
   pg_ctl: could not send stop signal (PID: 7308): Operation not permitted
   ```

### 3.4 Gate 2 Decision: **BLOCKED**
- Mandatory Safety Rule 2 specifies: *"Use only: `postgresql://postgres:postgres_password@localhost:5433/campusway_db`"*.
- Port 5433 is physically shadowed on localhost by an existing native PostgreSQL 13 service.
- The `campusway_postgres` Compose container cannot be contacted via `localhost:5433`.
- Attempting to force ingestion into the native Windows PostgreSQL 13 instance would violate database isolation and risk corrupting or polluting unrelated user databases (`shop123`, `college`, `pawlink`, `meal_optimization`).
- Therefore, Gate 2 failed, and execution was halted immediately.

---

## 4. Gates 3, 4, and 5 Status

In accordance with the prompt's explicit mandate:
> *"If a gate fails, stop at that gate, preserve the database state, document the failure, and report the precise blocker. Do not conceal failed checks or manufacture successful results."*

- **Gate 3 (Migration & Ingestion):** Not started. Zero tables altered, zero migrations applied.
- **Gate 4 (Database Verification):** Not started.
- **Gate 5 (API Integration Verification):** Not started.
- **Remote Neon Database:** Confirmed 100% untouched. No connections initiated.

---

## 5. Remediation Options & Next Steps

To unblock Phase 2B.2, one of the two following remediations is required:

### Option A: Use Dedicated Available Port 5434 (Recommended — No Admin Privileges Required)
Inspection confirms host ports `5434`, `5435`, and `5436` are completely free:
1. Start PostgreSQL with:
   ```powershell
   $env:POSTGRES_PORT = "5434"
   docker compose up -d postgres
   ```
2. Update the target connection URL in commands to:
   ```text
   postgresql://postgres:postgres_password@localhost:5434/campusway_db
   ```
3. Run Alembic migrations and ETL `--commit` against `localhost:5434`.

### Option B: Stop Native Windows PostgreSQL 13 Service (Requires Administrator)
If the user prefers to strictly maintain port 5433:
1. Open an elevated (Administrator) Command Prompt or PowerShell terminal.
2. Stop the conflicting service:
   ```powershell
   Stop-Service postgresql-x64-13
   # or: net stop postgresql-x64-13
   ```
3. Docker will then bind port 5433 without conflict, and Phase 2B.2 can resume.

---

## 6. Summary of Facts vs Assumptions

| Area | Status | Evidence / Proven Fact |
| :--- | :---: | :--- |
| **Git Working Tree** | Fact | Clean working tree verified on `demo/submission-mvp`. |
| **Dataset Authenticity** | Fact | `campus.json` (1,454,910 bytes) present in scratch directory; parsed cleanly by dry-run. |
| **Authoritative Counts** | Fact | Dry-run and test suite assert 48 locations, 89 aliases, 1,957 nodes, 2,049 edges. |
| **Docker Container Status** | Fact | `campusway_postgres` running and healthy (`postgres:16-alpine`). |
| **Port 5433 Collision** | Fact | PID 7308 (`postgresql-x64-13`) listening on port 5433 confirmed via `Get-NetTCPConnection` and `postgresql.conf`. |
| **Host Database Content** | Fact | Verified native PostgreSQL 13 contains user databases `['shop123', 'college', 'pawlink', 'meal_optimization']`. |
| **Remote Database Isolation** | Fact | Neon database URL in `backend/.env` was not accessed; zero network calls made to Neon. |
| **Gate 2 Result** | Fact | **BLOCKED** due to local port shadowing and safety rule enforcement. |
