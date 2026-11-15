"""Load Dataset C into the local SQLite development database.

Run against a database that has already been cleaned to Dataset C only:
    python database/seeds/load_surveyed_route_graph.py --apply

Stable IDs are derived from survey IDs. The loader never matches a location by
name or slug, and refuses to run while Dataset A IDs are present.
"""

from __future__ import annotations

import argparse
import json
import shutil
import sqlite3
import tempfile
import uuid
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_FILE = ROOT / "database" / "surveys" / "lpu_verified_survey.json"
DEFAULT_DB = ROOT / "backend" / "campusway_dev.db"
UUID_NAMESPACE = uuid.UUID("5c2396a7-4e49-48a6-b75c-40eb90905c2a")
LOCATION_A_PREFIX = "a0000001000140008000"
NODE_A_PREFIXES = ("b0000001000140008000", "b0000002000140008000")


def stable_id(kind: str, survey_id: str) -> str:
    return uuid.uuid5(UUID_NAMESPACE, f"campusway:{kind}:{survey_id}").hex


def load_data() -> dict:
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    if data.get("status") != "confirmed_project_route_data":
        raise ValueError("Route graph is not marked as confirmed project data.")
    if len(data.get("nodes", [])) != 27 or len(data.get("segments", [])) != 29:
        raise ValueError("Dataset C must contain 27 nodes and 29 path segments.")
    node_ids = {node["survey_id"] for node in data["nodes"]}
    if len(node_ids) != 27:
        raise ValueError("Dataset C node survey IDs must be unique.")
    for segment in data["segments"]:
        if segment["from"] not in node_ids or segment["to"] not in node_ids:
            raise ValueError(f"Segment {segment['survey_id']} references a missing node.")
        if segment.get("bidirectional") is not True:
            raise ValueError(f"Segment {segment['survey_id']} must be bidirectional.")
        if float(segment["distance_m"]) <= 0:
            raise ValueError(f"Segment {segment['survey_id']} has an invalid distance.")
    return data


def get_or_create_location(db: sqlite3.Connection, node: dict) -> str | None:
    slug = node.get("location_slug")
    if not slug:
        return None

    lat = float(node["coordinates"]["latitude"])
    lng = float(node["coordinates"]["longitude"])
    location_id = stable_id("location", node["survey_id"])
    location = db.execute("SELECT id FROM locations WHERE id = ?", (location_id,)).fetchone()
    slug_owner = db.execute("SELECT id FROM locations WHERE slug = ?", (slug,)).fetchone()
    if slug_owner and slug_owner[0] != location_id:
        raise ValueError(f"Slug {slug!r} belongs to a non-Dataset-C location; clean it first.")
    if location:
        db.execute(
            """UPDATE locations
               SET name = ?, location_type = ?, latitude = ?, longitude = ?,
                   is_verified = 1, is_active = 1, updated_at = CURRENT_TIMESTAMP
               WHERE id = ?""",
            (node["name"], node["location_type"], lat, lng, location_id),
        )
        return location_id

    location_id = stable_id("location", node["survey_id"])
    db.execute(
        """INSERT INTO locations
           (id, parent_id, name, slug, location_type, description, latitude,
            longitude, address_details, is_verified, is_active)
           VALUES (?, NULL, ?, ?, ?, ?, ?, ?, NULL, 1, 1)""",
        (
            location_id,
            node["name"],
            slug,
            node["location_type"],
            "Location and entrance coordinate supplied by the project team.",
            lat,
            lng,
        ),
    )
    return location_id


def get_or_create_node(
    db: sqlite3.Connection, node: dict, location_id: str | None
) -> str:
    lat = float(node["coordinates"]["latitude"])
    lng = float(node["coordinates"]["longitude"])
    node_type = node["node_type"]

    node_id = stable_id("node", node["survey_id"])
    db.execute(
        """INSERT INTO nodes
           (id, location_id, node_type, latitude, longitude, is_accessible, is_active)
           VALUES (?, ?, ?, ?, ?, 1, 1)
           ON CONFLICT(id) DO UPDATE SET
             location_id = excluded.location_id,
             node_type = excluded.node_type,
             latitude = excluded.latitude,
             longitude = excluded.longitude,
             is_accessible = excluded.is_accessible,
             is_active = excluded.is_active""",
        (node_id, location_id, node_type, lat, lng),
    )
    return node_id


def apply_graph(db: sqlite3.Connection, data: dict) -> tuple[int, int]:
    legacy_locations = db.execute(
        "SELECT count(*) FROM locations WHERE id LIKE ?", (LOCATION_A_PREFIX + "%",)
    ).fetchone()[0]
    legacy_nodes = sum(
        db.execute("SELECT count(*) FROM nodes WHERE id LIKE ?", (prefix + "%",)).fetchone()[0]
        for prefix in NODE_A_PREFIXES
    )
    if legacy_locations or legacy_nodes:
        raise ValueError("Dataset A IDs remain in this database; run the approved cleanup first.")

    survey_nodes: dict[str, str] = {}

    # Reconcile named campus places and their graph entrance nodes first.
    for node in data["nodes"]:
        location_id = get_or_create_location(db, node)
        node_id = get_or_create_node(db, node, location_id)
        survey_nodes[node["survey_id"]] = node_id

    # Upsert confirmed two-way edges by stable edge ID. Distances and the
    # straight-line geometries are estimates as labelled by the source file.
    for segment in data["segments"]:
        source_id = survey_nodes[segment["from"]]
        target_id = survey_nodes[segment["to"]]
        edge_id = stable_id("edge", segment["survey_id"])
        db.execute(
            """INSERT INTO edges
               (id, source_node_id, target_node_id, distance_m, path_type,
                is_bidirectional, is_accessible, is_active)
               VALUES (?, ?, ?, ?, ?, 1, ?, 1)
               ON CONFLICT(id) DO UPDATE SET
                 source_node_id = excluded.source_node_id,
                 target_node_id = excluded.target_node_id,
                 distance_m = excluded.distance_m,
                 path_type = excluded.path_type,
                 is_bidirectional = 1,
                 is_accessible = excluded.is_accessible,
                 is_active = 1,
                 updated_at = CURRENT_TIMESTAMP""",
            (
                edge_id,
                source_id,
                target_id,
                float(segment["distance_m"]),
                segment["path_type"],
                1 if segment.get("is_accessible", False) else 0,
            ),
        )

    return len(survey_nodes), len(data["segments"])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, default=DEFAULT_DB, help="SQLite development database")
    parser.add_argument("--apply", action="store_true", help="Back up and load the route graph")
    args = parser.parse_args()

    if not args.db.exists():
        raise SystemExit(f"SQLite database not found: {args.db}")
    data = load_data()
    if not args.apply:
        print(
            f"Validated {len(data['nodes'])} nodes and {len(data['segments'])} segments. "
            "Pass --apply to load them."
        )
        return

    backup_path = Path(tempfile.gettempdir()) / (
        f"campusway_dev_before_survey_{datetime.now():%Y%m%d_%H%M%S}.db"
    )
    shutil.copy2(args.db, backup_path)

    db = sqlite3.connect(args.db)
    try:
        db.execute("PRAGMA foreign_keys = ON")
        with db:
            node_count, edge_count = apply_graph(db, data)
        print(f"Loaded {node_count} surveyed route nodes and {edge_count} bidirectional edges.")
        print(f"Backup: {backup_path}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
