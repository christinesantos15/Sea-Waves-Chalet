from collections import defaultdict
from datetime import date, datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

from fastapi import (
    APIRouter,
    Depends,
    Query,
)
from sqlalchemy import (
    func,
    select,
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Cottage,
    Guest,
    MaintenanceIssue,
    Payment,
    Reservation,
    Room,
)
from app.schemas.owner_dashboard import (
    OwnerAttentionSummary,
    OwnerBookingCounts,
    OwnerDashboardResponse,
    OwnerFinanceSummary,
    OwnerRecentPayment,
    OwnerRecentReservation,
    OwnerRoomSummary,
    OwnerTodayCounts,
)

from app.dependencies.auth import (
    require_roles,
)

router = APIRouter(
    prefix="/owner",
    tags=["owner"],
    dependencies=[
        Depends(
            require_roles(
                "owner",
            )
        )
    ],
)


PHILIPPINES_TIMEZONE = ZoneInfo(
    "Asia/Manila"
)


FINANCIAL_RESERVATION_STATUSES = (
    "confirmed",
    "checked_in",
    "checked_out",
)


OPEN_MAINTENANCE_STATUSES = (
    "open",
    "in_progress",
)


def philippines_today() -> date:
    return datetime.now(
        PHILIPPINES_TIMEZONE
    ).date()


def money_string(
    value: Decimal,
) -> str:
    return f"{value:.2f}"


def reservation_count(
    db: Session,
    reservation_status: str,
) -> int:
    count = db.scalar(
        select(
            func.count()
        )
        .select_from(
            Reservation
        )
        .where(
            Reservation.status
            == reservation_status,
        )
    )

    return int(
        count or 0
    )


@router.get(
    "/dashboard",
    response_model=OwnerDashboardResponse,
)
def get_owner_dashboard(
    dashboard_date: date | None = Query(
        default=None,
        alias="date",
    ),
    db: Session = Depends(get_db),
) -> OwnerDashboardResponse:
    selected_date = (
        dashboard_date
        or philippines_today()
    )

    arrivals = db.scalar(
        select(
            func.count()
        )
        .select_from(
            Reservation
        )
        .where(
            Reservation.status
            == "confirmed",
            Reservation.check_in
            == selected_date,
        )
    )

    staying = db.scalar(
        select(
            func.count()
        )
        .select_from(
            Reservation
        )
        .where(
            Reservation.status
            == "checked_in",
            Reservation.check_in
            <= selected_date,
            Reservation.check_out
            >= selected_date,
        )
    )

    departures = db.scalar(
        select(
            func.count()
        )
        .select_from(
            Reservation
        )
        .where(
            Reservation.status
            == "checked_in",
            Reservation.check_out
            == selected_date,
        )
    )

    pending_count = reservation_count(
        db,
        "pending",
    )

    confirmed_count = reservation_count(
        db,
        "confirmed",
    )

    checked_in_count = reservation_count(
        db,
        "checked_in",
    )

    financial_rows = db.execute(
        select(
            Reservation.id,
            Reservation.total_amount,
        )
        .where(
            Reservation.status.in_(
                FINANCIAL_RESERVATION_STATUSES
            ),
        )
    ).all()

    financial_reservation_ids = [
        reservation_id
        for (
            reservation_id,
            _,
        ) in financial_rows
    ]

    received_by_reservation: dict[
        int,
        Decimal,
    ] = defaultdict(
        lambda: Decimal("0.00")
    )

    if financial_reservation_ids:
        received_rows = db.execute(
            select(
                Payment.reservation_id,
                Payment.amount,
            )
            .where(
                Payment.status
                == "received",
                Payment.reservation_id.in_(
                    financial_reservation_ids
                ),
            )
        ).all()

        for (
            reservation_id,
            amount,
        ) in received_rows:
            received_by_reservation[
                reservation_id
            ] += Decimal(
                amount or 0
            )

    booked_value = Decimal(
        "0.00"
    )

    payments_received = Decimal(
        "0.00"
    )

    outstanding_balance = Decimal(
        "0.00"
    )

    payment_attention = 0

    for (
        reservation_id,
        total_amount,
    ) in financial_rows:
        total = Decimal(
            total_amount or 0
        )

        received = (
            received_by_reservation[
                reservation_id
            ]
        )

        booked_value += total

        payments_received += received

        balance = (
            total - received
        )

        if balance < 0:
            balance = Decimal(
                "0.00"
            )

        outstanding_balance += balance

        if (
            total > 0
            and received < total
        ):
            payment_attention += 1

    room_rows = db.execute(
        select(
            Room.id,
            Room.status,
        )
        .where(
            Room.is_active.is_(True),
        )
    ).all()

    active_room_ids = {
        room_id
        for (
            room_id,
            _,
        ) in room_rows
    }

    total_rooms = len(
        room_rows
    )

    ready_rooms = sum(
        1
        for (
            _,
            room_status,
        ) in room_rows
        if room_status
        == "available"
    )

    needs_cleaning_rooms = sum(
        1
        for (
            _,
            room_status,
        ) in room_rows
        if room_status
        == "needs_cleaning"
    )

    cleaning_rooms = sum(
        1
        for (
            _,
            room_status,
        ) in room_rows
        if room_status
        == "cleaning"
    )

    other_rooms = (
        total_rooms
        - ready_rooms
        - needs_cleaning_rooms
        - cleaning_rooms
    )

    occupied_room_ids = set(
        db.scalars(
            select(
                Reservation.room_id
            )
            .where(
                Reservation.status
                == "checked_in",
                Reservation.room_id
                .is_not(None),
            )
        ).all()
    )

    occupied_rooms = len(
        active_room_ids
        .intersection(
            occupied_room_ids
        )
    )

    if total_rooms:
        occupancy_percent = round(
            (
                occupied_rooms
                / total_rooms
            )
            * 100,
            1,
        )
    else:
        occupancy_percent = 0.0

    open_maintenance = db.scalar(
        select(
            func.count()
        )
        .select_from(
            MaintenanceIssue
        )
        .where(
            MaintenanceIssue.status.in_(
                OPEN_MAINTENANCE_STATUSES
            ),
        )
    )

    recent_reservation_rows = db.execute(
        select(
            Reservation,
            Guest,
            Cottage,
            Room,
        )
        .join(
            Guest,
            Guest.id
            == Reservation.guest_id,
        )
        .join(
            Cottage,
            Cottage.id
            == Reservation.cottage_id,
        )
        .outerjoin(
            Room,
            Room.id
            == Reservation.room_id,
        )
        .order_by(
            Reservation.created_at.desc(),
            Reservation.id.desc(),
        )
        .limit(8)
    ).all()

    recent_reservations = [
        OwnerRecentReservation(
            id=reservation.id,
            reference=(
                reservation.reference
            ),
            guest_name=(
                guest.full_name
            ),
            cottage_name=(
                cottage.name
            ),
            room_name=(
                room.name
                if room is not None
                else None
            ),
            status=(
                reservation.status
            ),
            check_in=(
                reservation.check_in
            ),
            check_out=(
                reservation.check_out
            ),
            guest_count=(
                reservation.guest_count
            ),
            total_amount=money_string(
                Decimal(
                    reservation.total_amount
                    or 0
                )
            ),
            created_at=(
                reservation.created_at
            ),
        )
        for (
            reservation,
            guest,
            cottage,
            room,
        ) in recent_reservation_rows
    ]

    recent_payment_rows = db.execute(
        select(
            Payment,
            Reservation,
            Guest,
        )
        .join(
            Reservation,
            Reservation.id
            == Payment.reservation_id,
        )
        .join(
            Guest,
            Guest.id
            == Reservation.guest_id,
        )
        .where(
            Payment.status
            == "received",
        )
        .order_by(
            Payment.created_at.desc(),
            Payment.id.desc(),
        )
        .limit(8)
    ).all()

    recent_payments = [
        OwnerRecentPayment(
            id=payment.id,
            reservation_id=(
                reservation.id
            ),
            reservation_reference=(
                reservation.reference
            ),
            guest_name=(
                guest.full_name
            ),
            amount=money_string(
                Decimal(
                    payment.amount
                    or 0
                )
            ),
            payment_type=(
                payment.payment_type
            ),
            payment_method=(
                payment.payment_method
            ),
            reference=(
                payment.reference
            ),
            paid_at=(
                payment.paid_at
            ),
            created_at=(
                payment.created_at
            ),
        )
        for (
            payment,
            reservation,
            guest,
        ) in recent_payment_rows
    ]

    return OwnerDashboardResponse(
        date=selected_date,

        today=OwnerTodayCounts(
            arrivals=int(
                arrivals or 0
            ),
            staying=int(
                staying or 0
            ),
            departures=int(
                departures or 0
            ),
        ),

        bookings=OwnerBookingCounts(
            pending=pending_count,
            confirmed=confirmed_count,
            checked_in=checked_in_count,
        ),

        finance=OwnerFinanceSummary(
            booked_value=money_string(
                booked_value
            ),
            payments_received=money_string(
                payments_received
            ),
            outstanding_balance=money_string(
                outstanding_balance
            ),
            payment_attention=(
                payment_attention
            ),
        ),

        rooms=OwnerRoomSummary(
            total=total_rooms,
            ready=ready_rooms,
            needs_cleaning=(
                needs_cleaning_rooms
            ),
            cleaning=cleaning_rooms,
            other=other_rooms,
            occupied=occupied_rooms,
            occupancy_percent=(
                occupancy_percent
            ),
        ),

        attention=OwnerAttentionSummary(
            pending_reservations=(
                pending_count
            ),
            payment_attention=(
                payment_attention
            ),
            rooms_needing_attention=(
                needs_cleaning_rooms
                + cleaning_rooms
                + other_rooms
            ),
            open_maintenance=int(
                open_maintenance or 0
            ),
        ),

        recent_reservations=(
            recent_reservations
        ),

        recent_payments=(
            recent_payments
        ),
    )