from decimal import Decimal

from sqlalchemy import Boolean, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Cottage(Base):
    __tablename__ = "cottages"

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
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    capacity: Mapped[int] = mapped_column(
        Integer,
        default=1,
    )

    base_rate: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        default=0,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="available",
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    map_x: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    map_y: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )