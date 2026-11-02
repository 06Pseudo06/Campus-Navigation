"""Dedicated reliability and edge-case test suite for Milestone 10.

Covers authentication edge cases, location pagination/filtering, routing alternatives/validation,
assistance expiration/validation, and report workflow authorization boundaries.
"""

import uuid
import pytest
from app.core.security import create_access_token
from app.models.user import User

ADMIN_HEADERS = {"X-Admin-Key": "campusway-admin-dev-secret"}


# ==============================================================================
# 1. AUTHENTICATION & AUTHORIZATION EDGE CASES
# ==============================================================================

def test_expired_token_rejected_on_api(client):
    """Verify that requests bearing an expired JWT are rejected with 401."""
    expired_token = create_access_token({"sub": str(uuid.uuid4()), "role": "user"}, expires_in_seconds=-60)
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401
    assert "expired" in res.json()["detail"].lower()


def test_malformed_auth_header_rejected(client):
    """Verify that invalid token formats or unknown authentication schemes return 400 or 401."""
    # Malformed non-JWT string
    res1 = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer this-is-not-a-valid-token"})
    assert res1.status_code in (400, 401)

    # Missing bearer prefix or empty
    res2 = client.get("/api/v1/auth/me", headers={"Authorization": ""})
    assert res2.status_code == 401


def test_role_restriction_moderator_cannot_perform_admin(client):
    """Verify that a moderator can access moderation routes but cannot perform administrative writes."""
    mod_user_id = str(uuid.uuid4())
    mod_token = create_access_token({"sub": mod_user_id, "role": "moderator"}, expires_in_seconds=3600)
    mod_headers = {"Authorization": f"Bearer {mod_token}"}

    # Moderator can access visitor assistance moderation list
    res_assist = client.get("/api/v1/assistance/requests", headers=mod_headers)
    assert res_assist.status_code == 200

    # Moderator cannot create routing nodes (admin-only) -> 403 Forbidden
    res_admin_op = client.post(
        "/api/v1/routing/nodes",
        json={"node_type": "junction", "latitude": 31.25, "longitude": 75.70},
        headers=mod_headers,
    )
    assert res_admin_op.status_code == 403
    assert "administrative" in res_admin_op.json()["detail"].lower()


# ==============================================================================
# 2. LOCATIONS PAGINATION AND FILTERING
# ==============================================================================

def test_location_pagination_skip_limit(client):
    """Verify skip and limit parameters on public location search."""
    # Create 5 distinct buildings
    for i in range(5):
        client.post(
            "/api/v1/locations/",
            json={"name": f"Paging Building {i}", "location_type": "building"},
            headers=ADMIN_HEADERS,
        )

    # Fetch with limit=2, skip=0
    res_p1 = client.get("/api/v1/locations/", params={"query": "Paging Building", "limit": 2, "skip": 0})
    assert res_p1.status_code == 200
    page1 = res_p1.json()
    assert len(page1) == 2

    # Fetch next page with limit=2, skip=2
    res_p2 = client.get("/api/v1/locations/", params={"query": "Paging Building", "limit": 2, "skip": 2})
    assert res_p2.status_code == 200
    page2 = res_p2.json()
    assert len(page2) == 2

    # Pages must contain mutually disjoint location records
    p1_ids = {item["id"] for item in page1}
    p2_ids = {item["id"] for item in page2}
    assert p1_ids.isdisjoint(p2_ids)


def test_location_active_vs_inactive_filtering(client):
    """Verify filtering locations by is_active status."""
    loc = client.post(
        "/api/v1/locations/",
        json={"name": "Temporary Demolished Hall", "location_type": "building"},
        headers=ADMIN_HEADERS,
    ).json()

    # Deactivate it
    client.delete(f"/api/v1/locations/{loc['id']}", headers=ADMIN_HEADERS)

    # Default query (is_active=True) must not contain it
    res_active = client.get("/api/v1/locations/", params={"query": "Temporary Demolished Hall", "is_active": True})
    assert all(item["id"] != loc["id"] for item in res_active.json())

    # Query with is_active=False must return it
    res_inactive = client.get("/api/v1/locations/", params={"query": "Temporary Demolished Hall", "is_active": False})
    assert any(item["id"] == loc["id"] for item in res_inactive.json())


