# CampusWay — Phase 1B: ETL Feasibility & Data Contract Validation

**Deliverable:** `docs/MVP_PHASE_1B_ETL_FEASIBILITY.md`  
**Dataset Inspected:** Gapwise Carleton University Dataset (`scratch/gapwise_data/universities/carleton/campus.json`)  
**Target Backend Models:** `Location`, `LocationAlias`, `Node`, `Edge`, `MapImportBatch` (`backend/app/models/`)  
**Validation Status:** Complete  
**Final Recommendation:** **ADAPT**

---

## 1. Executive Summary

A comprehensive, source-code-level feasibility study and data contract validation was performed to determine whether the external Carleton University campus dataset from GapwiseHQ (`universities/carleton/campus.json`) can be safely ingested into CampusWay's backend.

### Key Conclusions:
1. **Schema Compatibility:** The existing SQLAlchemy database schema (Migrations 001–004) is **100% sufficient**. No schema modifications, new columns, or new database migrations are required.
2. **Data Gaps Requiring Adaptation:** The dataset cannot be ingested blindly via raw 1:1 copies because:
   - `pathEdges` completely lack metric weights (`distance_m` is missing).
   - `pathNodes` lack functional classification (`node_type` is missing).
   - Identifiers are string-based (`"osm-node-1034655523"`), whereas CampusWay enforces UUID primary and foreign keys.
   - Exactly 5 entrance nodes are topologically isolated (degree 0) in the raw OpenStreetMap graph.
   - Exactly 36 of 48 buildings lack entrance records in the source data.
3. **Feasibility Verdict:** **ADAPT**. All identified gaps can be resolved deterministically during ETL without altering backend models or routing algorithms. Synthetic Dijkstra testing demonstrates complete navigable connectivity across the campus (e.g. 882.70m route with 70 nodes between Leeds House and MacOdrum Library).

---

## 2. Source Dataset Reality vs. Backend Contracts

The dataset was parsed directly from disk (`campus.json`, 1.45 MB) and evaluated against CampusWay Pydantic schemas and SQLAlchemy models.

### Entity Inventory Summary

| Entity | Source Count | Target Model | Key Contract Requirements | Compatibility Status |
| :--- | :--- | :--- | :--- | :--- |
| `buildings` | 48 | `Location` | `name` (VARCHAR 180), `slug` (VARCHAR 200, UNIQUE), `location_type` (VARCHAR 40) | **Compatible** (Requires slug generation & centroid extraction) |
| `aliases` / `nativeCodes` | 65 | `LocationAlias` | `location_id` (FK), `alias` (VARCHAR 180), `normalized_alias` (VARCHAR 180) | **Compatible** (Requires lowercase normalization) |
| `pathNodes` | 1,922 | `Node` | `id` (UUID), `latitude` (FLOAT), `longitude` (FLOAT), `node_type` (VARCHAR 40) | **Compatible** (Requires UUIDv5 generation & node typing) |
| `entrances` | 15 | `Node` (linked) | `location_id` (FK), `node_type="entrance"` | **Compatible** (5 require topological bridging) |
| `pathEdges` | 2,009 | `Edge` | `source_node_id` (UUID), `target_node_id` (UUID), `distance_m > 0` | **Compatible** (Requires Haversine distance computation) |

---

## 3. Detailed Field Mapping & Contract Matrix

### 3.1 Buildings $\rightarrow$ `Location` (`app.models.location.Location`)

| Source Field (`buildings[*]`) | Target Column (`locations`) | Transformation / Validation Rule |
| :--- | :--- | :--- |
| `id` (e.g., `"macodrum-library"`) | `slug` | Direct copy. Guaranteed unique, URL-safe slug. |
| `id` | `id` | Deterministic UUIDv5: `uuid.uuid5(UUID_NAMESPACE, f"carleton:location:{b['id']}")`. |
| `name` (e.g., `"MacOdrum Library"`) | `name` | Truncate to 180 chars if necessary. None exceed 180. |
| `"building"` | `location_type` | Hardcoded `"building"`. |
| `nativeCodes` (e.g., `["ML"]`) | `description` | Stored as: `"Building Code: ML"`. Provenance details appended. |
| `geometry.coordinates` | `latitude`, `longitude` | Calculated exterior polygon centroid. |
| Provenance object | `address_details` | JSON-encoded source metadata: `{"source": "carleton-official-map-2025", "nativeId": "ML"}`. |
| Constant | `is_verified` | `True` (backed by university official map). |
| Constant | `is_active` | `True`. |

