from datetime import datetime, timezone
from decimal import Decimal

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Payment, Reservation
from app.schemas.payment import (
    OperatorPaymentCreate,
    OperatorPaymentResponse,
    OperatorPaymentSummaryResponse,
    OperatorReservationAmountUpdate,
)


router = APIRouter(
    prefix="/operator/reservations",
    tags=["operator payments"],
)


COUNTED_PAYMENT_STATUS = "received"

PAYMENT_ALLOWED_RESERVATION_STATUSES = (
    "confirmed",
    "checked_in",
)


def get_paid_amount(
    db: Session,
    reservation_id: int,
) -> Decimal:
    value = db.scalar(
        select(
            func.sum(Payment.amount)
        ).where(
            Payment.reservation_id
            == reservation_id,
            Payment.status
            == COUNTED_PAYMENT_STATUS,
        )
    )

    if value is None:
        return Decimal("0.00")

    return Decimal(value)


def get_payment_status(
    total_amount: Decimal,
    paid_amount: Decimal,
) -> str:
    if total_amount <= Decimal("0.00"):
        return "unpriced"

    if paid_amount <= Decimal("0.00"):
        return "unpaid"

    if paid_amount < total_amount:
        return "partial"

    return "paid"


def build_payment_summary(
    db: Session,
    reservation: Reservation,
) -> OperatorPaymentSummaryResponse:
    paid_amount = get_paid_amount(
        db,
        reservation.id,
    )

    total_amount = Decimal(
        reservation.total_amount
    )

    remaining = (
        total_amount - paid_amount
    )

    balance = max(
        remaining,
        Decimal("0.00"),
    )

    payments = list(
        db.scalars(
            select(Payment)
            .where(
                Payment.reservation_id
                == reservation.id,
            )
            .order_by(
                Payment.created_at.desc(),
                Payment.id.desc(),
            )
        ).all()
    )

    return OperatorPaymentSummaryResponse(
        reservation_id=reservation.id,
        reservation_reference=(
            reservation.reference
        ),
        total_amount=total_amount,
        paid_amount=paid_amount,
        balance=balance,
        payment_status=get_payment_status(
            total_amount,
            paid_amount,
        ),
        payments=[
            OperatorPaymentResponse(
                id=payment.id,
                reservation_id=(
                    payment.reservation_id
                ),
                amount=payment.amount,
                payment_type=(
                    payment.payment_type
                ),
                payment_method=(
                    payment.payment_method
                ),
                status=payment.status,
                reference=payment.reference,
                notes=payment.notes,
                paid_at=payment.paid_at,
                created_at=payment.created_at,
            )
            for payment in payments
        ],
    )


@router.get(
    "/{reservation_id}/payments",
    response_model=(
        OperatorPaymentSummaryResponse
    ),
)
def get_reservation_payments(
    reservation_id: int,
    db: Session = Depends(get_db),
) -> OperatorPaymentSummaryResponse:
    reservation = db.get(
        Reservation,
        reservation_id,
    )

    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found.",
        )

    return build_payment_summary(
        db,
        reservation,
    )


@router.patch(
    "/{reservation_id}/amount",
    response_model=(
        OperatorPaymentSummaryResponse
    ),
)
def update_reservation_amount(
    reservation_id: int,
    data: OperatorReservationAmountUpdate,
    db: Session = Depends(get_db),
) -> OperatorPaymentSummaryResponse:
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

        paid_amount = get_paid_amount(
            db,
            reservation.id,
        )

        if data.total_amount < paid_amount:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Booking total cannot be lower "
                    "than the amount already paid."
                ),
            )

        reservation.total_amount = (
            data.total_amount
        )

        db.commit()
        db.refresh(reservation)

        return build_payment_summary(
            db,
            reservation,
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


@router.post(
    "/{reservation_id}/payments",
    response_model=(
        OperatorPaymentSummaryResponse
    ),
    status_code=status.HTTP_201_CREATED,
)
def record_reservation_payment(
    reservation_id: int,
    data: OperatorPaymentCreate,
    db: Session = Depends(get_db),
) -> OperatorPaymentSummaryResponse:
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

        if (
            reservation.status
            not in
            PAYMENT_ALLOWED_RESERVATION_STATUSES
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Payments may only be recorded "
                    "for confirmed or checked-in "
                    "reservations."
                ),
            )

        total_amount = Decimal(
            reservation.total_amount
        )

        if total_amount <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Set the booking total before "
                    "recording a payment."
                ),
            )

        paid_amount = get_paid_amount(
            db,
            reservation.id,
        )

        remaining_balance = (
            total_amount - paid_amount
        )

        if data.amount > remaining_balance:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Payment exceeds the remaining "
                    "booking balance."
                ),
            )

        now = datetime.now(
            timezone.utc
        )

        payment = Payment(
            reservation_id=reservation.id,
            amount=data.amount,
            payment_type=(
                data.payment_type
            ),
            payment_method=(
                data.payment_method
            ),
            status=(
                COUNTED_PAYMENT_STATUS
            ),
            reference=data.reference,
            notes=data.notes,
            paid_at=now,
            created_at=now,
        )

        db.add(payment)
        db.commit()
        db.refresh(reservation)

        return build_payment_summary(
            db,
            reservation,
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise