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
    RoomRate,
    RoomType,
)
from app.schemas.reservation import (
    CustomerReservationCreate,
    CustomerReservationResponse,
    ReservationStatusLookupRequest,
    ReservationStatusLookupResponse,
    RoomTypeReservationCreate,
    RoomTypeReservationResponse,
)

from app.services.guest_identity import (
    get_or_create_guest,
    normalize_email,
    normalize_phone,
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


def reservation_lookup_not_found() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=(
            "Reservation not found or contact "
            "details do not match."
        ),
    )


@router.post(
    "/reservations/status-lookup",
    response_model=ReservationStatusLookupResponse,
)
def lookup_reservation_status(
    data: ReservationStatusLookupRequest,
    db: Session = Depends(get_db),
) -> ReservationStatusLookupResponse:
    reference = (
        data.reference
        .strip()
        .upper()
    )

    reservation = db.scalar(
        select(Reservation)
        .where(
            Reservation.reference
            == reference
        )
        .limit(1)
    )

    if reservation is None:
        raise reservation_lookup_not_found()

    guest = db.get(
        Guest,
        reservation.guest_id,
    )

    if guest is None:
        raise reservation_lookup_not_found()

    requested_phone = normalize_phone(
        data.phone
    )

    requested_email = normalize_email(
        data.email
    )

    stored_phone = normalize_phone(
        guest.phone
    )

    stored_email = normalize_email(
        guest.email
    )

    phone_matches = bool(
        requested_phone
        and stored_phone
        and requested_phone
        == stored_phone
    )

    email_matches = bool(
        requested_email
        and stored_email
        and requested_email
        == stored_email
    )

    if not (
        phone_matches
        or email_matches
    ):
        raise reservation_lookup_not_found()

    room_type = (
        db.get(
            RoomType,
            reservation.room_type_id,
        )
        if reservation.room_type_id
        is not None
        else None
    )

    cottage = (
        db.get(
            Cottage,
            reservation.cottage_id,
        )
        if reservation.cottage_id
        is not None
        else None
    )

    room = (
        db.get(
            Room,
            reservation.room_id,
        )
        if reservation.room_id
        is not None
        else None
    )

    return ReservationStatusLookupResponse(
        reference=reservation.reference,
        status=reservation.status,
        check_in=reservation.check_in,
        check_out=reservation.check_out,
        guest_count=(
            reservation.guest_count
        ),
        room_type_name=(
            room_type.name
            if room_type
            else None
        ),
        rate_plan=(
            reservation.rate_plan
        ),
        quoted_rate=(
            reservation.quoted_rate
        ),
        total_amount=(
            reservation.total_amount
        ),
        cottage_name=(
            cottage.name
            if cottage
            else None
        ),
        room_name=(
            room.name
            if room
            else None
        ),
    )


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

        guest, _guest_created = (
            get_or_create_guest(
                db,
                full_name=(
                    data.full_name
                ),
                phone=data.phone,
                email=data.email,
                creation_note=(
                    "Created from website "
                    "reservation request."
                ),
            )
        )

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

@router.post(
    "/reservations/room-type-request",
    response_model=RoomTypeReservationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_room_type_reservation(
    data: RoomTypeReservationCreate,
    db: Session = Depends(get_db),
) -> RoomTypeReservationResponse:
    try:
        room_type = db.get(
            RoomType,
            data.room_type_id,
        )

        if (
            room_type is None
            or not room_type.is_active
        ):
            raise HTTPException(
                status_code=(
                    status.HTTP_404_NOT_FOUND
                ),
                detail="Room type not found.",
            )

        if (
            data.guest_count
            > room_type.capacity
        ):
            raise HTTPException(
                status_code=(
                    status.HTTP_422_UNPROCESSABLE_CONTENT
                ),
                detail=(
                    "Guest count exceeds the "
                    "capacity of this room type."
                ),
            )

        rate = db.scalar(
            select(RoomRate)
            .where(
                RoomRate.room_type_id
                == room_type.id,
                RoomRate.rate_plan
                == data.rate_plan,
                RoomRate.is_active.is_(True),
            )
        )

        if rate is None:
            raise HTTPException(
                status_code=(
                    status.HTTP_409_CONFLICT
                ),
                detail=(
                    "The selected rate plan is "
                    "not currently available."
                ),
            )

        nights = (
            data.check_out
            - data.check_in
        ).days

        quoted_rate = Decimal(
            rate.amount
        )

        total_amount = (
            quoted_rate
            * Decimal(nights)
        )

        guest, _guest_created = (
            get_or_create_guest(
                db,
                full_name=data.full_name,
                phone=data.phone,
                email=data.email,
                creation_note=(
                    "Created from website "
                    "room-type reservation "
                    "request."
                ),
            )
        )

        reservation = Reservation(
            reference=generate_reference(),
            guest_id=guest.id,
            cottage_id=None,
            room_id=None,
            room_type_id=room_type.id,
            inquiry_id=None,
            source="website",
            status="pending",
            check_in=data.check_in,
            check_out=data.check_out,
            guest_count=data.guest_count,
            rate_plan=data.rate_plan,
            quoted_rate=quoted_rate,
            total_amount=total_amount,
            notes=data.notes,
            created_at=datetime.now(
                timezone.utc
            ),
        )

        db.add(reservation)
        db.flush()

        response = (
            RoomTypeReservationResponse(
                reservation_id=(
                    reservation.id
                ),
                reference=(
                    reservation.reference
                ),
                status=reservation.status,
                room_type_id=room_type.id,
                room_type_name=(
                    room_type.name
                ),
                rate_plan=(
                    reservation.rate_plan
                ),
                quoted_rate=(
                    reservation.quoted_rate
                ),
                nights=nights,
                total_amount=(
                    reservation.total_amount
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
                message=(
                    "Reservation request received. "
                    "The resort will assign the "
                    "physical cottage and room "
                    "before confirmation."
                ),
            )
        )

        db.commit()

        return response

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise
