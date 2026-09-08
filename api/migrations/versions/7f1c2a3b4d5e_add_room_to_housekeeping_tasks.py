"""add room to housekeeping tasks

Revision ID: 7f1c2a3b4d5e
Revises: 0bcdbba11e6b
Create Date: 2026-09-08
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "7f1c2a3b4d5e"
down_revision: str | None = "0bcdbba11e6b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "housekeeping_tasks",
        sa.Column(
            "room_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_foreign_key(
        "fk_housekeeping_tasks_room_id_rooms",
        "housekeeping_tasks",
        "rooms",
        ["room_id"],
        ["id"],
    )

    op.create_index(
        "ix_housekeeping_tasks_room_id",
        "housekeeping_tasks",
        ["room_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_housekeeping_tasks_room_id",
        table_name="housekeeping_tasks",
    )

    op.drop_constraint(
        "fk_housekeeping_tasks_room_id_rooms",
        "housekeeping_tasks",
        type_="foreignkey",
    )

    op.drop_column(
        "housekeeping_tasks",
        "room_id",
    )