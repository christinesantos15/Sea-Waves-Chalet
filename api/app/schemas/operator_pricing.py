from decimal import Decimal
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class RoomRateResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    room_type_id: int

    rate_plan: Literal[
        "with_breakfast",
        "without_breakfast",
    ]

    amount: Decimal
    is_active: bool


class RoomTypePricingResponse(BaseModel):
    id: int
    code: str
    name: str
    capacity: int
    is_active: bool

    rates: list[
        RoomRateResponse
    ]


class RoomTypeUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        max_length=100,
    )

    capacity: int | None = Field(
        default=None,
        ge=1,
    )

    is_active: bool | None = None


class RoomRateUpdate(BaseModel):
    amount: Decimal | None = Field(
        default=None,
        ge=0,
    )

    is_active: bool | None = None


class ExtraChargeResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    code: str
    name: str
    amount: Decimal
    is_active: bool


class ExtraChargeUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        max_length=100,
    )

    amount: Decimal | None = Field(
        default=None,
        ge=0,
    )

    is_active: bool | None = None
