from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
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
    OperatorReservationDecision,
    OperatorReservationResponse,
)
from app.services.turnover import (
    create_checkout_turnover_task,
)

from app.dependencies.auth import (
    require_roles,
)

router = APIRouter(
    prefix="/operator/reservations",
    tags=["operator reservations"],
    dependencies=[
        Depends(
            require_roles(
                "owner",
                "operator",
            )
        )
    ],
)


ALLOWED_QUEUE_STATUSES = (
    "pending",
    "confirmed",
    "declined",
    "cancelled",
    "checked_in",
    "checked_out",
)


ALLOWED_PENDING_DECISIONS = (
    "confirmed",
    "declined",
)


BLOCKING_RESERVATION_STATUSES = (
    "pending",
    "confirmed",
    "checked_in",
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


def get_operator_reservation_response(
    db: Session,
    reservation_id: int,
) -> OperatorReservationResponse:
    statement = (
        select(
            Reservation,
            Guest,
            Cottage,
            Room,
        )
        .join(
            Guest,
            Guest.id == Reservation.guest_id,
        )
        .join(
            Cottage,
            Cottage.id
            == Reservation.cottage_id,
        )
        .outerjoin(
            Room,
            Room.id == Reservation.room_id,
        )
        .where(
            Reservation.id
            == reservation_id,
        )
    )

    row = db.execute(
        statement
    ).first()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found.",
        )

    (
        reservation,
        guest,
        cottage,
        room,
    ) = row

    return build_operator_response(
        reservation,
        guest,
        cottage,
        room,
    )


@router.get(
    "",
    response_model=list[
        OperatorReservationResponse
    ],
)
def get_operator_reservations(
    reservation_status: str = Query(
        default="pending",
        alias="status",
    ),
    db: Session = Depends(get_db),
) -> list[OperatorReservationResponse]:
    if (
        reservation_status
        not in ALLOWED_QUEUE_STATUSES
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reservation status.",
        )

    statement = (
        select(
            Reservation,
            Guest,
            Cottage,
            Room,
        )
        .join(
            Guest,
            Guest.id == Reservation.guest_id,
        )
        .join(
            Cottage,
            Cottage.id
            == Reservation.cottage_id,
        )
        .outerjoin(
            Room,
            Room.id == Reservation.room_id,
        )
        .where(
            Reservation.status
            == reservation_status,
        )
        .order_by(
            Reservation.created_at.desc(),
            Reservation.id.desc(),
        )
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
    "/{reservation_id}",
    response_model=OperatorReservationResponse,
)
def get_operator_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
) -> OperatorReservationResponse:
    return get_operator_reservation_response(
        db,
        reservation_id,
    )


@router.patch(
    "/{reservation_id}/decision",
    response_model=OperatorReservationResponse,
)
def decide_pending_reservation(
    reservation_id: int,
    decision: OperatorReservationDecision,
    db: Session = Depends(get_db),
) -> OperatorReservationResponse:
    if (
        decision.status
        not in ALLOWED_PENDING_DECISIONS
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Pending reservations may only "
                "be confirmed or declined."
            ),
        )

    try:
        reservation = db.scalar(
            select(Reservation)
            .where(
                Reservation.id
                == reservation_id,
            )
            .with_for_update()
        )

        if reservation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found.",
            )

        if reservation.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Only pending reservations "
                    "can be reviewed."
                ),
            )

        if (
            decision.status == "confirmed"
            and reservation.room_id is not None
        ):
            conflict = db.scalar(
                select(Reservation.id)
                .where(
                    Reservation.id
                    != reservation.id,
                    Reservation.room_id
                    == reservation.room_id,
                    Reservation.status.in_(
                        BLOCKING_RESERVATION_STATUSES
                    ),
                    Reservation.check_in
                    < reservation.check_out,
                    Reservation.check_out
                    > reservation.check_in,
                )
                .limit(1)
            )

            if conflict is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "Another reservation now "
                        "conflicts with this room."
                    ),
                )

        reservation.status = (
            decision.status
        )

        db.commit()

        return get_operator_reservation_response(
            db,
            reservation.id,
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


@router.patch(
    "/{reservation_id}/check-in",
    response_model=OperatorReservationResponse,
)
def check_in_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
) -> OperatorReservationResponse:
    try:
        reservation = db.scalar(
            select(Reservation)
            .where(
                Reservation.id
                == reservation_id,
            )
            .with_for_update()
        )

        if reservation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found.",
            )

        if reservation.status != "confirmed":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Only confirmed reservations "
                    "can be checked in."
                ),
            )

        reservation.status = "checked_in"

        db.commit()

        return get_operator_reservation_response(
            db,
            reservation.id,
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


@router.patch(
    "/{reservation_id}/check-out",
    response_model=OperatorReservationResponse,
)
def check_out_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
) -> OperatorReservationResponse:
    try:
        reservation = db.scalar(
            select(Reservation)
            .where(
                Reservation.id
                == reservation_id,
            )
            .with_for_update()
        )

        if reservation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found.",
            )

        if reservation.status != "checked_in":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Only checked-in reservations "
                    "can be checked out."
                ),
            )

        reservation.status = "checked_out"

        create_checkout_turnover_task(
            db,
            reservation,
        )

        db.commit()

        return get_operator_reservation_response(
            db,
            reservation.id,
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise