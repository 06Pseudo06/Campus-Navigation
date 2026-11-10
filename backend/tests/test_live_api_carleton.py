"""Live API integration tests against the ingested Carleton dataset on local PostgreSQL."""

import os
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings


@pytest.fixture(scope="module")
def api_client():
    """Create FastAPI test client configured for the local database."""
    client = TestClient(app)
    return client


def test_locations_search_library(api_client: TestClient):
    """Test 1: GET /api/v1/locations/?query=Library."""
    response = api_client.get("/api/v1/locations/?query=Library")
    assert response.status_code == 200, response.text
    locations = response.json()
    assert len(locations) > 0, "Expected at least one location matching 'Library'"

    top_loc = locations[0]
    assert "library" in top_loc["name"].lower() or "library" in top_loc["slug"].lower()
    assert top_loc["location_type"] == "building"
    assert top_loc["latitude"] is not None and -90.0 <= top_loc["latitude"] <= 90.0
    assert top_loc["longitude"] is not None and -180.0 <= top_loc["longitude"] <= 180.0
    assert top_loc["is_active"] is True


def test_assistance_visitor_destinations(api_client: TestClient):
    """Test 2: GET /api/v1/assistance/destinations?category=building."""
    response = api_client.get("/api/v1/assistance/destinations?category=building")
    assert response.status_code == 200, response.text
    destinations = response.json()
    assert len(destinations) == 48, f"Expected 48 buildings, got {len(destinations)}"

    # 47 of 48 buildings are routable (Social Sciences Research Building exceeds 35m snapping threshold)
    routable_count = sum(1 for d in destinations if d["has_route_topology"])
    assert routable_count == 47, f"Expected 47 routable buildings, got {routable_count}"

    for dest in destinations:
        if dest["has_route_topology"]:
            assert dest["nearest_node_id"] is not None
            assert dest["visitor_guidance"] == "Pedestrian access point verified."
        else:
            assert dest["slug"] == "social-sciences-research-building"
            assert dest["nearest_node_id"] is None
            assert dest["visitor_guidance"] == "Navigation topology pending campus ground mapping."


def test_routing_nodes_for_location(api_client: TestClient):
    """Test 3: GET /api/v1/routing/nodes?location_id={location_id}."""
    # Lookup MacOdrum Library
    loc_resp = api_client.get("/api/v1/locations/?query=MacOdrum")
    assert loc_resp.status_code == 200
    locations = loc_resp.json()
    assert len(locations) > 0
    lib_id = locations[0]["id"]

    nodes_resp = api_client.get(f"/api/v1/routing/nodes?location_id={lib_id}")
    assert nodes_resp.status_code == 200, nodes_resp.text
    nodes = nodes_resp.json()
    assert len(nodes) > 0, "MacOdrum Library must have associated entrance/access nodes"

    for n in nodes:
        assert n["location_id"] == lib_id
        assert n["node_type"] in ("entrance", "synthetic_access")
        assert n["is_active"] is True


def test_route_calculation_dijkstra_and_astar(api_client: TestClient):
    """Test 4 & 5: Dijkstra and A* pathfinding between two real campus locations."""
    dest_resp = api_client.get("/api/v1/assistance/destinations?category=building")
    assert dest_resp.status_code == 200
    destinations = dest_resp.json()

    # Select two routable buildings: MacOdrum Library and Paterson Hall
    origin_dest = next(d for d in destinations if "macodrum" in d["slug"] and d["has_route_topology"])
    target_dest = next(d for d in destinations if "paterson" in d["slug"] and d["has_route_topology"])

    origin_node_id = origin_dest["nearest_node_id"]
    target_node_id = target_dest["nearest_node_id"]

    # 4. Dijkstra
    dijkstra_payload = {
        "origin_node_id": origin_node_id,
        "destination_node_id": target_node_id,
        "accessible_only": False,
        "algorithm": "dijkstra",
    }
    d_resp = api_client.post("/api/v1/routing/calculate", json=dijkstra_payload)
    assert d_resp.status_code == 200, d_resp.text
    d_route = d_resp.json()

    assert d_route["origin_node_id"] == origin_node_id
    assert d_route["destination_node_id"] == target_node_id
    assert d_route["total_distance_m"] > 0
    assert len(d_route["path_nodes"]) >= 2
    assert d_route["path_nodes"][0] == origin_node_id
    assert d_route["path_nodes"][-1] == target_node_id
    assert len(d_route["segments"]) == len(d_route["path_nodes"]) - 1
    assert d_route["estimated_duration_min"] is not None and d_route["estimated_duration_min"] > 0

    # 5. A*
    astar_payload = {
        "origin_node_id": origin_node_id,
        "destination_node_id": target_node_id,
        "accessible_only": False,
        "algorithm": "astar",
    }
    a_resp = api_client.post("/api/v1/routing/calculate", json=astar_payload)
    assert a_resp.status_code == 200, a_resp.text
    a_route = a_resp.json()

    assert a_route["origin_node_id"] == origin_node_id
    assert a_route["destination_node_id"] == target_node_id
    assert len(a_route["path_nodes"]) == len(d_route["path_nodes"])
    # Both algorithms must discover the exact same optimal distance
    assert abs(a_route["total_distance_m"] - d_route["total_distance_m"]) < 0.001
