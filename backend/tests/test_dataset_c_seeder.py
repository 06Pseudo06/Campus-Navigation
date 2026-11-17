"""Tests for Dataset C canonical route graph seeder and routing compatibility."""

import sys
import uuid
from pathlib import Path
import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
SEEDS_DIR = REPO_ROOT / "database" / "seeds"
if str(SEEDS_DIR) not in sys.path:
    sys.path.insert(0, str(SEEDS_DIR))

from app.models.edge import Edge
from app.models.location import Location
from app.models.node import Node
from app.services.routing.algorithms import a_star_shortest_path, dijkstra_shortest_path
from app.services.routing.graph import CampusGraph

from seed_surveyed_dataset_c import (
    DEFAULT_SURVEY_FILE,
    load_and_validate_survey,
    seed_dataset_c,
    stable_uuid,
)


def test_survey_file_validation():
    """Verify that lpu_verified_survey.json satisfies all dataset specifications."""
    data = load_and_validate_survey(DEFAULT_SURVEY_FILE)
    assert data["status"] == "confirmed_project_route_data"
    assert len(data["nodes"]) == 27
    assert len(data["segments"]) == 29

    survey_node_ids = {n["survey_id"] for n in data["nodes"]}
    assert len(survey_node_ids) == 27

    destination_nodes = [n for n in data["nodes"] if n.get("location_slug")]
    assert len(destination_nodes) == 15

    junction_nodes = [n for n in data["nodes"] if not n.get("location_slug")]
    assert len(junction_nodes) == 12

    for segment in data["segments"]:
        assert segment["from"] in survey_node_ids
        assert segment["to"] in survey_node_ids
        assert segment["bidirectional"] is True
        assert segment["distance_m"] > 0


def test_seed_dataset_c_first_run(db):
    """Verify that initial seeding correctly populates 15 locations, 27 nodes, and 29 edges."""
    data = load_and_validate_survey(DEFAULT_SURVEY_FILE)
    stats = seed_dataset_c(db, data)
    db.flush()

    assert stats.loc_inserted == 15
    assert stats.node_inserted == 27
    assert stats.edge_inserted == 29

    assert db.query(Location).count() == 15
    assert db.query(Node).count() == 27
    assert db.query(Edge).count() == 29


def test_seed_dataset_c_idempotency(db):
    """Verify that running seeder multiple times produces identical state with zero duplicate insertions."""
    data = load_and_validate_survey(DEFAULT_SURVEY_FILE)

    # First run
    stats1 = seed_dataset_c(db, data)
    db.flush()
    assert stats1.loc_inserted == 15
    assert stats1.node_inserted == 27
    assert stats1.edge_inserted == 29

    # Second run on same session
    stats2 = seed_dataset_c(db, data)
    db.flush()
    assert stats2.loc_inserted == 0
    assert stats2.loc_updated == 0
    assert stats2.loc_unchanged == 15
    assert stats2.node_inserted == 0
    assert stats2.node_updated == 0
    assert stats2.node_unchanged == 27
    assert stats2.edge_inserted == 0
    assert stats2.edge_updated == 0
    assert stats2.edge_unchanged == 29

    # Verify counts remain exact
    assert db.query(Location).count() == 15
    assert db.query(Node).count() == 27
    assert db.query(Edge).count() == 29


def test_seed_dataset_c_preserves_unrelated_entities(db):
    """Verify that the seeder does not touch, overwrite, or delete unrelated existing records."""
    dummy_loc = Location(
        id=uuid.uuid4(),
        name="Pre-existing Science Lab",
        slug="pre-existing-science-lab",
        location_type="facility",
        latitude=31.251000,
        longitude=75.701000,
        is_verified=True,
        is_active=True,
    )
    db.add(dummy_loc)
    db.flush()

    data = load_and_validate_survey(DEFAULT_SURVEY_FILE)
    seed_dataset_c(db, data)
    db.flush()

    # Total locations must be 15 + 1 = 16
    assert db.query(Location).count() == 16

    # Verify dummy entity untouched
    fetched = db.query(Location).filter(Location.slug == "pre-existing-science-lab").first()
    assert fetched is not None
    assert fetched.name == "Pre-existing Science Lab"
    assert fetched.location_type == "facility"


def test_seed_dataset_c_routing_integration(db):
    """Verify that CampusGraph and routing algorithms correctly solve paths across seeded Dataset C."""
    data = load_and_validate_survey(DEFAULT_SURVEY_FILE)
    seed_dataset_c(db, data)
    db.flush()

    graph = CampusGraph()
    graph.load_from_db(db)

    assert len(graph.nodes) == 27

    g1_id = str(stable_uuid("node", "G1-ENTRY"))
    gh2_id = str(stable_uuid("node", "GH-2"))
    aud_id = str(stable_uuid("node", "BALDEV-RAJ-MITTAL-AUDITORIUM"))

    # Path from Gate 1 to GH-2
    dijkstra_res = dijkstra_shortest_path(graph, g1_id, gh2_id)
    assert dijkstra_res is not None
    assert dijkstra_res["origin_node_id"] == g1_id
    assert dijkstra_res["destination_node_id"] == gh2_id
    assert dijkstra_res["total_distance_m"] > 0
    assert len(dijkstra_res["path_nodes"]) >= 2
    assert len(dijkstra_res["segments"]) >= 1

    # A* path equivalence
    astar_res = a_star_shortest_path(graph, g1_id, gh2_id)
    assert astar_res is not None
    assert astar_res["path_nodes"] == dijkstra_res["path_nodes"]
    assert abs(astar_res["total_distance_m"] - dijkstra_res["total_distance_m"]) < 0.01

    # Path from Gate 1 to Baldev Auditorium
    aud_res = dijkstra_shortest_path(graph, g1_id, aud_id)
    assert aud_res is not None
    assert aud_res["destination_node_id"] == aud_id


def test_dataset_c_api_compatibility(client, db):
    """Verify that locations seeded from Dataset C can be retrieved via canonical API endpoints."""
    data = load_and_validate_survey(DEFAULT_SURVEY_FILE)
    seed_dataset_c(db, data)
    db.flush()

    # Query locations endpoint
    response = client.get("/api/v1/locations/?limit=50")
    if response.status_code == 404:
        # Fallback to unprefixed route if configured
        response = client.get("/locations/?limit=50")

    assert response.status_code == 200
    locations = response.json()
    assert len(locations) >= 15

    slugs = {loc["slug"] for loc in locations}
    assert "gate-1" in slugs
    assert "uni-hospital" in slugs
    assert "block-1" in slugs
    assert "block-2" in slugs
    assert "gh-2" in slugs
