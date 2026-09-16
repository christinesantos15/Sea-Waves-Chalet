"""add room type reservation fields

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-09-16
"""

from alembic import op
import sqlalchemy as sa


revision = "f6a7b8c9d0e1"
down_revision = "e5f6a7b8c9d0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "reservations",
        "cottage_id",
        existing_type=sa.Integer(),
        nullable=True,
    )

    op.add_column(
        "reservations",
        sa.Column(
            "room_type_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.add_column(
        "reservations",
        sa.Column(
            "rate_plan",
            sa.String(length=30),
            nullable=True,
        ),
    )

    op.add_column(
        "reservations",
        sa.Column(
            "quoted_rate",
            sa.Numeric(
                precision=10,
                scale=2,
            ),
            nullable=True,
        ),
    )

    op.create_foreign_key(
        "fk_reservations_room_type_id_room_types",
        "reservations",
        "room_types",
        ["room_type_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_index(
        "ix_reservations_room_type_id",
        "reservations",
        ["room_type_id"],
        unique=False,
    )

    op.create_check_constraint(
        "ck_reservations_rate_plan",
        "reservations",
        (
            "rate_plan IS NULL OR "
            "rate_plan IN "
            "('with_breakfast', "
            "'without_breakfast')"
        ),
    )

    op.create_check_constraint(
        "ck_reservations_quoted_rate_nonnegative",
        "reservations",
        (
            "quoted_rate IS NULL OR "
            "quoted_rate >= 0"
        ),
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_reservations_quoted_rate_nonnegative",
        "reservations",
        type_="check",
    )

    op.drop_constraint(
        "ck_reservations_rate_plan",
        "reservations",
        type_="check",
    )

    op.drop_index(
        "ix_reservations_room_type_id",
        table_name="reservations",
    )

    op.drop_constraint(
        "fk_reservations_room_type_id_room_types",
        "reservations",
        type_="foreignkey",
    )

    op.drop_column(
        "reservations",
        "quoted_rate",
    )

    op.drop_column(
        "reservations",
        "rate_plan",
    )

    op.drop_column(
        "reservations",
        "room_type_id",
    )

    op.alter_column(
        "reservations",
        "cottage_id",
        existing_type=sa.Integer(),
        nullable=False,
    )
