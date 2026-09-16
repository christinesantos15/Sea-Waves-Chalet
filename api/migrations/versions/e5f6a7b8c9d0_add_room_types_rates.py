"""add room types rates and extra charges

Revision ID: e5f6a7b8c9d0
Revises: c4d5e6f7a8b9
Create Date: 2026-09-16
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "e5f6a7b8c9d0"
down_revision: str | None = (
    "c4d5e6f7a8b9"
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
        "room_types",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "code",
            sa.String(length=50),
            nullable=False,
        ),

        sa.Column(
            "name",
            sa.String(length=100),
            nullable=False,
        ),

        sa.Column(
            "capacity",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
        ),

        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
        sa.UniqueConstraint("name"),
    )

    op.create_index(
        "ix_room_types_code",
        "room_types",
        ["code"],
        unique=True,
    )

    op.create_table(
        "room_rates",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "room_type_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "rate_plan",
            sa.String(length=30),
            nullable=False,
        ),

        sa.Column(
            "amount",
            sa.Numeric(
                precision=10,
                scale=2,
            ),
            nullable=False,
        ),

        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
        ),

        sa.CheckConstraint(
            "rate_plan IN "
            "('with_breakfast', "
            "'without_breakfast')",
            name=(
                "ck_room_rates_rate_plan"
            ),
        ),

        sa.CheckConstraint(
            "amount >= 0",
            name=(
                "ck_room_rates_amount"
            ),
        ),

        sa.ForeignKeyConstraint(
            ["room_type_id"],
            ["room_types.id"],
            ondelete="CASCADE",
        ),

        sa.PrimaryKeyConstraint("id"),

        sa.UniqueConstraint(
            "room_type_id",
            "rate_plan",
            name=(
                "uq_room_rates_"
                "room_type_plan"
            ),
        ),
    )

    op.create_index(
        "ix_room_rates_room_type_id",
        "room_rates",
        ["room_type_id"],
        unique=False,
    )

    op.create_table(
        "extra_charges",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "code",
            sa.String(length=50),
            nullable=False,
        ),

        sa.Column(
            "name",
            sa.String(length=100),
            nullable=False,
        ),

        sa.Column(
            "amount",
            sa.Numeric(
                precision=10,
                scale=2,
            ),
            nullable=False,
        ),

        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
        ),

        sa.CheckConstraint(
            "amount >= 0",
            name=(
                "ck_extra_charges_amount"
            ),
        ),

        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
        sa.UniqueConstraint("name"),
    )

    op.create_index(
        "ix_extra_charges_code",
        "extra_charges",
        ["code"],
        unique=True,
    )

    op.add_column(
        "rooms",
        sa.Column(
            "room_type_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_foreign_key(
        "fk_rooms_room_type_id",
        "rooms",
        "room_types",
        ["room_type_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_index(
        "ix_rooms_room_type_id",
        "rooms",
        ["room_type_id"],
        unique=False,
    )

    room_types = sa.table(
        "room_types",
        sa.column("code", sa.String),
        sa.column("name", sa.String),
        sa.column("capacity", sa.Integer),
        sa.column("is_active", sa.Boolean),
    )

    op.bulk_insert(
        room_types,
        [
            {
                "code": "couple",
                "name": "Couple Room",
                "capacity": 2,
                "is_active": True,
            },
            {
                "code": "budget",
                "name": "Budget Room",
                "capacity": 4,
                "is_active": True,
            },
            {
                "code": "triple",
                "name": "Triple Room",
                "capacity": 3,
                "is_active": True,
            },
            {
                "code": "quadruplets",
                "name": "Quadruplets Room",
                "capacity": 4,
                "is_active": True,
            },
            {
                "code": "double_double",
                "name": "Double-Double Room",
                "capacity": 4,
                "is_active": True,
            },
            {
                "code": "pentagon",
                "name": "Pentagon Room",
                "capacity": 5,
                "is_active": True,
            },
            {
                "code": "decagon",
                "name": "Decagon Room",
                "capacity": 10,
                "is_active": True,
            },
            {
                "code": "family",
                "name": "Family Room",
                "capacity": 4,
                "is_active": True,
            },
        ],
    )

    bind = op.get_bind()

    type_ids = dict(
        bind.execute(
            sa.text(
                "SELECT code, id "
                "FROM room_types"
            )
        ).all()
    )

    rates = sa.table(
        "room_rates",
        sa.column(
            "room_type_id",
            sa.Integer,
        ),
        sa.column(
            "rate_plan",
            sa.String,
        ),
        sa.column(
            "amount",
            sa.Numeric,
        ),
        sa.column(
            "is_active",
            sa.Boolean,
        ),
    )

    pricing = {
        "couple": (1950, 1750),
        "budget": (2750, 2350),
        "triple": (2800, 2400),
        "quadruplets": (3000, 2600),
        "double_double": (3800, 3300),
        "pentagon": (3850, 3300),
        "decagon": (5500, 4650),
        "family": (5500, 4900),
    }

    rate_rows = []

    for code, (
        with_breakfast,
        without_breakfast,
    ) in pricing.items():
        rate_rows.extend(
            [
                {
                    "room_type_id":
                        type_ids[code],
                    "rate_plan":
                        "with_breakfast",
                    "amount":
                        with_breakfast,
                    "is_active":
                        True,
                },
                {
                    "room_type_id":
                        type_ids[code],
                    "rate_plan":
                        "without_breakfast",
                    "amount":
                        without_breakfast,
                    "is_active":
                        True,
                },
            ]
        )

    op.bulk_insert(
        rates,
        rate_rows,
    )

    extra_charges = sa.table(
        "extra_charges",
        sa.column("code", sa.String),
        sa.column("name", sa.String),
        sa.column("amount", sa.Numeric),
        sa.column("is_active", sa.Boolean),
    )

    op.bulk_insert(
        extra_charges,
        [
            {
                "code": "alcoholic_drinks",
                "name": (
                    "Alcoholic Drinks Charge"
                ),
                "amount": 350,
                "is_active": True,
            },
            {
                "code": "electrical_appliances",
                "name": (
                    "Electrical Appliances"
                ),
                "amount": 350,
                "is_active": True,
            },
            {
                "code": "pet",
                "name": "Pet Charge",
                "amount": 300,
                "is_active": True,
            },
        ],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_rooms_room_type_id",
        table_name="rooms",
    )

    op.drop_constraint(
        "fk_rooms_room_type_id",
        "rooms",
        type_="foreignkey",
    )

    op.drop_column(
        "rooms",
        "room_type_id",
    )

    op.drop_index(
        "ix_extra_charges_code",
        table_name="extra_charges",
    )

    op.drop_table(
        "extra_charges"
    )

    op.drop_index(
        "ix_room_rates_room_type_id",
        table_name="room_rates",
    )

    op.drop_table(
        "room_rates"
    )

    op.drop_index(
        "ix_room_types_code",
        table_name="room_types",
    )

    op.drop_table(
        "room_types"
    )
