from datetime import (
    date,
    datetime,
    timedelta,
    timezone,
)
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.models import (
    AuthSession,
    Guest,
    Reservation,
    User,
)
from app.security import hash_session_token


def authenticated_client(
    db,
) -> TestClient:
    now = datetime.now(
        timezone.utc
    )

    user = User(
        username=(
            "payment-test-"
            f"{now.timestamp()}"
        ),
        password_hash="unused",
        role="operator",
        is_active=True,
        created_at=now,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = (
        "payment-token-"
        f"{user.id}-"
        f"{now.timestamp()}"
    )

    session = AuthSession(
        user_id=user.id,
        token_hash=(
            hash_session_token(
                token
            )
        ),
        expires_at=(
            now
            + timedelta(hours=1)
        ),
        created_at=now,
        revoked_at=None,
    )

    db.add(session)
    db.commit()

    client = TestClient(app)

    client.cookies.set(
        settings.auth_cookie_name,
        token,
        path="/",
    )

    return client


def add_guest(
    db,
) -> Guest:
    guest = Guest(
        full_name="Payment Test Guest",
        phone="09171234567",
        email="payment@example.com",
        facebook_name=None,
        messenger_psid=None,
        notes=None,
    )

    db.add(guest)
    db.commit()
    db.refresh(guest)

    return guest


def add_reservation(
    db,
    *,
    reservation_status: str,
    total_amount: Decimal = (
        Decimal("3900.00")
    ),
) -> Reservation:
    guest = add_guest(db)

    reservation = Reservation(
        reference=(
            "PAY-"
            f"{reservation_status}-"
            f"{guest.id}"
        ),
        guest_id=guest.id,
        cottage_id=None,
        room_id=None,
        room_type_id=None,
        inquiry_id=None,
        source="website",
        status=reservation_status,
        check_in=date(
            2026,
            10,
            10,
        ),
        check_out=date(
            2026,
            10,
            12,
        ),
        guest_count=2,
        rate_plan=None,
        quoted_rate=None,
        total_amount=total_amount,
        notes=None,
    )

    db.add(reservation)
    db.commit()
    db.refresh(reservation)

    return reservation


def payment_payload(
    amount: str = "1000.00",
) -> dict:
    return {
        "amount": amount,
        "payment_type": "deposit",
        "payment_method": "GCash",
        "reference": "TEST-GCASH-001",
        "notes": (
            "Automated payment test."
        ),
    }


def test_pending_reservation_accepts_deposit(
    db,
):
    reservation = add_reservation(
        db,
        reservation_status="pending",
    )

    client = authenticated_client(db)

    response = client.post(
        (
            "/operator/reservations/"
            f"{reservation.id}/payments"
        ),
        json=payment_payload(),
    )

    assert response.status_code == 201

    body = response.json()

    assert body["paid_amount"] == "1000.00"
    assert body["balance"] == "2900.00"
    assert (
        body["payment_status"]
        == "partial"
    )


def test_confirmed_reservation_accepts_payment(
    db,
):
    reservation = add_reservation(
        db,
        reservation_status="confirmed",
    )

    client = authenticated_client(db)

    response = client.post(
        (
            "/operator/reservations/"
            f"{reservation.id}/payments"
        ),
        json=payment_payload(),
    )

    assert response.status_code == 201

    body = response.json()

    assert body["paid_amount"] == "1000.00"
    assert body["balance"] == "2900.00"


def test_checked_in_reservation_accepts_payment(
    db,
):
    reservation = add_reservation(
        db,
        reservation_status="checked_in",
    )

    client = authenticated_client(db)

    response = client.post(
        (
            "/operator/reservations/"
            f"{reservation.id}/payments"
        ),
        json=payment_payload(),
    )

    assert response.status_code == 201


@pytest.mark.parametrize(
    "reservation_status",
    [
        "declined",
        "cancelled",
        "checked_out",
    ],
)
def test_closed_reservation_rejects_payment(
    db,
    reservation_status: str,
):
    reservation = add_reservation(
        db,
        reservation_status=(
            reservation_status
        ),
    )

    client = authenticated_client(db)

    response = client.post(
        (
            "/operator/reservations/"
            f"{reservation.id}/payments"
        ),
        json=payment_payload(),
    )

    assert response.status_code == 409


def test_payment_cannot_exceed_balance(
    db,
):
    reservation = add_reservation(
        db,
        reservation_status="confirmed",
    )

    client = authenticated_client(db)

    response = client.post(
        (
            "/operator/reservations/"
            f"{reservation.id}/payments"
        ),
        json=payment_payload(
            "5000.00"
        ),
    )

    assert response.status_code == 409

    assert response.json()["detail"] == (
        "Payment exceeds the remaining "
        "booking balance."
    )


def test_total_cannot_be_lower_than_paid_amount(
    db,
):
    reservation = add_reservation(
        db,
        reservation_status="confirmed",
    )

    client = authenticated_client(db)

    payment_response = client.post(
        (
            "/operator/reservations/"
            f"{reservation.id}/payments"
        ),
        json=payment_payload(
            "1000.00"
        ),
    )

    assert (
        payment_response.status_code
        == 201
    )

    response = client.patch(
        (
            "/operator/reservations/"
            f"{reservation.id}/amount"
        ),
        json={
            "total_amount": "500.00",
        },
    )

    assert response.status_code == 409

    assert response.json()["detail"] == (
        "Booking total cannot be lower "
        "than the amount already paid."
    )
