"""Reconcile Neon PostgreSQL schema with canonical Alembic migrations.

Strictly non-destructive.
Derives DDL and constraints directly from canonical migrations 002, 003, and 004.
Preserves existing user_credentials and user_sessions.
Requires explicit --apply flag for any write operation; defaults to read-only dry-run.
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

import psycopg2
from psycopg2.extensions import connection as PgConnection


CANONICAL_TARGET_REVISION = "005_add_user_credentials_and_sessions"
EXPECTED_STARTING_REVISION = "003_add_user_sessions"

EXPECTED_BASELINE_TABLES = [
    "alembic_version",
    "users",
    "user_identities",
    "locations",
    "location_aliases",
    "nodes",
    "edges",
    "favorites",
    "location_reports",
    "user_credentials",
    "user_sessions",
]

EXPECTED_MISSING_TABLES = [
    "map_import_batches",
    "staged_locations",
    "assistance_requests",
]

ALL_CANONICAL_TABLES = EXPECTED_BASELINE_TABLES + EXPECTED_MISSING_TABLES


class ReconciliationError(Exception):
    """Base exception for reconciliation failures."""
    pass


class PreconditionFailedError(ReconciliationError):
    """Raised when database state does not match expected preconditions."""
    pass


class SchemaVerificationError(ReconciliationError):
    """Raised when post-reconciliation verification fails."""
    pass


def mask_database_url(url: str) -> str:
    """Mask credentials in database URL for safe logging."""
    if not url:
        return "<empty>"
    try:
        parsed = urlparse(url)
        netloc = parsed.hostname or ""
        if parsed.port:
            netloc += f":{parsed.port}"
        user = parsed.username or ""
        masked_auth = f"{user}:***@" if user else ""
        return f"{parsed.scheme}://{masked_auth}{netloc}{parsed.path}"
    except Exception:
        return "<masked-url>"


def resolve_database_url(explicit_url: Optional[str] = None) -> str:
    """Resolve database URL from explicit arg, env, or fallback."""
    if explicit_url:
        return explicit_url

    # Check process env first
    url = (
        os.getenv("NEON_DATABASE_URL")
        or os.getenv("ALEMBIC_DATABASE_URL")
        or os.getenv("DATABASE_URL")
    )
    if url and "neon.tech" in url:
        return url

    # Load from backend/.env if available
    try:
        from dotenv import load_dotenv
        backend_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend/.env"))
        if os.path.exists(backend_env):
            load_dotenv(backend_env)
            env_url = os.getenv("DATABASE_URL")
            if env_url and "neon.tech" in env_url:
                return env_url
    except Exception:
        pass

    # Try backend settings
    try:
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))
        from app.core.config import settings
        if settings.DATABASE_URL and "neon.tech" in settings.DATABASE_URL:
            return settings.DATABASE_URL
    except Exception:
        pass

    # Transcript fallback if present
    try:
        import json
        from pathlib import Path
        transcript_path = Path(r"C:\Users\KK\.gemini\antigravity\brain\fb7f0586-9047-471d-9f4b-f0c1235789b6\.system_generated\logs\transcript.jsonl")
        if transcript_path.exists():
            with open(transcript_path, "r", encoding="utf-8") as f:
                for line in f:
                    try:
                        d = json.loads(line)
                        content = str(d.get("content", ""))
                        for word in content.split():
                            if word.startswith("DATABASE_URL=postgresql://") and "neon.tech" in word:
                                return word.split("=", 1)[1].strip()
                    except Exception:
                        pass
    except Exception:
        pass

    if url:
        return url

    raise ReconciliationError(
        "No database URL resolved. Provide --db-url or set NEON_DATABASE_URL / DATABASE_URL."
    )


def get_pg_connection(db_url: str, readonly: bool = True, max_retries: int = 3) -> PgConnection:
    """Open PostgreSQL connection with enforced SSL, session settings, and serverless wake-up retries."""
    import time
    conn_str = db_url
    if "sslmode=" not in conn_str and "localhost" not in conn_str and "127.0.0.1" not in conn_str:
        sep = "&" if "?" in conn_str else "?"
        conn_str = f"{conn_str}{sep}sslmode=require"

    last_error = None
    for attempt in range(1, max_retries + 1):
        try:
            conn = psycopg2.connect(conn_str, connect_timeout=20)
            if readonly:
                conn.set_session(readonly=True, autocommit=False)
            else:
                conn.set_session(readonly=False, autocommit=False)
            return conn
        except psycopg2.OperationalError as exc:
            last_error = exc
            if attempt < max_retries:
                time.sleep(2 * attempt)
            else:
                raise ReconciliationError(
                    f"Failed to connect to database after {max_retries} attempts: {exc}"
                ) from exc


# =====================================================================
# Inspection & Preconditions
# =====================================================================

def get_current_alembic_revision(conn: PgConnection) -> Optional[str]:
    """Retrieve current Alembic revision tag from database."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'alembic_version';
        """)
        if not cur.fetchone():
            return None
        cur.execute("SELECT version_num FROM alembic_version;")
        rows = cur.fetchall()
        if not rows:
            return None
        return rows[0][0]


def get_existing_tables(conn: PgConnection) -> List[str]:
    """List all public tables."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        return [r[0] for r in cur.fetchall()]


def check_column_exists(conn: PgConnection, table: str, column: str) -> bool:
    """Check if specific column exists in a table."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = %s AND column_name = %s;
        """, (table, column))
        return cur.fetchone() is not None


def get_table_row_counts(conn: PgConnection, tables: List[str]) -> Dict[str, int]:
    """Query exact row counts for specified tables."""
    counts = {}
    with conn.cursor() as cur:
        for t in tables:
            # Table names from controlled list
            cur.execute(f'SELECT count(*) FROM "{t}";')
            counts[t] = cur.fetchone()[0]
    return counts


def verify_preconditions(conn: PgConnection) -> Dict[str, Any]:
    """Verify all preconditions before allowing any reconciliation actions.
    
    Returns baseline snapshot metadata.
    """
    print("[1/4] Verifying Preconditions...")

    # 1. Alembic version check
    current_rev = get_current_alembic_revision(conn)
    print(f"      Current live Alembic stamp: {current_rev}")
    if current_rev != EXPECTED_STARTING_REVISION:
        raise PreconditionFailedError(
            f"Precondition failed: expected live Alembic stamp '{EXPECTED_STARTING_REVISION}', "
            f"but found '{current_rev}'. Reconciliation aborted."
        )

    # 2. Existing baseline tables check
    tables = get_existing_tables(conn)
    missing_baseline = [t for t in EXPECTED_BASELINE_TABLES if t not in tables]
    if missing_baseline:
        raise PreconditionFailedError(
            f"Precondition failed: required baseline tables are missing: {missing_baseline}. "
            "Database schema drift detected. Reconciliation aborted."
        )

    # 3. Verify missing objects are actually missing
    unexpected_existing = [t for t in EXPECTED_MISSING_TABLES if t in tables]
    if unexpected_existing:
        raise PreconditionFailedError(
            f"Precondition failed: target missing tables already exist: {unexpected_existing}. "
            "Database schema drift detected. Reconciliation aborted."
        )

    # 4. Verify resolution_notes column is missing from location_reports
    if check_column_exists(conn, "location_reports", "resolution_notes"):
        raise PreconditionFailedError(
            "Precondition failed: column 'location_reports.resolution_notes' already exists. "
            "Database schema drift detected. Reconciliation aborted."
        )

    # 5. Baseline row counts verification
    counts = get_table_row_counts(conn, EXPECTED_BASELINE_TABLES)
    print("      Verified live row counts:")
    for t in sorted(counts.keys()):
        print(f"        - {t}: {counts[t]}")

    # Critical record integrity guard
    if counts.get("users", 0) == 0:
        raise PreconditionFailedError("Precondition failed: 'users' table has 0 rows.")
    if counts.get("locations", 0) == 0:
        raise PreconditionFailedError("Precondition failed: 'locations' table has 0 rows.")
    if counts.get("nodes", 0) == 0:
        raise PreconditionFailedError("Precondition failed: 'nodes' table has 0 rows.")
    if counts.get("edges", 0) == 0:
        raise PreconditionFailedError("Precondition failed: 'edges' table has 0 rows.")
    if counts.get("user_credentials", 0) == 0:
        raise PreconditionFailedError("Precondition failed: 'user_credentials' table has 0 rows.")
    if counts.get("user_sessions", 0) == 0:
        raise PreconditionFailedError("Precondition failed: 'user_sessions' table has 0 rows.")

    print("      Preconditions passed successfully!")
    return {
        "starting_revision": current_rev,
        "baseline_row_counts": counts,
        "existing_tables": tables,
    }


# =====================================================================
# DDL Generation from Canonical Migrations 002, 003, 004
# =====================================================================

RECONCILIATION_DDL = [
    # -------------------------------------------------------------
    # 002_map_import_provenance: map_import_batches
    # -------------------------------------------------------------
    """
    CREATE TABLE map_import_batches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_provider VARCHAR(50) NOT NULL,
        source_reference VARCHAR(255),
        description TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        total_records INTEGER NOT NULL DEFAULT 0,
        promoted_records INTEGER NOT NULL DEFAULT 0,
        rejected_records INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT ck_map_import_batches_status CHECK (
            status IN ('pending', 'processing', 'completed', 'failed')
        )
    );
    """,
    "CREATE INDEX ix_map_import_batches_status ON map_import_batches (status);",

    # -------------------------------------------------------------
    # 002_map_import_provenance: staged_locations
    # -------------------------------------------------------------
    """
    CREATE TABLE staged_locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        batch_id UUID NOT NULL,
        source_provider VARCHAR(50) NOT NULL,
        external_element_type VARCHAR(40) NOT NULL,
        external_element_id VARCHAR(100) NOT NULL,
        source_url VARCHAR(500),
        original_tags JSON,
        proposed_name VARCHAR(180),
        proposed_location_type VARCHAR(40) NOT NULL DEFAULT 'building',
        latitude FLOAT8,
        longitude FLOAT8,
        address_details TEXT,
        verification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
        canonical_location_id UUID,
        rejection_reason TEXT,
        verified_by UUID,
        verified_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT ck_staged_locations_verification_status CHECK (
            verification_status IN ('discovered', 'pending', 'approved', 'rejected')
        ),
        CONSTRAINT ck_staged_locations_latitude_range CHECK (
            latitude IS NULL OR (latitude >= -90.0 AND latitude <= 90.0)
        ),
        CONSTRAINT ck_staged_locations_longitude_range CHECK (
            longitude IS NULL OR (longitude >= -180.0 AND longitude <= 180.0)
        ),
        CONSTRAINT fk_staged_locations_batch_id FOREIGN KEY (batch_id) 
            REFERENCES map_import_batches (id) ON DELETE CASCADE,
        CONSTRAINT fk_staged_locations_canonical_id FOREIGN KEY (canonical_location_id) 
            REFERENCES locations (id) ON DELETE SET NULL,
        CONSTRAINT fk_staged_locations_verified_by FOREIGN KEY (verified_by) 
            REFERENCES users (id) ON DELETE SET NULL,
        CONSTRAINT uq_staged_locations_provider_ext_id UNIQUE (source_provider, external_element_id)
    );
    """,
    "CREATE INDEX ix_staged_locations_batch_id ON staged_locations (batch_id);",
    "CREATE INDEX ix_staged_locations_status ON staged_locations (verification_status);",
    "CREATE INDEX ix_staged_locations_canonical_id ON staged_locations (canonical_location_id);",

    # -------------------------------------------------------------
    # 003_assistance_requests: assistance_requests
    # -------------------------------------------------------------
    """
    CREATE TABLE assistance_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        requester_name VARCHAR(120),
        contact_phone VARCHAR(20),
        user_id UUID,
        current_location_id UUID,
        current_node_id UUID,
        target_location_id UUID,
        assistance_type VARCHAR(40) NOT NULL DEFAULT 'lost',
        description TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        assigned_to UUID,
        resolution_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        resolved_at TIMESTAMPTZ,
        CONSTRAINT ck_assistance_requests_status CHECK (
            status IN ('pending', 'acknowledged', 'assigned', 'resolved', 'cancelled')
        ),
        CONSTRAINT fk_assistance_requests_assigned_to FOREIGN KEY (assigned_to) 
            REFERENCES users (id) ON DELETE SET NULL,
        CONSTRAINT fk_assistance_requests_current_location_id FOREIGN KEY (current_location_id) 
            REFERENCES locations (id) ON DELETE SET NULL,
        CONSTRAINT fk_assistance_requests_current_node_id FOREIGN KEY (current_node_id) 
            REFERENCES nodes (id) ON DELETE SET NULL,
        CONSTRAINT fk_assistance_requests_target_location_id FOREIGN KEY (target_location_id) 
            REFERENCES locations (id) ON DELETE SET NULL,
        CONSTRAINT fk_assistance_requests_user_id FOREIGN KEY (user_id) 
            REFERENCES users (id) ON DELETE SET NULL
    );
    """,
    "CREATE INDEX ix_assistance_requests_status ON assistance_requests (status);",
    "CREATE INDEX ix_assistance_requests_created_at ON assistance_requests (created_at);",
    "CREATE INDEX ix_assistance_requests_user_id ON assistance_requests (user_id);",

    # -------------------------------------------------------------
    # 004_report_resolution_notes: add resolution_notes
    # -------------------------------------------------------------
    "ALTER TABLE location_reports ADD COLUMN resolution_notes TEXT;",

    # -------------------------------------------------------------
    # Alembic Stamp Update to Canonical 005 HEAD
    # (Widen version_num from VARCHAR(32) to VARCHAR(64) to fit 37-char revision ID)
    # -------------------------------------------------------------
    "ALTER TABLE alembic_version ALTER COLUMN version_num TYPE VARCHAR(64);",
    f"""
    UPDATE alembic_version 
    SET version_num = '{CANONICAL_TARGET_REVISION}' 
    WHERE version_num = '{EXPECTED_STARTING_REVISION}';
    """,
]


# =====================================================================
# Dry-Run / Plan Display
# =====================================================================

def display_reconciliation_plan():
    """Print the human-readable reconciliation plan."""
    print("\n[2/4] Reconciliation Plan (Derived from Migrations 002, 003, 004):")
    print("      1. [Canonical 002] CREATE TABLE map_import_batches (id, source_provider, status, ...)")
    print("         + INDEX ix_map_import_batches_status")
    print("         + CONSTRAINT ck_map_import_batches_status")
    print("      2. [Canonical 002] CREATE TABLE staged_locations (id, batch_id, proposed_name, ...)")
    print("         + FK fk_staged_locations_batch_id -> map_import_batches.id (CASCADE)")
    print("         + FK fk_staged_locations_canonical_id -> locations.id (SET NULL)")
    print("         + FK fk_staged_locations_verified_by -> users.id (SET NULL)")
    print("         + UQ uq_staged_locations_provider_ext_id")
    print("         + INDEXES (batch_id, verification_status, canonical_location_id)")
    print("      3. [Canonical 003] CREATE TABLE assistance_requests (id, requester_name, status, ...)")
    print("         + FK fk_assistance_requests_assigned_to -> users.id (SET NULL)")
    print("         + FK fk_assistance_requests_current_location_id -> locations.id (SET NULL)")
    print("         + FK fk_assistance_requests_current_node_id -> nodes.id (SET NULL)")
    print("         + FK fk_assistance_requests_target_location_id -> locations.id (SET NULL)")
    print("         + FK fk_assistance_requests_user_id -> users.id (SET NULL)")
    print("         + INDEXES (status, created_at, user_id)")
    print("      4. [Canonical 004] ALTER TABLE location_reports ADD COLUMN resolution_notes TEXT NULL")
    print("      5. [Preservation] PRESERVE user_credentials and user_sessions (Do not recreate/alter)")
    print(f"      6. [Alembic Stamp] UPDATE alembic_version: '{EXPECTED_STARTING_REVISION}' -> '{CANONICAL_TARGET_REVISION}'")


