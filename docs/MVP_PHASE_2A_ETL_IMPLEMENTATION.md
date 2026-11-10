# CampusWay — Phase 2A & 2A.1: Carleton Dataset ETL Implementation & Verification Report

**Document Version:** 2.0 (Phase 2A.1 Audit & Persistence Verification)  
**Working Branch:** `demo/submission-mvp`  
**Execution Status:** In-Memory Dry-Run & File-Backed SQLite Automated Testing Verified (15/15 Tests Passed)  
**Safety Status:** Zero Writes to Remote/Neon DB; Verified with Atomic Rollback & Pre-Connection Guard  

---

## 1. Executive Summary

In Phase 2A and 2A.1, the ETL transformation and persistence pipeline for the Gapwise Carleton University campus dataset was implemented, audited, and verified. The pipeline adapts the external dataset into CampusWay's existing backend architecture without altering database schemas, migrations, or application data models.

### Key Achievements:
1. **Genuine Persistence Validation:** Replaced previous mock fixtures with genuine persistence tests against a temporary file-backed SQLite database (`tmp_path`). Confirmed exact persistence of all 48 locations, 89 aliases, 1,957 nodes, 2,049 edges, and 1 batch record.
2. **Idempotency & Rerun Safety:** Demonstrated that running `commit_to_database()` repeatedly against an existing database succeeds without creating duplicate rows, violating unique constraints, or performing destructive deletions.
3. **Atomic Transaction Rollback:** Confirmed that any failure during persistence triggers an immediate database rollback via `with session.begin()`, ensuring no partial records persist.
4. **Pre-Connection Safety Guard:** Verified that any remote host or Neon PostgreSQL URL (e.g. `*.neon.tech`, `pooler`) raises `PermissionError` immediately before any database connection attempt.
5. **Inferred Access Connection Audit:** Audited all 40 inferred connections. Explicitly identified 6 zero-distance coincident connections, documenting that the stored $0.5\text{ m}$ value is strictly a database compatibility value (`CheckConstraint("distance_m > 0")`), not an empirical physical measurement.

---

## 2. Files Created & Modified

| File | Purpose |
| :--- | :--- |
| [`backend/scripts/etl_carleton.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/scripts/etl_carleton.py) | Full ETL transformation and persistence script. Supports deterministic UUIDv5 generation, Green-formula centroid computation, Haversine distance calculation, topology bridging, zero-distance audit, dry-run, and transactional database persistence with remote/Neon rejection. |
| [`backend/tests/test_etl_carleton.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/tests/test_etl_carleton.py) | Comprehensive pytest test suite with 15 tests. Separates pure in-memory transformation tests from genuine file-backed SQLite persistence, idempotency, foreign-key, rollback, and routing tests. |
| [`reports/carleton_etl_dry_run_report.json`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/reports/carleton_etl_dry_run_report.json) | Exported machine-readable summary containing source counts, transformed counts, validation status, unroutable buildings, sub-metre edges, and zero-distance compatibility connection records. |
| [`docs/MVP_PHASE_2A_ETL_IMPLEMENTATION.md`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/docs/MVP_PHASE_2A_ETL_IMPLEMENTATION.md) | This implementation, audit, and verification deliverable report. |

---

## 3. Transformation Logic & Architectural Design

### 3.1 Deterministic Identifiers (`CARLETON_NAMESPACE`)
To guarantee idempotency across repeated runs without generating duplicate records:
- **Namespace UUID:** `a3b8d692-0b2a-4a8e-908d-71b312781b49`
- `Location`: `uuid.uuid5(CARLETON_NAMESPACE, f"location:{bldg_id}")`
- `LocationAlias`: `uuid.uuid5(CARLETON_NAMESPACE, f"alias:{bldg_id}:{norm_alias}")`
- `Node` (source): `uuid.uuid5(CARLETON_NAMESPACE, f"node:{source_node_id}")`
- `Node` (synthetic): `uuid.uuid5(CARLETON_NAMESPACE, f"synthetic_node:{bldg_id}")`
- `Edge` (source): `uuid.uuid5(CARLETON_NAMESPACE, f"edge:{source_edge_id}")`
- `Edge` (inferred connector): `uuid.uuid5(CARLETON_NAMESPACE, f"inferred_connector:{entrance_id}:{target_node_id}")`
- `Edge` (inferred access): `uuid.uuid5(CARLETON_NAMESPACE, f"inferred_access:{bldg_id}:{target_node_id}")`
- `MapImportBatch`: `uuid.uuid5(CARLETON_NAMESPACE, f"batch:{source_reference}")`

### 3.2 Building Transformation & Centroids
- 48 buildings $\rightarrow$ 48 `Location` records.
- Standard Green-formula area-weighted polygon centroid calculation computes `(latitude, longitude)` for map display and bounding boxes.
- All records set `is_verified = False` (ensuring imported data is not falsely claimed as field-verified).
- Original building IDs and native metadata are preserved in `Location.address_details` as serialized JSON.
- 89 aliases and native building codes (e.g. `ML` for MacOdrum Library) are extracted into `LocationAlias` records with normalized lowercase strings.

### 3.3 Pedestrian Nodes & Entrance Mapping
- 1,922 source path nodes $\rightarrow$ `Node` records.
- Coordinate order conversion: WGS84 GeoJSON `[lon, lat]` $\rightarrow$ `Node.latitude = coord[1]`, `Node.longitude = coord[0]`.
- 15 source entrance records are linked to their respective buildings (`node_type = "entrance"`, `location_id = bldg_uuid`).
- All other path nodes are classified as `node_type = "path"`.

### 3.4 Edges & Metric Distance Computation
- 2,009 source path edges $\rightarrow$ `Edge` records.
- Distance derived via spherical Haversine formula with mean Earth radius $R = 6,371,000.0\text{ m}$.
- 12 sub-metre edges ($0.29\text{ m}$ to $0.99\text{ m}$) are stored with 3-decimal precision (`round(d, 3)`), strictly satisfying `distance_m > 0` without precision loss.

---

## 4. Inferred Connection & Zero-Distance Audit

### 4.1 Topology Bridging for Isolated Entrances
5 entrance nodes in the raw OpenStreetMap dataset were degree 0 (isolated from the giant component). An explicit threshold policy of $\text{MAX\_CONNECTOR\_DISTANCE\_M} = 60.0\text{ m}$ bridges all 5 entrance nodes to their nearest giant component neighbors:
1. `tory-building` (`osm-node-5158185088`): $8.90\text{ m}$
2. `nideyinan-centre` (`osm-node-5159634560`): $3.95\text{ m}$
3. `alumni-hall` (`osm-node-5158598331`): $15.05\text{ m}$
4. `stormont-house` (`osm-node-11390925448`): $21.00\text{ m}$
5. `maintenance-building` (`osm-node-13936769981`): $57.67\text{ m}$

### 4.2 Obstacle-Aware Building Access & Zero-Distance Connections
For the 36 buildings without entrance records:
- The closest exterior boundary vertex to an existing pedestrian node was identified.
- **35 buildings ($\le 35.0\text{ m}$):** Synthetic access nodes (`node_type = "synthetic_access"`) and inferred edges (`path_type = "inferred_access"`) were created on the exterior boundary without penetrating building interiors.
- **1 building ($> 35.0\text{ m}$):** Social Sciences Research Building ($51.92\text{ m}$) was left unroutable and flagged for manual administrative survey.

### 4.3 Coincident Zero-Distance Connections Table

In 6 buildings, OpenStreetMap walkway nodes were mapped directly onto a vertex of the building polygon ($d = 0.0\text{ m}$):

| Building ID | Building Name | Boundary Vertex $[lon, lat]$ | Coincident Node UUID | Stored Value | Nature of Value |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `paterson-hall` | Paterson Hall | `[-75.6983359, 45.382136]` | `781d2fed-7b51-5484-8d97-669fb63d7abd` | $0.5\text{ m}$ | Database compatibility fallback |
| `mackenzie-building` | Mackenzie Building | `[-75.6982204, 45.3845097]` | `1d133af8-1725-5350-aa74-e4733d43231c` | $0.5\text{ m}$ | Database compatibility fallback |
| `richcraft-hall` | Richcraft Hall | `[-75.6960068, 45.3824247]` | `46ffddf6-7fe9-54c7-8d9d-e573e1efd6c7` | $0.5\text{ m}$ | Database compatibility fallback |
| `glengarry-house` | Glengarry House | `[-75.696882, 45.3866791]` | `38774f2d-4857-5131-9c84-e8a781d8253e` | $0.5\text{ m}$ | Database compatibility fallback |
| `lennox-and-addington-house` | Lennox & Addington House | `[-75.6973287, 45.3862943]` | `8f5d0f11-c96f-5460-93cb-5b6d516ca47a` | $0.5\text{ m}$ | Database compatibility fallback |
| `russell-house` | Russell House | `[-75.698456, 45.3868566]` | `f9bf4553-639a-5fa3-80bc-65efc1374523` | $0.5\text{ m}$ | Database compatibility fallback |

> [!IMPORTANT]
> **Audit Disclosure on Fallback Distance:**  
> The stored $0.5\text{ m}$ distance on these 6 edges is strictly a **database compatibility value** required by the database constraint `CheckConstraint("distance_m > 0", name="ck_edges_positive_distance")` and Dijkstra priority queue invariants. It is **NOT** a physical measurement, nor does it guarantee an obstacle-free or wheelchair-accessible doorway. All 40 inferred edges remain distinguishable via `is_inferred = True` and dedicated `path_type` values (`inferred_connector`, `inferred_access`).

---

## 5. Import Idempotency Contract

The persistence method (`commit_to_database()`) strictly honors the following idempotency contract:

1. **Inserted When Absent:** If an entity's deterministic UUID does not exist in the database, it is inserted via `session.add()`.
2. **Updated Non-Destructively When Present:** If an entity's deterministic UUID already exists:
   - `Location`: Mutable fields (`name`, `slug`, `location_type`, `description`, `latitude`, `longitude`, `address_details`, `is_verified`, `is_active`) are updated in-place.
   - `LocationAlias`: Mutable fields (`alias`, `normalized_alias`) are updated in-place.
   - `Node`: Mutable fields (`location_id`, `node_type`, `latitude`, `longitude`, `is_accessible`, `is_active`) are updated in-place.
   - `Edge`: Mutable fields (`source_node_id`, `target_node_id`, `distance_m`, `path_type`, `is_bidirectional`, `is_accessible`, `is_active`) are updated in-place.
   - `MapImportBatch`: Metrics (`total_records`, `promoted_records`, `rejected_records`, `status`) are updated in-place.
3. **Zero Destructive Deletions:** No existing records in `locations`, `nodes`, `edges`, or unrelated tables are deleted or cleared during ingestion.
4. **Repeated Ingestion Safety:** Executing `commit_to_database()` $N$ times produces the exact same state as executing it once, with zero primary key collisions or unique constraint errors.

---

## 6. Entity & Transformation Counts

| Entity Category | Source Dataset Count | Transformed / Inferred Count | Total Ingested Count |
| :--- | :--- | :--- | :--- |
| **Locations (Buildings)** | 48 | 0 | **48** |
| **Location Aliases & Codes** | 0 | 89 (extracted) | **89** |
| **Pedestrian Nodes** | 1,922 | 35 (synthetic access) | **1,957** |
| - *Source Path Nodes* | 1,907 | 0 | 1,907 |
| - *Source Entrances* | 15 | 0 | 15 |
| - *Synthetic Access Nodes* | 0 | 35 | 35 |
| **Walkway Edges** | 2,009 | 40 (inferred) | **2,049** |
| - *Source Path Edges* | 2,009 | 0 | 2,009 |
| - *Inferred Entrance Connectors* | 0 | 5 | 5 |
| - *Inferred Building Access Edges* | 0 | 35 | 35 |
| **Map Import Batch** | 0 | 1 | **1** |

---

## 7. Validation Results Matrix

All 10 required validation checks were executed and passed with zero errors:

| Check # | Validation Name | Status | Observed Value / Details |
| :---: | :--- | :---: | :--- |
| 1 | **Expected Source Counts** | `[PASS]` | 48 buildings, 15 entrances, 1,922 path nodes, 2,009 path edges. |
| 2 | **Deterministic UUIDs** | `[PASS]` | 4,143 total UUIDs generated; 4,143 unique (0 collisions). |
| 3 | **Foreign Key Integrity** | `[PASS]` | 0 orphan aliases, 0 orphan nodes, 0 orphan edges. |
| 4 | **Duplicate Constraints** | `[PASS]` | 48 unique slugs; 89 unique `(location_id, normalized_alias)` pairs. |
| 5 | **Positive Edge Distances** | `[PASS]` | 0 non-positive edges; 12 sub-metre edges safely stored. |
| 6 | **Valid Node Coordinates** | `[PASS]` | 100% of nodes within valid WGS84 latitude/longitude ranges. |
| 7 | **Connected Components** | `[PASS]` | Exactly **1** connected component containing all **1,957** nodes. |
| 8 | **Source vs. Inferred Edges** | `[PASS]` | 2,009 source edges; 40 inferred edges (5 connectors + 35 access). |
| 9 | **Routable Building Coverage** | `[PASS]` | 47 routable buildings (97.9%); 1 requiring manual review. |
| 10 | **Database Constraint Safety** | `[PASS]` | 0 self-loops; 0 duplicate `(source, target, path_type)` edge tuples. |

---

## 8. Complete Test Suite Execution Results

Automated unit and integration test suite in [`backend/tests/test_etl_carleton.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/tests/test_etl_carleton.py):

```
backend/tests/test_etl_carleton.py::test_haversine_distance_accuracy PASSED         [  6%]
backend/tests/test_etl_carleton.py::test_compute_polygon_centroid PASSED            [ 13%]
backend/tests/test_etl_carleton.py::test_deterministic_uuids PASSED                 [ 20%]
backend/tests/test_etl_carleton.py::test_transformation_counts PASSED               [ 26%]
backend/tests/test_etl_carleton.py::test_all_validation_checks_pass PASSED         [ 33%]
backend/tests/test_etl_carleton.py::test_sub_metre_edge_preservation PASSED        [ 40%]
backend/tests/test_etl_carleton.py::test_isolated_entrance_resolution PASSED        [ 46%]
backend/tests/test_etl_carleton.py::test_zero_distance_connections_audit PASSED    [ 53%]
backend/tests/test_etl_carleton.py::test_inferred_edge_distinguishability PASSED   [ 60%]
backend/tests/test_etl_carleton.py::test_commit_to_database_file_backed PASSED      [ 66%]
backend/tests/test_etl_carleton.py::test_persistence_idempotency_second_run PASSED [ 73%]
backend/tests/test_etl_carleton.py::test_persistence_foreign_key_integrity PASSED  [ 80%]
backend/tests/test_etl_carleton.py::test_persistence_rollback_on_exception PASSED [ 86%]
backend/tests/test_etl_carleton.py::test_remote_and_neon_urls_rejected PASSED       [ 93%]
backend/tests/test_etl_carleton.py::test_routing_on_persisted_file_backed_db PASSED [100%]
============================== 15 passed in 19.35s ==============================
```

### Verified Behaviors Across Test Categories:
- **In-Memory Simulations (Tests 1–7):** Validates geometric formulas, deterministic UUID namespaces, sub-metre preservation, and graph connectivity.
- **Inference Audit (Tests 8–9):** Confirms all 6 zero-distance edges are tracked with database compatibility disclosures, and verifies strict separation of source vs. inferred edges.
- **Real File-Backed Persistence (Tests 10–12):** Directly executes `commit_to_database()` on a temporary file-backed SQLite database (`tmp_path / "carleton_test_persistence.db"`). Proves all 48 locations, 89 aliases, 1,957 nodes, 2,049 edges, and 1 batch record persist accurately. Proves that running `commit_to_database()` a second time maintains exact counts without duplicate errors. Proves all foreign keys resolve cleanly.
- **Atomic Rollback (Test 13):** Injects a check-constraint violation into the persistence stream and verifies that `session.begin()` aborts, leaving 0 partially-committed rows.
- **Safety Enforcement (Test 14):** Proves that Neon (`*.neon.tech`) and remote URLs raise `PermissionError` before any network or connection attempts.
- **Routing Engine on Persisted DB (Test 15):** Loads `CampusGraph` from the persisted file-backed SQLite database and computes optimal routes using Dijkstra and A*.

---

## 9. Known Limitations

1. **Unroutable Building (1 of 48):**
   - **Building:** Social Sciences Research Building (`social-sciences-research-building`)
   - **Reason:** Distance from nearest boundary vertex to the pedestrian graph is $51.92\text{ m}$, exceeding the safe snapping limit of $35.0\text{ m}$.
   - **Mitigation:** Intentionally left without an automatic inferred access edge. Requires an administrator to map an exact doorway or outdoor footpath link via CampusWay's moderation API.
2. **Inferred Connections Unverified:**
   - 40 edges are mathematically inferred from proximity and topology. They must remain tagged as `inferred_connector` or `inferred_access` until ground verification.
3. **Database Compatibility Values:**
   - The 6 coincident zero-distance connections are assigned $0.5\text{ m}$ solely for database constraint and graph weight invariants; they do not represent physical door widths.

---

## 10. Execution Instructions for Verification

### Execute In-Memory Dry Run:
```powershell
$env:PYTHONPATH='backend'
python backend/scripts/etl_carleton.py --report "reports/carleton_etl_dry_run_report.json"
```

### Run Automated Pytest Test Suite:
```powershell
$env:PYTHONPATH='backend'
backend/venv/Scripts/python.exe -m pytest backend/tests/test_etl_carleton.py -v
```
