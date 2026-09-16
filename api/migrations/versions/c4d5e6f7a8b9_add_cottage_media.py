"""add cottage media

Revision ID: c4d5e6f7a8b9
Revises: 9c2e4a6b8d10
Create Date: 2026-09-16
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = (
    "c4d5e6f7a8b9"
)

down_revision: str | None = (
    "9c2e4a6b8d10"
)

branch_labels: (
    str
    | Sequence[str]
    | None
) = None

depends_on: (
    str
    | Sequence[str]
    | None
) = None


def upgrade() -> None:
    op.create_table(
        "cottage_media",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "cottage_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "media_type",
            sa.String(
                length=20
            ),
            nullable=False,
        ),

        sa.Column(
            "url",
            sa.String(
                length=1000
            ),
            nullable=False,
        ),

        sa.Column(
            "alt_text",
            sa.String(
                length=255
            ),
            nullable=True,
        ),

        sa.Column(
            "caption",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "sort_order",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "is_cover",
            sa.Boolean(),
            nullable=False,
        ),

        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
        ),

        sa.CheckConstraint(
            "media_type IN "
            "('image', 'video')",
            name=(
                "ck_cottage_media_type"
            ),
        ),

        sa.CheckConstraint(
            "sort_order >= 0",
            name=(
                "ck_cottage_media_sort_order"
            ),
        ),

        sa.ForeignKeyConstraint(
            [
                "cottage_id",
            ],
            [
                "cottages.id",
            ],
            ondelete="CASCADE",
        ),

        sa.PrimaryKeyConstraint(
            "id"
        ),
    )

    op.create_index(
        "ix_cottage_media_cottage_id",
        "cottage_media",
        [
            "cottage_id",
        ],
        unique=False,
    )

    op.create_index(
        "uq_cottage_media_active_cover",
        "cottage_media",
        [
            "cottage_id",
        ],
        unique=True,
        postgresql_where=sa.text(
            "is_cover IS TRUE "
            "AND is_active IS TRUE"
        ),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_cottage_media_active_cover",
        table_name="cottage_media",
    )

    op.drop_index(
        "ix_cottage_media_cottage_id",
        table_name="cottage_media",
    )

    op.drop_table(
        "cottage_media"
    )
