from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import (
    Cottage,
    HousekeepingTask,
    Reservation,
    Room,
)


ROOM_HOUSEKEEPING_STATUSES = (
    "available",
    "needs_cleaning",
    "cleaning",
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def create_checkout_turnover_task(
    db: Session,
    reservation: Reservation,
) -> HousekeepingTask:
    cottage = db.get(
        Cottage,
        reservation.cottage_id,
    )

    room = None

    if reservation.room_id is not None:
        room = db.get(
            Room,
            reservation.room_id,
        )

    if cottage is not None:
        cottage_label = cottage.name
    else:
        cottage_label = (
            f"Cottage {reservation.cottage_id}"
        )

    if room is not None:
        target_label = (
            f"{cottage_label} / {room.name}"
        )
    else:
        target_label = cottage_label

    task = HousekeepingTask(
        cottage_id=reservation.cottage_id,
        room_id=(
            room.id
            if room is not None
            else None
        ),
        title=(
            "Turnover cleaning — "
            f"{target_label}"
        ),
        description=(
            "Automatic turnover task created "
            "after checkout for reservation "
            f"{reservation.reference}. "
            f"Stay: {reservation.check_in} "
            f"to {reservation.check_out}."
        ),
        status="open",
        priority="normal",
        assigned_to=None,
        due_at=None,
        completed_at=None,
        created_at=utc_now(),
    )

    if (
        room is not None
        and room.status
        in ROOM_HOUSEKEEPING_STATUSES
    ):
        if room.status != "cleaning":
            room.status = "needs_cleaning"

    db.add(task)

    return task