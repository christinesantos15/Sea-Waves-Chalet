from datetime import (
    datetime,
    timezone,
)
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
from app.dependencies.auth import require_roles
from app.models import (
    Cottage,
    Guest,
    Inquiry,
    Reservation,
    Room,
)
from app.schemas.operator_inquiry import (
    OperatorInquiryConvertRequest,
    OperatorInquiryConversionResponse,
    OperatorInquiryCreate,
    OperatorInquiryResponse,
    OperatorInquiryStatusUpdate,
)


router = APIRouter(
    prefix="/operator/inquiries",
    tags=["operator inquiries"],
    dependencies=[
        Depends(
            require_roles(
                "owner",
                "operator",
            )
        )
    ],
)


ALLOWED_STATUS_TRANSITIONS = {
    "new": {
        "contacted",
        "declined",
        "closed",
    },
    "contacted": {
        "qualified",
        "declined",
        "closed",
    },
    "qualified": {
        "declined",
        "closed",
    },
    "converted": set(),
    "declined": set(),
    "closed": set(),
}


BLOCKING_RESERVATION_STATUSES = (
    "pending",
    "confirmed",
    "checked_in",
)


def utc_now() -> datetime:
    return datetime.now(
        timezone.utc,
    )


def generate_reference() -> str:
    return (
        f"SW-{uuid4().hex[:12].upper()}"
    )


def clean_optional(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    cleaned = value.strip()

    return (
        cleaned
        if cleaned
        else None
    )


def build_inquiry_response(
    inquiry: Inquiry,
    guest: Guest,
) -> OperatorInquiryResponse:
    return OperatorInquiryResponse(
        id=inquiry.id,

        guest_id=guest.id,
        guest_name=guest.full_name,

        guest_phone=guest.phone,
        guest_email=guest.email,

        facebook_name=guest.facebook_name,
        messenger_psid=guest.messenger_psid,

        source=inquiry.source,
        status=inquiry.status,

        check_in=inquiry.check_in,
        check_out=inquiry.check_out,

        guest_count=inquiry.guest_count,

        message=inquiry.message,

        created_at=inquiry.created_at,
    )


def get_inquiry_with_guest(
    db: Session,
    inquiry_id: int,
) -> tuple[
    Inquiry,
    Guest,
]:
    row = db.execute(
        select(
            Inquiry,
            Guest,
        )
        .join(
            Guest,
            Guest.id
            == Inquiry.guest_id,
        )
        .where(
            Inquiry.id
            == inquiry_id,
        )
    ).first()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inquiry not found.",
        )

    inquiry, guest = row

    return (
        inquiry,
        guest,
    )


@router.get(
    "",
    response_model=list[
        OperatorInquiryResponse
    ],
)
def list_inquiries(
    db: Session = Depends(get_db),
) -> list[
    OperatorInquiryResponse
]:
    statement = (
        select(
            Inquiry,
            Guest,
        )
        .join(
            Guest,
            Guest.id
            == Inquiry.guest_id,
        )
        .order_by(
            Inquiry.created_at.desc(),
            Inquiry.id.desc(),
        )
    )

    rows = db.execute(
        statement,
    ).all()

    return [
        build_inquiry_response(
            inquiry,
            guest,
        )
        for inquiry, guest
        in rows
    ]


