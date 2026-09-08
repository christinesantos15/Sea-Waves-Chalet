"""add role auth tables

Revision ID: 9c2e4a6b8d10
Revises: 7f1c2a3b4d5e
Create Date: 2026-09-08
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = (
    "9c2e4a6b8d10"
)

down_revision: str | None = (
    "7f1c2a3b4d5e"
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
        "users",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "username",
            sa.String(
                length=100
            ),
            nullable=False,
        ),

        sa.Column(
            "password_hash",
            sa.String(
                length=512
            ),
            nullable=False,
        ),

        sa.Column(
            "role",
            sa.String(
                length=30
            ),
            nullable=False,
        ),

        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(
                timezone=True
            ),
            nullable=False,
        ),

        sa.CheckConstraint(
            "role IN "
            "('owner', 'operator', 'staff')",
            name=(
                "ck_users_role"
            ),
        ),

        sa.PrimaryKeyConstraint(
            "id"
        ),

        sa.UniqueConstraint(
            "username"
        ),
    )

    op.create_index(
        "ix_users_username",
        "users",
        [
            "username",
        ],
        unique=True,
    )

    op.create_index(
        "ix_users_role",
        "users",
        [
            "role",
        ],
        unique=False,
    )


    op.create_table(
        "auth_sessions",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "token_hash",
            sa.String(
                length=64
            ),
            nullable=False,
        ),

        sa.Column(
            "expires_at",
            sa.DateTime(
                timezone=True
            ),
            nullable=False,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(
                timezone=True
            ),
            nullable=False,
        ),

        sa.Column(
            "revoked_at",
            sa.DateTime(
                timezone=True
            ),
            nullable=True,
        ),

        sa.ForeignKeyConstraint(
            [
                "user_id",
            ],
            [
                "users.id",
            ],
            ondelete="CASCADE",
        ),

        sa.PrimaryKeyConstraint(
            "id"
        ),

        sa.UniqueConstraint(
            "token_hash"
        ),
    )

    op.create_index(
        "ix_auth_sessions_user_id",
        "auth_sessions",
        [
            "user_id",
        ],
        unique=False,
    )

    op.create_index(
        "ix_auth_sessions_token_hash",
        "auth_sessions",
        [
            "token_hash",
        ],
        unique=True,
    )

    op.create_index(
        "ix_auth_sessions_expires_at",
        "auth_sessions",
        [
            "expires_at",
        ],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_auth_sessions_expires_at",
        table_name="auth_sessions",
    )

    op.drop_index(
        "ix_auth_sessions_token_hash",
        table_name="auth_sessions",
    )

    op.drop_index(
        "ix_auth_sessions_user_id",
        table_name="auth_sessions",
    )

    op.drop_table(
        "auth_sessions"
    )

    op.drop_index(
        "ix_users_role",
        table_name="users",
    )

    op.drop_index(
        "ix_users_username",
        table_name="users",
    )

    op.drop_table(
        "users"
    )