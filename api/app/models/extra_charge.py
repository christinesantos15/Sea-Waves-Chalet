from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Integer,
    Numeric,
    String,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.database import Base


class ExtraCharge(Base):
    __tablename__ = "extra_charges"

    __table_args__ = (
        CheckConstraint(
            "amount >= 0",
            name=(
                "ck_extra_charges_amount"
            ),
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )
