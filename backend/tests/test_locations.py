"""Unit and integration tests for location hierarchy, search ranking, duplicate prevention, and verification."""

import uuid
import pytest
from app.models.location import Location

ADMIN_HEADERS = {"X-Admin-Key": "campusway-admin-dev-secret"}


def test_location_verification_workflow(client):
    """Verify that ordinary creation does not auto-verify, and admin endpoint sets verified status."""
    res_create = client.post(
        "/api/v1/locations/",
        json={"name": "Auditorium 1", "location_type": "building", "is_verified": True},
        headers=ADMIN_HEADERS,
    )
    assert res_create.status_code == 201
    loc_data = res_create.json()
    loc_id = loc_data["id"]
    # Even if client sends is_verified=True, standard creation must default to False
    assert loc_data["is_verified"] is False

    # Attempting to verify via generic PUT is ignored
    res_put = client.put(
        f"/api/v1/locations/{loc_id}",
        json={"name": "Auditorium 1", "is_verified": True},
        headers=ADMIN_HEADERS,
    )
    assert res_put.status_code == 200
    assert res_put.json()["is_verified"] is False

    # Dedicated verification endpoint sets is_verified to True
    res_verify = client.post(
        f"/api/v1/locations/{loc_id}/verify",
        json={"is_verified": True, "verification_notes": "Ground-truth checked by survey team."},
        headers=ADMIN_HEADERS,
    )
    assert res_verify.status_code == 200
    assert res_verify.json()["is_verified"] is True


def test_location_duplicate_sibling_prevention(client):
    """Verify that creating two locations with the same name under the same parent is rejected."""
    parent = client.post(
        "/api/v1/locations/",
        json={"name": "Main Academic Block", "location_type": "building"},
        headers=ADMIN_HEADERS,
    ).json()

    # Room 101 under Main Academic Block
    res1 = client.post(
        "/api/v1/locations/",
        json={"name": "Room 101", "location_type": "room", "parent_id": parent["id"]},
        headers=ADMIN_HEADERS,
    )
    assert res1.status_code == 201

    # Duplicate Room 101 under same parent must fail with 400
    res_dup = client.post(
        "/api/v1/locations/",
        json={"name": "room 101", "location_type": "room", "parent_id": parent["id"]},
        headers=ADMIN_HEADERS,
    )
    assert res_dup.status_code == 400
    assert "already exists" in res_dup.json()["detail"].lower()


def test_location_search_ranking(client):
    """Verify search returns exact matches before partial and alias matches."""
    # Create 3 locations:
    # 1. "Central Library" (exact search for "Library" partial)
    # 2. "Library" (exact match)
    # 3. "Study Hall" with alias "Library 2"
    l1 = client.post("/api/v1/locations/", json={"name": "Central Library", "location_type": "building"}, headers=ADMIN_HEADERS).json()
    l2 = client.post("/api/v1/locations/", json={"name": "Library", "location_type": "building"}, headers=ADMIN_HEADERS).json()
    l3 = client.post("/api/v1/locations/", json={"name": "Study Hall", "location_type": "room"}, headers=ADMIN_HEADERS).json()
    client.post(f"/api/v1/locations/{l3['id']}/aliases", json={"alias": "Library Wing"}, headers=ADMIN_HEADERS)

    # Search "Library"
    res = client.get("/api/v1/locations/", params={"query": "Library"})
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 3

    # Exact match ("Library") should be first in ranking
    assert items[0]["name"] == "Library"
    assert items[0]["id"] == l2["id"]


def test_location_hierarchy_ancestors_and_children(client):
    """Verify dedicated ancestors and children query endpoints."""
    bldg = client.post("/api/v1/locations/", json={"name": "Faculty Block", "location_type": "building"}, headers=ADMIN_HEADERS).json()
    flr = client.post("/api/v1/locations/", json={"name": "First Floor", "location_type": "floor", "parent_id": bldg["id"]}, headers=ADMIN_HEADERS).json()
    rm = client.post("/api/v1/locations/", json={"name": "Dean Office", "location_type": "room", "parent_id": flr["id"]}, headers=ADMIN_HEADERS).json()

    # Children of building
    res_children = client.get(f"/api/v1/locations/{bldg['id']}/children")
    assert res_children.status_code == 200
    children = res_children.json()
    assert len(children) == 1
    assert children[0]["id"] == flr["id"]

    # Ancestors of room (bottom up: First Floor, then Faculty Block)
    res_ancestors = client.get(f"/api/v1/locations/{rm['id']}/ancestors")
    assert res_ancestors.status_code == 200
    ancestors = res_ancestors.json()
    assert len(ancestors) == 2
    assert ancestors[0]["id"] == flr["id"]
    assert ancestors[1]["id"] == bldg["id"]


def test_location_deactivation_child_safety_policy(client):
    """Verify deactivating parent with active children requires cascade=true."""
    complex_bldg = client.post("/api/v1/locations/", json={"name": "Sports Hub", "location_type": "building"}, headers=ADMIN_HEADERS).json()
    court = client.post("/api/v1/locations/", json={"name": "Badminton Court", "location_type": "room", "parent_id": complex_bldg["id"]}, headers=ADMIN_HEADERS).json()

    # Deactivating parent without cascade fails
    res_fail = client.delete(f"/api/v1/locations/{complex_bldg['id']}", headers=ADMIN_HEADERS)
    assert res_fail.status_code == 400
    assert "active sub-location" in res_fail.json()["detail"].lower()

    # Deactivating with cascade=True succeeds and deactivates children
    res_cascade = client.delete(f"/api/v1/locations/{complex_bldg['id']}", params={"cascade": True}, headers=ADMIN_HEADERS)
    assert res_cascade.status_code == 200
    assert res_cascade.json()["is_active"] is False

    # Check child is also inactive
    res_child_get = client.get(f"/api/v1/locations/{court['id']}")
    assert res_child_get.status_code == 404  # Inactive locations return 404 on default get
