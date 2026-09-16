from datetime import (
    date,
    datetime,
    timedelta,
    timezone,
)
from decimal import Decimal

from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.models import (
    AuthSession,
    Cottage,
    Guest,
    Reservation,
    Room,
    RoomType,
    User,
)
from app.security import hash_session_token


def authenticated_client(
    db,
) -> TestClient:
    now = datetime.now(timezone.utc)

    user = User(
        username=(
            f"assignment-test-"
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
        f"assignment-token-"
        f"{user.id}-"
        f"{now.timestamp()}"
    )

    session = AuthSession(
        user_id=user.id,
        token_hash=(
            hash_session_token(token)
        ),
        expires_at=(
            now + timedelta(hours=1)
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


def setup_inventory(db):
    room_type = RoomType(
        code="couple",
        name="Couple Room",
        capacity=2,
        is_active=True,
    )

    db.add(room_type)
    db.flush()

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
        room_type_id=room_type.id,
        code="R1",
        name="Room 1",
        description=None,
        capacity=None,
        base_rate=None,
        status="available",
        is_active=True,
    )

    db.add(room)
    db.commit()

    return room_type, cottage, room


def add_guest(db) -> Guest:
    guest = Guest(
        full_name="Assignment Guest",
        phone="09171234567",
        email=None,
        facebook_name=None,
        messenger_psid=None,
        notes=None,
    )

    db.add(guest)
    db.commit()
    db.refresh(guest)

    return guest


def add_request(
    db,
    *,
    room_type_id: int,
) -> Reservation:
    guest = add_guest(db)

    reservation = Reservation(
        reference=(
            f"TEST-{guest.id}"
        ),
        guest_id=guest.id,
        cottage_id=None,
        room_id=None,
        room_type_id=room_type_id,
        inquiry_id=None,
        source="website",
        status="pending",
        check_in=date(2026, 10, 10),
        check_out=date(2026, 10, 12),
        guest_count=2,
        rate_plan="with_breakfast",
        quoted_rate=Decimal("1950.00"),
        total_amount=Decimal("3900.00"),
        notes=None,
    )

    db.add(reservation)
    db.commit()
    db.refresh(reservation)

    return reservation


def test_unassigned_room_type_request_cannot_be_confirmed(
    db,
):
    room_type, _, _ = setup_inventory(db)

    reservation = add_request(
        db,
        room_type_id=room_type.id,
    )

    client = authenticated_client(db)

    response = client.patch(
        (
            "/operator/reservations/"
            f"{reservation.id}/decision"
        ),
        json={
            "status": "confirmed",
        },
    )

    assert response.status_code == 409


def test_matching_physical_room_can_be_assigned(
    db,
):
    room_type, cottage, room = (
        setup_inventory(db)
    )

    reservation = add_request(
        db,
        room_type_id=room_type.id,
    )

    client = authenticated_client(db)

    response = client.patch(
        (
            "/operator/reservations/"
            f"{reservation.id}/assignment"
        ),
        json={
            "cottage_id": cottage.id,
            "room_id": room.id,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["cottage_id"] == cottage.id
    assert body["room_id"] == room.id
    assert (
        body["room_type_id"]
        == room_type.id
    )


def test_wrong_room_type_cannot_be_assigned(
    db,
):
    requested_type, cottage, _ = (
        setup_inventory(db)
    )

    other_type = RoomType(
        code="budget",
        name="Budget Room",
        capacity=4,
        is_active=True,
    )

    db.add(other_type)
    db.flush()

    wrong_room = Room(
        cottage_id=cottage.id,
        room_type_id=other_type.id,
        code="R2",
        name="Room 2",
        description=None,
        capacity=None,
        base_rate=None,
        status="available",
        is_active=True,
    )

    db.add(wrong_room)
    db.commit()

    reservation = add_request(
        db,
        room_type_id=requested_type.id,
    )

    client = authenticated_client(db)

    response = client.patch(
        (
            "/operator/reservations/"
            f"{reservation.id}/assignment"
        ),
        json={
            "cottage_id": cottage.id,
            "room_id": wrong_room.id,
        },
    )

    assert response.status_code == 409


def test_conflicting_room_cannot_be_assigned(
    db,
):
    room_type, cottage, room = (
        setup_inventory(db)
    )

    existing_guest = add_guest(db)

    existing = Reservation(
        reference="EXISTING-BOOKING",
        guest_id=existing_guest.id,
        cottage_id=cottage.id,
        room_id=room.id,
        room_type_id=None,
        inquiry_id=None,
        source="manual",
        status="confirmed",
        check_in=date(2026, 10, 11),
        check_out=date(2026, 10, 13),
        guest_count=1,
        rate_plan=None,
        quoted_rate=None,
        total_amount=Decimal("0.00"),
        notes=None,
    )

    db.add(existing)
    db.commit()

    reservation = add_request(
        db,
        room_type_id=room_type.id,
    )

    client = authenticated_client(db)

    response = client.patch(
        (
            "/operator/reservations/"
            f"{reservation.id}/assignment"
        ),
        json={
            "cottage_id": cottage.id,
            "room_id": room.id,
        },
    )

    assert response.status_code == 409


def test_assigned_request_can_be_confirmed(
    db,
):
    room_type, cottage, room = (
        setup_inventory(db)
    )

    reservation = add_request(
        db,
        room_type_id=room_type.id,
    )

    client = authenticated_client(db)

    assignment = client.patch(
        (
            "/operator/reservations/"
            f"{reservation.id}/assignment"
        ),
        json={
            "cottage_id": cottage.id,
            "room_id": room.id,
        },
    )

    assert assignment.status_code == 200

    confirmation = client.patch(
        (
            "/operator/reservations/"
            f"{reservation.id}/decision"
        ),
        json={
            "status": "confirmed",
        },
    )

    assert confirmation.status_code == 200
    assert (
        confirmation.json()["status"]
        == "confirmed"
    )
