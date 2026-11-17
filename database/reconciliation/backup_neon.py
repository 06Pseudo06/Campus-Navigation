"""Secure Pre-Reconciliation Database Backup for Neon PostgreSQL.

Connects in strict read-only mode.
Dumps complete table definitions, schema metadata, and all rows across all 11 tables.
Stores backup in the gitignored backups/ directory.
Verifies record count integrity.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

repo_root = Path(__file__).resolve().parents[2]
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from database.reconciliation.reconcile_neon_schema import (
    EXPECTED_BASELINE_TABLES,
    get_current_alembic_revision,
    get_pg_connection,
    get_table_row_counts,
    mask_database_url,
    resolve_database_url,
)


def backup_neon_database() -> Path:
    """Create a verified pre-reconciliation backup of the live Neon database."""
    db_url = resolve_database_url()
    masked_url = mask_database_url(db_url)
    print(f"Connecting to Neon DB ({masked_url}) in read-only mode...")

    conn = get_pg_connection(db_url, readonly=True)
    cur = conn.cursor()

    backup_data: Dict[str, Any] = {
        "metadata": {
            "created_at": datetime.now(timezone.utc).isoformat(),
            "target_database": masked_url,
            "starting_revision": get_current_alembic_revision(conn),
        },
        "tables": {},
    }

    try:
        baseline_counts = get_table_row_counts(conn, EXPECTED_BASELINE_TABLES)
        backup_data["metadata"]["baseline_counts"] = baseline_counts

        for table in EXPECTED_BASELINE_TABLES:
            print(f"  Backing up table: {table} ({baseline_counts[table]} rows)...")
            # Get columns
            cur.execute("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = %s
                ORDER BY ordinal_position;
            """, (table,))
            columns = [{"name": r[0], "type": r[1], "nullable": r[2]} for r in cur.fetchall()]

            # Get rows as dicts (converting complex types to str)
            col_names = [c["name"] for c in columns]
            cols_clause = ", ".join(f'"{c}"' for c in col_names)
            cur.execute(f'SELECT {cols_clause} FROM "{table}";')
            rows = []
            for raw_row in cur.fetchall():
                row_dict = {}
                for col_name, val in zip(col_names, raw_row):
                    if val is None:
                        row_dict[col_name] = None
                    elif isinstance(val, (int, float, bool, str)):
                        row_dict[col_name] = val
                    else:
                        row_dict[col_name] = str(val)
                rows.append(row_dict)

            backup_data["tables"][table] = {
                "columns": columns,
                "row_count": len(rows),
                "rows": rows,
            }

        # Save to backups/
        backup_dir = repo_root / "backups"
        backup_dir.mkdir(exist_ok=True)
        backup_file = backup_dir / f"neon_pre_reconciliation_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
        backup_file.write_text(json.dumps(backup_data, indent=2), encoding="utf-8")

        # Verify backup integrity
        verified_data = json.loads(backup_file.read_text(encoding="utf-8"))
        for t, cnt in baseline_counts.items():
            saved_cnt = verified_data["tables"][t]["row_count"]
            if saved_cnt != cnt:
                raise ValueError(f"Backup verification failed on {t}: expected {cnt}, got {saved_cnt}")

        print(f"\n[BACKUP VERIFIED SUCCESSFUL]")
        print(f"Backup file: {backup_file}")
        print(f"Total tables preserved: {len(backup_data['tables'])}")
        print(f"File size: {backup_file.stat().st_size} bytes")
        return backup_file

    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    backup_neon_database()
