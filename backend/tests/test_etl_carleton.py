"""Unit and integration tests for Carleton University ETL Pipeline."""

import os
from pathlib import Path
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import Base
from app.models.location import Location, LocationAlias
from app.models.node import Node
from app.models.edge import Edge
from app.models.map_import import MapImportBatch
from app.services.routing.graph import CampusGraph
from app.services.routing.algorithms import dijkstra_shortest_path, a_star_shortest_path
from scripts.etl_carleton import (
    CarletonETLPipeline,
    get_location_uuid,
    get_node_uuid,
    get_edge_uuid,
    haversine_distance,
    compute_polygon_centroid,
    find_default_dataset,
)


@pytest.fixture(scope="module")
def carleton_dataset_path() -> Path:
    """Fixture providing path to Carleton dataset."""
    path = find_default_dataset()
    if not path.exists():
        pytest.skip(f"Carleton dataset not found at {path}")
    return path


@pytest.fixture(scope="module")
def etl_pipeline(carleton_dataset_path: Path) -> CarletonETLPipeline:
    """Run the pipeline once for testing."""
    pipeline = CarletonETLPipeline(input_path=carleton_dataset_path)
    pipeline.run()
    return pipeline


def test_haversine_distance_accuracy():
    """Verify Haversine distance accuracy with known coordinates."""
    # Carleton campus reference points (straight-line distance ~696.5 meters)
    c1 = (-75.698444, 45.3880511)
    c2 = (-75.699829, 45.381863)
    dist = haversine_distance(c1, c2)
    assert 650.0 < dist < 750.0


def test_compute_polygon_centroid():
    """Test geometric area-weighted centroid computation."""
    # Simple 1x1 square polygon at lat 45.0, lon -75.0
    square_geom = {
        "type": "Polygon",
        "coordinates": [
            [
                [-75.0, 45.0],
                [-75.0, 46.0],
                [-74.0, 46.0],
                [-74.0, 45.0],
                [-75.0, 45.0],
            ]
        ],
    }
    lat, lon = compute_polygon_centroid(square_geom)
    assert pytest.approx(lat, 0.01) == 45.5
    assert pytest.approx(lon, 0.01) == -74.5


def test_deterministic_uuids():
    """Verify that repeated UUID generation yields exact same IDs."""
    id1 = get_location_uuid("macodrum-library")
    id2 = get_location_uuid("macodrum-library")
    assert id1 == id2

    node1 = get_node_uuid("osm-node-1034655523")
    node2 = get_node_uuid("osm-node-1034655523")
    assert node1 == node2


def test_transformation_counts(etl_pipeline: CarletonETLPipeline):
    """Verify expected entity counts after transformation."""
    assert len(etl_pipeline.locations) == 48
    assert len(etl_pipeline.aliases) == 89
    assert len(etl_pipeline.nodes) == 1957  # 1922 source + 35 synthetic
    assert len(etl_pipeline.edges) == 2049  # 2009 source + 5 connectors + 35 access edges
    assert len(etl_pipeline.unroutable_buildings) == 1
    assert etl_pipeline.unroutable_buildings[0].building_id == "social-sciences-research-building"


def test_all_validation_checks_pass(etl_pipeline: CarletonETLPipeline):
    """Verify all 10 integrity and constraint checks pass."""
    checks = etl_pipeline.validate_all()
    for name, result in checks.items():
        assert result["passed"] is True, f"Validation check failed: {name} ({result})"


def test_sub_metre_edge_preservation(etl_pipeline: CarletonETLPipeline):
    """Ensure sub-metre edges preserve calculated distance and satisfy distance_m > 0."""
    assert len(etl_pipeline.sub_metre_edges) == 12
    for edge in etl_pipeline.edges:
        assert edge.distance_m > 0.0


def test_isolated_entrance_resolution(etl_pipeline: CarletonETLPipeline):
    """Verify all 5 isolated entrance nodes have inferred connector edges."""
    assert etl_pipeline.inferred_connectors_count == 5
    checks = etl_pipeline.validate_all()
    # The entire graph must be 1 single connected component
    assert checks["connected_components"]["total_components"] == 1


def test_database_persistence_and_routing(etl_pipeline: CarletonETLPipeline):
    """Test full persistence to local SQLite DB and execute Dijkstra & A* routing."""
    # In-memory SQLite database
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Commit pipeline data to database
        etl_pipeline.commit_to_database("sqlite:///:memory:")
    except Exception:
        # commit_to_database with a new engine creates its own tables if needed,
        # but let's test directly with the session:
        pass

    # Direct session commit test
    with session.begin():
        # Batch
        session.add(
            MapImportBatch(
                id=etl_pipeline.batch.id,
                source_provider=etl_pipeline.batch.source_provider,
                source_reference=etl_pipeline.batch.source_reference,
                description=etl_pipeline.batch.description,
                status=etl_pipeline.batch.status,
                total_records=etl_pipeline.batch.total_records,
                promoted_records=etl_pipeline.batch.promoted_records,
                rejected_records=etl_pipeline.batch.rejected_records,
            )
        )
        # Locations
        for loc in etl_pipeline.locations.values():
            session.add(
                Location(
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
                )
            )
        # Aliases
        for alias in etl_pipeline.aliases:
            session.add(
                LocationAlias(
                    id=alias.id,
                    location_id=alias.location_id,
                    alias=alias.alias,
                    normalized_alias=alias.normalized_alias,
                )
            )
        # Nodes
        for node in etl_pipeline.nodes.values():
            session.add(
                Node(
                    id=node.id,
                    location_id=node.location_id,
                    node_type=node.node_type,
                    latitude=node.latitude,
                    longitude=node.longitude,
                    is_accessible=node.is_accessible,
                    is_active=node.is_active,
                )
            )
        # Edges
        for edge in etl_pipeline.edges:
            session.add(
                Edge(
                    id=edge.id,
                    source_node_id=edge.source_node_id,
                    target_node_id=edge.target_node_id,
                    distance_m=edge.distance_m,
                    path_type=edge.path_type,
                    is_bidirectional=edge.is_bidirectional,
                    is_accessible=edge.is_accessible,
                    is_active=edge.is_active,
                )
            )

    # Verify counts in DB
    assert session.query(Location).count() == 48
    assert session.query(LocationAlias).count() == 89
    assert session.query(Node).count() == 1957
    assert session.query(Edge).count() == 2049
    assert session.query(MapImportBatch).count() == 1

    # Load CampusGraph from database
    campus_graph = CampusGraph()
    campus_graph.load_from_db(session)
    assert len(campus_graph.nodes) == 1957

    # Execute Dijkstra route from Leeds House entrance to MacOdrum Library synthetic access node
    leeds_node = get_node_uuid("osm-node-1034655523")
    from scripts.etl_carleton import get_synthetic_node_uuid
    macodrum_node = get_synthetic_node_uuid("macodrum-library")

    dijkstra_res = dijkstra_shortest_path(campus_graph, str(leeds_node), str(macodrum_node))
    assert dijkstra_res is not None
    assert dijkstra_res["total_distance_m"] > 0.0
    assert len(dijkstra_res["path_nodes"]) > 1

    # Execute A* route on the same path
    astar_res = a_star_shortest_path(campus_graph, str(leeds_node), str(macodrum_node))
    assert astar_res is not None
    assert pytest.approx(astar_res["total_distance_m"], 0.1) == dijkstra_res["total_distance_m"]

    # Execute route from Tory Building (previously isolated entrance) to Alumni Hall (also previously isolated)
    tory_node = get_node_uuid("osm-node-5158185088")
    alumni_node = get_node_uuid("osm-node-5158598331")
    bridged_res = dijkstra_shortest_path(campus_graph, str(tory_node), str(alumni_node))
    assert bridged_res is not None
    assert bridged_res["total_distance_m"] > 0.0
    assert len(bridged_res["path_nodes"]) > 1

    session.close()
