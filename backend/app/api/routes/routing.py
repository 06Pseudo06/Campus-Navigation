"""Route calculation and navigation API endpoints."""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_admin_role
from app.schemas.graph import (
    EdgeCreate,
    EdgeRead,
    NodeCreate,
    NodeRead,
    RouteQuery,
    RouteResponse,
)
from app.services import graph_service

router = APIRouter()


@router.get("/nodes", response_model=List[NodeRead])
def list_nodes(
    location_id: Optional[uuid.UUID] = Query(None, description="Filter nodes by location"),
    is_active: bool = Query(True, description="Filter by active status"),
    db: Session = Depends(get_db),
):
    """Retrieve active navigation nodes/waypoints (Public endpoint)."""
    return graph_service.list_active_nodes(db, location_id=location_id, is_active=is_active)


@router.post("/nodes", response_model=NodeRead, status_code=status.HTTP_201_CREATED)
def create_node(
    node_in: NodeCreate,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin_role),
):
    """Create a new pedestrian routing graph vertex (Administrative operation)."""
    return graph_service.create_node(db, node_in)


@router.delete("/nodes/{node_id}", response_model=NodeRead)
def deactivate_node(
    node_id: uuid.UUID,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin_role),
):
    """Soft-deactivate a navigation node (Administrative operation)."""
    node = graph_service.deactivate_node(db, node_id)
    if not node:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Node not found.")
    return node


@router.get("/edges", response_model=List[EdgeRead])
def list_edges(
    accessible_only: bool = Query(False, description="Filter by wheelchair/accessible paths"),
    is_active: bool = Query(True, description="Filter by active status"),
    db: Session = Depends(get_db),
):
    """Retrieve active walkable connections between nodes (Public endpoint)."""
    return graph_service.list_active_edges(db, accessible_only=accessible_only, is_active=is_active)


@router.post("/edges", response_model=EdgeRead, status_code=status.HTTP_201_CREATED)
def create_edge(
    edge_in: EdgeCreate,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin_role),
):
    """Create a walkable connection between two existing active nodes (Administrative operation)."""
    try:
        return graph_service.create_edge(db, edge_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/edges/{edge_id}", response_model=EdgeRead)
def deactivate_edge(
    edge_id: uuid.UUID,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin_role),
):
    """Soft-deactivate an edge (Administrative operation)."""
    edge = graph_service.deactivate_edge(db, edge_id)
    if not edge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Edge not found.")
    return edge


@router.post("/calculate", response_model=RouteResponse)
def calculate_route(
    query: RouteQuery,
    db: Session = Depends(get_db),
):
    """Calculate optimal walking route between two campus nodes using Dijkstra pathfinding (Public endpoint)."""
    route = graph_service.compute_shortest_route(
        db,
        origin_node_id=query.origin_node_id,
        destination_node_id=query.destination_node_id,
        accessible_only=query.accessible_only,
    )
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No walkable path found between the specified origin and destination nodes.",
        )
    return route
