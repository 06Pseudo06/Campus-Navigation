"""Validation tests for Pydantic schemas."""

import uuid
import pytest
from pydantic import ValidationError

from app.schemas.user import UserCreate
from app.schemas.location import LocationCreate
from app.schemas.graph import EdgeCreate, NodeCreate
from app.schemas.report import LocationReportCreate


def test_user_schema_role_validation():
    # Valid role
    valid_user = UserCreate(full_name="Valid Student", role="student")
    assert valid_user.role == "student"

    # Invalid role
    with pytest.raises(ValidationError):
        UserCreate(full_name="Invalid Role", role="superhero")  # type: ignore


def test_location_schema_coordinates_and_slug():
    # Valid coordinates and auto-slug
    loc = LocationCreate(name="Student Center", location_type="building", latitude=13.0, longitude=77.0)
    assert loc.slug == "student-center"

    # Invalid latitude
    with pytest.raises(ValidationError):
        LocationCreate(name="Invalid Lat", location_type="building", latitude=95.0, longitude=0.0)

    # Invalid longitude
    with pytest.raises(ValidationError):
        LocationCreate(name="Invalid Lng", location_type="building", latitude=0.0, longitude=190.0)


def test_node_schema_coordinate_validation():
    node = NodeCreate(node_type="entrance", latitude=12.5, longitude=77.5)
    assert node.node_type == "entrance"

    with pytest.raises(ValidationError):
        NodeCreate(node_type="entrance", latitude=-100.0, longitude=50.0)


def test_edge_schema_positive_distance_and_no_self_loops():
    id1 = uuid.uuid4()
    id2 = uuid.uuid4()

    # Valid edge
    edge = EdgeCreate(source_node_id=id1, target_node_id=id2, distance_m=10.5)
    assert edge.distance_m == 10.5

    # Self-loop rejection
    with pytest.raises(ValidationError):
        EdgeCreate(source_node_id=id1, target_node_id=id1, distance_m=10.0)

    # Zero or negative distance
    with pytest.raises(ValidationError):
        EdgeCreate(source_node_id=id1, target_node_id=id2, distance_m=0.0)

    with pytest.raises(ValidationError):
        EdgeCreate(source_node_id=id1, target_node_id=id2, distance_m=-5.0)


def test_location_report_target_validation():
    # Target provided
    loc_id = uuid.uuid4()
    rep = LocationReportCreate(location_id=loc_id, report_type="wrong_pin", description="Pin error")
    assert rep.location_id == loc_id

    # No target provided should raise validation error
    with pytest.raises(ValidationError):
        LocationReportCreate(report_type="missing_place", description="No target attached")
