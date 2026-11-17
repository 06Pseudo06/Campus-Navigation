"""Isolated unit tests for Neon schema reconciliation engine.

Tests dry-run logic, precondition validation, drift rejection, and transaction rollback.
"""

from unittest.mock import MagicMock, call, patch
from pathlib import Path
import sys
import pytest

repo_root = Path(__file__).resolve().parent.parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from database.reconciliation.reconcile_neon_schema import (
    CANONICAL_TARGET_REVISION,
    EXPECTED_BASELINE_TABLES,
    EXPECTED_MISSING_TABLES,
    EXPECTED_STARTING_REVISION,
    PreconditionFailedError,
    SchemaVerificationError,
    check_column_exists,
    get_current_alembic_revision,
    get_existing_tables,
    get_table_row_counts,
    mask_database_url,
    verify_postconditions,
    verify_preconditions,
    execute_reconciliation,
)


def test_mask_database_url():
    """Verify password and sensitive credentials are never displayed."""
    url = "postgresql://neondb_owner:npg_SECRET_PASS_123@ep-misty-block.neon.tech/neondb?sslmode=require"
    masked = mask_database_url(url)
    assert "npg_SECRET_PASS_123" not in masked
    assert "neondb_owner:***@ep-misty-block.neon.tech/neondb" in masked

    assert mask_database_url("") == "<empty>"
    assert mask_database_url(None) == "<empty>"


def test_verify_preconditions_success():
    """Preconditions pass when live DB matches expected starting state."""
    mock_conn = MagicMock()
    mock_cur = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cur

    # Mock get_current_alembic_revision
    # First query checks table existence, second gets version
    mock_cur.fetchone.side_effect = [
        ("alembic_version",),  # table exists
        [("003_add_user_sessions",)],  # version_num
        None,  # column check: resolution_notes does NOT exist
        11, 2, 15, 0, 27, 29, 0, 0, 3, 11, 1,  # table counts for baseline tables
    ]

    # Mock get_existing_tables
    mock_cur.fetchall.side_effect = [
        [("003_add_user_sessions",)],  # version rows
        [(t,) for t in EXPECTED_BASELINE_TABLES],  # existing public tables
    ]

    with patch("database.reconciliation.reconcile_neon_schema.get_current_alembic_revision", return_value="003_add_user_sessions"):
        with patch("database.reconciliation.reconcile_neon_schema.get_existing_tables", return_value=EXPECTED_BASELINE_TABLES):
            with patch("database.reconciliation.reconcile_neon_schema.check_column_exists", return_value=False):
                with patch("database.reconciliation.reconcile_neon_schema.get_table_row_counts", return_value={
                    "users": 11,
                    "locations": 15,
                    "nodes": 27,
                    "edges": 29,
                    "user_credentials": 3,
                    "user_sessions": 11,
                    "user_identities": 2,
                    "alembic_version": 1,
                    "location_aliases": 0,
                    "favorites": 0,
                    "location_reports": 0,
                }):
                    baseline = verify_preconditions(mock_conn)
                    assert baseline["starting_revision"] == "003_add_user_sessions"
                    assert baseline["baseline_row_counts"]["users"] == 11
                    assert baseline["baseline_row_counts"]["nodes"] == 27


def test_verify_preconditions_rejects_wrong_alembic_version():
    """Preconditions fail if starting revision is not 003_add_user_sessions."""
    mock_conn = MagicMock()
    with patch("database.reconciliation.reconcile_neon_schema.get_current_alembic_revision", return_value="001_initial_schema_v1"):
        with pytest.raises(PreconditionFailedError) as exc_info:
            verify_preconditions(mock_conn)
        assert "expected live Alembic stamp '003_add_user_sessions'" in str(exc_info.value)


def test_verify_preconditions_rejects_missing_baseline_table():
    """Preconditions fail if an expected baseline table is missing."""
    mock_conn = MagicMock()
    partial_tables = [t for t in EXPECTED_BASELINE_TABLES if t != "user_credentials"]

    with patch("database.reconciliation.reconcile_neon_schema.get_current_alembic_revision", return_value="003_add_user_sessions"):
        with patch("database.reconciliation.reconcile_neon_schema.get_existing_tables", return_value=partial_tables):
            with pytest.raises(PreconditionFailedError) as exc_info:
                verify_preconditions(mock_conn)
            assert "required baseline tables are missing: ['user_credentials']" in str(exc_info.value)


def test_verify_preconditions_rejects_unexpected_existing_table():
    """Preconditions fail if a target missing table already exists (schema drift)."""
    mock_conn = MagicMock()
    drifted_tables = EXPECTED_BASELINE_TABLES + ["map_import_batches"]

    with patch("database.reconciliation.reconcile_neon_schema.get_current_alembic_revision", return_value="003_add_user_sessions"):
        with patch("database.reconciliation.reconcile_neon_schema.get_existing_tables", return_value=drifted_tables):
            with pytest.raises(PreconditionFailedError) as exc_info:
                verify_preconditions(mock_conn)
            assert "target missing tables already exist: ['map_import_batches']" in str(exc_info.value)


def test_verify_preconditions_rejects_already_existing_resolution_notes():
    """Preconditions fail if location_reports.resolution_notes already exists."""
    mock_conn = MagicMock()
    with patch("database.reconciliation.reconcile_neon_schema.get_current_alembic_revision", return_value="003_add_user_sessions"):
        with patch("database.reconciliation.reconcile_neon_schema.get_existing_tables", return_value=EXPECTED_BASELINE_TABLES):
            with patch("database.reconciliation.reconcile_neon_schema.check_column_exists", return_value=True):
                with pytest.raises(PreconditionFailedError) as exc_info:
                    verify_preconditions(mock_conn)
                assert "column 'location_reports.resolution_notes' already exists" in str(exc_info.value)


def test_execute_reconciliation_rolls_back_on_error():
    """Verify entire transaction is rolled back if any DDL statement fails."""
    mock_conn = MagicMock()
    mock_cur = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cur

    # Simulate failure on 3rd statement
    mock_cur.execute.side_effect = [None, None, Exception("Syntax or connection error")]

    with pytest.raises(Exception) as exc_info:
        execute_reconciliation(mock_conn)

    assert "Syntax or connection error" in str(exc_info.value)
    mock_conn.rollback.assert_called_once()
    mock_conn.commit.assert_not_called()


def test_verify_postconditions_success():
    """Post-verification passes when all 14 tables, deep structure, and counts match."""
    mock_conn = MagicMock()
    all_14_tables = EXPECTED_BASELINE_TABLES + EXPECTED_MISSING_TABLES
    baseline = {
        "baseline_row_counts": {
            "users": 11,
            "locations": 15,
            "nodes": 27,
            "edges": 29,
            "user_credentials": 3,
            "user_sessions": 11,
            "user_identities": 2,
            "alembic_version": 1,
            "location_aliases": 0,
            "favorites": 0,
            "location_reports": 0,
        }
    }

    with patch("database.reconciliation.reconcile_neon_schema.get_current_alembic_revision", return_value=CANONICAL_TARGET_REVISION):
        with patch("database.reconciliation.reconcile_neon_schema.get_existing_tables", return_value=all_14_tables):
            with patch("database.reconciliation.reconcile_neon_schema.check_column_exists", return_value=True):
                with patch("database.reconciliation.reconcile_neon_schema.verify_table_columns_and_constraints"):
                    with patch("database.reconciliation.reconcile_neon_schema.get_table_row_counts", return_value=baseline["baseline_row_counts"]):
                        verify_postconditions(mock_conn, baseline)


def test_verify_table_columns_and_constraints_catches_missing_index():
    """Verify deep structural check raises error if an expected index is missing."""
    from database.reconciliation.reconcile_neon_schema import (
        verify_table_columns_and_constraints,
    )
    mock_conn = MagicMock()
    mock_cur = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cur

    # map_import_batches cols
    mib_cols = [
        ("id", "uuid", "NO"), ("source_provider", "varchar", "NO"), ("source_reference", "varchar", "YES"),
        ("description", "text", "YES"), ("status", "varchar", "NO"), ("total_records", "integer", "NO"),
        ("promoted_records", "integer", "NO"), ("rejected_records", "integer", "NO"),
        ("created_at", "timestamptz", "NO"), ("updated_at", "timestamptz", "NO"),
    ]
    # staged_locations cols
    sl_cols = [
        ("id",), ("batch_id",), ("source_provider",), ("external_element_type",),
        ("external_element_id",), ("source_url",), ("proposed_name",),
        ("proposed_location_type",), ("latitude",), ("longitude",), ("address_details",),
        ("verification_status",), ("canonical_location_id",), ("verified_by",),
    ]
    # assistance_requests cols
    ar_cols = [
        ("id",), ("requester_name",), ("contact_phone",), ("user_id",),
        ("current_location_id",), ("current_node_id",), ("target_location_id",),
        ("assistance_type",), ("description",), ("status",), ("assigned_to",), ("resolution_notes",),
    ]
    # Only return 2 indexes instead of 7
    mock_indexes = [("ix_map_import_batches_status",), ("ix_staged_locations_batch_id",)]

    mock_cur.fetchall.side_effect = [
        mib_cols,
        sl_cols,
        ar_cols,
        mock_indexes,
    ]

    with pytest.raises(SchemaVerificationError) as exc_info:
        verify_table_columns_and_constraints(mock_conn)
    assert "Missing expected indexes on reconciled tables" in str(exc_info.value)


def test_verify_postconditions_detects_data_loss():
    """Post-verification catches and raises error if any table row count drops."""
    mock_conn = MagicMock()
    all_14_tables = EXPECTED_BASELINE_TABLES + EXPECTED_MISSING_TABLES
    baseline = {
        "baseline_row_counts": {
            "users": 11,
            "locations": 15,
            "nodes": 27,
            "edges": 29,
            "user_credentials": 3,
            "user_sessions": 11,
            "user_identities": 2,
            "alembic_version": 1,
            "location_aliases": 0,
            "favorites": 0,
            "location_reports": 0,
        }
    }
    drifted_counts = dict(baseline["baseline_row_counts"])
    drifted_counts["users"] = 10  # 1 user lost!

    with patch("database.reconciliation.reconcile_neon_schema.get_current_alembic_revision", return_value=CANONICAL_TARGET_REVISION):
        with patch("database.reconciliation.reconcile_neon_schema.get_existing_tables", return_value=all_14_tables):
            with patch("database.reconciliation.reconcile_neon_schema.check_column_exists", return_value=True):
                with patch("database.reconciliation.reconcile_neon_schema.verify_table_columns_and_constraints"):
                    with patch("database.reconciliation.reconcile_neon_schema.get_table_row_counts", return_value=drifted_counts):
                        with pytest.raises(SchemaVerificationError) as exc_info:
                            verify_postconditions(mock_conn, baseline)
                        assert "Data integrity violation on table 'users'" in str(exc_info.value)
