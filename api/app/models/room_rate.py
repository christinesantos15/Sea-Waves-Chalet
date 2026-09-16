from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.database import Base


class RoomRate(Base):
    __tablename__ = "room_rates"

    __table_args__ = (
        UniqueConstraint(
            "room_type_id",
            "rate_plan",
            name=(
                "uq_room_rates_"
                "room_type_plan"
            ),
        ),
        CheckConstraint(
            "rate_plan IN "
            "('with_breakfast', "
            "'without_breakfast')",
            name=(
                "ck_room_rates_"
                "rate_plan"
            ),
        ),
        CheckConstraint(
            "amount >= 0",
            name=(
                "ck_room_rates_amount"
            ),
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    room_type_id: Mapped[int] = mapped_column(
        ForeignKey(
            "room_types.id",
            ondelete="CASCADE",
        ),
        index=True,
    )

    rate_plan: Mapped[str] = mapped_column(
        String(30),
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )
