from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import app
from app.models import (
    Cottage,
    Reservation,
    Room,
    RoomRate,
    RoomType,
)


client = TestClient(app)


def add_room_type(
    db,
) -> RoomType:
    room_type = RoomType(
        code="couple",
        name="Couple Room",
        capacity=2,
        is_active=True,
    )

    db.add(room_type)
    db.commit()
    db.refresh(room_type)

    return room_type


def add_rate(
    db,
    room_type: RoomType,
) -> RoomRate:
    rate = RoomRate(
        room_type_id=room_type.id,
        rate_plan="with_breakfast",
        amount=Decimal("1950.00"),
        is_active=True,
    )

    db.add(rate)
    db.commit()
    db.refresh(rate)

    return rate


def create_reservation(
    db,
    *,
    phone: str | None = "0917 123 4567",
    email: str | None = "Guest@Test.com",
) -> dict:
    room_type = add_room_type(db)

    add_rate(
        db,
        room_type,
    )

    response = client.post(
        "/reservations/room-type-request",
        json={
            "room_type_id": room_type.id,
            "rate_plan": "with_breakfast",
            "check_in": "2026-10-10",
            "check_out": "2026-10-12",
            "guest_count": 2,
            "full_name": "Lookup Test Guest",
            "phone": phone,
            "email": email,
            "notes": None,
        },
    )

    assert response.status_code == 201

    return response.json()


def test_lookup_with_correct_email(
    db,
):
    reservation = create_reservation(
        db,
    )

    response = client.post(
        "/reservations/status-lookup",
        json={
            "reference": (
                reservation["reference"]
            ),
            "email": "guest@test.com",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert (
        body["reference"]
        == reservation["reference"]
    )
    assert body["status"] == "pending"
    assert (
        body["room_type_name"]
        == "Couple Room"
    )
    assert (
        body["rate_plan"]
        == "with_breakfast"
    )
    assert (
        body["quoted_rate"]
        == "1950.00"
    )
    assert (
        body["total_amount"]
        == "3900.00"
    )
    assert body["cottage_name"] is None
    assert body["room_name"] is None


def test_lookup_with_formatted_phone(
    db,
):
    reservation = create_reservation(
        db,
    )

    response = client.post(
        "/reservations/status-lookup",
        json={
            "reference": (
                reservation["reference"]
            ),
            "phone": "0917-123-4567",
        },
    )

    assert response.status_code == 200

    assert (
        response.json()["reference"]
        == reservation["reference"]
    )


def test_lookup_accepts_lowercase_reference(
    db,
):
    reservation = create_reservation(
        db,
    )

    response = client.post(
        "/reservations/status-lookup",
        json={
            "reference": (
                reservation["reference"]
                .lower()
            ),
            "email": "GUEST@TEST.COM",
        },
    )

    assert response.status_code == 200

    assert (
        response.json()["reference"]
        == reservation["reference"]
    )


def test_lookup_wrong_contact_returns_generic_404(
    db,
):
    reservation = create_reservation(
        db,
    )

    response = client.post(
        "/reservations/status-lookup",
        json={
            "reference": (
                reservation["reference"]
            ),
            "email": "wrong@example.com",
        },
    )

    assert response.status_code == 404

    assert response.json()["detail"] == (
        "Reservation not found or contact "
        "details do not match."
    )


def test_lookup_unknown_reference_returns_same_404(
    db,
):
    response = client.post(
        "/reservations/status-lookup",
        json={
            "reference": (
                "SW-DOESNOTEXIST"
            ),
            "email": "guest@test.com",
        },
    )

    assert response.status_code == 404

    assert response.json()["detail"] == (
        "Reservation not found or contact "
        "details do not match."
    )


def test_lookup_requires_contact():
    response = client.post(
        "/reservations/status-lookup",
        json={
            "reference": "SW-TESTREFERENCE",
        },
    )

    assert response.status_code == 422


def assign_physical_room(
    db,
    reservation_data: dict,
):
    cottage = Cottage(
        code="C01",
        name="Cottage 1",
        description=None,
        capacity=None,
        base_rate=None,
        status="available",
        is_active=True,
        map_x=None,
        map_y=None,
    )

    db.add(cottage)
    db.flush()

    room = Room(
        cottage_id=cottage.id,
        room_type_id=(
            reservation_data[
                "room_type_id"
            ]
        ),
        code="R1",
        name="Room 1",
        description=None,
        capacity=None,
        base_rate=None,
        status="available",
        is_active=True,
    )

    db.add(room)
    db.flush()

    reservation = db.scalar(
        select(Reservation).where(
            Reservation.reference
            == reservation_data[
                "reference"
            ]
        )
    )

    assert reservation is not None

    reservation.cottage_id = (
        cottage.id
    )
    reservation.room_id = room.id

    db.commit()
    db.refresh(reservation)

    return (
        cottage,
        room,
        reservation,
    )


def test_pending_lookup_hides_physical_assignment(
    db,
):
    created = create_reservation(
        db,
    )

    cottage, room, reservation = (
        assign_physical_room(
            db,
            created,
        )
    )

    assert reservation.status == "pending"
    assert (
        reservation.cottage_id
        == cottage.id
    )
    assert reservation.room_id == room.id

    response = client.post(
        "/reservations/status-lookup",
        json={
            "reference": (
                created["reference"]
            ),
            "email": "guest@test.com",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["status"] == "pending"
    assert body["cottage_name"] is None
    assert body["room_name"] is None


def test_confirmed_lookup_shows_physical_assignment(
    db,
):
    created = create_reservation(
        db,
    )

    cottage, room, reservation = (
        assign_physical_room(
            db,
            created,
        )
    )

    reservation.status = "confirmed"

    db.commit()
    db.refresh(reservation)

    response = client.post(
        "/reservations/status-lookup",
        json={
            "reference": (
                created["reference"]
            ),
            "email": "guest@test.com",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["status"] == "confirmed"
    assert (
        body["cottage_name"]
        == cottage.name
    )
    assert (
        body["room_name"]
        == room.name
    )
