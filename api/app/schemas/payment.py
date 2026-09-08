from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class OperatorReservationAmountUpdate(BaseModel):
    total_amount: Decimal = Field(
        ge=Decimal("0.00"),
    )


class OperatorPaymentCreate(BaseModel):
    amount: Decimal = Field(
        gt=Decimal("0.00"),
    )

    payment_type: Literal[
        "deposit",
        "balance",
        "full",
        "other",
    ]

    payment_method: str | None = Field(
        default=None,
        max_length=50,
    )

    reference: str | None = Field(
        default=None,
        max_length=255,
    )

    notes: str | None = None


class OperatorPaymentResponse(BaseModel):
    id: int
    reservation_id: int

    amount: Decimal

    payment_type: str
    payment_method: str | None

    status: str

    reference: str | None
    notes: str | None

    paid_at: datetime | None
    created_at: datetime


class OperatorPaymentSummaryResponse(BaseModel):
    reservation_id: int
    reservation_reference: str

    total_amount: Decimal
    paid_amount: Decimal
    balance: Decimal

    payment_status: Literal[
        "unpriced",
        "unpaid",
        "partial",
        "paid",
    ]

    payments: list[OperatorPaymentResponse]