def test_location_get_nonexistent_returns_404(client):
    """Verify that querying a non-existent UUID returns 404."""
    fake_id = uuid.uuid4()
    res = client.get(f"/api/v1/locations/{fake_id}")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


# ==============================================================================
# 3. ROUTING ENGINE EDGE CASES
# ==============================================================================

def test_routing_invalid_endpoints_return_404(client):
    """Verify calculating a route with invalid/non-existent node IDs returns 404."""
    existing_node = client.post(
        "/api/v1/routing/nodes",
        json={"node_type": "junction", "latitude": 31.25, "longitude": 75.70},
        headers=ADMIN_HEADERS,
    ).json()
    fake_id = str(uuid.uuid4())

    res = client.post(
        "/api/v1/routing/calculate",
        json={"origin_node_id": existing_node["id"], "destination_node_id": fake_id},
    )
    assert res.status_code == 404
    assert "no walkable path" in res.json()["detail"].lower()


def test_routing_multiple_route_alternatives_shortest_path_selection(client):
    """Verify Dijkstra algorithm selects the strictly shorter path among multiple alternatives."""
    # Graph Topology:
    # Origin: S
    # Path A: S -> A (30m) -> D (40m) = 70m total
    # Path B: S -> B (20m) -> D (25m) = 45m total
    nS = client.post("/api/v1/routing/nodes", json={"node_type": "junction", "latitude": 31.250, "longitude": 75.700}, headers=ADMIN_HEADERS).json()
    nA = client.post("/api/v1/routing/nodes", json={"node_type": "junction", "latitude": 31.251, "longitude": 75.701}, headers=ADMIN_HEADERS).json()
    nB = client.post("/api/v1/routing/nodes", json={"node_type": "junction", "latitude": 31.250, "longitude": 75.701}, headers=ADMIN_HEADERS).json()
    nD = client.post("/api/v1/routing/nodes", json={"node_type": "junction", "latitude": 31.251, "longitude": 75.702}, headers=ADMIN_HEADERS).json()

    # Path A edges
    client.post("/api/v1/routing/edges", json={"source_node_id": nS["id"], "target_node_id": nA["id"], "distance_m": 30.0}, headers=ADMIN_HEADERS)
    client.post("/api/v1/routing/edges", json={"source_node_id": nA["id"], "target_node_id": nD["id"], "distance_m": 40.0}, headers=ADMIN_HEADERS)

    # Path B edges (shorter total: 45m)
    client.post("/api/v1/routing/edges", json={"source_node_id": nS["id"], "target_node_id": nB["id"], "distance_m": 20.0}, headers=ADMIN_HEADERS)
    client.post("/api/v1/routing/edges", json={"source_node_id": nB["id"], "target_node_id": nD["id"], "distance_m": 25.0}, headers=ADMIN_HEADERS)

    res = client.post(
        "/api/v1/routing/calculate",
        json={"origin_node_id": nS["id"], "destination_node_id": nD["id"]},
    )
    assert res.status_code == 200
    route = res.json()
    assert route["total_distance_m"] == 45.0
    assert route["path_nodes"] == [nS["id"], nB["id"], nD["id"]]
    assert len(route["segments"]) == 2


def test_routing_edge_weight_validation(client):
    """Verify that edge creation with distance <= 0 is rejected by schema validation."""
    n1 = client.post("/api/v1/routing/nodes", json={"node_type": "junction", "latitude": 31.25, "longitude": 75.70}, headers=ADMIN_HEADERS).json()
    n2 = client.post("/api/v1/routing/nodes", json={"node_type": "junction", "latitude": 31.26, "longitude": 75.71}, headers=ADMIN_HEADERS).json()

    # Distance <= 0
    res = client.post(
        "/api/v1/routing/edges",
        json={"source_node_id": n1["id"], "target_node_id": n2["id"], "distance_m": 0.0},
        headers=ADMIN_HEADERS,
    )
    assert res.status_code == 422


# ==============================================================================
# 4. VISITOR ASSISTANCE EDGE CASES
# ==============================================================================

