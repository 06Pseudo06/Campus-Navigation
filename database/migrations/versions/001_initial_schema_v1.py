"""Create initial schema v1 tables

Revision ID: 001_initial_schema_v1
Revises:
Create Date: 2026-10-25 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "001_initial_schema_v1"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("full_name", sa.String(length=120), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("role", sa.String(length=20), server_default="student", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("role IN ('student', 'admin', 'moderator')", name="ck_users_role_valid"),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
        sa.UniqueConstraint("email", name="uq_users_email"),
        sa.UniqueConstraint("phone", name="uq_users_phone"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_phone", "users", ["phone"])

    # 2. user_identities
    op.create_table(
        "user_identities",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("provider", sa.String(length=30), nullable=False),
        sa.Column("provider_subject", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_user_identities_user_id", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="pk_user_identities"),
        sa.UniqueConstraint("provider", "provider_subject", name="uq_user_identities_provider_subject"),
    )
    op.create_index("ix_user_identities_user_id", "user_identities", ["user_id"])

    # 3. locations
    op.create_table(
        "locations",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("parent_id", sa.Uuid(), nullable=True),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column("slug", sa.String(length=200), nullable=False),
        sa.Column("location_type", sa.String(length=40), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("latitude", sa.Float(precision=53), nullable=True),
        sa.Column("longitude", sa.Float(precision=53), nullable=True),
        sa.Column("address_details", sa.Text(), nullable=True),
        sa.Column("is_verified", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("parent_id IS NULL OR parent_id != id", name="ck_locations_prevent_self_parent"),
        sa.CheckConstraint("latitude IS NULL OR (latitude >= -90.0 AND latitude <= 90.0)", name="ck_locations_latitude_range"),
        sa.CheckConstraint("longitude IS NULL OR (longitude >= -180.0 AND longitude <= 180.0)", name="ck_locations_longitude_range"),
        sa.ForeignKeyConstraint(["parent_id"], ["locations.id"], name="fk_locations_parent_id", ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name="pk_locations"),
        sa.UniqueConstraint("slug", name="uq_locations_slug"),
    )
    op.create_index("ix_locations_parent_id", "locations", ["parent_id"])
    op.create_index("ix_locations_location_type", "locations", ["location_type"])
    op.create_index("ix_locations_is_active", "locations", ["is_active"])
    op.create_index("ix_locations_slug", "locations", ["slug"])

    # 4. location_aliases
    op.create_table(
        "location_aliases",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("location_id", sa.Uuid(), nullable=False),
        sa.Column("alias", sa.String(length=180), nullable=False),
        sa.Column("normalized_alias", sa.String(length=180), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["location_id"], ["locations.id"], name="fk_location_aliases_location_id", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="pk_location_aliases"),
        sa.UniqueConstraint("location_id", "normalized_alias", name="uq_location_aliases_location_normalized"),
    )
    op.create_index("ix_location_aliases_normalized_alias", "location_aliases", ["normalized_alias"])

    # 5. nodes
    op.create_table(
        "nodes",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("location_id", sa.Uuid(), nullable=True),
        sa.Column("node_type", sa.String(length=40), nullable=False),
        sa.Column("latitude", sa.Float(precision=53), nullable=False),
        sa.Column("longitude", sa.Float(precision=53), nullable=False),
        sa.Column("is_accessible", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("latitude >= -90.0 AND latitude <= 90.0", name="ck_nodes_latitude_range"),
        sa.CheckConstraint("longitude >= -180.0 AND longitude <= 180.0", name="ck_nodes_longitude_range"),
        sa.ForeignKeyConstraint(["location_id"], ["locations.id"], name="fk_nodes_location_id", ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name="pk_nodes"),
    )
    op.create_index("ix_nodes_location_id", "nodes", ["location_id"])
    op.create_index("ix_nodes_is_active", "nodes", ["is_active"])

    # 6. edges
    op.create_table(
        "edges",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("source_node_id", sa.Uuid(), nullable=False),
        sa.Column("target_node_id", sa.Uuid(), nullable=False),
        sa.Column("distance_m", sa.Float(precision=53), nullable=False),
        sa.Column("path_type", sa.String(length=40), server_default="footpath", nullable=False),
        sa.Column("is_bidirectional", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("is_accessible", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("source_node_id != target_node_id", name="ck_edges_prevent_self_loops"),
        sa.CheckConstraint("distance_m > 0", name="ck_edges_positive_distance"),
        sa.ForeignKeyConstraint(["source_node_id"], ["nodes.id"], name="fk_edges_source_node_id", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["target_node_id"], ["nodes.id"], name="fk_edges_target_node_id", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="pk_edges"),
        sa.UniqueConstraint("source_node_id", "target_node_id", "path_type", name="uq_edges_source_target_path"),
    )
    op.create_index("ix_edges_source_active", "edges", ["source_node_id", "is_active"])
    op.create_index("ix_edges_target_active", "edges", ["target_node_id", "is_active"])

    # 7. favorites
    op.create_table(
        "favorites",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("location_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["location_id"], ["locations.id"], name="fk_favorites_location_id", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_favorites_user_id", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "location_id", name="pk_favorites"),
    )
    op.create_index("ix_favorites_user_id", "favorites", ["user_id"])
    op.create_index("ix_favorites_location_id", "favorites", ["location_id"])

    # 8. location_reports
    op.create_table(
        "location_reports",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("reporter_id", sa.Uuid(), nullable=True),
        sa.Column("location_id", sa.Uuid(), nullable=True),
        sa.Column("node_id", sa.Uuid(), nullable=True),
        sa.Column("edge_id", sa.Uuid(), nullable=True),
        sa.Column("report_type", sa.String(length=40), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("location_id IS NOT NULL OR node_id IS NOT NULL OR edge_id IS NOT NULL", name="ck_location_reports_target_required"),
        sa.CheckConstraint("status IN ('pending', 'reviewing', 'resolved', 'rejected')", name="ck_location_reports_status_valid"),
        sa.ForeignKeyConstraint(["edge_id"], ["edges.id"], name="fk_location_reports_edge_id", ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["location_id"], ["locations.id"], name="fk_location_reports_location_id", ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["node_id"], ["nodes.id"], name="fk_location_reports_node_id", ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["reporter_id"], ["users.id"], name="fk_location_reports_reporter_id", ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name="pk_location_reports"),
    )
    op.create_index("ix_location_reports_status", "location_reports", ["status"])
    op.create_index("ix_location_reports_reporter_id", "location_reports", ["reporter_id"])
    op.create_index("ix_location_reports_location_id", "location_reports", ["location_id"])
    op.create_index("ix_location_reports_node_id", "location_reports", ["node_id"])
    op.create_index("ix_location_reports_edge_id", "location_reports", ["edge_id"])


def downgrade() -> None:
    # Drop tables in reverse dependency order
    op.drop_table("location_reports")
    op.drop_table("favorites")
    op.drop_table("edges")
    op.drop_table("nodes")
    op.drop_table("location_aliases")
    op.drop_table("locations")
    op.drop_table("user_identities")
    op.drop_table("users")
