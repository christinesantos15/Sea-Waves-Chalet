from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
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
from app.schemas.reservation import (
    CustomerReservationCreate,
    CustomerReservationResponse,
)


router = APIRouter(
    tags=["reservations"],
)


BLOCKING_RESERVATION_STATUSES = (
    "pending",
    "confirmed",
    "checked_in",
)


def generate_reference() -> str:
    return f"SW-{uuid4().hex[:12].upper()}"


@router.post(
    "/reservations",
    response_model=CustomerReservationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_customer_reservation(
    data: CustomerReservationCreate,
    db: Session = Depends(get_db),
) -> CustomerReservationResponse:
    try:
        cottage = db.get(
            Cottage,
            data.cottage_id,
        )

        if cottage is None or not cottage.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cottage not found.",
            )

        # Lock the selected room for the duration of this
        # transaction so concurrent booking requests for the
        # same room are serialized.
        room = db.scalar(
            select(Room)
            .where(
                Room.id == data.room_id,
                Room.cottage_id == data.cottage_id,
                Room.is_active.is_(True),
            )
            .with_for_update()
        )

        if room is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Room not found for this cottage.",
            )

        if room.status != "available":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This room is currently unavailable.",
            )

        conflicting_reservation = db.scalar(
            select(Reservation.id)
            .where(
                Reservation.room_id == room.id,
                Reservation.status.in_(
                    BLOCKING_RESERVATION_STATUSES
                ),
                Reservation.check_in < data.check_out,
                Reservation.check_out > data.check_in,
            )
            .limit(1)
        )

        if conflicting_reservation is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "This room is no longer available "
                    "for the selected dates."
                ),
            )

        guest = Guest(
            full_name=data.full_name.strip(),
            phone=(
                data.phone.strip()
                if data.phone
                else None
            ),
            email=(
                data.email.strip()
                if data.email
                else None
            ),
            notes="Created from website reservation request.",
        )

        db.add(guest)
        db.flush()

        reservation = Reservation(
            reference=generate_reference(),
            guest_id=guest.id,
            cottage_id=cottage.id,
            room_id=room.id,
            inquiry_id=None,
            source="website",
            status="pending",
            check_in=data.check_in,
            check_out=data.check_out,
            guest_count=data.guest_count,
            total_amount=Decimal("0.00"),
            notes=data.notes,
            created_at=datetime.now(timezone.utc),
        )

        db.add(reservation)
        db.flush()

        response = CustomerReservationResponse(
            reservation_id=reservation.id,
            reference=reservation.reference,
            status=reservation.status,
            cottage_id=reservation.cottage_id,
            room_id=reservation.room_id,
            check_in=reservation.check_in,
            check_out=reservation.check_out,
            guest_count=reservation.guest_count,
            message=(
                "Reservation request received. "
                "The resort will confirm the booking."
            ),
        )

        db.commit()

        return response

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise