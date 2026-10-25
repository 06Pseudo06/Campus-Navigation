"""Tests for Alembic migration definitions and revision chain."""

import os
from alembic.config import Config
from alembic.script import ScriptDirectory
from alembic import command
from sqlalchemy import create_engine, inspect


def test_migration_revision_chain():
    """Verify that Alembic revision chain has a single unambiguous head revision."""
    config = Config("alembic.ini")
    script = ScriptDirectory.from_config(config)

    heads = script.get_heads()
    assert len(heads) == 1
    head_rev = heads[0]
    assert head_rev == "001_initial_schema_v1"

    revision = script.get_revision(head_rev)
    assert revision is not None
    assert revision.down_revision is None


def test_migration_upgrade_and_downgrade_on_disposable_db(tmp_path):
    """Test full upgrade, downgrade, and re-upgrade on an isolated disposable SQLite test DB."""
    test_db_path = tmp_path / "migration_test.db"
    test_db_url = f"sqlite:///{test_db_path}"

    config = Config("alembic.ini")
    config.set_main_option("sqlalchemy.url", test_db_url)

    # Set environment variable so env.py connects to disposable test DB
    old_env = os.environ.get("ALEMBIC_DATABASE_URL")
    os.environ["ALEMBIC_DATABASE_URL"] = test_db_url

    try:
        # Upgrade to head
        command.upgrade(config, "head")

        engine = create_engine(test_db_url)
        inspector = inspect(engine)
        tables = set(inspector.get_table_names())

        expected_tables = {
            "alembic_version",
            "users",
            "user_identities",
            "locations",
            "location_aliases",
            "nodes",
            "edges",
            "favorites",
            "location_reports",
        }
        assert expected_tables.issubset(tables)

        # Downgrade to base
        command.downgrade(config, "base")

        inspector = inspect(engine)
        tables_after_downgrade = set(inspector.get_table_names())
        # All schema tables should be removed
        for tbl in expected_tables - {"alembic_version"}:
            assert tbl not in tables_after_downgrade

        # Re-upgrade to head cleanly
        command.upgrade(config, "head")
        inspector = inspect(engine)
        re_tables = set(inspector.get_table_names())
        assert expected_tables.issubset(re_tables)
        engine.dispose()
    finally:
        if old_env is not None:
            os.environ["ALEMBIC_DATABASE_URL"] = old_env
        else:
            os.environ.pop("ALEMBIC_DATABASE_URL", None)
