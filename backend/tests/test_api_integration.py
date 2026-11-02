"""API integration tests for locations, routing, favorites, reports, and security authorization."""

import uuid
import pytest
from app.models.user import User

ADMIN_HEADERS = {"X-Admin-Key": "campusway-admin-dev-secret"}


def test_unauthorized_administrative_operations_rejected(client):
    """Verify that all administrative write operations are rejected with 401 when unauthenticated."""
    dummy_id = uuid.uuid4()

    # 1. Location write operations
    res_loc_post = client.post("/api/v1/locations/", json={"name": "Hacker Hall", "location_type": "building"})
    assert res_loc_post.status_code == 401
    assert "administrative" in res_loc_post.json()["detail"].lower()

    res_loc_put = client.put(f"/api/v1/locations/{dummy_id}", json={"name": "New Name"})
    assert res_loc_put.status_code == 401

    res_loc_del = client.delete(f"/api/v1/locations/{dummy_id}")
    assert res_loc_del.status_code == 401

    res_alias_post = client.post(f"/api/v1/locations/{dummy_id}/aliases", json={"alias": "Alias"})
    assert res_alias_post.status_code == 401

    # 2. Routing graph write operations
    res_node_post = client.post("/api/v1/routing/nodes", json={"node_type": "entrance", "latitude": 10.0, "longitude": 20.0})
    assert res_node_post.status_code == 401

    res_edge_post = client.post(
        "/api/v1/routing/edges",
        json={"source_node_id": str(dummy_id), "target_node_id": str(uuid.uuid4()), "distance_m": 10.0},
    )
    assert res_edge_post.status_code == 401

    # 3. Reports moderation
    res_rep_list = client.get("/api/v1/reports/")
    assert res_rep_list.status_code == 401

    res_rep_patch = client.patch(f"/api/v1/reports/{dummy_id}", json={"status": "resolved"})
    assert res_rep_patch.status_code == 401


def test_invalid_administrative_key_forbidden(client):
    """Verify that supplying an incorrect administrative key returns 403 Forbidden."""
    bad_headers = {"X-Admin-Key": "wrong-secret-token"}
    res = client.post("/api/v1/locations/", json={"name": "Bad Auth", "location_type": "building"}, headers=bad_headers)
    assert res.status_code == 403
    assert "forbidden" in res.json()["detail"].lower()


def test_locations_api_crud_and_search(client):
    """Verify location CRUD with admin authorization, public search, and hierarchy navigation."""
    # 1. Create building location with valid admin credentials
    res1 = client.post(
        "/api/v1/locations/",
        json={
            "name": "Science Block",
            "location_type": "building",
            "latitude": 12.9716,
            "longitude": 77.5946,
        },
        headers=ADMIN_HEADERS,
    )
    assert res1.status_code == 201
    loc1 = res1.json()
    loc1_id = loc1["id"]
    assert loc1["slug"] == "science-block"

    # 2. Add an alias
    res_alias = client.post(
        f"/api/v1/locations/{loc1_id}/aliases",
        json={"alias": "Block S"},
        headers=ADMIN_HEADERS,
    )
    assert res_alias.status_code == 201
    assert res_alias.json()["normalized_alias"] == "block s"

    # 3. Public search by alias (no auth required)
    res_search = client.get("/api/v1/locations/", params={"query": "Block S"})
    assert res_search.status_code == 200
    results = res_search.json()
    assert len(results) >= 1
    assert results[0]["id"] == loc1_id

    # 4. Create a child location
    res_child = client.post(
        "/api/v1/locations/",
        json={
            "name": "Physics Lab",
            "location_type": "room",
            "parent_id": loc1_id,
        },
        headers=ADMIN_HEADERS,
    )
    assert res_child.status_code == 201
    child_id = res_child.json()["id"]

    # 5. Public hierarchy retrieval
    res_hier = client.get(f"/api/v1/locations/{child_id}/hierarchy")
    assert res_hier.status_code == 200
    hier = res_hier.json()
    assert len(hier["ancestors"]) == 1
    assert hier["ancestors"][0]["id"] == loc1_id

    # 6. Cycle prevention on update
    res_cycle = client.put(
        f"/api/v1/locations/{loc1_id}",
        json={"parent_id": child_id},
        headers=ADMIN_HEADERS,
    )
    assert res_cycle.status_code == 400
    assert "circular" in res_cycle.json()["detail"].lower()

    # 7. Soft deactivation
    res_deact = client.delete(f"/api/v1/locations/{child_id}", headers=ADMIN_HEADERS)
    assert res_deact.status_code == 200
    assert res_deact.json()["is_active"] is False

    # Inactive excluded by default in public search
    res_active_list = client.get("/api/v1/locations/")
    active_ids = [l["id"] for l in res_active_list.json()]
    assert child_id not in active_ids


def test_location_parent_validation(client):
    """Verify validation when setting a non-existent or inactive parent location."""
    fake_parent_id = uuid.uuid4()

    # Non-existent parent
    res_nonexistent = client.post(
        "/api/v1/locations/",
        json={"name": "Orphan Room", "location_type": "room", "parent_id": str(fake_parent_id)},
        headers=ADMIN_HEADERS,
    )
    assert res_nonexistent.status_code == 400
    assert "does not exist" in res_nonexistent.json()["detail"]

    # Inactive parent
    parent = client.post(
        "/api/v1/locations/",
        json={"name": "Deprecated Complex", "location_type": "block"},
        headers=ADMIN_HEADERS,
    ).json()
    client.delete(f"/api/v1/locations/{parent['id']}", headers=ADMIN_HEADERS)

    res_inactive_parent = client.post(
        "/api/v1/locations/",
        json={"name": "Sub Room", "location_type": "room", "parent_id": parent["id"]},
        headers=ADMIN_HEADERS,
    )
    assert res_inactive_parent.status_code == 400
    assert "inactive location" in res_inactive_parent.json()["detail"]


def test_routing_graph_and_pathfinding(client):
    """Verify node and edge creation, bidirectional edge expansion, and route computation."""
    n1 = client.post("/api/v1/routing/nodes", json={"node_type": "gate", "latitude": 12.0, "longitude": 77.0}, headers=ADMIN_HEADERS).json()
    n2 = client.post("/api/v1/routing/nodes", json={"node_type": "junction", "latitude": 12.001, "longitude": 77.001}, headers=ADMIN_HEADERS).json()
    n3 = client.post("/api/v1/routing/nodes", json={"node_type": "entrance", "latitude": 12.002, "longitude": 77.002}, headers=ADMIN_HEADERS).json()

    # Create bidirectional edges: A <-> B (50m), B <-> C (30m)
    e1 = client.post(
        "/api/v1/routing/edges",
        json={
            "source_node_id": n1["id"],
            "target_node_id": n2["id"],
            "distance_m": 50.0,
            "path_type": "footpath",
            "is_bidirectional": True,
        },
        headers=ADMIN_HEADERS,
    )
    assert e1.status_code == 201

    e2 = client.post(
        "/api/v1/routing/edges",
        json={
            "source_node_id": n2["id"],
            "target_node_id": n3["id"],
            "distance_m": 30.0,
            "path_type": "footpath",
            "is_bidirectional": True,
        },
        headers=ADMIN_HEADERS,
    )
    assert e2.status_code == 201

    # Route forward: A to C
    res_route = client.post(
        "/api/v1/routing/calculate",
        json={"origin_node_id": n1["id"], "destination_node_id": n3["id"]},
    )
    assert res_route.status_code == 200
    route = res_route.json()
    assert route["total_distance_m"] == 80.0
    assert route["path_nodes"] == [n1["id"], n2["id"], n3["id"]]

    # Route backward: C to A (relies on bidirectional edge traversal)
    res_route_back = client.post(
        "/api/v1/routing/calculate",
        json={"origin_node_id": n3["id"], "destination_node_id": n1["id"]},
    )
    assert res_route_back.status_code == 200
    route_back = res_route_back.json()
    assert route_back["total_distance_m"] == 80.0
    assert route_back["path_nodes"] == [n3["id"], n2["id"], n1["id"]]


def test_routing_inactive_node_isolation(client):
    """Verify that deactivated nodes are isolated from pathfinding even if edges are present."""
    nA = client.post("/api/v1/routing/nodes", json={"node_type": "junction", "latitude": 10.0, "longitude": 20.0}, headers=ADMIN_HEADERS).json()
    nB = client.post("/api/v1/routing/nodes", json={"node_type": "junction", "latitude": 10.1, "longitude": 20.1}, headers=ADMIN_HEADERS).json()
    nC = client.post("/api/v1/routing/nodes", json={"node_type": "junction", "latitude": 10.2, "longitude": 20.2}, headers=ADMIN_HEADERS).json()

    # Edges A <-> B (10m) and B <-> C (10m)
    client.post("/api/v1/routing/edges", json={"source_node_id": nA["id"], "target_node_id": nB["id"], "distance_m": 10.0}, headers=ADMIN_HEADERS)
    client.post("/api/v1/routing/edges", json={"source_node_id": nB["id"], "target_node_id": nC["id"], "distance_m": 10.0}, headers=ADMIN_HEADERS)

    # Deactivate intermediate node B
    client.delete(f"/api/v1/routing/nodes/{nB['id']}", headers=ADMIN_HEADERS)

    # Attempt to route A -> C (should fail 404 because path through B is severed)
    res_route = client.post(
        "/api/v1/routing/calculate",
        json={"origin_node_id": nA["id"], "destination_node_id": nC["id"]},
    )
    assert res_route.status_code == 404


def test_routing_accessible_node_filtering(client):
    """Verify that accessible_only=True excludes inaccessible nodes (e.g. staircases)."""
    nA = client.post("/api/v1/routing/nodes", json={"node_type": "junction", "latitude": 10.0, "longitude": 20.0, "is_accessible": True}, headers=ADMIN_HEADERS).json()
    nStairs = client.post("/api/v1/routing/nodes", json={"node_type": "staircase", "latitude": 10.1, "longitude": 20.1, "is_accessible": False}, headers=ADMIN_HEADERS).json()
    nRamp = client.post("/api/v1/routing/nodes", json={"node_type": "ramp", "latitude": 10.1, "longitude": 20.2, "is_accessible": True}, headers=ADMIN_HEADERS).json()
    nB = client.post("/api/v1/routing/nodes", json={"node_type": "entrance", "latitude": 10.3, "longitude": 20.3, "is_accessible": True}, headers=ADMIN_HEADERS).json()

    # Short path via stairs (total 20m)
    client.post("/api/v1/routing/edges", json={"source_node_id": nA["id"], "target_node_id": nStairs["id"], "distance_m": 10.0, "is_accessible": False}, headers=ADMIN_HEADERS)
    client.post("/api/v1/routing/edges", json={"source_node_id": nStairs["id"], "target_node_id": nB["id"], "distance_m": 10.0, "is_accessible": False}, headers=ADMIN_HEADERS)

    # Longer path via ramp (total 40m, fully accessible)
    client.post("/api/v1/routing/edges", json={"source_node_id": nA["id"], "target_node_id": nRamp["id"], "distance_m": 20.0, "is_accessible": True}, headers=ADMIN_HEADERS)
    client.post("/api/v1/routing/edges", json={"source_node_id": nRamp["id"], "target_node_id": nB["id"], "distance_m": 20.0, "is_accessible": True}, headers=ADMIN_HEADERS)

    # Standard routing chooses shortest path (stairs, 20m)
    res_std = client.post(
        "/api/v1/routing/calculate",
        json={"origin_node_id": nA["id"], "destination_node_id": nB["id"], "accessible_only": False},
    )
    assert res_std.status_code == 200
    assert res_std.json()["total_distance_m"] == 20.0
    assert nStairs["id"] in res_std.json()["path_nodes"]

    # Accessible-only routing must choose the ramp path (40m) and bypass stairs
    res_acc = client.post(
        "/api/v1/routing/calculate",
        json={"origin_node_id": nA["id"], "destination_node_id": nB["id"], "accessible_only": True},
    )
    assert res_acc.status_code == 200
    assert res_acc.json()["total_distance_m"] == 40.0
    assert nStairs["id"] not in res_acc.json()["path_nodes"]
    assert nRamp["id"] in res_acc.json()["path_nodes"]


