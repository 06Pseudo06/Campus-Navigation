"""Navigation graph and pathway connection service."""

import heapq
import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.node import Node
from app.models.edge import Edge
from app.schemas.graph import NodeCreate, NodeUpdate, EdgeCreate, EdgeUpdate, RouteResponse, PathSegment
from app.services.routing.graph import CampusGraph


def list_active_nodes(
    db: Session,
    location_id: Optional[uuid.UUID] = None,
    accessible_only: bool = False,
    is_active: bool = True,
) -> List[Node]:
    """Retrieve active navigation graph nodes, optionally filtered by accessibility."""
    q = db.query(Node).filter(Node.is_active == is_active)
    if location_id:
        q = q.filter(Node.location_id == location_id)
    if accessible_only:
        q = q.filter(Node.is_accessible.is_(True))
    return q.all()


def get_node_by_id(
    db: Session,
    node_id: uuid.UUID,
    include_inactive: bool = False,
) -> Optional[Node]:
    """Retrieve a node by UUID."""
    q = db.query(Node).filter(Node.id == node_id)
    if not include_inactive:
        q = q.filter(Node.is_active.is_(True))
    return q.first()


def create_node(db: Session, node_in: NodeCreate) -> Node:
    """Create a new navigation node."""
    db_node = Node(
        location_id=node_in.location_id,
        node_type=node_in.node_type,
        latitude=node_in.latitude,
        longitude=node_in.longitude,
        is_accessible=node_in.is_accessible,
        is_active=node_in.is_active,
    )
    db.add(db_node)
    db.commit()
    db.refresh(db_node)
    return db_node


def update_node(
    db: Session,
    node_id: uuid.UUID,
    node_in: NodeUpdate,
) -> Optional[Node]:
    """Update an existing navigation node."""
    node = db.query(Node).filter(Node.id == node_id).first()
    if not node:
        return None
    for field, val in node_in.model_dump(exclude_unset=True).items():
        setattr(node, field, val)
    db.commit()
    db.refresh(node)
    return node


def deactivate_node(db: Session, node_id: uuid.UUID) -> Optional[Node]:
    """Soft-deactivate a navigation node."""
    node = db.query(Node).filter(Node.id == node_id).first()
    if not node:
        return None
    node.is_active = False
    db.commit()
    db.refresh(node)
    return node


def list_active_edges(
    db: Session,
    accessible_only: bool = False,
    is_active: bool = True,
) -> List[Edge]:
    """Retrieve active walkable connections."""
    q = db.query(Edge).filter(Edge.is_active == is_active)
    if accessible_only:
        q = q.filter(Edge.is_accessible.is_(True))
    return q.all()


def get_edge_by_id(
    db: Session,
    edge_id: uuid.UUID,
    include_inactive: bool = False,
) -> Optional[Edge]:
    """Retrieve an edge by UUID."""
    q = db.query(Edge).filter(Edge.id == edge_id)
    if not include_inactive:
        q = q.filter(Edge.is_active.is_(True))
    return q.first()


def create_edge(db: Session, edge_in: EdgeCreate) -> Edge:
    """Create a walkable connection between two existing active nodes with duplicate policy enforcement."""
    source_node = get_node_by_id(db, edge_in.source_node_id)
    target_node = get_node_by_id(db, edge_in.target_node_id)
    if not source_node or not target_node:
        raise ValueError("Both source and target nodes must exist and be active.")

    if edge_in.source_node_id == edge_in.target_node_id:
        raise ValueError("Cannot create self-loop edge.")

    # 1. Exact forward duplicate check on active edges
    existing_forward = (
        db.query(Edge)
        .filter(
            Edge.source_node_id == edge_in.source_node_id,
            Edge.target_node_id == edge_in.target_node_id,
            Edge.path_type == edge_in.path_type,
            Edge.is_active.is_(True),
        )
        .first()
    )
    if existing_forward:
        raise ValueError(
            f"An active edge from {edge_in.source_node_id} to {edge_in.target_node_id} "
            f"with path type '{edge_in.path_type}' already exists."
        )

    # 2. Reverse duplicate check: if either connection is bidirectional, prevent duplicate definition
    existing_reverse = (
        db.query(Edge)
        .filter(
            Edge.source_node_id == edge_in.target_node_id,
            Edge.target_node_id == edge_in.source_node_id,
            Edge.path_type == edge_in.path_type,
            Edge.is_active.is_(True),
        )
        .first()
    )
    if existing_reverse:
        if existing_reverse.is_bidirectional:
            raise ValueError(
                f"A bidirectional edge between these nodes with path type '{edge_in.path_type}' "
                "already exists in the reverse direction. Do not create a duplicate connection."
            )
        if edge_in.is_bidirectional:
            raise ValueError(
                f"An active directed edge from {edge_in.target_node_id} to {edge_in.source_node_id} "
                f"with path type '{edge_in.path_type}' already exists. Update or replace it rather "
                "than creating an overlapping bidirectional edge."
            )

    db_edge = Edge(
        source_node_id=edge_in.source_node_id,
        target_node_id=edge_in.target_node_id,
        distance_m=edge_in.distance_m,
        path_type=edge_in.path_type,
        is_bidirectional=edge_in.is_bidirectional,
        is_accessible=edge_in.is_accessible,
        is_active=edge_in.is_active,
    )
    db.add(db_edge)
    db.commit()
    db.refresh(db_edge)
    return db_edge


def update_edge(
    db: Session,
    edge_id: uuid.UUID,
    edge_in: EdgeUpdate,
) -> Optional[Edge]:
    """Update an existing edge."""
    edge = db.query(Edge).filter(Edge.id == edge_id).first()
    if not edge:
        return None
    for field, val in edge_in.model_dump(exclude_unset=True).items():
        setattr(edge, field, val)
    db.commit()
    db.refresh(edge)
    return edge


def deactivate_edge(db: Session, edge_id: uuid.UUID) -> Optional[Edge]:
    """Soft-deactivate an edge."""
    edge = db.query(Edge).filter(Edge.id == edge_id).first()
    if not edge:
        return None
    edge.is_active = False
    db.commit()
    db.refresh(edge)
    return edge


def build_campus_graph(db: Session, accessible_only: bool = False) -> CampusGraph:
    """Build in-memory CampusGraph populated from active nodes and edges in the database.

    Guarantees:
    - Only active nodes are included in the graph.
    - If accessible_only=True, only accessible nodes and accessible edges are included.
    - Edges are only registered if BOTH endpoint nodes exist and are active in the graph.
    - Bidirectional edges are expanded symmetrically into the adjacency list.
    """
    graph = CampusGraph()

    nodes = list_active_nodes(db, accessible_only=accessible_only, is_active=True)
    edges = list_active_edges(db, accessible_only=accessible_only, is_active=True)

    for n in nodes:
        node_id_str = str(n.id)
        graph.nodes[node_id_str] = {
            "id": n.id,
            "node_type": n.node_type,
            "latitude": n.latitude,
            "longitude": n.longitude,
            "is_accessible": n.is_accessible,
            "location_id": n.location_id,
        }
        graph.adjacency_list[node_id_str] = []

    for e in edges:
        s_id = str(e.source_node_id)
        t_id = str(e.target_node_id)

        # Both endpoints MUST exist in active graph nodes
        if s_id not in graph.nodes or t_id not in graph.nodes:
            continue

        # Forward edge
        graph.adjacency_list[s_id].append({
            "target": t_id,
            "distance_m": e.distance_m,
            "path_type": e.path_type,
            "is_accessible": e.is_accessible,
            "edge_id": e.id,
        })

        # Reverse edge if bidirectional
        if e.is_bidirectional:
            graph.adjacency_list[t_id].append({
                "target": s_id,
                "distance_m": e.distance_m,
                "path_type": e.path_type,
                "is_accessible": e.is_accessible,
                "edge_id": e.id,
            })

    return graph


def compute_shortest_route(
    db: Session,
    origin_node_id: uuid.UUID,
    destination_node_id: uuid.UUID,
    accessible_only: bool = False,
) -> Optional[RouteResponse]:
    """Compute shortest walkable path using Dijkstra on the current database topology."""
    origin_str = str(origin_node_id)
    dest_str = str(destination_node_id)

    graph = build_campus_graph(db, accessible_only=accessible_only)

    if origin_str not in graph.nodes or dest_str not in graph.nodes:
        return None

    if origin_str == dest_str:
        return RouteResponse(
            origin_node_id=origin_node_id,
            destination_node_id=destination_node_id,
            total_distance_m=0.0,
            accessible=True,
            path_nodes=[origin_node_id],
            segments=[],
        )

    # Dijkstra priority queue: (distance, current_node, path, segments)
    queue = [(0.0, origin_str, [origin_str], [])]
    best_dist: Dict[str, float] = {origin_str: 0.0}
    visited = set()

    while queue:
        dist, current, path, segments = heapq.heappop(queue)

        if current in visited:
            continue
        visited.add(current)

        if current == dest_str:
            return RouteResponse(
                origin_node_id=origin_node_id,
                destination_node_id=destination_node_id,
                total_distance_m=round(dist, 2),
                accessible=accessible_only or all(s.get("is_accessible", True) for s in segments),
                path_nodes=[uuid.UUID(nid) for nid in path],
                segments=[
                    PathSegment(
                        source_node_id=uuid.UUID(s["source"]),
                        target_node_id=uuid.UUID(s["target"]),
                        distance_m=s["distance_m"],
                        path_type=s["path_type"],
                        instruction=f"Follow {s['path_type']} for {s['distance_m']}m",
                    )
                    for s in segments
                ],
            )

        for neighbor in graph.adjacency_list.get(current, []):
            nxt = neighbor["target"]
            edge_dist = neighbor["distance_m"]
            cost = dist + edge_dist

            if cost < best_dist.get(nxt, float("inf")):
                best_dist[nxt] = cost
                new_segments = list(segments) + [{
                    "source": current,
                    "target": nxt,
                    "distance_m": edge_dist,
                    "path_type": neighbor["path_type"],
                    "is_accessible": neighbor["is_accessible"],
                }]
                heapq.heappush(queue, (cost, nxt, path + [nxt], new_segments))

    return None
