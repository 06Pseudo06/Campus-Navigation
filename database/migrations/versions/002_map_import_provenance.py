"""Create map import batches and staged locations tables

Revision ID: 002_map_import_provenance
Revises: 001_initial_schema_v1
Create Date: 2026-11-01 21:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "002_map_import_provenance"
down_revision: Union[str, None] = "001_initial_schema_v1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. map_import_batches
    op.create_table(
        "map_import_batches",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("source_provider", sa.String(length=50), nullable=False),
        sa.Column("source_reference", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column("total_records", sa.Integer(), server_default="0", nullable=False),
        sa.Column("promoted_records", sa.Integer(), server_default="0", nullable=False),
        sa.Column("rejected_records", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "status IN ('pending', 'processing', 'completed', 'failed')",
            name="ck_map_import_batches_status",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_map_import_batches"),
    )
    op.create_index("ix_map_import_batches_status", "map_import_batches", ["status"])

    # 2. staged_locations
    op.create_table(
        "staged_locations",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("batch_id", sa.Uuid(), nullable=False),
        sa.Column("source_provider", sa.String(length=50), nullable=False),
        sa.Column("external_element_type", sa.String(length=40), nullable=False),
        sa.Column("external_element_id", sa.String(length=100), nullable=False),
        sa.Column("source_url", sa.String(length=500), nullable=True),
        sa.Column("original_tags", sa.JSON(), nullable=True),
        sa.Column("proposed_name", sa.String(length=180), nullable=True),
        sa.Column("proposed_location_type", sa.String(length=40), server_default="building", nullable=False),
        sa.Column("latitude", sa.Float(precision=53), nullable=True),
        sa.Column("longitude", sa.Float(precision=53), nullable=True),
        sa.Column("address_details", sa.Text(), nullable=True),
        sa.Column("verification_status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column("canonical_location_id", sa.Uuid(), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("verified_by", sa.Uuid(), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "verification_status IN ('discovered', 'pending', 'approved', 'rejected')",
            name="ck_staged_locations_verification_status",
        ),
        sa.CheckConstraint(
            "latitude IS NULL OR (latitude >= -90.0 AND latitude <= 90.0)",
            name="ck_staged_locations_latitude_range",
        ),
        sa.CheckConstraint(
            "longitude IS NULL OR (longitude >= -180.0 AND longitude <= 180.0)",
            name="ck_staged_locations_longitude_range",
        ),
        sa.ForeignKeyConstraint(["batch_id"], ["map_import_batches.id"], name="fk_staged_locations_batch_id", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["canonical_location_id"], ["locations.id"], name="fk_staged_locations_canonical_id", ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["verified_by"], ["users.id"], name="fk_staged_locations_verified_by", ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name="pk_staged_locations"),
        sa.UniqueConstraint("source_provider", "external_element_id", name="uq_staged_locations_provider_ext_id"),
    )
    op.create_index("ix_staged_locations_batch_id", "staged_locations", ["batch_id"])
    op.create_index("ix_staged_locations_status", "staged_locations", ["verification_status"])
    op.create_index("ix_staged_locations_canonical_id", "staged_locations", ["canonical_location_id"])


def downgrade() -> None:
    op.drop_table("staged_locations")
    op.drop_table("map_import_batches")
