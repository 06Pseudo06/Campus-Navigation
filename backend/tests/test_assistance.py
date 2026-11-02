"""Unit and integration tests for visitor assistance requests, destination lookup, and QR wayfinding."""

import uuid
import pytest
from app.services.assistance_service import generate_qr_navigation_token, resolve_qr_navigation_token

ADMIN_HEADERS = {"X-Admin-Key": "campusway-admin-dev-secret"}


def test_submit_assistance_request_public_and_moderation(client):
    """Verify visitor help request submission and staff moderation lifecycle."""
    bldg = client.post(
        "/api/v1/locations/",
        json={"name": "Help Desk Hub", "location_type": "building"},
        headers=ADMIN_HEADERS,
    ).json()

    # 1. Public submission (no auth required)
    res_sub = client.post(
        "/api/v1/assistance/requests",
        json={
            "requester_name": "Lost Parent",
            "contact_phone": "+919876543210",
            "target_location_id": bldg["id"],
            "assistance_type": "lost",
            "description": "Looking for Convocation Hall in Block 34.",
        },
    )
    assert res_sub.status_code == 201
    req_data = res_sub.json()
    assert req_data["status"] == "pending"
    assert req_data["requester_name"] == "Lost Parent"
    req_id = req_data["id"]

    # 2. Staff lists requests (unauthenticated fails 401)
    res_unauth = client.get("/api/v1/assistance/requests")
    assert res_unauth.status_code == 401

    res_staff = client.get("/api/v1/assistance/requests", headers=ADMIN_HEADERS)
    assert res_staff.status_code == 200
    assert any(r["id"] == req_id for r in res_staff.json())

    # 3. Staff updates status to assigned
    res_patch = client.patch(
        f"/api/v1/assistance/requests/{req_id}",
        json={"status": "assigned", "resolution_notes": "Security Officer Sharma dispatched."},
        headers=ADMIN_HEADERS,
    )
    assert res_patch.status_code == 200
    assert res_patch.json()["status"] == "assigned"
    assert res_patch.json()["resolved_at"] is None

    # 4. Resolve request
    res_resolve = client.patch(
        f"/api/v1/assistance/requests/{req_id}",
        json={"status": "resolved", "resolution_notes": "Visitor safely guided to Convocation Hall."},
        headers=ADMIN_HEADERS,
    )
    assert res_resolve.status_code == 200
    assert res_resolve.json()["status"] == "resolved"
    assert res_resolve.json()["resolved_at"] is not None


def test_visitor_destinations_topology_status(client):
    """Verify destination guide checks whether walking route topology is available."""
    # Location 1: with node and edge (topology available)
    loc1 = client.post("/api/v1/locations/", json={"name": "Gate 1", "location_type": "gate"}, headers=ADMIN_HEADERS).json()
    n1 = client.post("/api/v1/routing/nodes", json={"location_id": loc1["id"], "node_type": "gate", "latitude": 31.25, "longitude": 75.70}, headers=ADMIN_HEADERS).json()
    n2 = client.post("/api/v1/routing/nodes", json={"node_type": "junction", "latitude": 31.251, "longitude": 75.701}, headers=ADMIN_HEADERS).json()
    client.post("/api/v1/routing/edges", json={"source_node_id": n1["id"], "target_node_id": n2["id"], "distance_m": 25.0}, headers=ADMIN_HEADERS)

    # Location 2: without node (topology pending)
    loc2 = client.post("/api/v1/locations/", json={"name": "Remote Farm Block", "location_type": "building"}, headers=ADMIN_HEADERS).json()

    # Query destinations
    res = client.get("/api/v1/assistance/destinations")
    assert res.status_code == 200
    cards = res.json()

    card1 = next(c for c in cards if c["id"] == loc1["id"])
    card2 = next(c for c in cards if c["id"] == loc2["id"])

    assert card1["has_route_topology"] is True
    assert card2["has_route_topology"] is False
    assert "pending" in card2["visitor_guidance"].lower()


def test_qr_wayfinding_token_generation_and_resolution(client):
    """Verify QR token generation, signature validation, and topology guarantees."""
    # Destination with topology
    loc = client.post("/api/v1/locations/", json={"name": "Administration Block", "location_type": "building"}, headers=ADMIN_HEADERS).json()
    node = client.post("/api/v1/routing/nodes", json={"location_id": loc["id"], "node_type": "entrance", "latitude": 31.252, "longitude": 75.702}, headers=ADMIN_HEADERS).json()
    waypoint = client.post("/api/v1/routing/nodes", json={"node_type": "junction", "latitude": 31.253, "longitude": 75.703}, headers=ADMIN_HEADERS).json()
    client.post("/api/v1/routing/edges", json={"source_node_id": node["id"], "target_node_id": waypoint["id"], "distance_m": 40.0}, headers=ADMIN_HEADERS)

    # 1. Generate QR token
    res_gen = client.post(
        "/api/v1/assistance/qr/generate",
        json={"location_id": loc["id"], "qr_type": "destination", "expires_in_hours": 24},
        headers=ADMIN_HEADERS,
    )
    assert res_gen.status_code == 200
    qr_data = res_gen.json()
    assert qr_data["token"].startswith("CWQR.")
    assert qr_data["has_route_topology"] is True
    token = qr_data["token"]

    # 2. Public resolution of scanned QR token
    res_res = client.get("/api/v1/assistance/qr/resolve", params={"token": token})
    assert res_res.status_code == 200
    resolved = res_res.json()
    assert resolved["valid"] is True
    assert resolved["has_route_topology"] is True
    assert resolved["routing_available"] is True
    assert resolved["destination"]["name"] == "Administration Block"

    # 3. Tampered token is rejected
    tampered_token = token[:-5] + "XXXXX"
    res_tampered = client.get("/api/v1/assistance/qr/resolve", params={"token": tampered_token})
    assert res_tampered.status_code == 200
    assert res_tampered.json()["valid"] is False
    assert "signature" in res_tampered.json()["status_message"].lower() or "failed" in res_tampered.json()["status_message"].lower()

    # 4. Malformed token is rejected
    res_malformed = client.get("/api/v1/assistance/qr/resolve", params={"token": "invalid-random-string"})
    assert res_malformed.status_code == 200
    assert res_malformed.json()["valid"] is False
