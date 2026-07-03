"""Add description to transactions and comment to ratings

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-28
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add optional description to transactions
    op.add_column(
        "transactions",
        sa.Column("description", sa.Text(), nullable=True,
                  comment="Free-text description of the service rendered."),
    )

    # Make sub_category_id nullable (optional during MVP — description replaces it)
    op.alter_column("transactions", "sub_category_id", nullable=True)

    # Add optional comment to ratings
    op.add_column(
        "ratings",
        sa.Column("comment", sa.Text(), nullable=True,
                  comment="Optional free-text comment from the customer."),
    )


def downgrade() -> None:
    op.drop_column("transactions", "description")
    op.alter_column("transactions", "sub_category_id", nullable=False)
    op.drop_column("ratings", "comment")