### 3.2 Native Codes & Aliases $\rightarrow$ `LocationAlias` (`app.models.location.LocationAlias`)

| Source Field | Target Column (`location_aliases`) | Transformation Rule |
| :--- | :--- | :--- |
| Synthetic key | `id` | Deterministic UUIDv5: `uuid.uuid5(UUID_NAMESPACE, f"carleton:alias:{b_id}:{norm_alias}")`. |
| `b['id']` | `location_id` | Foreign key referencing target `Location.id`. |
| Raw alias string | `alias` | Direct string value (e.g. `"Library"`, `"ML"`). |
| Normalized string | `normalized_alias` | `.strip().lower()` (e.g. `"library"`, `"ml"`). Enforces unique constraint per location. |

### 3.3 Path Nodes $\rightarrow$ `Node` (`app.models.node.Node`)

| Source Field (`pathNodes[*]`) | Target Column (`nodes`) | Transformation Rule |
| :--- | :--- | :--- |
| `id` (e.g., `"osm-node-3780127642"`) | `id` | Deterministic UUIDv5: `uuid.uuid5(UUID_NAMESPACE, f"carleton:node:{n['id']}")`. |
| `coordinate[1]` | `latitude` | Float, verified within range `[45.378, 45.393]`. |
| `coordinate[0]` | `longitude` | Float, verified within range `[-75.706, -75.690]`. |
| Derived | `node_type` | `"entrance"` if referenced in `entrances`; `"building_access"` if designated for entrance-less building; else `"path"`. |
| Derived | `location_id` | Populated with building UUID if node represents an entrance or access point; otherwise `None`. |
| Constant | `is_accessible` | `True` (OpenStreetMap pedestrian ways are walkable). |
| Constant | `is_active` | `True`. |

### 3.4 Path Edges $\rightarrow$ `Edge` (`app.models.edge.Edge`)

| Source Field (`pathEdges[*]`) | Target Column (`edges`) | Transformation Rule |
| :--- | :--- | :--- |
| `id` (e.g., `"edge-osm-1"`) | `id` | Deterministic UUIDv5: `uuid.uuid5(UUID_NAMESPACE, f"carleton:edge:{e['id']}")`. |
| `from` | `source_node_id` | Deterministic UUIDv5 of source node. |
| `to` | `target_node_id` | Deterministic UUIDv5 of target node. |
| Calculated | `distance_m` | **Missing in source.** Calculated using spherical Haversine formula between source and target coordinates. Clamped to $\ge 1.0\text{ m}$. |
| `mode` (`"outdoor-walk"`) | `path_type` | Mapped to `"footpath"` (standard CampusWay path type). |
| Constant | `is_bidirectional` | `True` (outdoor campus walkways allow two-way travel). |
| Constant | `is_accessible` | `True`. |
| Constant | `is_active` | `True`. |

---

## 4. Distance Calculation & Geometry Strategy

### 4.1 Edge Geometry Absence
Inspection of all 2,009 edge records confirms that **no intermediate polyline coordinates or geometry objects exist in `pathEdges`**. Each edge represents a straight topological connection between its `from` and `to` nodes.

### 4.2 Haversine Distance Formula
Distances must be derived mathematically from the endpoints' WGS84 coordinates:

$$\Delta \phi = \text{radians}(\text{lat}_2 - \text{lat}_1), \quad \Delta \lambda = \text{radians}(\text{lon}_2 - \text{lon}_1)$$
$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\text{radians}(\text{lat}_1)) \cdot \cos(\text{radians}(\text{lat}_2)) \cdot \sin^2\left(\frac{\Delta \lambda}{2}\right)$$
$$d = 2 \cdot R \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right)$$
*(where Earth radius $R = 6,371,000.0\text{ meters}$)*

