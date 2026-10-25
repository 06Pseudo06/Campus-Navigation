"""Unit tests for SQLAlchemy models, constraints, and relationships."""

import uuid
import pytest
from sqlalchemy.exc import IntegrityError

from app.models.user import User, UserIdentity
from app.models.location import Location, LocationAlias
from app.models.node import Node
from app.models.edge import Edge
from app.models.favorite import Favorite
from app.models.report import LocationReport


def test_user_creation_and_defaults(db):
    user = User(full_name="Alex Smith", email="alex@campus.edu", role="student")
    db.add(user)
    db.commit()

    assert user.id is not None
    assert isinstance(user.id, uuid.UUID)
    assert user.is_active is True
    assert user.role == "student"


def test_user_unique_email_constraint(db):
    u1 = User(full_name="User 1", email="unique@campus.edu")
    u2 = User(full_name="User 2", email="unique@campus.edu")
    db.add(u1)
    db.commit()

    db.add(u2)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_user_identity_cascade(db):
    user = User(full_name="Identity User", email="id_test@campus.edu")
    db.add(user)
    db.commit()

    identity = UserIdentity(
        user_id=user.id,
        provider="google",
        provider_subject="sub-12345",
    )
    db.add(identity)
    db.commit()

    assert len(user.identities) == 1
    assert user.identities[0].provider == "google"

    # Delete user and verify identity cascades
    db.delete(user)
    db.commit()

    remaining_identity = db.query(UserIdentity).filter(UserIdentity.id == identity.id).first()
    assert remaining_identity is None


def test_location_parent_child_and_aliases(db):
    building = Location(
        name="Engineering Complex",
        slug="engineering-complex",
        location_type="building",
        latitude=12.9716,
        longitude=77.5946,
    )
    db.add(building)
    db.commit()

    room = Location(
        name="Lab 101",
        slug="lab-101",
        location_type="room",
        parent_id=building.id,
    )
    db.add(room)
    db.commit()

    assert room.parent.name == "Engineering Complex"
    assert len(building.children) == 1
    assert building.children[0].name == "Lab 101"

    # Add alias to building
    alias = LocationAlias(
        location_id=building.id,
        alias="Engg Block",
        normalized_alias="engg block",
    )
    db.add(alias)
    db.commit()

    assert len(building.aliases) == 1
    assert building.aliases[0].normalized_alias == "engg block"


def test_location_alias_unique_constraint(db):
    loc = Location(name="Main Library", slug="main-lib", location_type="building")
    db.add(loc)
    db.commit()

    a1 = LocationAlias(location_id=loc.id, alias="Library", normalized_alias="library")
    a2 = LocationAlias(location_id=loc.id, alias="library", normalized_alias="library")
    db.add(a1)
    db.commit()

    db.add(a2)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_node_and_edge_relationship(db):
    n1 = Node(node_type="entrance", latitude=12.9716, longitude=77.5946)
    n2 = Node(node_type="junction", latitude=12.9720, longitude=77.5950)
    db.add_all([n1, n2])
    db.commit()

    edge = Edge(
        source_node_id=n1.id,
        target_node_id=n2.id,
        distance_m=45.5,
        path_type="footpath",
        is_bidirectional=True,
    )
    db.add(edge)
    db.commit()

    assert edge.id is not None
    assert edge.source_node.node_type == "entrance"
    assert edge.target_node.node_type == "junction"
    assert edge.distance_m == 45.5


def test_favorite_composite_pk_and_unique(db):
    user = User(full_name="Fav Tester", email="fav@campus.edu")
    loc = Location(name="Cafeteria", slug="cafeteria", location_type="food_court")
    db.add_all([user, loc])
    db.commit()

    fav = Favorite(user_id=user.id, location_id=loc.id)
    db.add(fav)
    db.commit()

    duplicate_fav = Favorite(user_id=user.id, location_id=loc.id)
    db.add(duplicate_fav)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_location_report_creation(db):
    loc = Location(name="Sports Arena", slug="sports-arena", location_type="facility")
    db.add(loc)
    db.commit()

    report = LocationReport(
        location_id=loc.id,
        report_type="wrong_pin",
        description="Pin is placed 50 meters north of actual entrance.",
    )
    db.add(report)
    db.commit()

    assert report.id is not None
    assert report.status == "pending"
    assert report.location.name == "Sports Arena"
    assert report.resolved_at is None
