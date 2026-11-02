"""Add user_credentials table for email/password authentication

Revision ID: 002_add_user_credentials
Revises: 001_initial_schema_v1
Create Date: 2026-11-02 02:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "002_add_user_credentials"
down_revision: Union[str, None] = "001_initial_schema_v1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the user_credentials table and its associated constraints."""
    op.create_table(
        "user_credentials",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "password_hash",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name="pk_user_credentials"),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_user_credentials_user_id",
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint("user_id", name="uq_user_credentials_user_id"),
    )
    op.create_index(
        "ix_user_credentials_user_id",
        "user_credentials",
        ["user_id"],
        unique=True,
    )


def downgrade() -> None:
    """Drop the user_credentials table and its index."""
    op.drop_index("ix_user_credentials_user_id", table_name="user_credentials")
    op.drop_table("user_credentials")
