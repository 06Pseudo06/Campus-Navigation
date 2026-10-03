"""Route planning pathfinding algorithms foundation.

Shortest/optimal path algorithms (e.g., Dijkstra, A*) will be implemented here
to calculate the optimal sequence of campus nodes between source and destination.
"""

from typing import Any, Dict, List, Optional
from app.services.routing.graph import CampusGraph


def find_shortest_path(
    graph: CampusGraph,
    origin_node_id: str,
    destination_node_id: str,
    accessible_only: bool = False,
) -> Optional[Dict[str, Any]]:
    """Compute optimal path between two campus locations.
    
    Implementation to be developed in the routing engine milestone.
    """
    raise NotImplementedError("Pathfinding algorithms will be implemented in the routing milestone.")
