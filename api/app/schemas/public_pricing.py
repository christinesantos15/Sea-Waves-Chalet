from decimal import Decimal
from typing import Literal

from pydantic import BaseModel


class PublicRoomRateResponse(BaseModel):
    rate_plan: Literal[
        "with_breakfast",
        "without_breakfast",
    ]

    amount: Decimal


class PublicRoomTypePricingResponse(BaseModel):
    id: int
    code: str
    name: str
    capacity: int

    rates: list[
        PublicRoomRateResponse
    ]


class PublicExtraChargeResponse(BaseModel):
    id: int
    code: str
    name: str
    amount: Decimal
