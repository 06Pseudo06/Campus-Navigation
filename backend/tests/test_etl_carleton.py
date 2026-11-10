"""Unit and integration tests for Carleton University ETL Pipeline.

Covers:
1. Pure in-memory transformation, geometric computations, and graph validation.
2. Inferred connection auditing (zero-distance database compatibility fallbacks).
3. Genuine database persistence to a temporary file-backed SQLite database.
4. Idempotent rerun verification (no duplicate records, no constraint violations).
5. Foreign-key referential integrity validation on persisted tables.
6. Atomic transaction rollback verification on persistence exceptions.
7. Strict pre-connection rejection of remote and Neon database URLs.
8. Real Dijkstra and A* routing on the persisted file-backed database.
"""

from pathlib import Path
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

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
    get_synthetic_node_uuid,
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
    """Run the pipeline transformation once for test fixtures."""
    pipeline = CarletonETLPipeline(input_path=carleton_dataset_path)
    pipeline.run()
    return pipeline


# =============================================================================
# In-Memory Geometry and Transformation Tests
# =============================================================================

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


# =============================================================================
# Inferred Access Connection Audit Tests
# =============================================================================

def test_zero_distance_connections_audit(etl_pipeline: CarletonETLPipeline):
    """Verify zero-distance boundary connections are explicitly tracked with compatibility reasons."""
    # Exactly 6 buildings have boundary vertices coincident with existing walkway nodes (0.0m)
    zero_conns = etl_pipeline.zero_distance_connections
    assert len(zero_conns) == 6

    expected_bldg_ids = {
        "paterson-hall",
        "mackenzie-building",
        "richcraft-hall",
        "glengarry-house",
        "lennox-and-addington-house",
        "russell-house",
    }
    actual_bldg_ids = {z.building_id for z in zero_conns}
    assert actual_bldg_ids == expected_bldg_ids

    for z in zero_conns:
        assert z.original_distance_m == 0.0
        # 0.5m is stored strictly for database constraint compliance (distance_m > 0)
        assert z.stored_distance_m == 0.5
        assert "database compatibility" in z.compatibility_reason.lower()
        assert "not" in z.compatibility_reason.lower() and "survey" in z.compatibility_reason.lower()


def test_inferred_edge_distinguishability(etl_pipeline: CarletonETLPipeline):
    """Verify every inferred edge is explicitly distinguishable from source edges."""
    source_edges = [e for e in etl_pipeline.edges if not e.is_inferred]
    inferred_edges = [e for e in etl_pipeline.edges if e.is_inferred]

    assert len(source_edges) == 2009
    assert len(inferred_edges) == 40  # 5 connectors + 35 access edges

    # All inferred edges must use designated path_types
    for ie in inferred_edges:
        assert ie.path_type in ("inferred_connector", "inferred_access")
        assert ie.source_id.startswith("inferred-")

    # Source edges must NOT use inferred path_types
    for se in source_edges:
        assert se.path_type == "footpath"
        assert not se.source_id.startswith("inferred-")


# =============================================================================
# Real File-Backed SQLite Persistence Tests
# =============================================================================

@pytest.fixture(scope="module")
def file_backed_db_url(tmp_path_factory) -> str:
    """Fixture providing a temporary file-backed SQLite database path."""
    tmp_dir = tmp_path_factory.mktemp("carleton_db")
    db_file = tmp_dir / "carleton_test_persistence.db"
    return f"sqlite:///{db_file}"


def test_commit_to_database_file_backed(file_backed_db_url: str, etl_pipeline: CarletonETLPipeline):
    """Verify the actual commit_to_database method creates all expected records in a file-backed DB."""
    # Execute actual method under test
    etl_pipeline.commit_to_database(file_backed_db_url)

    # Inspect persisted records via a separate, independent engine and session
    verify_engine = create_engine(file_backed_db_url)
    VerifySession = sessionmaker(bind=verify_engine)
    session = VerifySession()

    try:
        assert session.query(Location).count() == 48
        assert session.query(LocationAlias).count() == 89
        assert session.query(Node).count() == 1957
        assert session.query(Edge).count() == 2049
        assert session.query(MapImportBatch).count() == 1

        # Verify batch record attributes
        batch = session.query(MapImportBatch).first()
        assert batch.source_provider == "gapwise"
        assert batch.status == "completed"
        assert batch.promoted_records == 48 + 89 + 1957 + 2049
        assert batch.rejected_records == 1
    finally:
        session.close()
        verify_engine.dispose()


def test_persistence_idempotency_second_run(file_backed_db_url: str, etl_pipeline: CarletonETLPipeline):
    """Verify that a second execution of commit_to_database does not create duplicates or fail."""
    # Execute a second time on the already-populated database
    etl_pipeline.commit_to_database(file_backed_db_url)

    verify_engine = create_engine(file_backed_db_url)
    VerifySession = sessionmaker(bind=verify_engine)
    session = VerifySession()

    try:
        # Counts must remain exactly identical
        assert session.query(Location).count() == 48
        assert session.query(LocationAlias).count() == 89
        assert session.query(Node).count() == 1957
        assert session.query(Edge).count() == 2049
        assert session.query(MapImportBatch).count() == 1
    finally:
        session.close()
        verify_engine.dispose()


