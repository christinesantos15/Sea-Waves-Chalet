from datetime import date, datetime

from pydantic import BaseModel


class OwnerTodayCounts(BaseModel):
    arrivals: int
    staying: int
    departures: int


class OwnerBookingCounts(BaseModel):
    pending: int
    confirmed: int
    checked_in: int


class OwnerFinanceSummary(BaseModel):
    booked_value: str
    payments_received: str
    outstanding_balance: str
    payment_attention: int


class OwnerRoomSummary(BaseModel):
    total: int
    ready: int
    needs_cleaning: int
    cleaning: int
    other: int

    occupied: int
    occupancy_percent: float


class OwnerAttentionSummary(BaseModel):
    pending_reservations: int
    payment_attention: int
    rooms_needing_attention: int
    open_maintenance: int


class OwnerRecentReservation(BaseModel):
    id: int
    reference: str

    guest_name: str

    cottage_name: str
    room_name: str | None

    status: str

    check_in: date
    check_out: date

    guest_count: int

    total_amount: str

    created_at: datetime


class OwnerRecentPayment(BaseModel):
    id: int

    reservation_id: int
    reservation_reference: str

    guest_name: str

    amount: str

    payment_type: str
    payment_method: str | None

    reference: str | None

    paid_at: datetime | None
    created_at: datetime


class OwnerDashboardResponse(BaseModel):
    date: date

    today: OwnerTodayCounts
    bookings: OwnerBookingCounts
    finance: OwnerFinanceSummary
    rooms: OwnerRoomSummary
    attention: OwnerAttentionSummary

    recent_reservations: list[
        OwnerRecentReservation
    ]

    recent_payments: list[
        OwnerRecentPayment
    ]