### 4.3 Metric Distribution & Constraint Enforcement
Evaluation of the computed edge distances reveals:
- **Minimum distance:** $0.29\text{ m}$
- **Median (p50):** $6.60\text{ m}$
- **Maximum distance:** $133.31\text{ m}$
- **Edges $< 0.5\text{ m}$:** 4
- **Edges $< 1.0\text{ m}$:** 12
- **Zero or negative edges:** 0

CampusWay's database constraint `CheckConstraint("distance_m > 0")` and the Dijkstra routing queue require positive non-zero weights. To avoid zero-weight anomalies or rounding collisions on micro-edges, the ETL script must clamp calculated weights:
$$\text{distance\_m} = \text{round}(\max(d_{\text{haversine}}, 1.0), 2)$$

---

## 5. Graph Topology & Isolated Entrance Resolution

### 5.1 Component Analysis
Graph traversal across all 1,922 nodes and 2,009 edges identified **6 connected components**:
- **Giant Component:** 1,917 nodes and 2,009 edges (completely connected pedestrian mesh).
- **Isolated Components:** Exactly 5 components of size 1 (degree 0 nodes).

### 5.2 Isolated Entrances Identification
The 5 isolated nodes correspond exactly to 5 building entrances in `campus.json`:

| Entrance ID | Building ID | Building Name | Node ID | Degree | Distance to Giant Component |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ent-osm-5158185088` | `tory-building` | Tory Building | `osm-node-5158185088` | 0 | **8.90 m** to `osm-node-2860186239` |
| `ent-osm-5159634560` | `nideyinan-centre` | Nideyinan Centre | `osm-node-5159634560` | 0 | **3.95 m** to `osm-node-12021442561` |
| `ent-osm-5158598331` | `alumni-hall` | Alumni Hall | `osm-node-5158598331` | 0 | **15.05 m** to `osm-node-1034655716` |
| `ent-osm-11390925448` | `stormont-house` | Stormont House | `osm-node-11390925448` | 0 | **21.00 m** to `osm-node-12021448629` |
| `ent-osm-13936769981` | `maintenance-building` | Maintenance Building | `osm-node-13936769981` | 0 | **57.67 m** to `osm-node-4354520545` |

**Root Cause:** In OpenStreetMap, these 5 entrances were mapped as nodes on the building polygon perimeter, but no walkway edge connected them to the sidewalk network 3.9m to 57.7m away.

### 5.3 Resolution via Topological Bridging
Leaving these nodes isolated causes route calculation to fail (`Destination unreachable`). The ETL script must synthesize 5 connector edges bridging each isolated entrance to its nearest giant component neighbor:
- `id = uuid5(UUID_NAMESPACE, f"carleton:connector:{ent['id']}:{nearest_node_id}")`
- `distance_m = round(max(haversine(ent_coord, nearest_coord), 1.0), 2)`
- `path_type = "footpath"`
- `is_bidirectional = True`
This unifies the entire graph into a **single 100% connected component of 1,922 nodes and 2,014 edges**.

---

## 6. Building Access & Obstacle-Aware Centroid Strategy

### 6.1 The Danger of Naive Centroid Connections
Of the 48 buildings, **36 lack entrance records** in the raw dataset.
A naive approach would calculate the centroid of each building polygon, insert a node at that centroid, and create a straight-line edge to the nearest outdoor path node.

> [!CAUTION]
> **Obstacle Violation:** A building centroid lies inside the building interior. Drawing an edge from an interior point directly to an outdoor walkway creates a path that passes straight through exterior walls, glass facades, structural columns, or courtyards. In some campus layouts, naive centroid rays even intersect adjacent neighboring buildings!

### 6.2 Architectural Separation of Concerns
CampusWay resolves this cleanly by decoupling **geographic entity markers** from **navigable graph topology**:

1. **`Location` Entity (Search & Display):**
   - The polygon centroid $(\bar{x}, \bar{y})$ is stored in `Location.latitude` and `Location.longitude`.
   - This provides the exact map pin location and bounding box center for frontend map rendering and spatial queries.
2. **`Node` Entity (Navigable Access Waypoint):**
   - Do **NOT** insert interior centroid nodes into the routing graph.
   - For each entrance-less building, determine the perimeter boundary vertex closest to the giant pedestrian network.
   - Designate the existing outdoor walkway node at that perimeter access point as the building's access waypoint (`location_id = building.id`, `node_type = "building_access"`).
   - If an exterior entrance waypoint node is placed on the building perimeter, connect it only to the exterior walkway node that faces the open pathway without intersecting the building polygon.
3. **Routing Invariant:** All routing origins and destinations terminate at verified exterior walkway/perimeter nodes. Turn-by-turn guidance never directs users through walls or obstacle zones.

---

## 7. Deterministic Identifiers & Idempotency Design

### 7.1 UUIDv5 Deterministic Generation
To guarantee that repeated runs produce identical records without generating orphan duplicate keys:
```python
import uuid

