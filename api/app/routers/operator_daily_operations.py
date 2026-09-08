from datetime import date as Date

from fastapi import (
    APIRouter,
    Depends,
    Query,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Cottage,
    Guest,
    Reservation,
    Room,
)
from app.schemas.daily_operations import (
    OperatorDailyOperationsCounts,
    OperatorDailyOperationsResponse,
)
from app.schemas.reservation import (
    OperatorReservationResponse,
)


router = APIRouter(
    prefix="/operator/daily-operations",
    tags=["operator daily operations"],
)


def build_operator_response(
    reservation: Reservation,
    guest: Guest,
    cottage: Cottage,
    room: Room | None,
) -> OperatorReservationResponse:
    return OperatorReservationResponse(
        id=reservation.id,
        reference=reservation.reference,
        guest_id=guest.id,
        guest_name=guest.full_name,
        guest_phone=guest.phone,
        guest_email=guest.email,
        cottage_id=cottage.id,
        cottage_code=cottage.code,
        cottage_name=cottage.name,
        room_id=(
            room.id
            if room is not None
            else None
        ),
        room_code=(
            room.code
            if room is not None
            else None
        ),
        room_name=(
            room.name
            if room is not None
            else None
        ),
        source=reservation.source,
        status=reservation.status,
        check_in=reservation.check_in,
        check_out=reservation.check_out,
        guest_count=reservation.guest_count,
        total_amount=str(
            reservation.total_amount
        ),
        notes=reservation.notes,
        created_at=reservation.created_at,
    )


def get_reservations(
    db: Session,
    *,
    reservation_status: str,
    check_in: Date | None = None,
    check_out: Date | None = None,
    active_on: Date | None = None,
) -> list[OperatorReservationResponse]:
    statement = (
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
        .where(
            Reservation.status
            == reservation_status,
        )
    )

    if check_in is not None:
        statement = statement.where(
            Reservation.check_in
            == check_in,
        )

    if check_out is not None:
        statement = statement.where(
            Reservation.check_out
            == check_out,
        )

    if active_on is not None:
        statement = statement.where(
            Reservation.check_in
            <= active_on,
            Reservation.check_out
            >= active_on,
        )

    statement = statement.order_by(
        Reservation.check_in.asc(),
        Reservation.created_at.asc(),
        Reservation.id.asc(),
    )

    rows = db.execute(
        statement
    ).all()

    return [
        build_operator_response(
            reservation,
            guest,
            cottage,
            room,
        )
        for (
            reservation,
            guest,
            cottage,
            room,
        ) in rows
    ]


@router.get(
    "",
    response_model=(
        OperatorDailyOperationsResponse
    ),
)
def get_daily_operations(
    operation_date: Date | None = Query(
        default=None,
        alias="date",
    ),
    db: Session = Depends(get_db),
) -> OperatorDailyOperationsResponse:
    selected_date = (
        operation_date
        if operation_date is not None
        else Date.today()
    )

    arrivals = get_reservations(
        db,
        reservation_status="confirmed",
        check_in=selected_date,
    )

    staying = get_reservations(
        db,
        reservation_status="checked_in",
        active_on=selected_date,
    )

    departures = get_reservations(
        db,
        reservation_status="checked_in",
        check_out=selected_date,
    )

    return OperatorDailyOperationsResponse(
        date=selected_date,
        counts=OperatorDailyOperationsCounts(
            arrivals=len(arrivals),
            staying=len(staying),
            departures=len(departures),
        ),
        arrivals=arrivals,
        staying=staying,
        departures=departures,
    )