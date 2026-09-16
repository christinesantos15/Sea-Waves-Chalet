from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import (
    func,
    or_,
    select,
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import (
    require_roles,
)
from app.models import (
    Guest,
    Inquiry,
    Reservation,
)
from app.schemas.operator_guest import (
    OperatorGuestDetail,
    OperatorGuestDuplicateCandidate,
    OperatorGuestDuplicateMatch,
    OperatorGuestInquiryHistory,
    OperatorGuestListItem,
    OperatorGuestReservationHistory,
    OperatorGuestUpdate,
)


router = APIRouter(
    prefix="/operator/guests",
    tags=["operator guests"],
    dependencies=[
        Depends(
            require_roles(
                "owner",
                "operator",
            )
        )
    ],
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


def get_guest_or_404(
    db: Session,
    guest_id: int,
) -> Guest:
    guest = db.get(
        Guest,
        guest_id,
    )

    if guest is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Guest not found.",
        )

    return guest


def build_guest_detail(
    db: Session,
    guest: Guest,
) -> OperatorGuestDetail:
    inquiries = list(
        db.scalars(
            select(Inquiry)
            .where(
                Inquiry.guest_id
                == guest.id
            )
            .order_by(
                Inquiry.created_at.desc(),
                Inquiry.id.desc(),
            )
        ).all()
    )

    reservations = list(
        db.scalars(
            select(Reservation)
            .where(
                Reservation.guest_id
                == guest.id
            )
            .order_by(
                Reservation.created_at.desc(),
                Reservation.id.desc(),
            )
        ).all()
    )

    return OperatorGuestDetail(
        id=guest.id,
        full_name=guest.full_name,
        phone=guest.phone,
        email=guest.email,
        facebook_name=(
            guest.facebook_name
        ),
        messenger_psid=(
            guest.messenger_psid
        ),
        notes=guest.notes,
        inquiry_count=len(
            inquiries
        ),
        reservation_count=len(
            reservations
        ),
        inquiries=[
            OperatorGuestInquiryHistory(
                id=inquiry.id,
                source=inquiry.source,
                status=inquiry.status,
                check_in=inquiry.check_in,
                check_out=inquiry.check_out,
                guest_count=(
                    inquiry.guest_count
                ),
                message=inquiry.message,
                created_at=(
                    inquiry.created_at
                ),
            )
            for inquiry in inquiries
        ],
        reservations=[
            OperatorGuestReservationHistory(
                id=reservation.id,
                reference=(
                    reservation.reference
                ),
                cottage_id=(
                    reservation.cottage_id
                ),
                room_id=(
                    reservation.room_id
                ),
                inquiry_id=(
                    reservation.inquiry_id
                ),
                source=(
                    reservation.source
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
                total_amount=(
                    reservation.total_amount
                ),
                notes=reservation.notes,
                created_at=(
                    reservation.created_at
                ),
            )
            for reservation
            in reservations
        ],
    )


@router.get(
    "",
    response_model=list[
        OperatorGuestListItem
    ],
)
def list_guests(
    q: str | None = Query(
        default=None,
        max_length=200,
    ),
    db: Session = Depends(
        get_db
    ),
):
    inquiry_count = (
        select(
            func.count(
                Inquiry.id
            )
        )
        .where(
            Inquiry.guest_id
            == Guest.id
        )
        .correlate(
            Guest
        )
        .scalar_subquery()
    )

    reservation_count = (
        select(
            func.count(
                Reservation.id
            )
        )
        .where(
            Reservation.guest_id
            == Guest.id
        )
        .correlate(
            Guest
        )
        .scalar_subquery()
    )

    statement = select(
        Guest,
        inquiry_count.label(
            "inquiry_count"
        ),
        reservation_count.label(
            "reservation_count"
        ),
    )

    if q is not None:
        cleaned_query = q.strip()

        if cleaned_query:
            search_term = (
                f"%{cleaned_query}%"
            )

            statement = (
                statement.where(
                    or_(
                        Guest.full_name.ilike(
                            search_term
                        ),
                        Guest.phone.ilike(
                            search_term
                        ),
                        Guest.email.ilike(
                            search_term
                        ),
                        Guest.facebook_name.ilike(
                            search_term
                        ),
                        Guest.messenger_psid.ilike(
                            search_term
                        ),
                    )
                )
            )

    rows = db.execute(
        statement.order_by(
            Guest.full_name.asc(),
            Guest.id.asc(),
        )
    ).all()

    return [
        OperatorGuestListItem(
            id=guest.id,
            full_name=(
                guest.full_name
            ),
            phone=guest.phone,
            email=guest.email,
            facebook_name=(
                guest.facebook_name
            ),
            messenger_psid=(
                guest.messenger_psid
            ),
            notes=guest.notes,
            inquiry_count=(
                inquiry_total
            ),
            reservation_count=(
                reservation_total
            ),
        )
        for (
            guest,
            inquiry_total,
            reservation_total,
        ) in rows
    ]


@router.get(
    "/duplicates",
    response_model=list[
        OperatorGuestDuplicateCandidate
    ],
)
def list_duplicate_guests(
    db: Session = Depends(
        get_db
    ),
):
    from app.services.guest_identity import (
        compare_guest_identity,
    )

    guests = list(
        db.scalars(
            select(Guest).order_by(
                Guest.id.asc()
            )
        ).all()
    )

    inquiry_counts = dict(
        db.execute(
            select(
                Inquiry.guest_id,
                func.count(
                    Inquiry.id
                ),
            )
            .group_by(
                Inquiry.guest_id
            )
        ).all()
    )

    reservation_counts = dict(
        db.execute(
            select(
                Reservation.guest_id,
                func.count(
                    Reservation.id
                ),
            )
            .group_by(
                Reservation.guest_id
            )
        ).all()
    )

    def guest_summary(
        guest: Guest,
    ) -> OperatorGuestListItem:
        return OperatorGuestListItem(
            id=guest.id,
            full_name=(
                guest.full_name
            ),
            phone=guest.phone,
            email=guest.email,
            facebook_name=(
                guest.facebook_name
            ),
            messenger_psid=(
                guest.messenger_psid
            ),
            notes=guest.notes,
            inquiry_count=(
                inquiry_counts.get(
                    guest.id,
                    0,
                )
            ),
            reservation_count=(
                reservation_counts.get(
                    guest.id,
                    0,
                )
            ),
        )

    candidates: list[
        OperatorGuestDuplicateCandidate
    ] = []

    for index, first in enumerate(
        guests
    ):
        for second in guests[
            index + 1:
        ]:
            identity_matches = (
                compare_guest_identity(
                    first,
                    second,
                )
            )

            if not identity_matches:
                continue

            candidates.append(
                OperatorGuestDuplicateCandidate(
                    guest_a=guest_summary(
                        first
                    ),
                    guest_b=guest_summary(
                        second
                    ),
                    matches=[
                        OperatorGuestDuplicateMatch(
                            field=match.field,
                            value=match.value,
                        )
                        for match
                        in identity_matches
                    ],
                )
            )

    return candidates


@router.get(
    "/{guest_id}",
    response_model=(
        OperatorGuestDetail
    ),
)
def get_guest(
    guest_id: int,
    db: Session = Depends(
        get_db
    ),
):
    guest = get_guest_or_404(
        db,
        guest_id,
    )

    return build_guest_detail(
        db,
        guest,
    )


@router.patch(
    "/{guest_id}",
    response_model=(
        OperatorGuestDetail
    ),
)
def update_guest(
    guest_id: int,
    data: OperatorGuestUpdate,
    db: Session = Depends(
        get_db
    ),
):
    guest = get_guest_or_404(
        db,
        guest_id,
    )

    fields = (
        data.model_fields_set
    )

    try:
        if (
            "full_name"
            in fields
        ):
            if (
                data.full_name
                is None
            ):
                raise HTTPException(
                    status_code=(
                        status.HTTP_422_UNPROCESSABLE_ENTITY
                    ),
                    detail=(
                        "Guest name cannot "
                        "be empty."
                    ),
                )

            full_name = (
                data.full_name.strip()
            )

            if not full_name:
                raise HTTPException(
                    status_code=(
                        status.HTTP_422_UNPROCESSABLE_ENTITY
                    ),
                    detail=(
                        "Guest name cannot "
                        "be empty."
                    ),
                )

            guest.full_name = (
                full_name
            )

        if "phone" in fields:
            guest.phone = (
                clean_optional(
                    data.phone
                )
            )

        if "email" in fields:
            guest.email = (
                clean_optional(
                    data.email
                )
            )

        if (
            "facebook_name"
            in fields
        ):
            guest.facebook_name = (
                clean_optional(
                    data.facebook_name
                )
            )

        if (
            "messenger_psid"
            in fields
        ):
            guest.messenger_psid = (
                clean_optional(
                    data.messenger_psid
                )
            )

        if "notes" in fields:
            guest.notes = (
                clean_optional(
                    data.notes
                )
            )

        db.commit()
        db.refresh(
            guest
        )

        return build_guest_detail(
            db,
            guest,
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise
