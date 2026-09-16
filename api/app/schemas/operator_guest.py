from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class OperatorGuestUpdate(BaseModel):
    full_name: str | None = Field(
        default=None,
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

    notes: str | None = None


class OperatorGuestBase(BaseModel):
    id: int

    full_name: str

    phone: str | None
    email: str | None

    facebook_name: str | None
    messenger_psid: str | None

    notes: str | None


class OperatorGuestListItem(
    OperatorGuestBase
):
    inquiry_count: int
    reservation_count: int


class OperatorGuestInquiryHistory(
    BaseModel
):
    id: int

    source: str
    status: str

    check_in: date | None
    check_out: date | None

    guest_count: int | None

    message: str | None

    created_at: datetime


class OperatorGuestReservationHistory(
    BaseModel
):
    id: int
    reference: str

    cottage_id: int
    room_id: int | None
    inquiry_id: int | None

    source: str
    status: str

    check_in: date
    check_out: date

    guest_count: int

    total_amount: Decimal

    notes: str | None

    created_at: datetime


class OperatorGuestDetail(
    OperatorGuestBase
):
    inquiry_count: int
    reservation_count: int

    inquiries: list[
        OperatorGuestInquiryHistory
    ]

    reservations: list[
        OperatorGuestReservationHistory
    ]


class OperatorGuestDuplicateMatch(
    BaseModel
):
    field: str
    value: str


class OperatorGuestDuplicateCandidate(
    BaseModel
):
    guest_a: OperatorGuestListItem
    guest_b: OperatorGuestListItem

    matches: list[
        OperatorGuestDuplicateMatch
    ]


class OperatorGuestMergeRequest(
    BaseModel
):
    canonical_guest_id: int = Field(
        gt=0
    )
    duplicate_guest_id: int = Field(
        gt=0
    )


class OperatorGuestMergeResponse(
    BaseModel
):
    canonical_guest: OperatorGuestDetail

    merged_guest_id: int

    moved_inquiries: int
    moved_reservations: int
