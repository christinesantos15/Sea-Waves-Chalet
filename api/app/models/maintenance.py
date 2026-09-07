from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class MaintenanceIssue(Base):
    __tablename__ = "maintenance_issues"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    cottage_id: Mapped[int | None] = mapped_column(
        ForeignKey("cottages.id"),
        nullable=True,
    )

    location: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    title: Mapped[str] = mapped_column(
        String(150),
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    priority: Mapped[str] = mapped_column(
        String(30),
        default="normal",
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="open",
    )

    reported_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
    )

    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )