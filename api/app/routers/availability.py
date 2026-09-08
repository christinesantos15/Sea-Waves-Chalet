from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Cottage, Reservation, Room
from app.schemas.availability import (
    CottageAvailabilityResponse,
    RoomAvailabilityResponse,
)


router = APIRouter(
    tags=["availability"],
)


BLOCKING_RESERVATION_STATUSES = (
    "pending",
    "confirmed",
    "checked_in",
)


@router.get(
    "/cottages/{cottage_id}/availability",
    response_model=CottageAvailabilityResponse,
)
def get_cottage_availability(
    cottage_id: int,
    check_in: date = Query(...),
    check_out: date = Query(...),
    db: Session = Depends(get_db),
) -> CottageAvailabilityResponse:
    if check_out <= check_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-out must be after check-in.",
        )

    cottage = db.get(Cottage, cottage_id)

    if cottage is None or not cottage.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cottage not found.",
        )

    rooms = list(
        db.scalars(
            select(Room)
            .where(
                Room.cottage_id == cottage_id,
                Room.is_active.is_(True),
            )
            .order_by(Room.code)
        ).all()
    )

    blocking_room_ids = set(
        db.scalars(
            select(Reservation.room_id).where(
                Reservation.room_id.is_not(None),
                Reservation.cottage_id == cottage_id,
                Reservation.status.in_(
                    BLOCKING_RESERVATION_STATUSES
                ),
                Reservation.check_in < check_out,
                Reservation.check_out > check_in,
            )
        ).all()
    )

    room_results = [
        RoomAvailabilityResponse(
            id=room.id,
            code=room.code,
            name=room.name,
            capacity=room.capacity,
            base_rate=room.base_rate,
            status=room.status,
            available=(
                room.id not in blocking_room_ids
                and room.status == "available"
            ),
        )
        for room in rooms
    ]

    return CottageAvailabilityResponse(
        cottage_id=cottage.id,
        cottage_code=cottage.code,
        cottage_name=cottage.name,
        check_in=check_in,
        check_out=check_out,
        rooms=room_results,
    )