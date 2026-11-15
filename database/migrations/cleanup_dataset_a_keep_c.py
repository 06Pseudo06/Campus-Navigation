"""Replace legacy campus geography in SQLite with the verified Dataset C graph.

This is a one-time, fail-closed data migration. It requires an independently
verified SQLite backup and is intentionally limited to campus geographic rows.
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import uuid
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_FILE = ROOT / "database" / "surveys" / "lpu_verified_survey.json"
UUID_NAMESPACE = uuid.UUID("5c2396a7-4e49-48a6-b75c-40eb90905c2a")
LOCATION_A_PREFIX = "a0000001000140008000"
NODE_A_PREFIXES = ("b0000001000140008000", "b0000002000140008000")
EXPECTED_C_NODES = 27
EXPECTED_C_EDGES = 29


def stable_id(kind: str, survey_id: str) -> str:
    return uuid.uuid5(UUID_NAMESPACE, f"campusway:{kind}:{survey_id}").hex


def load_source() -> dict:
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    nodes = data.get("nodes", [])
    segments = data.get("segments", [])
    node_ids = {n["survey_id"] for n in nodes}
    if data.get("status") != "confirmed_project_route_data":
        raise ValueError("Dataset C source is not marked confirmed.")
    if len(nodes) != EXPECTED_C_NODES or len(node_ids) != EXPECTED_C_NODES:
        raise ValueError("Dataset C must contain exactly 27 unique nodes.")
    if len(segments) != EXPECTED_C_EDGES:
        raise ValueError("Dataset C must contain exactly 29 segments.")
    if len({s["survey_id"] for s in segments}) != EXPECTED_C_EDGES:
        raise ValueError("Dataset C segment IDs must be unique.")
    if len([n for n in nodes if n.get("location_slug")]) != 15:
        raise ValueError("Dataset C must contain 15 named locations.")
    if len([n for n in nodes if n["node_type"] == "junction"]) != 12:
        raise ValueError("Dataset C must contain junctions J1 through J12.")
    if not all(s.get("bidirectional") is True for s in segments):
        raise ValueError("Every Dataset C connection must be bidirectional.")
    for node in nodes:
        lat = float(node["coordinates"]["latitude"])
        lon = float(node["coordinates"]["longitude"])
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            raise ValueError(f"Invalid coordinates for {node['survey_id']}.")
    for segment in segments:
        if segment["from"] not in node_ids or segment["to"] not in node_ids:
            raise ValueError(f"Missing endpoint in {segment['survey_id']}.")
        if float(segment["distance_m"]) <= 0:
            raise ValueError(f"Invalid distance in {segment['survey_id']}.")
    if not any(
        s["survey_id"] == "P-029" and {s["from"], s["to"]} == {"J-008", "J-009"}
        for s in segments
    ):
        raise ValueError("The explicitly supplied J8 ↔ J9 connection is missing.")
    return data


def count(db: sqlite3.Connection, table: str) -> int:
    return int(db.execute(f'SELECT count(*) FROM "{table}"').fetchone()[0])


def check_backup(db_path: Path, backup_path: Path) -> None:
    if not backup_path.is_file():
        raise ValueError(f"Required verified backup is missing: {backup_path}")
    for path in (db_path, backup_path):
        with sqlite3.connect(f"file:{path.resolve().as_posix()}?mode=ro", uri=True) as db:
            if db.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                raise ValueError(f"SQLite integrity check failed: {path}")
    with sqlite3.connect(f"file:{db_path.resolve().as_posix()}?mode=ro", uri=True) as live, sqlite3.connect(
        f"file:{backup_path.resolve().as_posix()}?mode=ro", uri=True
    ) as backup:
        live_tables = [r[0] for r in live.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")]
        backup_tables = [r[0] for r in backup.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")]
        if live_tables != backup_tables:
            raise ValueError("Backup table inventory differs from the target database.")
        if any(count(live, t) != count(backup, t) for t in live_tables):
            raise ValueError("Backup record counts differ from the target database.")


def ensure_no_unmapped_dependencies(db: sqlite3.Connection, a_only_location_ids: set[str], legacy_node_ids: set[str], c_edge_ids: set[str]) -> None:
    """Stop rather than cascade-delete records that have no C equivalent."""
    checks = {
        "favorites to non-C locations": "SELECT count(*) FROM favorites WHERE location_id IN ({})",
        "reports to non-C locations": "SELECT count(*) FROM location_reports WHERE location_id IN ({})",
        "reports to non-C nodes": "SELECT count(*) FROM location_reports WHERE node_id IN ({})",
        "reports to non-C edges": "SELECT count(*) FROM location_reports WHERE edge_id IS NOT NULL AND edge_id NOT IN ({})",
        "assistance requests to non-C locations": "SELECT count(*) FROM assistance_requests WHERE current_location_id IN ({}) OR target_location_id IN ({})",
        "assistance requests to non-C nodes": "SELECT count(*) FROM assistance_requests WHERE current_node_id IN ({})",
        "staged imports to non-C locations": "SELECT count(*) FROM staged_locations WHERE canonical_location_id IN ({})",
    }
    node_placeholders = ",".join("?" for _ in legacy_node_ids) or "NULL"
    loc_placeholders = ",".join("?" for _ in a_only_location_ids) or "NULL"
    edge_placeholders = ",".join("?" for _ in c_edge_ids) or "NULL"
    values = []
    values.append(("reports to non-C edges", checks["reports to non-C edges"].format(edge_placeholders), tuple(c_edge_ids)))
    values.append(("reports to non-C nodes", checks["reports to non-C nodes"].format(node_placeholders), tuple(legacy_node_ids)))
    # The caller separately checks shared-location references and migrates them.
    for name in ("favorites to non-C locations", "reports to non-C locations"):
        values.append((name, checks[name].format(loc_placeholders), tuple(a_only_location_ids)))
    values.append(("assistance requests to non-C locations", checks["assistance requests to non-C locations"].format(loc_placeholders, loc_placeholders), tuple(a_only_location_ids) * 2))
    values.append(("assistance requests to non-C nodes", checks["assistance requests to non-C nodes"].format(node_placeholders), tuple(legacy_node_ids)))
    values.append(("staged imports to non-C locations", checks["staged imports to non-C locations"].format(loc_placeholders), tuple(a_only_location_ids)))
    values.append(("child locations under Dataset A", f"SELECT count(*) FROM locations WHERE parent_id IN ({loc_placeholders})", tuple(a_only_location_ids)))
    for label, query, params in values:
        n = int(db.execute(query, params).fetchone()[0])
        if n:
            raise ValueError(f"Preflight found {n} {label}; refusing cleanup.")


def migrate(db_path: Path, backup_path: Path, apply: bool) -> dict:
    data = load_source()
    check_backup(db_path, backup_path)
    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON")
    try:
        legacy_location_rows = db.execute(
            "SELECT id, slug FROM locations WHERE id LIKE ? ORDER BY id",
            (LOCATION_A_PREFIX + "%",),
        ).fetchall()
        legacy_node_rows = db.execute(
            "SELECT id FROM nodes WHERE id LIKE ? OR id LIKE ? ORDER BY id",
            (NODE_A_PREFIXES[0] + "%", NODE_A_PREFIXES[1] + "%"),
        ).fetchall()
        legacy_ids = {r["id"] for r in legacy_location_rows}
        legacy_node_ids = {r["id"] for r in legacy_node_rows}
        if len(legacy_ids) != 86 or len(legacy_node_ids) != 106:
            raise ValueError(
                f"Unexpected legacy inventory ({len(legacy_ids)} locations, {len(legacy_node_ids)} nodes)."
            )

        source_by_slug = {n["location_slug"]: n for n in data["nodes"] if n.get("location_slug")}
        current_c_locations: dict[str, str] = {}
        current_c_nodes: dict[str, str] = {}
        for node in data["nodes"]:
            slug = node.get("location_slug")
            if slug:
                rows = db.execute("SELECT id, latitude, longitude FROM locations WHERE slug=?", (slug,)).fetchall()
                if len(rows) != 1:
                    raise ValueError(f"Dataset C slug {slug!r} is missing or ambiguous.")
                row = rows[0]
                expected = node["coordinates"]
                if abs(row["latitude"] - expected["latitude"]) > 1e-8 or abs(row["longitude"] - expected["longitude"]) > 1e-8:
                    raise ValueError(f"Coordinate mismatch for {node['survey_id']}.")
                current_c_locations[node["survey_id"]] = row["id"]
                linked = db.execute(
                    "SELECT id, is_accessible FROM nodes WHERE location_id=? AND node_type=? ORDER BY is_active DESC,id LIMIT 1",
                    (row["id"], node["node_type"]),
                ).fetchone()
                if linked is None:
                    raise ValueError(f"No current entrance node for {node['survey_id']}.")
                current_c_nodes[node["survey_id"]] = linked["id"]
            else:
                expected_id = stable_id("node", node["survey_id"])
                found = db.execute("SELECT id FROM nodes WHERE id=?", (expected_id,)).fetchone()
                if found is None:
                    raise ValueError(f"C junction {node['survey_id']} is not independently stored.")
                current_c_nodes[node["survey_id"]] = expected_id

        shared_location_ids = {
            current_c_locations[sid]
            for sid in current_c_locations
            if current_c_locations[sid].startswith(LOCATION_A_PREFIX)
        }
        shared_node_ids = {
            current_c_nodes[n["survey_id"]]
            for n in data["nodes"]
            if n.get("location_slug") and current_c_nodes[n["survey_id"]].startswith(NODE_A_PREFIXES)
        }
        if len(shared_location_ids) != 8 or len(shared_node_ids) != 8:
            raise ValueError("Expected exactly eight shared Dataset A/C locations and nodes.")
        a_only_location_ids = legacy_ids - shared_location_ids
        a_only_node_ids = legacy_node_ids - shared_node_ids

        c_edge_ids = {stable_id("edge", s["survey_id"]) for s in data["segments"]}
        existing_edges = {r["id"] for r in db.execute("SELECT id FROM edges")}
        if len(existing_edges - c_edge_ids) != 150 or len(existing_edges & c_edge_ids) != 28:
            raise ValueError("Edge inventory differs from the audited 150 A / 28 C split.")
        if count(db, "location_aliases") != 190:
            raise ValueError("Alias inventory changed; refusing to remove unexpected aliases.")
        alias_to_non_a = db.execute(
            "SELECT count(*) FROM location_aliases WHERE location_id NOT IN (SELECT id FROM locations WHERE id LIKE ?)",
            (LOCATION_A_PREFIX + "%",),
        ).fetchone()[0]
        if alias_to_non_a:
            raise ValueError(f"Found {alias_to_non_a} aliases outside Dataset A; refusing blanket alias cleanup.")
        ensure_no_unmapped_dependencies(db, a_only_location_ids, a_only_node_ids, c_edge_ids)
        if db.execute(
            "SELECT count(*) FROM locations WHERE parent_id IN (SELECT id FROM locations WHERE id LIKE ?)",
            (LOCATION_A_PREFIX + "%",),
        ).fetchone()[0]:
            raise ValueError("Dataset A locations still have child location references; refusing cleanup.")
        if db.execute("PRAGMA foreign_key_check").fetchall():
            raise ValueError("Existing foreign-key check failed.")

        original_counts = {
            t: count(db, t)
            for t in ("users", "user_credentials", "user_identities", "user_sessions", "assistance_requests", "map_import_batches", "staged_locations")
        }
        report = {
            "shared_location_ids": len(shared_location_ids),
            "shared_node_ids": len(shared_node_ids),
            "delete_locations": len(legacy_ids),
            "delete_nodes": len(legacy_node_ids),
            "delete_edges": 150,
            "delete_aliases": 190,
            "before": {t: count(db, t) for t in ("locations", "nodes", "edges", "location_aliases")},
        }
        if not apply:
            return {"status": "preflight_passed_dry_run", **report}

        db.execute("BEGIN IMMEDIATE")
        try:
            new_location_ids = {
                n["survey_id"]: stable_id("location", n["survey_id"])
                for n in data["nodes"] if n.get("location_slug")
            }
            new_node_ids = {n["survey_id"]: stable_id("node", n["survey_id"]) for n in data["nodes"]}

            # Free the eight shared slugs while preserving the old rows until
            # C rows, nodes, and route references have independent IDs.
            for survey_id, old_id in current_c_locations.items():
                if old_id in shared_location_ids:
                    db.execute("UPDATE locations SET slug=? WHERE id=?", (f"__dataset_a_pending_delete_{old_id}", old_id))

            # Insert/update all 15 C locations strictly from the survey source.
            for node in data["nodes"]:
                if not node.get("location_slug"):
                    continue
                loc_id = new_location_ids[node["survey_id"]]
                lat = float(node["coordinates"]["latitude"])
                lon = float(node["coordinates"]["longitude"])
                existing = db.execute("SELECT id FROM locations WHERE id=?", (loc_id,)).fetchone()
                if existing:
                    db.execute(
                        "UPDATE locations SET parent_id=NULL,name=?,slug=?,location_type=?,description=NULL,latitude=?,longitude=?,address_details=NULL,is_verified=1,is_active=1,updated_at=CURRENT_TIMESTAMP WHERE id=?",
                        (node["name"], node["location_slug"], node["location_type"], lat, lon, loc_id),
                    )
                else:
                    db.execute(
                        "INSERT INTO locations (id,parent_id,name,slug,location_type,description,latitude,longitude,address_details,is_verified,is_active) VALUES (?,NULL,?,?,?,NULL,?,?,NULL,1,1)",
                        (loc_id, node["name"], node["location_slug"], node["location_type"], lat, lon),
                    )

            # Copy C entrance attributes from the surveyed nodes; the eight
            # shared nodes get new IDs, while existing C-only node IDs remain.
            old_accessibility: dict[str, int] = {}
            for survey_id, old_node_id in current_c_nodes.items():
                row = db.execute("SELECT is_accessible FROM nodes WHERE id=?", (old_node_id,)).fetchone()
                old_accessibility[survey_id] = int(row["is_accessible"])
            for node in data["nodes"]:
                node_id = new_node_ids[node["survey_id"]]
                location_id = new_location_ids.get(node["survey_id"])
                lat = float(node["coordinates"]["latitude"])
                lon = float(node["coordinates"]["longitude"])
                accessible = old_accessibility.get(node["survey_id"], 0)
                existing = db.execute("SELECT id FROM nodes WHERE id=?", (node_id,)).fetchone()
                if existing:
                    db.execute(
                        "UPDATE nodes SET location_id=?,node_type=?,latitude=?,longitude=?,is_accessible=?,is_active=1 WHERE id=?",
                        (location_id, node["node_type"], lat, lon, accessible, node_id),
                    )
                else:
                    db.execute(
                        "INSERT INTO nodes (id,location_id,node_type,latitude,longitude,is_accessible,is_active) VALUES (?,?,?,?,?,?,1)",
                        (node_id, location_id, node["node_type"], lat, lon, accessible),
                    )

            # Move user-facing references on the eight shared records before
            # the old IDs are removed. A-only references were rejected above.
            for survey_id, old_id in current_c_locations.items():
                new_id = new_location_ids[survey_id]
                if old_id != new_id:
                    db.execute("UPDATE favorites SET location_id=? WHERE location_id=?", (new_id, old_id))
                    db.execute("UPDATE location_reports SET location_id=? WHERE location_id=?", (new_id, old_id))
                    db.execute("UPDATE assistance_requests SET current_location_id=? WHERE current_location_id=?", (new_id, old_id))
                    db.execute("UPDATE assistance_requests SET target_location_id=? WHERE target_location_id=?", (new_id, old_id))
            for survey_id, old_id in current_c_nodes.items():
                new_id = new_node_ids[survey_id]
                if old_id != new_id:
                    db.execute("UPDATE location_reports SET node_id=? WHERE node_id=?", (new_id, old_id))
                    db.execute("UPDATE assistance_requests SET current_node_id=? WHERE current_node_id=?", (new_id, old_id))

            # Remove only the 150 audited non-C edges, then update the 28 C
            # edges and add P-029. Every segment remains explicitly two-way.
            placeholders = ",".join("?" for _ in c_edge_ids)
            db.execute(f"DELETE FROM edges WHERE id NOT IN ({placeholders})", tuple(c_edge_ids))
            for segment in data["segments"]:
                edge_id = stable_id("edge", segment["survey_id"])
                source_id = new_node_ids[segment["from"]]
                target_id = new_node_ids[segment["to"]]
                values = (
                    source_id, target_id, float(segment["distance_m"]), segment["path_type"],
                    1, 1 if segment.get("is_accessible", False) else 0, 1, edge_id,
                )
                db.execute(
                    "INSERT INTO edges (id,source_node_id,target_node_id,distance_m,path_type,is_bidirectional,is_accessible,is_active) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET source_node_id=excluded.source_node_id,target_node_id=excluded.target_node_id,distance_m=excluded.distance_m,path_type=excluded.path_type,is_bidirectional=1,is_accessible=excluded.is_accessible,is_active=1,updated_at=CURRENT_TIMESTAMP",
                    (edge_id, *values[:-1]),
                )

            # All aliases are A-derived and none are specified by Dataset C.
            db.execute("DELETE FROM location_aliases")
            # Old A nodes and locations can now be removed without cascading
            # into C edges or user/authentication records.
            db.execute("DELETE FROM nodes WHERE id LIKE ? OR id LIKE ?", (NODE_A_PREFIXES[0] + "%", NODE_A_PREFIXES[1] + "%"))
            db.execute("DELETE FROM locations WHERE id LIKE ?", (LOCATION_A_PREFIX + "%",))

            final_counts = {t: count(db, t) for t in ("locations", "nodes", "edges", "location_aliases")}
            if final_counts != {"locations": 15, "nodes": 27, "edges": 29, "location_aliases": 0}:
                raise ValueError(f"Unexpected final campus counts: {final_counts}")
            if db.execute("PRAGMA foreign_key_check").fetchall():
                raise ValueError("Post-cleanup foreign-key check failed.")
            if db.execute("SELECT count(*) FROM edges WHERE is_bidirectional != 1").fetchone()[0]:
                raise ValueError("A Dataset C edge is not bidirectional.")
            for table, before_count in original_counts.items():
                if count(db, table) != before_count:
                    raise ValueError(f"Non-geographic table {table} changed during cleanup.")
            for n in data["nodes"]:
                if n.get("location_slug"):
                    row = db.execute("SELECT id,latitude,longitude FROM locations WHERE slug=?", (n["location_slug"],)).fetchone()
                    assert row and row["id"] == new_location_ids[n["survey_id"]]
                    assert abs(row["latitude"] - n["coordinates"]["latitude"]) < 1e-8
                    assert abs(row["longitude"] - n["coordinates"]["longitude"]) < 1e-8
            db.commit()
            return {"status": "applied_and_verified", **report, "after": final_counts, "auth_and_user_counts_unchanged": True}
        except Exception:
            db.rollback()
            raise
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, default=ROOT / "backend" / "campusway_dev.db")
    parser.add_argument("--backup", type=Path, required=True)
    parser.add_argument("--apply", action="store_true", help="Apply the destructive cleanup after preflight.")
    args = parser.parse_args()
    print(json.dumps(migrate(args.db, args.backup, args.apply), indent=2))


if __name__ == "__main__":
    main()
