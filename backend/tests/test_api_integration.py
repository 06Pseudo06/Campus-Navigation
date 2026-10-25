"""API integration tests for locations, routing, favorites, and reports."""

import uuid
from app.models.user import User


def test_locations_api_crud_and_search(client):
    # 1. Create building location
    res1 = client.post(
        "/api/v1/locations/",
        json={
            "name": "Science Block",
            "location_type": "building",
            "latitude": 12.9716,
            "longitude": 77.5946,
        },
    )
    assert res1.status_code == 201
    loc1 = res1.json()
    loc1_id = loc1["id"]
    assert loc1["slug"] == "science-block"

    # 2. Add an alias
    res_alias = client.post(
        f"/api/v1/locations/{loc1_id}/aliases",
        json={"alias": "Block S"},
    )
    assert res_alias.status_code == 201
    assert res_alias.json()["normalized_alias"] == "block s"

    # 3. Search by alias
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
    )
    assert res_child.status_code == 201
    child_id = res_child.json()["id"]

    # 5. Get hierarchy
    res_hier = client.get(f"/api/v1/locations/{child_id}/hierarchy")
    assert res_hier.status_code == 200
    hier = res_hier.json()
    assert len(hier["ancestors"]) == 1
    assert hier["ancestors"][0]["id"] == loc1_id

    # 6. Cycle prevention on update
    res_cycle = client.put(
        f"/api/v1/locations/{loc1_id}",
        json={"parent_id": child_id},
    )
    assert res_cycle.status_code == 400
    assert "circular" in res_cycle.json()["detail"].lower()

    # 7. Soft deactivation
    res_deact = client.delete(f"/api/v1/locations/{child_id}")
    assert res_deact.status_code == 200
    assert res_deact.json()["is_active"] is False

    # Inactive excluded by default
    res_active_list = client.get("/api/v1/locations/")
    active_ids = [l["id"] for l in res_active_list.json()]
    assert child_id not in active_ids


def test_routing_graph_and_pathfinding(client):
    # Create 3 navigation nodes (A -> B -> C)
    n1 = client.post("/api/v1/routing/nodes", json={"node_type": "gate", "latitude": 12.0, "longitude": 77.0}).json()
    n2 = client.post("/api/v1/routing/nodes", json={"node_type": "junction", "latitude": 12.001, "longitude": 77.001}).json()
    n3 = client.post("/api/v1/routing/nodes", json={"node_type": "entrance", "latitude": 12.002, "longitude": 77.002}).json()

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
    assert len(route["path_nodes"]) == 3
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


def test_favorites_and_reports_api(client, db):
    # Setup user and location
    user = User(full_name="Favorite User", email="favorite.user@campus.edu")
    db.add(user)
    db.commit()

    loc = client.post(
        "/api/v1/locations/",
        json={"name": "Library Garden", "location_type": "landmark"},
    ).json()

    # Add favorite
    res_fav = client.post(
        "/api/v1/favorites/",
        json={"user_id": str(user.id), "location_id": loc["id"]},
    )
    assert res_fav.status_code == 201

    # List favorites
    res_list = client.get(f"/api/v1/favorites/{user.id}")
    assert res_list.status_code == 200
    assert len(res_list.json()) == 1

    # Submit location report
    res_rep = client.post(
        "/api/v1/reports/",
        json={
            "reporter_id": str(user.id),
            "location_id": loc["id"],
            "report_type": "blocked_path",
            "description": "Construction barrier blocking pathway.",
        },
    )
    assert res_rep.status_code == 201
    rep = res_rep.json()
    assert rep["status"] == "pending"

    # Update report status to resolved
    res_update = client.patch(
        f"/api/v1/reports/{rep['id']}",
        json={"status": "resolved"},
    )
    assert res_update.status_code == 200
    assert res_update.json()["status"] == "resolved"
    assert res_update.json()["resolved_at"] is not None
