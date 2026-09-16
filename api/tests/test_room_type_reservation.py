from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import app
from app.models import (
    Reservation,
    RoomRate,
    RoomType,
)


client = TestClient(app)


def add_room_type(
    db,
    *,
    code: str = "couple",
    name: str = "Couple Room",
    capacity: int = 2,
    is_active: bool = True,
) -> RoomType:
    room_type = RoomType(
        code=code,
        name=name,
        capacity=capacity,
        is_active=is_active,
    )

    db.add(room_type)
    db.commit()
    db.refresh(room_type)

    return room_type


def add_rate(
    db,
    room_type: RoomType,
    *,
    rate_plan: str = "with_breakfast",
    amount: Decimal = Decimal("1950.00"),
    is_active: bool = True,
) -> RoomRate:
    rate = RoomRate(
        room_type_id=room_type.id,
        rate_plan=rate_plan,
        amount=amount,
        is_active=is_active,
    )

    db.add(rate)
    db.commit()
    db.refresh(rate)

    return rate


def reservation_payload(
    room_type_id: int,
) -> dict:
    return {
        "room_type_id": room_type_id,
        "rate_plan": "with_breakfast",
        "check_in": "2026-10-10",
        "check_out": "2026-10-12",
        "guest_count": 2,
        "full_name": "Test Guest",
        "phone": "09171234567",
        "email": None,
        "notes": None,
    }


def test_room_type_request_uses_server_rate(
    db,
):
    room_type = add_room_type(db)

    add_rate(
        db,
        room_type,
        amount=Decimal("1950.00"),
    )

    response = client.post(
        "/reservations/room-type-request",
        json=reservation_payload(
            room_type.id
        ),
    )

    assert response.status_code == 201

    body = response.json()

    assert (
        body["room_type_id"]
        == room_type.id
    )
    assert (
        body["room_type_name"]
        == "Couple Room"
    )
    assert (
        body["rate_plan"]
        == "with_breakfast"
    )
    assert body["quoted_rate"] == "1950.00"
    assert body["nights"] == 2
    assert body["total_amount"] == "3900.00"

    reservation = db.scalar(
        select(Reservation).where(
            Reservation.id
            == body["reservation_id"]
        )
    )

    assert reservation is not None
    assert reservation.cottage_id is None
    assert reservation.room_id is None
    assert (
        reservation.room_type_id
        == room_type.id
    )
    assert (
        reservation.rate_plan
        == "with_breakfast"
    )
    assert (
        reservation.quoted_rate
        == Decimal("1950.00")
    )
    assert (
        reservation.total_amount
        == Decimal("3900.00")
    )
    assert reservation.status == "pending"


def test_guest_count_cannot_exceed_capacity(
    db,
):
    room_type = add_room_type(
        db,
        capacity=2,
    )

    add_rate(
        db,
        room_type,
    )

    payload = reservation_payload(
        room_type.id
    )
    payload["guest_count"] = 3

    response = client.post(
        "/reservations/room-type-request",
        json=payload,
    )

    assert response.status_code == 422
    assert (
        response.json()["detail"]
        == (
            "Guest count exceeds the "
            "capacity of this room type."
        )
    )


def test_inactive_room_type_cannot_be_requested(
    db,
):
    room_type = add_room_type(
        db,
        is_active=False,
    )

    add_rate(
        db,
        room_type,
    )

    response = client.post(
        "/reservations/room-type-request",
        json=reservation_payload(
            room_type.id
        ),
    )

    assert response.status_code == 404


def test_inactive_rate_plan_cannot_be_requested(
    db,
):
    room_type = add_room_type(db)

    add_rate(
        db,
        room_type,
        is_active=False,
    )

    response = client.post(
        "/reservations/room-type-request",
        json=reservation_payload(
            room_type.id
        ),
    )

    assert response.status_code == 409


def test_customer_cannot_supply_price(
    db,
):
    room_type = add_room_type(db)

    add_rate(
        db,
        room_type,
    )

    payload = reservation_payload(
        room_type.id
    )

    payload["quoted_rate"] = "1.00"
    payload["total_amount"] = "2.00"

    response = client.post(
        "/reservations/room-type-request",
        json=payload,
    )

    assert response.status_code == 422


def test_without_breakfast_uses_correct_rate(
    db,
):
    room_type = add_room_type(db)

    add_rate(
        db,
        room_type,
        rate_plan="without_breakfast",
        amount=Decimal("1750.00"),
    )

    payload = reservation_payload(
        room_type.id
    )

    payload["rate_plan"] = (
        "without_breakfast"
    )

    response = client.post(
        "/reservations/room-type-request",
        json=payload,
    )

    assert response.status_code == 201

    body = response.json()

    assert body["quoted_rate"] == "1750.00"
    assert body["nights"] == 2
    assert body["total_amount"] == "3500.00"
