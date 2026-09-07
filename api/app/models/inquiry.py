from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Inquiry(Base):
    __tablename__ = "inquiries"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    guest_id: Mapped[int | None] = mapped_column(
        ForeignKey("guests.id"),
        nullable=True,
    )

    source: Mapped[str] = mapped_column(
        String(50),
        default="manual",
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="new",
    )

    check_in: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    check_out: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    guest_count: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
    )