def test_expired_qr_token_resolution(client, db):
    """Verify that an expired QR wayfinding token is rejected upon resolution."""
    from app.services.assistance_service import generate_qr_navigation_token

    loc = client.post(
        "/api/v1/locations/",
        json={"name": "Short-lived Event Booth", "location_type": "facility"},
        headers=ADMIN_HEADERS,
    ).json()

    # 1. API endpoint rejects negative hours with 422 schema validation error
    gen_res = client.post(
        "/api/v1/assistance/qr/generate",
        json={"location_id": loc["id"], "qr_type": "destination", "expires_in_hours": -1},
        headers=ADMIN_HEADERS,
    )
    assert gen_res.status_code == 422

    # 2. Directly generate token expired in past (-1 hour)
    expired_resp = generate_qr_navigation_token(db, uuid.UUID(loc["id"]), expires_in_hours=-1)
    expired_token = expired_resp.token

    # 3. Resolution should return valid=False with expired indication
    res = client.get("/api/v1/assistance/qr/resolve", params={"token": expired_token})
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is False
    assert "expired" in data["status_message"].lower()


# ==============================================================================
# 5. FAVORITES & REPORTS AUTHORIZATION BOUNDARIES
# ==============================================================================

def test_favorite_nonexistent_location_rejected(client):
    """Verify adding a favorite for a non-existent location ID returns 400."""
    user_id = str(uuid.uuid4())
    fake_loc_id = str(uuid.uuid4())

    res = client.post(
        "/api/v1/favorites/",
        json={"user_id": user_id, "location_id": fake_loc_id},
        headers={"X-User-ID": user_id},
    )
    assert res.status_code == 400
    assert "not found" in res.json()["detail"].lower() or "does not exist" in res.json()["detail"].lower()


def test_report_workflow_and_permission_boundaries(client):
    """Verify full report resolution workflow by staff and rejection of non-owner/non-admin modifications."""
    loc = client.post(
        "/api/v1/locations/",
        json={"name": "Signboard Target Location", "location_type": "building"},
        headers=ADMIN_HEADERS,
    ).json()

    reporter_id = str(uuid.uuid4())
    reporter_token = create_access_token({"sub": reporter_id, "role": "user"}, expires_in_seconds=3600)
    reporter_headers = {"Authorization": f"Bearer {reporter_token}"}

    # 1. Reporter submits report
    res_submit = client.post(
        "/api/v1/reports/",
        json={
            "location_id": loc["id"],
            "report_type": "incorrect_info",
            "description": "Building name on signboard says Block 35 not Block 34.",
        },
        headers=reporter_headers,
    )
    assert res_submit.status_code == 201
    rep = res_submit.json()
    report_id = rep["id"]
    assert rep["status"] == "pending"

    # 2. Reporter attempts to update status -> 403 Forbidden
    res_user_status = client.patch(
        f"/api/v1/reports/{report_id}",
        json={"status": "resolved"},
        headers=reporter_headers,
    )
    assert res_user_status.status_code == 403
    assert "administrator" in res_user_status.json()["detail"].lower()

    # 3. Staff moderator updates status to reviewing
    mod_id = str(uuid.uuid4())
    mod_token = create_access_token({"sub": mod_id, "role": "moderator"}, expires_in_seconds=3600)
    mod_headers = {"Authorization": f"Bearer {mod_token}"}

    res_mod_rev = client.patch(
        f"/api/v1/reports/{report_id}",
        json={"status": "reviewing", "resolution_notes": "Surveyor assigned to inspect signboard."},
        headers=mod_headers,
    )
    assert res_mod_rev.status_code == 200
    assert res_mod_rev.json()["status"] == "reviewing"
    assert "surveyor" in res_mod_rev.json()["resolution_notes"].lower()

    # 4. Staff administrator resolves report
    res_admin_res = client.patch(
        f"/api/v1/reports/{report_id}",
        json={"status": "resolved", "resolution_notes": "Signboard verified and database corrected."},
        headers=ADMIN_HEADERS,
    )
    assert res_admin_res.status_code == 200
    assert res_admin_res.json()["status"] == "resolved"
