"""Canonical SQLAlchemy Seeder for LPU Verified Route Graph (Dataset C).

Adopts complete Dataset C (27 nodes, 29 segments, 15 locations) using the existing
SQLAlchemy models (Location, Node, Edge) and database architecture.

Supported Databases:
- SQLite (local development and test fixtures)
- PostgreSQL / Neon (production and staging)

Features:
- Deterministic UUIDv5 primary keys derived from survey IDs.
- Full idempotency: multiple executions preserve identical database state.
- Isolation: never modifies or deletes unrelated locations, nodes, or edges.
- Supports dry-run validation (default) and atomic commit (--apply).
- Supports --create-tables for isolated test databases.

Usage:
    # Dry run (validates dataset and reports planned actions without committing):
    python database/seeds/seed_surveyed_dataset_c.py

    # Apply to configured default database (app.core.database):
    python database/seeds/seed_surveyed_dataset_c.py --apply

    # Apply to a specific SQLite database (e.g. for testing):
    python database/seeds/seed_surveyed_dataset_c.py --apply --db-url sqlite:///test_campusway.db --create-tables
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Ensure backend package is discoverable
REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = REPO_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.models.base import Base
from app.models.edge import Edge
from app.models.location import Location
from app.models.node import Node

# Deterministic namespace for Dataset C UUIDs (identical to original survey spec)
UUID_NAMESPACE = uuid.UUID("5c2396a7-4e49-48a6-b75c-40eb90905c2a")
DEFAULT_SURVEY_FILE = REPO_ROOT / "database" / "surveys" / "lpu_verified_survey.json"


def stable_uuid(kind: str, survey_id: str) -> uuid.UUID:
    """Generate deterministic UUIDv5 from entity kind and survey identifier."""
    return uuid.uuid5(UUID_NAMESPACE, f"campusway:{kind}:{survey_id}")


@dataclass
class SeedStats:
    """Statistics tracking inserted, updated, and unchanged entities."""

    loc_inserted: int = 0
    loc_updated: int = 0
    loc_unchanged: int = 0

    node_inserted: int = 0
    node_updated: int = 0
    node_unchanged: int = 0

    edge_inserted: int = 0
    edge_updated: int = 0
    edge_unchanged: int = 0

    def summary(self) -> str:
        return (
            f"  Locations: {self.loc_inserted} inserted, {self.loc_updated} updated, {self.loc_unchanged} unchanged (Total: {self.loc_inserted + self.loc_updated + self.loc_unchanged})\n"
            f"  Nodes:     {self.node_inserted} inserted, {self.node_updated} updated, {self.node_unchanged} unchanged (Total: {self.node_inserted + self.node_updated + self.node_unchanged})\n"
            f"  Edges:     {self.edge_inserted} inserted, {self.edge_updated} updated, {self.edge_unchanged} unchanged (Total: {self.edge_inserted + self.edge_updated + self.edge_unchanged})"
        )


def load_and_validate_survey(survey_path: Path) -> dict[str, Any]:
    """Load and validate the survey JSON dataset against schema specifications."""
    if not survey_path.exists():
        raise FileNotFoundError(f"Survey file not found: {survey_path}")

    with open(survey_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if data.get("status") != "confirmed_project_route_data":
        raise ValueError(
            f"Unexpected dataset status: {data.get('status')!r}. Expected 'confirmed_project_route_data'."
        )

    nodes = data.get("nodes", [])
    segments = data.get("segments", [])

    if len(nodes) != 27:
        raise ValueError(f"Dataset C must contain exactly 27 nodes; found {len(nodes)}.")
    if len(segments) != 29:
        raise ValueError(f"Dataset C must contain exactly 29 segments; found {len(segments)}.")

    node_ids = {n["survey_id"] for n in nodes}
    if len(node_ids) != 27:
        raise ValueError("Dataset C node survey IDs must be unique.")

    for segment in segments:
        seg_id = segment.get("survey_id")
        src = segment.get("from")
        tgt = segment.get("to")
        if src not in node_ids:
            raise ValueError(f"Segment {seg_id} references unknown source node {src!r}.")
        if tgt not in node_ids:
            raise ValueError(f"Segment {seg_id} references unknown target node {tgt!r}.")
        if not segment.get("bidirectional", False):
            raise ValueError(f"Segment {seg_id} must be bidirectional.")
        if float(segment.get("distance_m", 0)) <= 0:
            raise ValueError(f"Segment {seg_id} has invalid non-positive distance.")

    return data


def upsert_location(
    db: Session,
    node: dict[str, Any],
    stats: SeedStats,
) -> Optional[uuid.UUID]:
    """Upsert a canonical Location for destination nodes in an idempotent manner."""
    slug = node.get("location_slug")
    if not slug:
        return None

    loc_id = stable_uuid("location", node["survey_id"])
    name = node["name"]
    loc_type = node["location_type"]
    lat = float(node["coordinates"]["latitude"])
    lng = float(node["coordinates"]["longitude"])
    desc = "Location and entrance coordinate supplied by the project team."

    # Look up by deterministic primary key first
    existing = db.query(Location).filter(Location.id == loc_id).first()

    # Look up by slug to prevent unique constraint conflicts
    slug_match = db.query(Location).filter(Location.slug == slug).first()

    if existing:
        # Check if any attribute changed
        changed = False
        if existing.name != name:
            existing.name = name
            changed = True
        if existing.slug != slug:
            existing.slug = slug
            changed = True
        if existing.location_type != loc_type:
            existing.location_type = loc_type
            changed = True
        if existing.latitude != lat:
            existing.latitude = lat
            changed = True
        if existing.longitude != lng:
            existing.longitude = lng
            changed = True
        if not existing.is_verified:
            existing.is_verified = True
            changed = True
        if not existing.is_active:
            existing.is_active = True
            changed = True

        if changed:
            stats.loc_updated += 1
        else:
            stats.loc_unchanged += 1
        return existing.id

    if slug_match and slug_match.id != loc_id:
        # A location with this slug exists under a different ID; update in-place
        slug_match.name = name
        slug_match.location_type = loc_type
        slug_match.latitude = lat
        slug_match.longitude = lng
        slug_match.is_verified = True
        slug_match.is_active = True
        stats.loc_updated += 1
        return slug_match.id

    # Create new location
    new_loc = Location(
        id=loc_id,
        parent_id=None,
        name=name,
        slug=slug,
        location_type=loc_type,
        description=desc,
        latitude=lat,
        longitude=lng,
        address_details=None,
        is_verified=True,
        is_active=True,
    )
    db.add(new_loc)
    stats.loc_inserted += 1
    return new_loc.id


def upsert_node(
    db: Session,
    node: dict[str, Any],
    location_id: Optional[uuid.UUID],
    stats: SeedStats,
) -> uuid.UUID:
    """Upsert a routing Node entity in an idempotent manner."""
    node_id = stable_uuid("node", node["survey_id"])
    node_type = node["node_type"]
    lat = float(node["coordinates"]["latitude"])
    lng = float(node["coordinates"]["longitude"])

    existing = db.query(Node).filter(Node.id == node_id).first()

    if existing:
        changed = False
        if existing.location_id != location_id:
            existing.location_id = location_id
            changed = True
        if existing.node_type != node_type:
            existing.node_type = node_type
            changed = True
        if existing.latitude != lat:
            existing.latitude = lat
            changed = True
        if existing.longitude != lng:
            existing.longitude = lng
            changed = True
        if not existing.is_accessible:
            existing.is_accessible = True
            changed = True
        if not existing.is_active:
            existing.is_active = True
            changed = True

        if changed:
            stats.node_updated += 1
        else:
            stats.node_unchanged += 1
        return existing.id

    new_node = Node(
        id=node_id,
        location_id=location_id,
        node_type=node_type,
        latitude=lat,
        longitude=lng,
        is_accessible=True,
        is_active=True,
    )
    db.add(new_node)
    stats.node_inserted += 1
    return new_node.id


def upsert_edge(
    db: Session,
    segment: dict[str, Any],
    survey_nodes: dict[str, uuid.UUID],
    stats: SeedStats,
) -> uuid.UUID:
    """Upsert a walkable pathway Edge entity in an idempotent manner."""
    edge_id = stable_uuid("edge", segment["survey_id"])
    source_id = survey_nodes[segment["from"]]
    target_id = survey_nodes[segment["to"]]
    distance_m = float(segment["distance_m"])
    path_type = segment.get("path_type", "footpath")
    is_accessible = bool(segment.get("is_accessible", False))
    is_bidirectional = bool(segment.get("bidirectional", True))

    # Look up by deterministic primary key
    existing = db.query(Edge).filter(Edge.id == edge_id).first()

    # Look up by unique constraint (source, target, path_type)
    uq_match = (
        db.query(Edge)
        .filter(
            Edge.source_node_id == source_id,
            Edge.target_node_id == target_id,
            Edge.path_type == path_type,
        )
        .first()
    )

    target_edge = existing or uq_match

    if target_edge:
        changed = False
        if target_edge.source_node_id != source_id:
            target_edge.source_node_id = source_id
            changed = True
        if target_edge.target_node_id != target_id:
            target_edge.target_node_id = target_id
            changed = True
        if abs(target_edge.distance_m - distance_m) > 0.001:
            target_edge.distance_m = distance_m
            changed = True
        if target_edge.path_type != path_type:
            target_edge.path_type = path_type
            changed = True
        if target_edge.is_bidirectional != is_bidirectional:
            target_edge.is_bidirectional = is_bidirectional
            changed = True
        if target_edge.is_accessible != is_accessible:
            target_edge.is_accessible = is_accessible
            changed = True
        if not target_edge.is_active:
            target_edge.is_active = True
            changed = True

        if changed:
            stats.edge_updated += 1
        else:
            stats.edge_unchanged += 1
        return target_edge.id

    new_edge = Edge(
        id=edge_id,
        source_node_id=source_id,
        target_node_id=target_id,
        distance_m=distance_m,
        path_type=path_type,
        is_bidirectional=is_bidirectional,
        is_accessible=is_accessible,
        is_active=True,
    )
    db.add(new_edge)
    stats.edge_inserted += 1
    return new_edge.id


def seed_dataset_c(
    db: Session,
    survey_data: dict[str, Any],
) -> SeedStats:
    """Execute complete Dataset C seeding within the provided database session."""
    stats = SeedStats()
    survey_nodes: dict[str, uuid.UUID] = {}

    # Phase 1: Locations (15 destinations)
    for node_data in survey_data["nodes"]:
        loc_id = upsert_location(db, node_data, stats)
        # Flush to make location available for foreign key constraints if needed
        db.flush()

    # Phase 2: Nodes (27 waypoints: 12 junctions + 15 destinations)
    for node_data in survey_data["nodes"]:
        loc_id = None
        if node_data.get("location_slug"):
            loc_id = stable_uuid("location", node_data["survey_id"])
        node_id = upsert_node(db, node_data, loc_id, stats)
        survey_nodes[node_data["survey_id"]] = node_id
        db.flush()

    # Phase 3: Edges (29 bidirectional segments)
    for seg_data in survey_data["segments"]:
        upsert_edge(db, seg_data, survey_nodes, stats)
        db.flush()

    return stats


def get_session_factory(db_url: Optional[str] = None) -> sessionmaker[Session]:
    """Obtain session factory for specified DB URL or default project engine."""
    if db_url:
        engine_kwargs: dict[str, Any] = {}
        if db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

        custom_engine = create_engine(db_url, **engine_kwargs)

        if db_url.startswith("sqlite"):

            @event.listens_for(custom_engine, "connect")
            def set_sqlite_pragma(dbapi_connection: Any, connection_record: Any) -> None:
                if isinstance(dbapi_connection, sqlite3.Connection):
                    cursor = dbapi_connection.cursor()
                    cursor.execute("PRAGMA foreign_keys=ON")
                    cursor.close()

        return sessionmaker(autocommit=False, autoflush=False, bind=custom_engine)

    # Use project's canonical engine and sessionmaker
    from app.core.database import SessionLocal, engine

    if str(engine.url).startswith("sqlite"):

        @event.listens_for(engine, "connect")
        def set_sqlite_pragma_default(dbapi_connection: Any, connection_record: Any) -> None:
            if isinstance(dbapi_connection, sqlite3.Connection):
                cursor = dbapi_connection.cursor()
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.close()

    return SessionLocal


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Canonical SQLAlchemy Seeder for LPU Verified Route Graph (Dataset C)"
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Commit changes to database. Without this flag, runs in dry-run mode and rolls back.",
    )
    parser.add_argument(
        "--db-url",
        type=str,
        default=None,
        help="Custom database connection URL (e.g. sqlite:///test.db or postgresql+psycopg2://...). Defaults to app.core.database engine.",
    )
    parser.add_argument(
        "--create-tables",
        action="store_true",
        help="Create tables (Base.metadata.create_all) before seeding. Useful for fresh test databases.",
    )
    parser.add_argument(
        "--survey-file",
        type=Path,
        default=DEFAULT_SURVEY_FILE,
        help="Path to verified survey JSON file.",
    )
    args = parser.parse_args()

    print("=" * 70)
    print("CampusWay — Dataset C Canonical Route Graph Seeder")
    print("=" * 70)

    try:
        data = load_and_validate_survey(args.survey_file)
        print(f"Loaded survey: {data.get('dataset_name')}")
        print(f"Status:        {data.get('status')}")
        print(f"Input records: {len(data['nodes'])} nodes, {len(data['segments'])} segments")
    except Exception as exc:
        print(f"ERROR: Survey validation failed: {exc}", file=sys.stderr)
        return 1

    session_factory = get_session_factory(args.db_url)
    engine_bound = session_factory.kw["bind"]
    db_desc = str(engine_bound.url)
    # Mask password if present in db_url
    if "@" in db_desc and "://" in db_desc:
        proto, rest = db_desc.split("://", 1)
        creds, hostpart = rest.split("@", 1)
        user = creds.split(":", 1)[0]
        db_desc = f"{proto}://{user}:***@{hostpart}"
    print(f"Target Database: {db_desc}")

    if args.create_tables:
        print("Ensuring tables exist via Base.metadata.create_all...")
        Base.metadata.create_all(bind=engine_bound)

    session = session_factory()
    try:
        if not args.apply:
            print("\n[DRY-RUN MODE] Simulating dataset seeding (no changes will be committed)...")
            stats = seed_dataset_c(session, data)
            session.rollback()
            print("\nPlanned operations:")
            print(stats.summary())
            print("\nDry-run completed successfully. Pass --apply to commit changes.")
            return 0

        print("\n[APPLY MODE] Applying Dataset C seeding...")
        stats = seed_dataset_c(session, data)
        session.commit()
        print("\nSeeding completed successfully:")
        print(stats.summary())
        return 0
    except Exception as exc:
        session.rollback()
        print(f"\nERROR: Seeding failed with error: {exc}", file=sys.stderr)
        import traceback

        traceback.print_exc()
        return 1
    finally:
        session.close()


if __name__ == "__main__":
    sys.exit(main())
