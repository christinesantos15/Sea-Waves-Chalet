from sqlalchemy import (
    Boolean,
    Integer,
    String,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.database import Base


class RoomType(Base):
    __tablename__ = "room_types"

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

    capacity: Mapped[int] = mapped_column(
        Integer,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )
