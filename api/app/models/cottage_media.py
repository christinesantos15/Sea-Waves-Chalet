from sqlalchemy import (
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.database import Base


class CottageMedia(Base):
    __tablename__ = "cottage_media"

    __table_args__ = (
        CheckConstraint(
            "media_type IN ('image', 'video')",
            name="ck_cottage_media_type",
        ),
        CheckConstraint(
            "sort_order >= 0",
            name="ck_cottage_media_sort_order",
        ),
        Index(
            "uq_cottage_media_active_cover",
            "cottage_id",
            unique=True,
            postgresql_where=text(
                "is_cover IS TRUE "
                "AND is_active IS TRUE"
            ),
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    cottage_id: Mapped[int] = mapped_column(
        ForeignKey(
            "cottages.id",
            ondelete="CASCADE",
        ),
        index=True,
    )

    media_type: Mapped[str] = mapped_column(
        String(20),
    )

    url: Mapped[str] = mapped_column(
        String(1000),
    )

    alt_text: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    caption: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    sort_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    is_cover: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )
