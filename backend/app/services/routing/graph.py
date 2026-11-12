"""Campus Graph Architecture Foundation.

Manages campus graph loading, in-memory graph representation, endpoint validation,
and neighbor queries for walkable pedestrian pathways.
"""

import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.edge import Edge
from app.models.node import Node


class CampusGraph:
    """In-memory representation of walkable campus pathways and waypoints."""

    def __init__(self) -> None:
        self.nodes: Dict[str, Dict[str, Any]] = {}
        self.adjacency_list: Dict[str, List[Dict[str, Any]]] = {}

    def clear(self) -> None:
        """Clear loaded nodes and edges."""
        self.nodes.clear()
        self.adjacency_list.clear()

    def has_node(self, node_id: str) -> bool:
        """Check if node exists in active graph."""
        return node_id in self.nodes

    def get_node(self, node_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve node attributes by ID."""
        return self.nodes.get(node_id)

    def get_neighbors(self, node_id: str) -> List[Dict[str, Any]]:
        """Retrieve outgoing walkable connections from node."""
        return self.adjacency_list.get(node_id, [])

    def load_from_db(self, db: Session, accessible_only: bool = False) -> None:
        """Populate in-memory graph from database nodes and edges.
        
        Guarantees:
        - Only active nodes are included.
        - If accessible_only=True, only accessible nodes and edges are included.
        - Edges are registered only if BOTH endpoints exist in active graph nodes.
        - Bidirectional edges are populated symmetrically into the adjacency list.
        - Preserves edge IDs, path types, and distance weights.
        """
        self.clear()

        # 1. Fetch active nodes
        node_query = db.query(Node).filter(Node.is_active.is_(True))
        if accessible_only:
            node_query = node_query.filter(Node.is_accessible.is_(True))
        db_nodes = node_query.all()

        for n in db_nodes:
            n_id = str(n.id)
            self.nodes[n_id] = {
                "id": n.id,
                "node_type": n.node_type,
                "latitude": n.latitude,
                "longitude": n.longitude,
                "is_accessible": n.is_accessible,
                "location_id": n.location_id,
            }
            self.adjacency_list[n_id] = []

        # 2. Fetch active edges
        edge_query = db.query(Edge).filter(Edge.is_active.is_(True))
        if accessible_only:
            edge_query = edge_query.filter(Edge.is_accessible.is_(True))
        db_edges = edge_query.all()

        for e in db_edges:
            s_id = str(e.source_node_id)
            t_id = str(e.target_node_id)

            # Both endpoint nodes MUST exist in active graph nodes
            if s_id not in self.nodes or t_id not in self.nodes:
                continue

            # Protect against invalid or zero weights
            if e.distance_m <= 0:
                continue

            # Forward edge
            self.adjacency_list[s_id].append({
                "target": t_id,
                "distance_m": float(e.distance_m),
                "path_type": e.path_type,
                "is_accessible": e.is_accessible,
                "is_bidirectional": e.is_bidirectional,
                "edge_id": e.id,
            })

            # Symmetrical reverse edge if bidirectional
            if e.is_bidirectional:
                self.adjacency_list[t_id].append({
                    "target": s_id,
                    "distance_m": float(e.distance_m),
                    "path_type": e.path_type,
                    "is_accessible": e.is_accessible,
                    "is_bidirectional": True,
                    "edge_id": e.id,
                })

    def load_from_memory(self, nodes: List[Any], edges: List[Any], accessible_only: bool = False) -> None:
        """Populate in-memory graph from node and edge records."""
        self.clear()

        for n in nodes:
            if not getattr(n, "is_active", True):
                continue
            if accessible_only and not getattr(n, "is_accessible", True):
                continue

            n_id = str(n.id)
            self.nodes[n_id] = {
                "id": n.id,
                "node_type": getattr(n, "node_type", "hallway"),
                "latitude": float(n.latitude),
                "longitude": float(n.longitude),
                "is_accessible": getattr(n, "is_accessible", True),
                "location_id": getattr(n, "location_id", None),
            }
            self.adjacency_list[n_id] = []

        for e in edges:
            if not getattr(e, "is_active", True):
                continue
            if accessible_only and not getattr(e, "is_accessible", True):
                continue

            s_id = str(e.source_node_id)
            t_id = str(e.target_node_id)

            if s_id not in self.nodes or t_id not in self.nodes:
                continue

            dist = float(e.distance_m)
            if dist <= 0:
                continue

            path_type = getattr(e, "path_type", "footpath")
            is_acc = getattr(e, "is_accessible", True)
            is_bi = getattr(e, "is_bidirectional", True)
            edge_id = getattr(e, "id", None)

            self.adjacency_list[s_id].append({
                "target": t_id,
                "distance_m": dist,
                "path_type": path_type,
                "is_accessible": is_acc,
                "is_bidirectional": is_bi,
                "edge_id": edge_id,
            })

            if is_bi:
                self.adjacency_list[t_id].append({
                    "target": s_id,
                    "distance_m": dist,
                    "path_type": path_type,
                    "is_accessible": is_acc,
                    "is_bidirectional": True,
                    "edge_id": edge_id,
                })
