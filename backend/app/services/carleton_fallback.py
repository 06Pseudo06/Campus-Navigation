"""Carleton Demonstration Dataset in-memory provider.

Provides guaranteed high-performance fallback and local demonstration service for:
- 48 Carleton University building locations
- 1,957 graph navigation nodes
- 2,049 walkable graph edges with verified Dijkstra and A* pathfinding
- Visitor destination cards with verified nearest node topology
- Visitor assistance request logging
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import uuid
from datetime import datetime, timezone

from scripts.etl_carleton import CarletonETLPipeline
from app.schemas.assistance import VisitorDestinationCard, AssistanceRequestRead, AssistanceRequestCreate
from app.schemas.graph import NodeRead, RouteResponse
from app.schemas.location import LocationRead
from app.services.routing.algorithms import find_shortest_path
from app.services.routing.directions import calculate_walking_duration, generate_step_directions
from app.services.routing.graph import CampusGraph

_DATASET_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "carleton" / "campus.json"

_pipeline_instance: Optional[CarletonETLPipeline] = None
_cached_graph: Optional[CampusGraph] = None
_cached_cards: Optional[List[VisitorDestinationCard]] = None
_cached_nodes: Optional[List[NodeRead]] = None
_cached_locations: Optional[List[LocationRead]] = None
_in_memory_assistance_tickets: List[AssistanceRequestRead] = []


def _get_pipeline() -> CarletonETLPipeline:
    global _pipeline_instance
    if _pipeline_instance is None:
        p = CarletonETLPipeline(_DATASET_PATH)
        p.run()
        _pipeline_instance = p
    return _pipeline_instance


def get_fallback_graph(accessible_only: bool = False) -> CampusGraph:
    """Build in-memory graph from Carleton dataset."""
    p = _get_pipeline()
    graph = CampusGraph()
    graph.load_from_memory(list(p.nodes.values()), p.edges, accessible_only=accessible_only)
    return graph


def get_fallback_locations(
    query: Optional[str] = None,
    location_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> List[LocationRead]:
    """Retrieve Carleton university building locations."""
    global _cached_locations
    p = _get_pipeline()
    if _cached_locations is None:
        _cached_locations = []
        for loc in p.locations.values():
            _cached_locations.append(
                LocationRead(
                    id=loc.id,
                    name=loc.name,
                    slug=loc.slug,
                    location_type=loc.location_type,
                    description=loc.description,
                    latitude=loc.latitude,
                    longitude=loc.longitude,
                    address_details=loc.address_details,
                    is_verified=loc.is_verified,
                    is_active=loc.is_active,
                    parent_id=None,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )

    filtered = _cached_locations
    if location_type and location_type != "all":
        filtered = [l for l in filtered if l.location_type == location_type]
    if query:
        q = query.strip().lower()
        filtered = [l for l in filtered if q in l.name.lower() or q in l.slug.lower() or (l.description and q in l.description.lower())]

    return filtered[skip : skip + limit]


def get_fallback_visitor_destinations(
    query: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> List[VisitorDestinationCard]:
    """Retrieve visitor-friendly destination guide cards."""
    global _cached_cards
    if _cached_cards is None:
        p = _get_pipeline()
        cards: List[VisitorDestinationCard] = []

        # Map locations to nearest nodes
        loc_to_nodes: Dict[uuid.UUID, List[uuid.UUID]] = {}
        for n in p.nodes.values():
            if n.location_id:
                loc_to_nodes.setdefault(n.location_id, []).append(n.id)

        # Check edge coverage
        routable_nodes: set[uuid.UUID] = set()
        for e in p.edges:
            routable_nodes.add(e.source_node_id)
            routable_nodes.add(e.target_node_id)

        for loc in p.locations.values():
            associated = loc_to_nodes.get(loc.id, [])
            nearest_node = associated[0] if associated else None
            has_topology = bool(nearest_node and nearest_node in routable_nodes)
            guidance = (
                "Pedestrian access point verified."
                if has_topology
                else "Navigation topology pending campus ground mapping."
            )
            cards.append(
                VisitorDestinationCard(
                    id=loc.id,
                    name=loc.name,
                    slug=loc.slug,
                    location_type=loc.location_type,
                    description=loc.description,
                    latitude=loc.latitude,
                    longitude=loc.longitude,
                    address_details=loc.address_details,
                    is_accessible=True,
                    nearest_node_id=nearest_node,
                    has_route_topology=has_topology,
                    visitor_guidance=guidance,
                )
            )
        _cached_cards = sorted(cards, key=lambda c: c.name)

    filtered = _cached_cards
    if category and category != "all":
        filtered = [c for c in filtered if c.location_type == category]
    if query:
        q = query.strip().lower()
        filtered = [c for c in filtered if q in c.name.lower() or q in c.slug.lower() or (c.description and q in c.description.lower())]

    return filtered[skip : skip + limit]


def get_fallback_nodes(
    location_id: Optional[uuid.UUID] = None,
    is_active: bool = True,
) -> List[NodeRead]:
    """Retrieve Carleton navigation nodes."""
    global _cached_nodes
    if _cached_nodes is None:
        p = _get_pipeline()
        nodes: List[NodeRead] = []
        for n in p.nodes.values():
            nodes.append(
                NodeRead(
                    id=n.id,
                    location_id=n.location_id,
                    node_type=n.node_type,
                    latitude=n.latitude,
                    longitude=n.longitude,
                    floor_level=getattr(n, "floor_level", None),
                    is_accessible=n.is_accessible,
                    is_active=n.is_active,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )
        _cached_nodes = nodes

    filtered = _cached_nodes
    if location_id is not None:
        filtered = [n for n in filtered if n.location_id == location_id]
    if is_active:
        filtered = [n for n in filtered if n.is_active]

    return filtered


def compute_fallback_shortest_route(
    origin_node_id: uuid.UUID,
    destination_node_id: uuid.UUID,
    accessible_only: bool = False,
    algorithm: str = "dijkstra",
) -> Optional[RouteResponse]:
    """Compute shortest path across Carleton pedestrian network using in-memory graph solver."""
    graph = get_fallback_graph(accessible_only=accessible_only)

    origin_str = str(origin_node_id)
    dest_str = str(destination_node_id)

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

    path_uuids = [uuid.UUID(n_str) for n_str in raw_result["path_nodes"]]

    return RouteResponse(
        origin_node_id=origin_node_id,
        destination_node_id=destination_node_id,
        algorithm=algorithm,
        total_distance_m=round(total_dist, 2),
        estimated_duration_s=round(duration_s, 1),
        estimated_duration_min=round(duration_min, 1),
        accessible=accessible_only,
        path_nodes=path_uuids,
        segments=enriched_segments,
    )


def save_fallback_assistance_request(req_in: AssistanceRequestCreate) -> AssistanceRequestRead:
    """Save assistance ticket in memory and return response."""
    ticket = AssistanceRequestRead(
        id=uuid.uuid4(),
        requester_name=req_in.requester_name,
        contact_phone=req_in.contact_phone,
        current_location_id=req_in.current_location_id,
        current_node_id=req_in.current_node_id,
        target_location_id=req_in.target_location_id,
        assistance_type=req_in.assistance_type,
        description=req_in.description,
        status="pending",
        user_id=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    _in_memory_assistance_tickets.append(ticket)
    return ticket
