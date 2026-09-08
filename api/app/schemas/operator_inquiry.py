from datetime import (
    date,
    datetime,
)
from typing import Literal

from pydantic import (
    BaseModel,
    Field,
    model_validator,
)


InquirySource = Literal[
    "messenger",
    "facebook",
    "website",
    "walk_in",
    "phone",
    "manual",
]


InquiryStatus = Literal[
    "new",
    "contacted",
    "qualified",
    "converted",
    "declined",
    "closed",
]


OperatorEditableInquiryStatus = Literal[
    "new",
    "contacted",
    "qualified",
    "declined",
    "closed",
]


class OperatorInquiryCreate(BaseModel):
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

    facebook_name: str | None = Field(
        default=None,
        max_length=150,
    )

    messenger_psid: str | None = Field(
        default=None,
        max_length=255,
    )

    source: InquirySource = "manual"

    check_in: date | None = None
    check_out: date | None = None

    guest_count: int | None = Field(
        default=None,
        ge=1,
    )

    message: str | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if (
            self.check_in is not None
            and self.check_out is not None
            and self.check_out
            <= self.check_in
        ):
            raise ValueError(
                "Check-out must be after check-in."
            )

        return self


class OperatorInquiryStatusUpdate(BaseModel):
    status: OperatorEditableInquiryStatus


class OperatorInquiryConvertRequest(BaseModel):
    cottage_id: int
    room_id: int

    notes: str | None = None


class OperatorInquiryResponse(BaseModel):
    id: int

    guest_id: int
    guest_name: str

    guest_phone: str | None
    guest_email: str | None

    facebook_name: str | None
    messenger_psid: str | None

    source: str
    status: InquiryStatus

    check_in: date | None
    check_out: date | None

    guest_count: int | None

    message: str | None

    created_at: datetime


class OperatorInquiryConversionResponse(BaseModel):
    inquiry_id: int
    inquiry_status: InquiryStatus

    reservation_id: int
    reservation_reference: str
    reservation_status: str

    guest_id: int

    cottage_id: int
    room_id: int

    check_in: date
    check_out: date

    guest_count: int