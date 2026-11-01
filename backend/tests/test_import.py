"""Unit and integration tests for map import pipeline, GeoJSON staging, deduplication, and provenance."""

import uuid
import pytest
from app.models.location import Location

ADMIN_HEADERS = {"X-Admin-Key": "campusway-admin-dev-secret"}


def test_import_batch_creation_and_staging(client):
    """Verify import batch creation and individual record staging with provenance retention."""
    # 1. Create batch
    res_batch = client.post(
        "/api/v1/import/batches",
        json={
            "source_provider": "osm",
            "source_reference": "lpu_osm_extract.json",
            "description": "LPU OpenStreetMap building footprints extract",
        },
        headers=ADMIN_HEADERS,
    )
    assert res_batch.status_code == 201
    batch_data = res_batch.json()
    batch_id = batch_data["id"]
    assert batch_data["source_provider"] == "osm"
    assert batch_data["status"] == "pending"

    # 2. Stage a location record
    res_stage = client.post(
        f"/api/v1/import/batches/{batch_id}/records",
        json={
            "external_element_type": "way",
            "external_element_id": "osm:way:99887766",
            "proposed_name": "University Main Gate",
            "proposed_location_type": "gate",
            "latitude": 31.2535,
            "longitude": 75.7025,
            "original_tags": {"barrier": "gate", "wheelchair": "yes"},
        },
        headers=ADMIN_HEADERS,
    )
    assert res_stage.status_code == 201
    staged = res_stage.json()
    assert staged["verification_status"] == "pending"
    assert staged["external_element_id"] == "osm:way:99887766"

    # 3. Duplicate external reference is rejected (400)
    res_dup = client.post(
        f"/api/v1/import/batches/{batch_id}/records",
        json={
            "external_element_type": "way",
            "external_element_id": "osm:way:99887766",
            "proposed_name": "Duplicate Entry",
            "proposed_location_type": "gate",
        },
        headers=ADMIN_HEADERS,
    )
    assert res_dup.status_code == 400
    assert "already staged" in res_dup.json()["detail"].lower()


def test_geojson_feature_collection_staging(client):
    """Verify ingestion of a standard GeoJSON FeatureCollection."""
    # Create batch
    batch = client.post(
        "/api/v1/import/batches",
        json={"source_provider": "geojson", "description": "Surveyor GeoJSON"},
        headers=ADMIN_HEADERS,
    ).json()
    batch_id = batch["id"]

    geojson_payload = {
        "geojson": {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "id": "survey:point:lib",
                    "geometry": {"type": "Point", "coordinates": [75.7040, 31.2550]},
                    "properties": {"name": "Central Library Building", "building": "library"},
                },
                {
                    "type": "Feature",
                    "id": "survey:poly:sports",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [
                            [
                                [75.7050, 31.2560],
                                [75.7060, 31.2560],
                                [75.7060, 31.2570],
                                [75.7050, 31.2570],
                                [75.7050, 31.2560],
                            ]
                        ],
                    },
                    "properties": {"name": "Indoor Stadium", "building": "sports_centre"},
                },
            ],
        },
        "default_location_type": "building",
    }

    res_geojson = client.post(
        f"/api/v1/import/batches/{batch_id}/geojson",
        json=geojson_payload,
        headers=ADMIN_HEADERS,
    )
    assert res_geojson.status_code == 200
    data = res_geojson.json()
    assert data["staged_count"] == 2
    assert data["skipped_duplicates_count"] == 0


def test_staged_record_review_approve_and_reject(client):
    """Verify review approval promotes to canonical Location, while rejection records reason."""
    batch = client.post(
        "/api/v1/import/batches",
        json={"source_provider": "osm"},
        headers=ADMIN_HEADERS,
    ).json()

    # Stage Record 1 (to be approved)
    rec1 = client.post(
        f"/api/v1/import/batches/{batch['id']}/records",
        json={
            "external_element_type": "node",
            "external_element_id": "osm:node:112233",
            "proposed_name": "Block 34",
            "proposed_location_type": "building",
            "latitude": 31.2540,
            "longitude": 75.7030,
        },
        headers=ADMIN_HEADERS,
    ).json()

    # Stage Record 2 (to be rejected)
    rec2 = client.post(
        f"/api/v1/import/batches/{batch['id']}/records",
        json={
            "external_element_type": "node",
            "external_element_id": "osm:node:445566",
            "proposed_name": "Highway Dhaba",
            "proposed_location_type": "food_court",
        },
        headers=ADMIN_HEADERS,
    ).json()

    # 1. Approve Record 1 with override name
    res_app = client.post(
        f"/api/v1/import/records/{rec1['id']}/review",
        json={
            "action": "approve",
            "approved_name": "Block 34 (Computer Science)",
            "approved_location_type": "building",
        },
        headers=ADMIN_HEADERS,
    )
    assert res_app.status_code == 200
    app_data = res_app.json()
    assert app_data["verification_status"] == "approved"
    assert app_data["canonical_location_id"] is not None

    # Verify canonical location now exists in public locations directory
    canonical_id = app_data["canonical_location_id"]
    res_can = client.get(f"/api/v1/locations/{canonical_id}")
    assert res_can.status_code == 200
    assert res_can.json()["name"] == "Block 34 (Computer Science)"
    assert res_can.json()["is_verified"] is True

    # 2. Reject Record 2 with reason
    res_rej = client.post(
        f"/api/v1/import/records/{rec2['id']}/review",
        json={"action": "reject", "rejection_reason": "Commercial establishment outside campus boundary."},
        headers=ADMIN_HEADERS,
    )
    assert res_rej.status_code == 200
    rej_data = res_rej.json()
    assert rej_data["verification_status"] == "rejected"
    assert "outside campus" in rej_data["rejection_reason"].lower()
    assert rej_data["canonical_location_id"] is None


def test_import_duplicate_detection_against_canonical(client):
    """Verify that staged records detect potential duplicate candidates in canonical locations."""
    # Create canonical location
    client.post(
        "/api/v1/locations/",
        json={"name": "UniHospital", "location_type": "facility", "latitude": 31.2500, "longitude": 75.7000},
        headers=ADMIN_HEADERS,
    )

    batch = client.post(
        "/api/v1/import/batches",
        json={"source_provider": "osm"},
        headers=ADMIN_HEADERS,
    ).json()

    # Stage record with matching name
    staged = client.post(
        f"/api/v1/import/batches/{batch['id']}/records",
        json={
            "external_element_type": "way",
            "external_element_id": "osm:way:unihosp_test",
            "proposed_name": "UniHospital",
            "proposed_location_type": "facility",
            "latitude": 31.2501,
            "longitude": 75.7001,
        },
        headers=ADMIN_HEADERS,
    ).json()

    assert len(staged["potential_duplicates"]) >= 1
    dup = staged["potential_duplicates"][0]
    assert dup["name"] == "UniHospital"
    assert "match" in dup["similarity_reason"].lower() or "proximity" in dup["similarity_reason"].lower()
