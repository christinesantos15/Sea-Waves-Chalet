from datetime import date

from pydantic import BaseModel, Field, model_validator


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