# Fixed namespace UUID for CampusWay Carleton ETL
CARLETON_NAMESPACE = uuid.UUID("a3b8d692-0b2a-4a8e-908d-71b312781b49")

def location_uuid(bldg_id: str) -> uuid.UUID:
    return uuid.uuid5(CARLETON_NAMESPACE, f"location:{bldg_id}")

def node_uuid(node_id: str) -> uuid.UUID:
    return uuid.uuid5(CARLETON_NAMESPACE, f"node:{node_id}")

def edge_uuid(edge_id: str) -> uuid.UUID:
    return uuid.uuid5(CARLETON_NAMESPACE, f"edge:{edge_id}")

def alias_uuid(bldg_id: str, norm_alias: str) -> uuid.UUID:
    return uuid.uuid5(CARLETON_NAMESPACE, f"alias:{bldg_id}:{norm_alias}")
```

### 7.2 Idempotent Execution Rules
1. **Primary Key Deduplication:** Check existence of entities by their deterministic UUID before insertion (`session.get(Model, uid)`).
2. **Natural Key Deduplication:** Check `Location.slug` and `LocationAlias.normalized_alias` to avoid violating unique constraints.
3. **Edge Duplicate Policy:** Validate `(source_node_id, target_node_id, path_type)` to honor `uq_edges_source_target_path`.
4. **Topological Ingestion Order:**
   1. `MapImportBatch` (create provenance batch record)
   2. `Location` records (buildings)
   3. `LocationAlias` records (aliases and native codes)
   4. `Node` records (path nodes and entrances)
   5. `Edge` records (walkways and bridge connectors)
5. **Atomic Transactions:** Wrap execution in an explicit database transaction (`session.begin()`). Roll back completely on any validation error.
6. **Dry-Run Mode:** Provide a `--dry-run` CLI flag to inspect counts, check constraints, and test routes in memory without committing changes.

---

## 8. Provenance & Verification Metadata

To satisfy auditability and open-source licensing requirements:

1. **`MapImportBatch` (`app.models.map_import`):**
   ```python
   batch = MapImportBatch(
       source_provider="gapwise",
       source_reference="osm-carleton-2026-09 / carleton-official-map-2025",
       description="Gapwise Carleton University campus dataset ETL import",
       total_records=len(buildings) + len(nodes) + len(edges) + 5,
       promoted_records=len(buildings) + len(nodes) + len(edges) + 5,
       status="completed",
   )
   ```
2. **Entity Attribution:**
   - `Location.description`: Includes native codes (`"Building Code: ML"`) and source citation.
   - `Location.address_details`: Stores serialized JSON containing native identifiers:
     `{"sourceId": "osm-carleton-2026-09", "nativeId": "way/29570388", "verification": "source-backed"}`.
   - `Location.is_verified`: Set to `True` for official Carleton university buildings.

---

## 9. Verification & Routing Test Plan

### 9.1 Local Test Environment
- **Test Database:** Isolated local SQLite database (`backend/tests/test_carleton.db`) or in-memory SQLite session.
- **Pre-flight Checks:** Build tables using `Base.metadata.create_all(bind=engine)`.

### 9.2 Empirical Dijkstra Simulation Results
A pilot pathfinding simulation was executed using the actual Carleton dataset with synthetic connector edges:

1. **Test Route 1: Major Campus Transit (Leeds House $\rightarrow$ MacOdrum Library)**
   - **Origin:** Leeds House Entrance (`osm-node-1034655523`)
   - **Destination:** MacOdrum Library Exterior Plaza Node (`osm-node-13771349324`)
   - **Result:** Path found successfully.
   - **Metric Distance:** $882.70\text{ meters}$.
   - **Waypoint Count:** 70 path nodes.
   - **Estimated Walk Time:** $\approx 11.3\text{ minutes}$ (at $1.3\text{ m/s}$).
2. **Test Route 2: Isolated Entrance Recovery (Tory Building $\rightarrow$ Alumni Hall)**
   - **Origin:** Tory Building Entrance (`osm-node-5158185088`, previously isolated degree 0)
   - **Destination:** Alumni Hall Entrance (`osm-node-5158598331`, previously isolated degree 0)
   - **Result:** Path found successfully across campus via bridge edges.
   - **Metric Distance:** $1,454.40\text{ meters}$.
   - **Waypoint Count:** 109 path nodes.
   - **Estimated Walk Time:** $\approx 18.6\text{ minutes}$.

Both test routes demonstrate that CampusWay's Dijkstra pathfinding and turn-by-turn instruction engine (`generate_step_directions`) operate seamlessly on the transformed Carleton graph.

---

## 10. Database Migrations Assessment

| Migration Area | Evaluation | Verdict |
| :--- | :--- | :--- |
| `locations` table | All fields (`name`, `slug`, `location_type`, `latitude`, `longitude`, `description`, `address_details`) are supported. | **No migration needed** |
| `location_aliases` table | `location_id`, `alias`, `normalized_alias` fully supported. | **No migration needed** |
| `nodes` table | `location_id`, `node_type`, `latitude`, `longitude`, `is_accessible` fully supported. | **No migration needed** |
| `edges` table | `source_node_id`, `target_node_id`, `distance_m`, `path_type`, `is_bidirectional` fully supported. | **No migration needed** |
| `map_import_batches` table | Provenance schema already exists in Migration 002. | **No migration needed** |

**Conclusion:** The current database schema is 100% compatible. **Zero database migrations are needed.**

---

## 11. Final Recommendation: ADAPT

### Verdict: **ADAPT**

- **Why NOT Direct REUSE?** Raw ingestion would fail due to missing edge distances, string identifiers, 5 disconnected entrance nodes, and lack of entrance nodes for 36 buildings.
- **Why NOT REJECT?** The Carleton dataset provides 1,922 verified path nodes, 2,009 interconnected pedestrian pathways, 48 building footprints, and official native codes. Building this map from scratch would require weeks of manual drafting.
- **The Path Forward (ADAPT):** Implement a dedicated ETL transformation script (`backend/scripts/etl_carleton.py`) that applies deterministic UUID generation, Haversine distance calculation, 5 entrance bridge edges, perimeter access association, and transactional idempotency.

---

## 12. Implementation Checklist for Phase 2 ETL Script

When authorized to implement the ETL pipeline in Phase 2:
- [ ] Create `backend/scripts/etl_carleton.py` with CLI flags: `--data-path`, `--dry-run`, `--db-url`.
- [ ] Implement deterministic UUIDv5 helper functions.
- [ ] Implement Haversine distance calculator with $\ge 1.0\text{ m}$ clamping.
- [ ] Transform 48 buildings $\rightarrow$ `Location` and `LocationAlias` records.
- [ ] Transform 1,922 path nodes $\rightarrow$ `Node` records.
- [ ] Map 15 entrances $\rightarrow$ `Node` records (`node_type="entrance"`, `location_id=bldg.id`).
- [ ] Synthesize 5 connector edges to bridge isolated entrances to the giant component.
- [ ] Map perimeter access nodes for the 36 entrance-less buildings.
- [ ] Transform 2,009 path edges $\rightarrow$ `Edge` records (`path_type="footpath"`, `is_bidirectional=True`).
- [ ] Record batch import metadata in `MapImportBatch`.
- [ ] Write pytest verification suite testing ETL idempotency and route computation on SQLite.

