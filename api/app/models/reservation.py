from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Reservation(Base):
    __tablename__ = "reservations"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    reference: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
    )

    guest_id: Mapped[int] = mapped_column(
        ForeignKey("guests.id"),
    )

    cottage_id: Mapped[int] = mapped_column(
        ForeignKey("cottages.id"),
    )

    room_id: Mapped[int | None] = mapped_column(
        ForeignKey("rooms.id"),
        nullable=True,
    )

    inquiry_id: Mapped[int | None] = mapped_column(
        ForeignKey("inquiries.id"),
        nullable=True,
    )

    source: Mapped[str] = mapped_column(
        String(50),
        default="manual",
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
    )

    check_in: Mapped[date] = mapped_column(
        Date,
    )

    check_out: Mapped[date] = mapped_column(
        Date,
    )

    guest_count: Mapped[int] = mapped_column(
        Integer,
    )

    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        default=0,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
    )