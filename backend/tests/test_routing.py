"""Unit and integration tests for graph construction, Dijkstra, A*, directions, and walking time."""

import uuid
import pytest
from app.services.routing.algorithms import a_star_shortest_path, dijkstra_shortest_path
from app.services.routing.directions import calculate_bearing, calculate_walking_duration
from app.services.routing.graph import CampusGraph

ADMIN_HEADERS = {"X-Admin-Key": "campusway-admin-dev-secret"}


def test_walking_duration_calculation():
    """Verify walking time estimation matches speed formula."""
    # At 1.3 m/s, 130 meters takes 100 seconds ~= 1.7 minutes
    sec, mins = calculate_walking_duration(130.0, walking_speed_mps=1.3)
    assert sec == 100.0
    assert mins == 1.7

    # Zero distance takes 0 seconds
    z_sec, z_mins = calculate_walking_duration(0.0)
    assert z_sec == 0.0
    assert z_mins == 0.0


def test_bearing_calculation_cardinal_directions():
    """Verify geographic initial bearing calculations."""
    # Due North: (0.0, 0.0) to (1.0, 0.0) -> ~0 degrees
    b_north = calculate_bearing(0.0, 0.0, 1.0, 0.0)
    assert abs(b_north - 0.0) < 1.0

    # Due East: (0.0, 0.0) to (0.0, 1.0) -> ~90 degrees
    b_east = calculate_bearing(0.0, 0.0, 0.0, 1.0)
    assert abs(b_east - 90.0) < 1.0

    # Due South: (1.0, 0.0) to (0.0, 0.0) -> ~180 degrees
    b_south = calculate_bearing(1.0, 0.0, 0.0, 0.0)
    assert abs(b_south - 180.0) < 1.0

    # Due West: (0.0, 1.0) to (0.0, 0.0) -> ~270 degrees
    b_west = calculate_bearing(0.0, 1.0, 0.0, 0.0)
    assert abs(b_west - 270.0) < 1.0


def test_dijkstra_and_astar_pure_graph():
    """Verify Dijkstra and A* pathfinding on an in-memory CampusGraph."""
    graph = CampusGraph()
    # Nodes in an L-shape
    # A (0,0) -> B (0, 0.001) [100m] -> C (0.001, 0.001) [100m]
    # Direct diagonal A -> C [250m]
    graph.nodes = {
        "A": {"id": "A", "node_type": "gate", "latitude": 31.2500, "longitude": 75.7000, "is_accessible": True},
        "B": {"id": "B", "node_type": "junction", "latitude": 31.2500, "longitude": 75.7010, "is_accessible": True},
        "C": {"id": "C", "node_type": "entrance", "latitude": 31.2510, "longitude": 75.7010, "is_accessible": True},
    }
    graph.adjacency_list = {
        "A": [
            {"target": "B", "distance_m": 100.0, "path_type": "footpath", "is_accessible": True},
            {"target": "C", "distance_m": 250.0, "path_type": "footpath", "is_accessible": True},
        ],
        "B": [
            {"target": "A", "distance_m": 100.0, "path_type": "footpath", "is_accessible": True},
            {"target": "C", "distance_m": 100.0, "path_type": "corridor", "is_accessible": True},
        ],
        "C": [
            {"target": "B", "distance_m": 100.0, "path_type": "corridor", "is_accessible": True},
            {"target": "A", "distance_m": 250.0, "path_type": "footpath", "is_accessible": True},
        ],
    }

    # Dijkstra should choose A -> B -> C (200m) over A -> C (250m)
    dijk_res = dijkstra_shortest_path(graph, "A", "C")
    assert dijk_res is not None
    assert dijk_res["total_distance_m"] == 200.0
    assert dijk_res["path_nodes"] == ["A", "B", "C"]
    assert len(dijk_res["segments"]) == 2

    # A* should also find the optimal path
    astar_res = a_star_shortest_path(graph, "A", "C")
    assert astar_res is not None
    assert astar_res["total_distance_m"] == 200.0
    assert astar_res["path_nodes"] == ["A", "B", "C"]


def test_routing_api_with_walking_duration_and_directions(client):
    """Verify route calculation API returns estimated durations and turn instructions."""
    # Create 3 waypoints forming a right turn
    # n1 (31.2500, 75.7000) -> n2 (31.2510, 75.7000) [heading North]
    # n2 -> n3 (31.2510, 75.7010) [heading East => Right Turn]
    n1 = client.post("/api/v1/routing/nodes", json={"node_type": "gate", "latitude": 31.2500, "longitude": 75.7000}, headers=ADMIN_HEADERS).json()
    n2 = client.post("/api/v1/routing/nodes", json={"node_type": "junction", "latitude": 31.2510, "longitude": 75.7000}, headers=ADMIN_HEADERS).json()
    n3 = client.post("/api/v1/routing/nodes", json={"node_type": "entrance", "latitude": 31.2510, "longitude": 75.7010}, headers=ADMIN_HEADERS).json()

    # Edge 1: n1 -> n2 (111m footpath)
    client.post(
        "/api/v1/routing/edges",
        json={"source_node_id": n1["id"], "target_node_id": n2["id"], "distance_m": 111.0, "path_type": "footpath", "is_bidirectional": True},
        headers=ADMIN_HEADERS,
    )

    # Edge 2: n2 -> n3 (95m corridor)
    client.post(
        "/api/v1/routing/edges",
        json={"source_node_id": n2["id"], "target_node_id": n3["id"], "distance_m": 95.0, "path_type": "corridor", "is_bidirectional": True},
        headers=ADMIN_HEADERS,
    )

    # Calculate route via API
    res = client.post(
        "/api/v1/routing/calculate",
        json={"origin_node_id": n1["id"], "destination_node_id": n3["id"]},
    )
    assert res.status_code == 200
    route = res.json()

    assert route["total_distance_m"] == 206.0
    assert route["estimated_duration_s"] is not None
    assert route["estimated_duration_min"] is not None
    assert route["estimated_duration_s"] > 0

    segments = route["segments"]
    assert len(segments) == 2
    # First segment: straight / base instruction
    assert "footpath" in segments[0]["instruction"].lower()
    # Second segment should detect right turn onto corridor
    assert "right" in segments[1]["instruction"].lower() or "corridor" in segments[1]["instruction"].lower()


def test_routing_same_origin_and_unreachable(client):
    """Verify same-origin returns 0 distance, and unreachable disconnected node returns 404."""
    n1 = client.post("/api/v1/routing/nodes", json={"node_type": "gate", "latitude": 31.0, "longitude": 75.0}, headers=ADMIN_HEADERS).json()
    n_isolated = client.post("/api/v1/routing/nodes", json={"node_type": "junction", "latitude": 31.5, "longitude": 75.5}, headers=ADMIN_HEADERS).json()

    # Same origin
    res_same = client.post(
        "/api/v1/routing/calculate",
        json={"origin_node_id": n1["id"], "destination_node_id": n1["id"]},
    )
    assert res_same.status_code == 200
    same_data = res_same.json()
    assert same_data["total_distance_m"] == 0.0
    assert same_data["path_nodes"] == [n1["id"]]
    assert len(same_data["segments"]) == 0

    # Unreachable destination
    res_unreach = client.post(
        "/api/v1/routing/calculate",
        json={"origin_node_id": n1["id"], "destination_node_id": n_isolated["id"]},
    )
    assert res_unreach.status_code == 404
    assert "no walkable path" in res_unreach.json()["detail"].lower()


def test_directed_edge_one_way(client):
    """Verify directed edge allows forward traversal but disallows reverse traversal."""
    nA = client.post("/api/v1/routing/nodes", json={"node_type": "junction", "latitude": 30.0, "longitude": 70.0}, headers=ADMIN_HEADERS).json()
    nB = client.post("/api/v1/routing/nodes", json={"node_type": "junction", "latitude": 30.1, "longitude": 70.1}, headers=ADMIN_HEADERS).json()

    # Create ONE-WAY edge from nA -> nB
    client.post(
        "/api/v1/routing/edges",
        json={"source_node_id": nA["id"], "target_node_id": nB["id"], "distance_m": 50.0, "is_bidirectional": False},
        headers=ADMIN_HEADERS,
    )

    # A -> B succeeds
    res_fwd = client.post(
        "/api/v1/routing/calculate",
        json={"origin_node_id": nA["id"], "destination_node_id": nB["id"]},
    )
    assert res_fwd.status_code == 200
    assert res_fwd.json()["total_distance_m"] == 50.0

    # B -> A must fail (404) because edge is strictly one-way
    res_rev = client.post(
        "/api/v1/routing/calculate",
        json={"origin_node_id": nB["id"], "destination_node_id": nA["id"]},
    )
    assert res_rev.status_code == 404