def test_duplicate_edge_policy(client):
    """Verify that duplicate forward and conflicting reverse bidirectional edges are rejected."""
    n1 = client.post("/api/v1/routing/nodes", json={"node_type": "junction", "latitude": 1.0, "longitude": 1.0}, headers=ADMIN_HEADERS).json()
    n2 = client.post("/api/v1/routing/nodes", json={"node_type": "junction", "latitude": 2.0, "longitude": 2.0}, headers=ADMIN_HEADERS).json()

    # Forward edge
    client.post(
        "/api/v1/routing/edges",
        json={"source_node_id": n1["id"], "target_node_id": n2["id"], "distance_m": 15.0, "is_bidirectional": True},
        headers=ADMIN_HEADERS,
    )

    # Exact duplicate
    res_exact = client.post(
        "/api/v1/routing/edges",
        json={"source_node_id": n1["id"], "target_node_id": n2["id"], "distance_m": 20.0, "is_bidirectional": True},
        headers=ADMIN_HEADERS,
    )
    assert res_exact.status_code == 400
    assert "already exists" in res_exact.json()["detail"].lower()

    # Conflicting reverse edge
    res_rev = client.post(
        "/api/v1/routing/edges",
        json={"source_node_id": n2["id"], "target_node_id": n1["id"], "distance_m": 15.0, "is_bidirectional": True},
        headers=ADMIN_HEADERS,
    )
    assert res_rev.status_code == 400
    assert "reverse direction" in res_rev.json()["detail"].lower()


def test_favorites_security_and_scoping(client, db):
    """Verify authentication enforcement and user isolation for favorites."""
    u1 = User(full_name="User One", email="u1@campus.edu")
    u2 = User(full_name="User Two", email="u2@campus.edu")
    db.add_all([u1, u2])
    db.commit()

    loc = client.post(
        "/api/v1/locations/",
        json={"name": "Botanical Garden", "location_type": "landmark"},
        headers=ADMIN_HEADERS,
    ).json()

    # 1. Unauthenticated request rejected
    res_unauth = client.get(f"/api/v1/favorites/{u1.id}")
    assert res_unauth.status_code == 401

    # 2. Add favorite for u1 with u1 header
    u1_headers = {"X-User-ID": str(u1.id)}
    res_add = client.post(
        "/api/v1/favorites/",
        json={"user_id": str(u1.id), "location_id": loc["id"]},
        headers=u1_headers,
    )
    assert res_add.status_code == 201

    # 3. User 2 cannot view user 1's favorites (403 Forbidden)
    u2_headers = {"X-User-ID": str(u2.id)}
    res_cross_view = client.get(f"/api/v1/favorites/{u1.id}", headers=u2_headers)
    assert res_cross_view.status_code == 403

    # 4. User 2 cannot delete user 1's favorite (403 Forbidden)
    res_cross_del = client.delete(f"/api/v1/favorites/{u1.id}/{loc['id']}", headers=u2_headers)
    assert res_cross_del.status_code == 403

    # 5. User 1 successfully deletes own favorite
    res_own_del = client.delete(f"/api/v1/favorites/{u1.id}/{loc['id']}", headers=u1_headers)
    assert res_own_del.status_code == 204


def test_reports_moderation_security(client, db):
    """Verify that visitors can submit reports publicly, but viewing/moderating requires admin credentials."""
    loc = client.post(
        "/api/v1/locations/",
        json={"name": "Clock Tower", "location_type": "landmark"},
        headers=ADMIN_HEADERS,
    ).json()

    # Public submission (no auth header needed)
    res_submit = client.post(
        "/api/v1/reports/",
        json={"location_id": loc["id"], "report_type": "wrong_pin", "description": "Pin 10m off."},
    )
    assert res_submit.status_code == 201
    rep_id = res_submit.json()["id"]

    # Listing reports without admin auth is rejected (401)
    res_unauth_list = client.get("/api/v1/reports/")
    assert res_unauth_list.status_code == 401

    # Listing with admin auth succeeds
    res_admin_list = client.get("/api/v1/reports/", headers=ADMIN_HEADERS)
    assert res_admin_list.status_code == 200
    assert any(r["id"] == rep_id for r in res_admin_list.json())

    # Patch without admin auth is rejected (401)
    res_unauth_patch = client.patch(f"/api/v1/reports/{rep_id}", json={"status": "resolved"})
    assert res_unauth_patch.status_code == 401

    # Patch with admin auth succeeds
    res_admin_patch = client.patch(f"/api/v1/reports/{rep_id}", json={"status": "resolved"}, headers=ADMIN_HEADERS)
    assert res_admin_patch.status_code == 200
    assert res_admin_patch.json()["status"] == "resolved"
    assert res_admin_patch.json()["resolved_at"] is not None
