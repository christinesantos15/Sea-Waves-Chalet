from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class CustomerReservationCreate(BaseModel):
    cottage_id: int
    room_id: int

    check_in: date
    check_out: date

    guest_count: int = Field(ge=1)

    full_name: str = Field(
        min_length=1,
        max_length=150,
    )

    phone: str | None = Field(
        default=None,
        max_length=50,
    )

    email: str | None = Field(
        default=None,
        max_length=255,
    )

    notes: str | None = None

    @model_validator(mode="after")
    def validate_request(self):
        if self.check_out <= self.check_in:
            raise ValueError(
                "Check-out must be after check-in."
            )

        if not self.phone and not self.email:
            raise ValueError(
                "Provide either a phone number or email address."
            )

        return self


class CustomerReservationResponse(BaseModel):
    reservation_id: int
    reference: str

    status: str

    cottage_id: int
    room_id: int

    check_in: date
    check_out: date

    guest_count: int

    message: str



class RoomTypeReservationCreate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    room_type_id: int = Field(ge=1)

    rate_plan: Literal[
        "with_breakfast",
        "without_breakfast",
    ]

    check_in: date
    check_out: date

    guest_count: int = Field(ge=1)

    full_name: str = Field(
        min_length=1,
        max_length=150,
    )

    phone: str | None = Field(
        default=None,
        max_length=50,
    )

    email: str | None = Field(
        default=None,
        max_length=255,
    )

    notes: str | None = None

    @model_validator(mode="after")
    def validate_request(self):
        if self.check_out <= self.check_in:
            raise ValueError(
                "Check-out must be after check-in."
            )

        if not self.phone and not self.email:
            raise ValueError(
                "Provide either a phone number "
                "or email address."
            )

        return self


class RoomTypeReservationResponse(BaseModel):
    reservation_id: int
    reference: str
    status: str

    room_type_id: int
    room_type_name: str

    rate_plan: Literal[
        "with_breakfast",
        "without_breakfast",
    ]

    quoted_rate: Decimal
    nights: int
    total_amount: Decimal

    check_in: date
    check_out: date
    guest_count: int

    message: str


class ReservationStatusLookupRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    reference: str = Field(
        min_length=1,
        max_length=50,
    )

    phone: str | None = Field(
        default=None,
        max_length=50,
    )

    email: str | None = Field(
        default=None,
        max_length=255,
    )

    @model_validator(mode="after")
    def validate_contact(self):
        phone = (
            self.phone.strip()
            if self.phone
            else ""
        )

        email = (
            self.email.strip()
            if self.email
            else ""
        )

        if not phone and not email:
            raise ValueError(
                "Provide either a phone number "
                "or email address."
            )

        if not self.reference.strip():
            raise ValueError(
                "Reservation reference is required."
            )

        return self


class ReservationStatusLookupResponse(BaseModel):
    reference: str
    status: str

    check_in: date
    check_out: date
    guest_count: int

    room_type_name: str | None
    rate_plan: str | None
    quoted_rate: Decimal | None
    total_amount: Decimal

    cottage_name: str | None
    room_name: str | None


class OperatorReservationResponse(BaseModel):
    id: int
    reference: str

    guest_id: int
    guest_name: str
    guest_phone: str | None
    guest_email: str | None

    cottage_id: int | None
    cottage_code: str | None
    cottage_name: str | None

    room_id: int | None
    room_code: str | None
    room_name: str | None

    room_type_id: int | None
    room_type_name: str | None
    rate_plan: str | None
    quoted_rate: str | None

    source: str
    status: str

    check_in: date
    check_out: date
    guest_count: int

    total_amount: str
    notes: str | None
    created_at: datetime


class OperatorReservationDecision(BaseModel):
    status: str

class OperatorReservationAssignment(BaseModel):
    cottage_id: int = Field(ge=1)
    room_id: int = Field(ge=1)
