# CampusWay — Phase 2A: Carleton Dataset ETL Implementation Report

**Document Version:** 1.0  
**Phase:** 2A — Carleton Dataset ETL Implementation  
**Working Branch:** `demo/submission-mvp`  
**Execution Status:** Dry-Run & Automated Testing Verified (100% Pass)  
**Safety Status:** Zero Writes to Remote/Neon DB; Ready for Local Ingestion  

---

## 1. Executive Summary

In Phase 2A, the ETL transformation pipeline for the Gapwise Carleton University campus dataset was implemented and verified. The pipeline adapts the external dataset into CampusWay's existing backend architecture without altering database schemas, migrations, or application data models.

The transformation addresses all data contract gaps identified in Phase 1B:
- Synthesizes 5 inferred connector edges to bridge isolated entrance nodes into the giant component ($\le 60.0\text{ m}$).
- Identifies exterior perimeter access points for the 36 entrance-less buildings, creating 35 synthetic access nodes and inferred access edges ($\le 35.0\text{ m}$).
- Detects and reports 1 building requiring manual review (`social-sciences-research-building` at $51.92\text{ m}$).
- Preserves all 12 sub-metre walkway edges without losing precision or violating positive distance constraints.
- Unifies the entire campus pedestrian network into a **single connected component of 1,957 nodes and 2,049 edges**.

---

## 2. Files Created & Modified

| File | Purpose |
| :--- | :--- |
| [`backend/scripts/etl_carleton.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/scripts/etl_carleton.py) | Full ETL transformation script supporting deterministic UUID generation, polygon centroid computation, Haversine distance calculation, topology bridging, validation, dry-run, and machine-readable report export. |
| [`backend/tests/test_etl_carleton.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/tests/test_etl_carleton.py) | Pytest test suite containing 8 unit and integration tests verifying transformation accuracy, database persistence, and Dijkstra / A* routing on SQLite. |
| [`reports/carleton_etl_dry_run_report.json`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/reports/carleton_etl_dry_run_report.json) | Exported machine-readable summary of transformation metrics and validation status. |
| [`docs/MVP_PHASE_2A_ETL_IMPLEMENTATION.md`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/docs/MVP_PHASE_2A_ETL_IMPLEMENTATION.md) | This implementation and validation deliverable report. |

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

### 3.5 Isolated Entrance Bridging Policy
- 5 entrance nodes in the raw dataset were degree 0 (isolated from the giant component).
- An explicit threshold policy of $\text{MAX\_CONNECTOR\_DISTANCE\_M} = 60.0\text{ m}$ bridges all 5 entrance nodes to their nearest giant component neighbors:
  1. `tory-building` (`osm-node-5158185088`): $8.90\text{ m}$
  2. `nideyinan-centre` (`osm-node-5159634560`): $3.95\text{ m}$
  3. `alumni-hall` (`osm-node-5158598331`): $15.05\text{ m}$
  4. `stormont-house` (`osm-node-11390925448`): $21.00\text{ m}$
  5. `maintenance-building` (`osm-node-13936769981`): $57.67\text{ m}$
- These 5 edges are designated `path_type = "inferred_connector"`, preserving provenance distinction.

### 3.6 Obstacle-Aware Exterior Building Access Policy
- For the 36 buildings without entrances:
  - Extract all exterior perimeter boundary vertices from the building polygon.
  - Find the boundary vertex $V$ closest to an existing giant component path node.
  - Threshold policy: $\text{MAX\_ACCESS\_DISTANCE\_M} = 35.0\text{ m}$.
  - For 35 buildings ($\le 35.0\text{ m}$):
    - A synthetic access node (`node_type = "synthetic_access"`) is placed on the exterior boundary vertex $V$.
    - An inferred access edge (`path_type = "inferred_access"`) connects $V$ to the adjacent walkway node.
    - If $V$ is coincident with an existing walkway ($d = 0.0\text{ m}$, 6 buildings), distance is set to a standard $0.5\text{ m}$ threshold crossing to satisfy `distance_m > 0`.
  - For 1 building (`social-sciences-research-building` at $51.92\text{ m} > 35.0\text{ m}$):
    - Connection is rejected to prevent unrealistic straight-line paths through obstacle zones.
    - Flagged as unroutable and reported for manual administrative survey.

---

## 4. Entity & Transformation Counts

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

## 5. Validation Results Matrix

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

## 6. Test Suite & Verification Results

An automated pytest test suite was added to [`backend/tests/test_etl_carleton.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/tests/test_etl_carleton.py):

```
backend\tests\test_etl_carleton.py::test_haversine_distance_accuracy PASSED [ 12%]
backend\tests\test_etl_carleton.py::test_compute_polygon_centroid PASSED     [ 25%]
backend\tests\test_etl_carleton.py::test_deterministic_uuids PASSED          [ 37%]
backend\tests\test_etl_carleton.py::test_transformation_counts PASSED        [ 50%]
backend\tests\test_etl_carleton.py::test_all_validation_checks_pass PASSED  [ 62%]
backend\tests\test_etl_carleton.py::test_sub_metre_edge_preservation PASSED [ 75%]
backend\tests\test_etl_carleton.py::test_isolated_entrance_resolution PASSED [ 87%]
backend\tests\test_etl_carleton.py::test_database_persistence_and_routing PASSED [100%]
============================== 8 passed in 7.69s ===============================
```

### Verified Routing Behaviors:
- **Dijkstra & A\* Routing:** Tested on an in-memory SQLite database populated with all 48 locations, 89 aliases, 1,957 nodes, and 2,049 edges. Optimal shortest path between Leeds House entrance and MacOdrum Library perimeter access was computed cleanly by both Dijkstra and A\*.
- **Bridged Isolated Entrance Routing:** Route from Tory Building (`osm-node-5158185088`, previously isolated) to Alumni Hall (`osm-node-5158598331`, previously isolated) completed successfully across campus via inferred connector edges.

---

## 7. Known Limitations

1. **Unroutable Building (1 of 48):**
   - **Building:** Social Sciences Research Building (`social-sciences-research-building`)
   - **Reason:** Distance from nearest boundary vertex to the pedestrian graph is $51.92\text{ m}$, exceeding the safe snapping limit of $35.0\text{ m}$.
   - **Mitigation:** Intentionally left without an automatic inferred access edge. Requires an administrator to map an exact doorway or outdoor footpath link via CampusWay's moderation API.
2. **Pedestrian Graph Outdoor Scope:**
   - The graph represents outdoor walkways, plazas, and building perimeter entries. Indoor hallways and tunnel networks are not part of this dataset.
3. **Inferred Connections Unverified:**
   - 40 edges are mathematically inferred from proximity and topology. They must remain tagged as `inferred_connector` or `inferred_access` until ground verification.

---

## 8. Exact Commands to Execute Dry Run & Tests

### Dry Run Execution (In-memory Transformation & Validation):
```powershell
$env:PYTHONPATH='backend'
python backend/scripts/etl_carleton.py --report "reports/carleton_etl_dry_run_report.json"
```

### With Explicit Dataset Path:
```powershell
$env:PYTHONPATH='backend'
python backend/scripts/etl_carleton.py `
  --input "C:\Users\KK\.gemini\antigravity\brain\fb7f0586-9047-471d-9f4b-f0c1235789b6\scratch\gapwise_data\universities\carleton\campus.json" `
  --report "reports/carleton_etl_dry_run_report.json"
```

### Run Automated Test Suite:
```powershell
$env:PYTHONPATH='backend'
backend/venv/Scripts/python.exe -m pytest backend/tests/test_etl_carleton.py -v
```

---

## 9. Remaining Blockers

- **None.** The ETL transformation is complete, tested, and idempotent. All database constraints and routing engines operate properly with the adapted dataset. Ready for local database ingestion upon authorization.