@router.post(
    "",
    response_model=OperatorInquiryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_inquiry(
    data: OperatorInquiryCreate,
    db: Session = Depends(get_db),
) -> OperatorInquiryResponse:
    full_name = (
        data.full_name
        .strip()
    )

    if not full_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Guest name is required.",
        )

    try:
        guest = Guest(
            full_name=full_name,

            phone=clean_optional(
                data.phone,
            ),

            email=clean_optional(
                data.email,
            ),

            facebook_name=clean_optional(
                data.facebook_name,
            ),

            messenger_psid=clean_optional(
                data.messenger_psid,
            ),

            notes=(
                "Created from resort inquiry."
            ),
        )

        db.add(
            guest,
        )
        db.flush()

        inquiry = Inquiry(
            guest_id=guest.id,

            source=data.source,
            status="new",

            check_in=data.check_in,
            check_out=data.check_out,

            guest_count=data.guest_count,

            message=clean_optional(
                data.message,
            ),

            created_at=utc_now(),
        )

        db.add(
            inquiry,
        )
        db.flush()

        response = (
            build_inquiry_response(
                inquiry,
                guest,
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


@router.patch(
    "/{inquiry_id}/status",
    response_model=OperatorInquiryResponse,
)
def update_inquiry_status(
    inquiry_id: int,
    data: OperatorInquiryStatusUpdate,
    db: Session = Depends(get_db),
) -> OperatorInquiryResponse:
    inquiry, guest = (
        get_inquiry_with_guest(
            db,
            inquiry_id,
        )
    )

    current_status = (
        inquiry.status
    )

    target_status = (
        data.status
    )

    if (
        target_status
        == current_status
    ):
        return build_inquiry_response(
            inquiry,
            guest,
        )

    allowed_targets = (
        ALLOWED_STATUS_TRANSITIONS.get(
            current_status,
            set(),
        )
    )

    if (
        target_status
        not in allowed_targets
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Inquiry cannot move from "
                f"{current_status!r} to "
                f"{target_status!r}."
            ),
        )

    inquiry.status = (
        target_status
    )

    db.commit()
    db.refresh(
        inquiry,
    )

    return build_inquiry_response(
        inquiry,
        guest,
    )


@router.post(
    "/{inquiry_id}/convert",
    response_model=OperatorInquiryConversionResponse,
    status_code=status.HTTP_201_CREATED,
)
def convert_inquiry_to_reservation(
    inquiry_id: int,
    data: OperatorInquiryConvertRequest,
    db: Session = Depends(get_db),
) -> OperatorInquiryConversionResponse:
    try:
        inquiry, guest = (
            get_inquiry_with_guest(
                db,
                inquiry_id,
            )
        )

        if inquiry.status != "qualified":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Only qualified inquiries "
                    "can be converted."
                ),
            )

        existing_reservation = db.scalar(
            select(
                Reservation.id,
            )
            .where(
                Reservation.inquiry_id
                == inquiry.id,
            )
            .limit(1)
        )

        if (
            existing_reservation
            is not None
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "This inquiry is already linked "
                    "to a reservation."
                ),
            )

        if (
            inquiry.check_in is None
            or inquiry.check_out is None
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Inquiry must have check-in "
                    "and check-out dates before "
                    "conversion."
                ),
            )

        if (
            inquiry.guest_count
            is None
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Inquiry must have a guest count "
                    "before conversion."
                ),
            )

        cottage = db.get(
            Cottage,
            data.cottage_id,
        )

        if (
            cottage is None
            or not cottage.is_active
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cottage not found.",
            )

        room = db.scalar(
            select(Room)
            .where(
                Room.id
                == data.room_id,
                Room.cottage_id
                == data.cottage_id,
                Room.is_active.is_(
                    True,
                ),
            )
            .with_for_update()
        )

        if room is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "Room not found for this cottage."
                ),
            )

        if (
            room.status
            != "available"
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "This room is currently unavailable."
                ),
            )

        conflicting_reservation = (
            db.scalar(
                select(
                    Reservation.id,
                )
                .where(
                    Reservation.room_id
                    == room.id,

                    Reservation.status.in_(
                        BLOCKING_RESERVATION_STATUSES,
                    ),

                    Reservation.check_in
                    < inquiry.check_out,

                    Reservation.check_out
                    > inquiry.check_in,
                )
                .limit(1)
            )
        )

        if (
            conflicting_reservation
            is not None
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "This room is no longer available "
                    "for the inquiry dates."
                ),
            )

        reservation = Reservation(
            reference=generate_reference(),

            guest_id=guest.id,
            cottage_id=cottage.id,
            room_id=room.id,

            inquiry_id=inquiry.id,

            source=inquiry.source,
            status="pending",

            check_in=inquiry.check_in,
            check_out=inquiry.check_out,

            guest_count=(
                inquiry.guest_count
            ),

            total_amount=Decimal(
                "0.00",
            ),

            notes=(
                data.notes.strip()
                if (
                    data.notes
                    and data.notes.strip()
                )
                else inquiry.message
            ),

            created_at=utc_now(),
        )

        db.add(
            reservation,
        )
        db.flush()

        inquiry.status = (
            "converted"
        )

        response = (
            OperatorInquiryConversionResponse(
                inquiry_id=inquiry.id,

                inquiry_status=(
                    inquiry.status
                ),

                reservation_id=(
                    reservation.id
                ),

                reservation_reference=(
                    reservation.reference
                ),

                reservation_status=(
                    reservation.status
                ),

                guest_id=guest.id,

                cottage_id=cottage.id,
                room_id=room.id,

                check_in=(
                    reservation.check_in
                ),

                check_out=(
                    reservation.check_out
                ),

                guest_count=(
                    reservation.guest_count
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