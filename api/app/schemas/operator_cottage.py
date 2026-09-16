from decimal import Decimal
from typing import Literal

from pydantic import (
    BaseModel,
    Field,
)

from app.schemas.cottage import (
    CottageDetailResponse,
)
from app.schemas.cottage_media import (
    CottageMediaResponse,
)


class OperatorCottageUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        max_length=100,
    )

    description: str | None = None

    capacity: int | None = Field(
        default=None,
        ge=1,
    )

    base_rate: Decimal | None = Field(
        default=None,
        ge=0,
    )

    status: str | None = Field(
        default=None,
        max_length=30,
    )

    is_active: bool | None = None


class CottageMediaCreate(BaseModel):
    media_type: Literal[
        "image",
        "video",
    ]

    url: str = Field(
        min_length=1,
        max_length=1000,
    )

    alt_text: str | None = Field(
        default=None,
        max_length=255,
    )

    caption: str | None = None

    sort_order: int = Field(
        default=0,
        ge=0,
    )

    is_cover: bool = False
    is_active: bool = True


class CottageMediaUpdate(BaseModel):
    media_type: Literal[
        "image",
        "video",
    ] | None = None

    url: str | None = Field(
        default=None,
        min_length=1,
        max_length=1000,
    )

    alt_text: str | None = Field(
        default=None,
        max_length=255,
    )

    caption: str | None = None

    sort_order: int | None = Field(
        default=None,
        ge=0,
    )

    is_cover: bool | None = None
    is_active: bool | None = None


class OperatorCottageDetail(
    CottageDetailResponse
):
    pass


class OperatorCottageMediaResponse(
    CottageMediaResponse
):
    pass
