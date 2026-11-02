"""Add resolution_notes to location_reports table

Revision ID: 004_report_resolution_notes
Revises: 003_assistance_requests
Create Date: 2026-11-01 21:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "004_report_resolution_notes"
down_revision: Union[str, None] = "003_assistance_requests"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("location_reports", sa.Column("resolution_notes", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("location_reports", "resolution_notes")
