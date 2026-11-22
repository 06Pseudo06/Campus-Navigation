"""Navigation graph and pathway connection service."""

import time
import uuid
from collections import OrderedDict
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.models.node import Node
from app.models.edge import Edge
from app.schemas.graph import NodeCreate, NodeUpdate, EdgeCreate, EdgeUpdate, RouteResponse, PathSegment
from app.services.routing.graph import CampusGraph

# In-memory graph cache: accessible_only -> CampusGraph
_GRAPH_CACHE: Dict[bool, CampusGraph] = {}

# In-memory route query LRU / TTL cache: (origin_str, dest_str, accessible_only, algorithm) -> (expiry_time, RouteResponse)
_ROUTE_CACHE: "OrderedDict[Tuple[str, str, bool, str], Tuple[float, RouteResponse]]" = OrderedDict()
_ROUTE_CACHE_MAX_SIZE = 500
_ROUTE_CACHE_TTL_SEC = 300.0  # 5 minutes TTL


def invalidate_graph_cache() -> None:
    """Clear cached CampusGraph and route query cache when graph topology changes."""
    _GRAPH_CACHE.clear()
    _ROUTE_CACHE.clear()


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
    invalidate_graph_cache()
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
    invalidate_graph_cache()
    return node


def deactivate_node(db: Session, node_id: uuid.UUID) -> Optional[Node]:
    """Soft-deactivate a navigation node."""
    node = db.query(Node).filter(Node.id == node_id).first()
    if not node:
        return None
    node.is_active = False
    db.commit()
    db.refresh(node)
    invalidate_graph_cache()
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
    invalidate_graph_cache()
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
    invalidate_graph_cache()
    return edge


def deactivate_edge(db: Session, edge_id: uuid.UUID) -> Optional[Edge]:
    """Soft-deactivate an edge."""
    edge = db.query(Edge).filter(Edge.id == edge_id).first()
    if not edge:
        return None
    edge.is_active = False
    db.commit()
    db.refresh(edge)
    invalidate_graph_cache()
    return edge


from app.services.routing.algorithms import find_shortest_path
from app.services.routing.directions import calculate_walking_duration, generate_step_directions
from app.services.routing.graph import CampusGraph


def build_campus_graph(db: Session, accessible_only: bool = False) -> CampusGraph:
    """Build or retrieve cached in-memory CampusGraph populated from active nodes and edges in the database."""
    if accessible_only in _GRAPH_CACHE:
        return _GRAPH_CACHE[accessible_only]

    graph = CampusGraph()
    graph.load_from_db(db, accessible_only=accessible_only)
    _GRAPH_CACHE[accessible_only] = graph
    return graph


def compute_shortest_route(
    db: Session,
    origin_node_id: uuid.UUID,
    destination_node_id: uuid.UUID,
    accessible_only: bool = False,
    algorithm: str = "dijkstra",
) -> Optional[RouteResponse]:
    """Compute optimal walking route using selected pathfinding algorithm with LRU cache."""
    origin_str = str(origin_node_id)
    dest_str = str(destination_node_id)
    cache_key = (origin_str, dest_str, accessible_only, algorithm)
    now = time.monotonic()

    # 1. Check in-memory LRU route cache
    if cache_key in _ROUTE_CACHE:
        expiry, cached_route = _ROUTE_CACHE[cache_key]
        if now < expiry:
            _ROUTE_CACHE.move_to_end(cache_key)
            return cached_route
        else:
            del _ROUTE_CACHE[cache_key]

    graph = build_campus_graph(db, accessible_only=accessible_only)

    raw_result = find_shortest_path(
        graph,
        origin_str,
        dest_str,
        accessible_only=accessible_only,
        algorithm=algorithm,
    )
    if not raw_result:
        return None

    total_dist = raw_result["total_distance_m"]
    duration_s, duration_min = calculate_walking_duration(total_dist)

    enriched_segments = generate_step_directions(
        graph,
        raw_result["path_nodes"],
        raw_result["segments"],
    )

    path_uuids = [uuid.UUID(nid) for nid in raw_result["path_nodes"]]
    formatted_segments = [
        PathSegment(
            source_node_id=uuid.UUID(str(s["source_node_id"])),
            target_node_id=uuid.UUID(str(s["target_node_id"])),
            distance_m=s["distance_m"],
            path_type=s["path_type"],
            instruction=s["instruction"],
        )
        for s in enriched_segments
    ]

    is_accessible = (
        accessible_only
        or (len(raw_result["segments"]) == 0)
        or all(s.get("is_accessible", True) for s in raw_result["segments"])
    )

    route_response = RouteResponse(
        origin_node_id=origin_node_id,
        destination_node_id=destination_node_id,
        total_distance_m=total_dist,
        accessible=is_accessible,
        path_nodes=path_uuids,
        segments=formatted_segments,
        estimated_duration_s=duration_s,
        estimated_duration_min=duration_min,
    )

    # Store in LRU cache with eviction
    if len(_ROUTE_CACHE) >= _ROUTE_CACHE_MAX_SIZE:
        _ROUTE_CACHE.popitem(last=False)
    _ROUTE_CACHE[cache_key] = (now + _ROUTE_CACHE_TTL_SEC, route_response)

    return route_response