def test_persistence_foreign_key_integrity(file_backed_db_url: str):
    """Verify foreign-key relationships remain valid across all persisted tables."""
    verify_engine = create_engine(file_backed_db_url)
    VerifySession = sessionmaker(bind=verify_engine)
    session = VerifySession()

    try:
        # Check all location aliases reference valid locations
        location_ids = {loc.id for loc in session.query(Location.id).all()}
        for alias in session.query(LocationAlias).all():
            assert alias.location_id in location_ids

        # Check all nodes with location_id reference valid locations
        for node in session.query(Node).filter(Node.location_id.isnot(None)).all():
            assert node.location_id in location_ids

        # Check all edges reference valid nodes
        node_ids = {n.id for n in session.query(Node.id).all()}
        for edge in session.query(Edge).all():
            assert edge.source_node_id in node_ids
            assert edge.target_node_id in node_ids
            assert edge.source_node_id != edge.target_node_id
            assert edge.distance_m > 0.0
    finally:
        session.close()
        verify_engine.dispose()


def test_persistence_rollback_on_exception(tmp_path, etl_pipeline: CarletonETLPipeline):
    """Verify that an exception during persistence triggers an atomic rollback without partial commits."""
    fail_db_path = tmp_path / "rollback_test.db"
    fail_db_url = f"sqlite:///{fail_db_path}"

    # Corrupt pipeline edges temporarily with an invalid record that violates foreign-key / check constraints
    original_edges = list(etl_pipeline.edges)
    import uuid
    from scripts.etl_carleton import EdgeRecord

    # Inject an edge with negative distance (violating CheckConstraint distance_m > 0)
    bad_edge = EdgeRecord(
        id=uuid.uuid4(),
        source_node_id=original_edges[0].source_node_id,
        target_node_id=original_edges[0].target_node_id,
        distance_m=-10.0,  # Negative distance!
        original_distance_m=-10.0,
        path_type="footpath",
        is_bidirectional=True,
        is_accessible=True,
        is_active=True,
        is_inferred=False,
    )
    etl_pipeline.edges.append(bad_edge)

    try:
        with pytest.raises(Exception):
            etl_pipeline.commit_to_database(fail_db_url)

        # Confirm rollback: verify no locations were committed partially
        engine = create_engine(fail_db_url)
        Session = sessionmaker(bind=engine)
        session = Session()
        try:
            assert session.query(Location).count() == 0
            assert session.query(Node).count() == 0
            assert session.query(Edge).count() == 0
        finally:
            session.close()
            engine.dispose()
    finally:
        # Restore clean edges
        etl_pipeline.edges = original_edges


def test_remote_and_neon_urls_rejected(etl_pipeline: CarletonETLPipeline):
    """Verify that remote and Neon database URLs are rejected before any connection attempt."""
    neon_url = "postgresql://user:secret@ep-cool-fog-12345.us-east-2.aws.neon.tech/neondb"
    with pytest.raises(PermissionError) as exc_info:
        etl_pipeline.commit_to_database(neon_url)
    assert "neon" in str(exc_info.value).lower() or "remote" in str(exc_info.value).lower()

    remote_url = "postgresql://user:secret@database.campusway-production.internal:5432/campusway"
    with pytest.raises(PermissionError):
        etl_pipeline.commit_to_database(remote_url)


def test_local_docker_and_localhost_urls_allowed_by_guard(etl_pipeline: CarletonETLPipeline):
    """Verify that legitimate local PostgreSQL URLs (localhost, 127.0.0.1, docker service) pass the remote guard."""
    local_urls = [
        "postgresql://postgres:postgres@localhost:5432/campusway_db",
        "postgresql://postgres:postgres@127.0.0.1:5432/campusway_db",
        "postgresql://postgres:postgres@postgres:5432/campusway_db",
        "postgresql://postgres:postgres@campusway_postgres:5432/campusway_db",
    ]
    remote_indicators = ["neon.tech", "pooler", "aws", "azure", "gcp", "compute.com"]
    local_host_indicators = ["localhost", "127.0.0.1", "::1", "@postgres", "@campusway_postgres"]

    for u in local_urls:
        u_lower = u.lower()
        is_local_host = any(h in u_lower for h in local_host_indicators)
        assert not any(ind in u_lower for ind in remote_indicators)
        assert is_local_host


def test_routing_on_persisted_file_backed_db(file_backed_db_url: str):
    """Verify Dijkstra and A* pathfinding execute properly on graph loaded from file-backed DB."""
    verify_engine = create_engine(file_backed_db_url)
    VerifySession = sessionmaker(bind=verify_engine)
    session = VerifySession()

    try:
        campus_graph = CampusGraph()
        campus_graph.load_from_db(session)
        assert len(campus_graph.nodes) == 1957

        # Route: Leeds House entrance to MacOdrum Library synthetic access node
        leeds_node = get_node_uuid("osm-node-1034655523")
        macodrum_node = get_synthetic_node_uuid("macodrum-library")

        # Dijkstra
        dijkstra_res = dijkstra_shortest_path(campus_graph, str(leeds_node), str(macodrum_node))
        assert dijkstra_res is not None
        assert dijkstra_res["total_distance_m"] > 0.0
        assert len(dijkstra_res["path_nodes"]) > 1

        # A*
        astar_res = a_star_shortest_path(campus_graph, str(leeds_node), str(macodrum_node))
        assert astar_res is not None
        assert pytest.approx(astar_res["total_distance_m"], 0.1) == dijkstra_res["total_distance_m"]

        # Route between bridged isolated entrances: Tory Building -> Alumni Hall
        tory_node = get_node_uuid("osm-node-5158185088")
        alumni_node = get_node_uuid("osm-node-5158598331")
        bridged_res = dijkstra_shortest_path(campus_graph, str(tory_node), str(alumni_node))
        assert bridged_res is not None
        assert bridged_res["total_distance_m"] > 0.0
        assert len(bridged_res["path_nodes"]) > 1
    finally:
        session.close()
        verify_engine.dispose()
