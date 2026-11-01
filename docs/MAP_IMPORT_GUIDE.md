# CampusWay Map Import and Data Provenance Guide

**Project**: CampusWay — Lovely Professional University (LPU), Punjab, India  
**Target Audience**: GIS / Map Developers, Surveyors, Backend Engineers, Administrators  

---

## 1. Overview and Architecture

The CampusWay map ingestion pipeline is designed to receive external geographic data (primarily from OpenStreetMap and GIS surveyors) without assuming the final campus map is ready or auto-trusting raw external sources.

The backend maintains strict isolation between **staged external records** and the **canonical campus location inventory**:

```
[OpenStreetMap / GeoJSON / QGIS]
               │
               ▼  (POST /api/v1/import/batches/{id}/geojson)
     [Map Import Batches]
               │
               ▼  (Duplicate detection, provenance retention)
      [Staged Locations] ─── (Status: pending)
               │
               ├─► Administrative Review & Verification
               │
               ├───► [Approve] ──► Promoted to Canonical Location (is_verified=true)
               │
               └───► [Reject]  ──► Stored as Rejected with Reason
```

---

## 2. Ingestion Rules & Data Integrity Principles

1. **Never Automatically Verify External Names**: Raw OSM names (or surveyor tags) may be typos, colloquial nicknames, or outdated abbreviations. All records must pass through the staging queue.
2. **Never Scrape Google Maps**: Google Maps data must never be scraped or ingested. Doing so violates Terms of Service and data licensing restrictions.
3. **No Speculative Coordinates**: Never fabricate building coordinates or gate locations. If coordinate data is missing or ambiguous, leave it pending ground-truth verification.
4. **Coordinate Reference System**: All coordinate inputs must use **WGS84 (EPSG:4326)** decimal degrees (Latitude: -90.0 to 90.0, Longitude: -180.0 to 180.0).
5. **Idempotence & Provenance**: Every staged record retains its source provider name (`osm`, `geojson`, `campus_survey`), external element type (`node`, `way`, `relation`, `Feature`), and unique external ID (e.g. `osm:way:98765432`). Duplicate external IDs are rejected to prevent re-staging.

---

## 3. Supported Input Formats

### Format A: GeoJSON FeatureCollection (Recommended)

Submit a standard GeoJSON `FeatureCollection` to `POST /api/v1/import/batches/{batch_id}/geojson`.

#### Example Feature: Building / Academic Block
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "osm:way:54128930",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [75.7021, 31.2530],
            [75.7035, 31.2530],
            [75.7035, 31.2542],
            [75.7021, 31.2542],
            [75.7021, 31.2530]
          ]
        ]
      },
      "properties": {
        "name": "Block 34 - School of Computer Science & Engineering",
        "building": "university",
        "amenity": "faculty",
        "addr:full": "Lovely Professional University, Phagwara, Punjab 144411",
        "source_url": "https://www.openstreetmap.org/way/54128930"
      }
    },
    {
      "type": "Feature",
      "id": "osm:node:10982341",
      "geometry": {
        "type": "Point",
        "coordinates": [75.7015, 31.2525]
      },
      "properties": {
        "name": "Main University Gate 1",
        "barrier": "gate",
        "entrance": "main",
        "wheelchair": "yes"
      }
    }
  ]
}
```

### Format B: Single External Record

Submit an individual record to `POST /api/v1/import/batches/{batch_id}/records`.

```json
{
  "external_element_type": "node",
  "external_element_id": "survey:point:gate_2",
  "source_provider": "campus_survey",
  "proposed_name": "Gate 2 (GT Road Entrance)",
  "proposed_location_type": "gate",
  "latitude": 31.2528,
  "longitude": 75.7018,
  "original_tags": {
    "surveyor": "Team Alpha",
    "notes": "Pedestrian gate operational 24/7"
  }
}
```

---

## 4. API Workflow for Map Developers

### Step 1: Create an Import Batch
```http
POST /api/v1/import/batches
Headers:
  Authorization: Bearer <admin_token> OR X-Admin-Key: <ADMIN_API_KEY>
Content-Type: application/json

{
  "source_provider": "osm",
  "source_reference": "lpu_overpass_extract_20261101.geojson",
  "description": "Export of LPU campus boundary and major academic blocks from OpenStreetMap"
}
```
**Response**: `201 Created` with batch `id`.

### Step 2: Upload GeoJSON Data
```http
POST /api/v1/import/batches/{batch_id}/geojson
Headers:
  Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "geojson": { ...FeatureCollection... },
  "default_location_type": "building"
}
```
**Response**:
```json
{
  "batch_id": "9a38f322-...",
  "staged_count": 28,
  "skipped_duplicates_count": 0,
  "message": "Successfully staged 28 features (0 skipped as duplicates)."
}
```

### Step 3: Administrator Review & Deduplication
Retrieve staged records awaiting verification:
```http
GET /api/v1/import/records?batch_id={batch_id}&verification_status=pending
```
The response automatically includes `potential_duplicates` detected in the canonical database by name matching and physical coordinate proximity (~60m).

### Step 4: Promote (Approve) or Reject
To promote a verified record into the canonical campus location directory:
```http
POST /api/v1/import/records/{record_id}/review
Headers:
  Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "action": "approve",
  "approved_name": "Block 34 (Computer Science)",
  "approved_location_type": "building",
  "parent_id": null
}
```
This automatically:
1. Creates a verified `Location` in the database with `is_verified=true`.
2. Marks the staged record as `approved`.
3. Links `canonical_location_id` to the new location.
4. Updates batch counters (`promoted_records`).

To reject an invalid or irrelevant record:
```http
POST /api/v1/import/records/{record_id}/review
Content-Type: application/json

{
  "action": "reject",
  "rejection_reason": "Private off-campus residential building outside university boundary."
}
```