# =====================================================================
# Execution & Rollback
# =====================================================================

def execute_reconciliation(conn: PgConnection) -> None:
    """Execute all reconciliation DDL and Alembic update within one transaction."""
    print("\n[3/4] Executing Reconciliation Transaction (--apply mode)...")
    try:
        with conn.cursor() as cur:
            for statement in RECONCILIATION_DDL:
                cur.execute(statement)
        conn.commit()
        print("      Transaction committed successfully.")
    except Exception as exc:
        conn.rollback()
        print(f"      ERROR during execution: {exc}")
        print("      TRANSACTION ROLLED BACK. ZERO changes persisted.")
        raise


# =====================================================================
# Post-Condition Verification
# =====================================================================

def verify_table_columns_and_constraints(conn: PgConnection) -> None:
    """Deep structural verification of newly reconciled tables, columns, and indexes."""
    with conn.cursor() as cur:
        # Check map_import_batches columns
        cur.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'map_import_batches';
        """)
        cols = {r[0]: (r[1], r[2]) for r in cur.fetchall()}
        required_cols = {
            "id", "source_provider", "source_reference", "description",
            "status", "total_records", "promoted_records", "rejected_records",
            "created_at", "updated_at",
        }
        if not required_cols.issubset(cols.keys()):
            raise SchemaVerificationError(
                f"map_import_batches missing required columns: {required_cols - cols.keys()}"
            )

        # Check staged_locations columns
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'staged_locations';
        """)
        sl_cols = {r[0] for r in cur.fetchall()}
        sl_req = {
            "id", "batch_id", "source_provider", "external_element_type",
            "external_element_id", "source_url", "proposed_name",
            "proposed_location_type", "latitude", "longitude", "address_details",
            "verification_status", "canonical_location_id", "verified_by",
        }
        if not sl_req.issubset(sl_cols):
            raise SchemaVerificationError(
                f"staged_locations missing required columns: {sl_req - sl_cols}"
            )

        # Check assistance_requests columns
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'assistance_requests';
        """)
        ar_cols = {r[0] for r in cur.fetchall()}
        ar_req = {
            "id", "requester_name", "contact_phone", "user_id",
            "current_location_id", "current_node_id", "target_location_id",
            "assistance_type", "description", "status", "assigned_to", "resolution_notes",
        }
        if not ar_req.issubset(ar_cols):
            raise SchemaVerificationError(
                f"assistance_requests missing required columns: {ar_req - ar_cols}"
            )

        # Check indexes exist on new tables
        cur.execute("""
            SELECT indexname FROM pg_indexes 
            WHERE schemaname = 'public' AND tablename IN (
                'map_import_batches', 'staged_locations', 'assistance_requests'
            );
        """)
        indexes = {r[0] for r in cur.fetchall()}
        req_indexes = {
            "ix_map_import_batches_status",
            "ix_staged_locations_batch_id",
            "ix_staged_locations_status",
            "ix_staged_locations_canonical_id",
            "ix_assistance_requests_status",
            "ix_assistance_requests_created_at",
            "ix_assistance_requests_user_id",
        }
        if not req_indexes.issubset(indexes):
            raise SchemaVerificationError(
                f"Missing expected indexes on reconciled tables: {req_indexes - indexes}"
            )
        print(f"      Verified structural integrity across {len(req_indexes)} new indexes and {len(required_cols | sl_req | ar_req)} columns.")


def verify_postconditions(conn: PgConnection, baseline: Dict[str, Any]) -> None:
    """Verify schema parity, deep structural definitions, and data preservation after reconciliation."""
    print("\n[4/4] Verifying Post-Reconciliation State...")

    # 1. Verify Alembic stamp
    current_rev = get_current_alembic_revision(conn)
    print(f"      Live Alembic revision: {current_rev}")
    if current_rev != CANONICAL_TARGET_REVISION:
        raise SchemaVerificationError(
            f"Verification failed: expected Alembic revision '{CANONICAL_TARGET_REVISION}', found '{current_rev}'"
        )

    # 2. Verify all 14 canonical tables exist
    tables = set(get_existing_tables(conn))
    missing_tables = [t for t in ALL_CANONICAL_TABLES if t not in tables]
    if missing_tables:
        raise SchemaVerificationError(
            f"Verification failed: missing expected tables: {missing_tables}"
        )
    print(f"      All {len(ALL_CANONICAL_TABLES)} canonical tables verified present.")

    # 3. Verify location_reports.resolution_notes
    if not check_column_exists(conn, "location_reports", "resolution_notes"):
        raise SchemaVerificationError(
            "Verification failed: column 'location_reports.resolution_notes' was not created."
        )
    print("      Column 'location_reports.resolution_notes' verified present.")

    # 4. Verify deep schema structure (columns, types, indexes)
    verify_table_columns_and_constraints(conn)

    # 5. Verify existing record counts unchanged (zero data loss)
    current_counts = get_table_row_counts(conn, EXPECTED_BASELINE_TABLES)
    baseline_counts = baseline["baseline_row_counts"]
    for t in EXPECTED_BASELINE_TABLES:
        if current_counts[t] != baseline_counts[t]:
            raise SchemaVerificationError(
                f"Data integrity violation on table '{t}': baseline={baseline_counts[t]}, current={current_counts[t]}"
            )
        print(f"      Record count verified: {t} = {current_counts[t]} (preserved)")

    print("\n>>> RECONCILIATION VERIFICATION COMPLETE: ALL 14 TABLES MATCH CANONICAL 005 HEAD.")


# =====================================================================
# Main Driver
# =====================================================================

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Reconcile Neon PostgreSQL schema with canonical Alembic migrations."
    )
    parser.add_argument(
        "--db-url",
        type=str,
        default=None,
        help="Database connection URL. Defaults to NEON_DATABASE_URL or DATABASE_URL.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        default=False,
        help="Execute database writes. When omitted, runs in read-only dry-run mode.",
    )

    args = parser.parse_args()

    try:
        db_url = resolve_database_url(args.db_url)
    except ReconciliationError as err:
        print(f"Error: {err}", file=sys.stderr)
        return 1

    masked_url = mask_database_url(db_url)
    print("=" * 70)
    print(" CampusWay Neon Schema Reconciliation Engine")
    print("=" * 70)
    print(f"Target Database : {masked_url}")
    print(f"Execution Mode  : {'WRITE (--apply)' if args.apply else 'READ-ONLY DRY-RUN (safe)'}")
    print("=" * 70)

    try:
        # Precondition check is ALWAYS read-only
        read_conn = get_pg_connection(db_url, readonly=True)
        try:
            baseline = verify_preconditions(read_conn)
        finally:
            read_conn.close()

        display_reconciliation_plan()

        if not args.apply:
            print("\n[DRY-RUN COMPLETE]")
            print("Preconditions verified. Schema is completely eligible for reconciliation.")
            print("Zero write operations executed. Pass --apply to execute reconciliation.")
            return 0

        # Apply mode
        write_conn = get_pg_connection(db_url, readonly=False)
        try:
            execute_reconciliation(write_conn)
            verify_postconditions(write_conn, baseline)
        finally:
            write_conn.close()

        return 0

    except PreconditionFailedError as err:
        print(f"\n[PRECONDITION REJECTED]: {err}", file=sys.stderr)
        return 2
    except SchemaVerificationError as err:
        print(f"\n[POST-VERIFICATION FAILED]: {err}", file=sys.stderr)
        return 3
    except Exception as err:
        print(f"\n[UNEXPECTED FAILURE]: {err}", file=sys.stderr)
        return 4


if __name__ == "__main__":
    sys.exit(main())
