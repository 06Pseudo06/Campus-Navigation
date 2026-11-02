"""Route planning pathfinding algorithms.

Implements weighted shortest path routing using Dijkstra's algorithm and A* search
with predecessor backtracking, zero/negative weight protection, and memory-efficient
priority queue state tracking.
"""

import heapq
import math
import uuid
from typing import Any, Dict, List, Optional, Set, Tuple

from app.services.routing.graph import CampusGraph


def _haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate straight-line distance in meters between two coordinates."""
    r = 6371000.0  # Earth radius
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(d_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * (math.sin(d_lambda / 2.0) ** 2)
    )
    return r * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))


def dijkstra_shortest_path(
    graph: CampusGraph,
    origin_node_id: str,
    destination_node_id: str,
    accessible_only: bool = False,
) -> Optional[Dict[str, Any]]:
    """Compute weighted shortest path using Dijkstra's algorithm with predecessor tracking.
    
    Guarantees:
    - O((V + E) log V) time complexity using predecessor tracking (heap entry: (cost, node)).
    - Memory bounded to O(V + E) rather than storing full paths inside heap entries.
    - Zero/invalid edge weight protection.
    - Symmetrical handling of directed and bidirectional connections.
    """
    origin = str(origin_node_id)
    dest = str(destination_node_id)

    if not graph.has_node(origin) or not graph.has_node(dest):
        return None

    # Same origin and destination edge case
    if origin == dest:
        return {
            "origin_node_id": origin,
            "destination_node_id": dest,
            "total_distance_m": 0.0,
            "path_nodes": [origin],
            "segments": [],
        }

    # Best distance map and predecessor map
    # predecessor[node] = (prev_node, edge_dict)
    best_dist: Dict[str, float] = {origin: 0.0}
    predecessors: Dict[str, Tuple[str, Dict[str, Any]]] = {}
    visited: Set[str] = set()

    # Priority queue stores: (current_distance, node_id)
    pq: List[Tuple[float, str]] = [(0.0, origin)]

    while pq:
        curr_dist, curr_node = heapq.heappop(pq)

        if curr_node in visited:
            continue
        visited.add(curr_node)

        # Reached destination
        if curr_node == dest:
            break

        # If current distance is worse than best recorded, skip
        if curr_dist > best_dist.get(curr_node, float("inf")):
            continue

        for neighbor in graph.get_neighbors(curr_node):
            nxt_node = neighbor["target"]
            edge_dist = neighbor["distance_m"]

            # Edge weight validation
            if edge_dist <= 0:
                continue

            if accessible_only and not neighbor.get("is_accessible", True):
                continue

            cost = curr_dist + edge_dist
            if cost < best_dist.get(nxt_node, float("inf")):
                best_dist[nxt_node] = cost
                predecessors[nxt_node] = (curr_node, neighbor)
                heapq.heappush(pq, (cost, nxt_node))

    # Destination unreachable
    if dest not in predecessors:
        return None

    # Reconstruct path and segments via predecessor backtracking
    path_nodes: List[str] = []
    segments: List[Dict[str, Any]] = []
    curr = dest

    while curr != origin:
        path_nodes.append(curr)
        prev_node, edge_data = predecessors[curr]
        segments.append({
            "source_node_id": prev_node,
            "target_node_id": curr,
            "distance_m": edge_data["distance_m"],
            "path_type": edge_data["path_type"],
            "is_accessible": edge_data.get("is_accessible", True),
            "edge_id": edge_data.get("edge_id"),
        })
        curr = prev_node

    path_nodes.append(origin)
    path_nodes.reverse()
    segments.reverse()

    return {
        "origin_node_id": origin,
        "destination_node_id": dest,
        "total_distance_m": round(best_dist[dest], 2),
        "path_nodes": path_nodes,
        "segments": segments,
    }


def a_star_shortest_path(
    graph: CampusGraph,
    origin_node_id: str,
    destination_node_id: str,
    accessible_only: bool = False,
) -> Optional[Dict[str, Any]]:
    """Compute shortest path using A* search with Haversine distance heuristic."""
    origin = str(origin_node_id)
    dest = str(destination_node_id)

    if not graph.has_node(origin) or not graph.has_node(dest):
        return None

    if origin == dest:
        return {
            "origin_node_id": origin,
            "destination_node_id": dest,
            "total_distance_m": 0.0,
            "path_nodes": [origin],
            "segments": [],
        }

    dest_node = graph.get_node(dest)
    dest_lat = dest_node.get("latitude") if dest_node else None
    dest_lon = dest_node.get("longitude") if dest_node else None

    def heuristic(n_id: str) -> float:
        if dest_lat is None or dest_lon is None:
            return 0.0
        n_node = graph.get_node(n_id)
        if not n_node or n_node.get("latitude") is None:
            return 0.0
        return _haversine_meters(
            n_node["latitude"], n_node["longitude"], dest_lat, dest_lon
        )

    g_score: Dict[str, float] = {origin: 0.0}
    predecessors: Dict[str, Tuple[str, Dict[str, Any]]] = {}
    visited: Set[str] = set()

    # Priority queue: (f_score, g_score, node_id)
    pq: List[Tuple[float, float, str]] = [(heuristic(origin), 0.0, origin)]

    while pq:
        _, curr_g, curr_node = heapq.heappop(pq)

        if curr_node in visited:
            continue
        visited.add(curr_node)

        if curr_node == dest:
            break

        if curr_g > g_score.get(curr_node, float("inf")):
            continue

        for neighbor in graph.get_neighbors(curr_node):
            nxt_node = neighbor["target"]
            edge_dist = neighbor["distance_m"]
            if edge_dist <= 0:
                continue
            if accessible_only and not neighbor.get("is_accessible", True):
                continue

            tentative_g = curr_g + edge_dist
            if tentative_g < g_score.get(nxt_node, float("inf")):
                g_score[nxt_node] = tentative_g
                f_score = tentative_g + heuristic(nxt_node)
                predecessors[nxt_node] = (curr_node, neighbor)
                heapq.heappush(pq, (f_score, tentative_g, nxt_node))

    if dest not in predecessors:
        return None

    # Reconstruct path
    path_nodes: List[str] = []
    segments: List[Dict[str, Any]] = []
    curr = dest
    while curr != origin:
        path_nodes.append(curr)
        prev_node, edge_data = predecessors[curr]
        segments.append({
            "source_node_id": prev_node,
            "target_node_id": curr,
            "distance_m": edge_data["distance_m"],
            "path_type": edge_data["path_type"],
            "is_accessible": edge_data.get("is_accessible", True),
            "edge_id": edge_data.get("edge_id"),
        })
        curr = prev_node

    path_nodes.append(origin)
    path_nodes.reverse()
    segments.reverse()

    return {
        "origin_node_id": origin,
        "destination_node_id": dest,
        "total_distance_m": round(g_score[dest], 2),
        "path_nodes": path_nodes,
        "segments": segments,
    }


def find_shortest_path(
    graph: CampusGraph,
    origin_node_id: str,
    destination_node_id: str,
    accessible_only: bool = False,
    algorithm: str = "dijkstra",
) -> Optional[Dict[str, Any]]:
    """Compute optimal path between two campus locations using selected algorithm."""
    if algorithm == "astar":
        return a_star_shortest_path(graph, origin_node_id, destination_node_id, accessible_only)
    return dijkstra_shortest_path(graph, origin_node_id, destination_node_id, accessible_only)
