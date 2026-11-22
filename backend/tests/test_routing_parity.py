"""Parity and performance tests comparing Dijkstra vs A* shortest path algorithms across 50 pairs."""

import random
import sys
from pathlib import Path
from typing import List, Tuple
import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
SEEDS_DIR = REPO_ROOT / "database" / "seeds"
if str(SEEDS_DIR) not in sys.path:
    sys.path.insert(0, str(SEEDS_DIR))

from app.services.routing.algorithms import a_star_shortest_path, dijkstra_shortest_path
from app.services.routing.graph import CampusGraph
from seed_surveyed_dataset_c import DEFAULT_SURVEY_FILE, load_and_validate_survey


def build_survey_graph() -> Tuple[CampusGraph, List[str]]:
    data = load_and_validate_survey(DEFAULT_SURVEY_FILE)
    graph = CampusGraph()

    for n in data["nodes"]:
        n_id = str(n["survey_id"])
        coords = n.get("coordinates", {})
        graph.nodes[n_id] = {
            "id": n_id,
            "node_type": n.get("node_type", "waypoint"),
            "latitude": float(coords.get("latitude", 31.25)),
            "longitude": float(coords.get("longitude", 75.70)),
            "is_accessible": n.get("is_accessible", True),
            "location_id": None,
        }
        graph.adjacency_list[n_id] = []

    for seg in data["segments"]:
        src = str(seg["from"])
        tgt = str(seg["to"])
        dist = seg["distance_m"]
        is_bi = seg.get("bidirectional", True)
        if src in graph.nodes and tgt in graph.nodes:
            graph.adjacency_list[src].append({
                "target": tgt,
                "distance_m": dist,
                "path_type": "footpath",
                "is_accessible": True,
                "is_bidirectional": is_bi,
                "edge_id": None,
            })
            if is_bi:
                graph.adjacency_list[tgt].append({
                    "target": src,
                    "distance_m": dist,
                    "path_type": "footpath",
                    "is_accessible": True,
                    "is_bidirectional": is_bi,
                    "edge_id": None,
                })

    node_ids = list(graph.nodes.keys())
    return graph, node_ids


from typing import List, Tuple


def test_dijkstra_astar_50_pairs_parity():
    """Verify that Dijkstra and A* produce identical shortest-path distances across 50 random pairs."""
    graph, node_ids = build_survey_graph()
    assert len(node_ids) >= 20

    rng = random.Random(42)  # Seeded for deterministic test runs
    tested_pairs = 0

    for _ in range(50):
        src = rng.choice(node_ids)
        dest = rng.choice(node_ids)
        while dest == src:
            dest = rng.choice(node_ids)

        dijkstra_res = dijkstra_shortest_path(graph, src, dest)
        astar_res = a_star_shortest_path(graph, src, dest)

        if dijkstra_res is None:
            # If unreachable in Dijkstra, must also be unreachable in A*
            assert astar_res is None, f"Dijkstra found no path for {src}->{dest}, but A* did."
        else:
            assert astar_res is not None, f"Dijkstra found path for {src}->{dest}, but A* found none."
            # Verify distance matches within 0.05 meters
            assert abs(dijkstra_res["total_distance_m"] - astar_res["total_distance_m"]) < 0.05, (
                f"Distance mismatch for {src}->{dest}: "
                f"Dijkstra={dijkstra_res['total_distance_m']}, A*={astar_res['total_distance_m']}"
            )
            # Verify both paths start at src and end at dest
            assert dijkstra_res["path_nodes"][0] == src
            assert dijkstra_res["path_nodes"][-1] == dest
            assert astar_res["path_nodes"][0] == src
            assert astar_res["path_nodes"][-1] == dest

        tested_pairs += 1

    assert tested_pairs == 50
