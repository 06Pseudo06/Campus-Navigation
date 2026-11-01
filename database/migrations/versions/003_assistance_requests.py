"""Create assistance_requests table

Revision ID: 003_assistance_requests
Revises: 002_map_import_provenance
Create Date: 2026-11-01 21:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "003_assistance_requests"
down_revision: Union[str, None] = "002_map_import_provenance"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "assistance_requests",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("requester_name", sa.String(length=120), nullable=True),
        sa.Column("contact_phone", sa.String(length=20), nullable=True),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("current_location_id", sa.Uuid(), nullable=True),
        sa.Column("current_node_id", sa.Uuid(), nullable=True),
        sa.Column("target_location_id", sa.Uuid(), nullable=True),
        sa.Column("assistance_type", sa.String(length=40), server_default="lost", nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column("assigned_to", sa.Uuid(), nullable=True),
        sa.Column("resolution_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "status IN ('pending', 'acknowledged', 'assigned', 'resolved', 'cancelled')",
            name="ck_assistance_requests_status",
        ),
        sa.ForeignKeyConstraint(["assigned_to"], ["users.id"], name="fk_assistance_requests_assigned_to", ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["current_location_id"], ["locations.id"], name="fk_assistance_requests_current_location_id", ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["current_node_id"], ["nodes.id"], name="fk_assistance_requests_current_node_id", ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["target_location_id"], ["locations.id"], name="fk_assistance_requests_target_location_id", ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_assistance_requests_user_id", ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name="pk_assistance_requests"),
    )
    op.create_index("ix_assistance_requests_status", "assistance_requests", ["status"])
    op.create_index("ix_assistance_requests_created_at", "assistance_requests", ["created_at"])
    op.create_index("ix_assistance_requests_user_id", "assistance_requests", ["user_id"])


def downgrade() -> None:
    op.drop_table("assistance_requests")
