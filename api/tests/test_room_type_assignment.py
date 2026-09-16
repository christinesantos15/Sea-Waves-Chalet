from datetime import (
    datetime,
    timedelta,
    timezone,
)

from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.models import (
    AuthSession,
    Cottage,
    Room,
    RoomType,
    User,
)
from app.security import hash_session_token


def utc_now() -> datetime:
    return datetime.now(
        timezone.utc
    )


def authenticated_client(
    db,
    *,
    role: str = "operator",
) -> TestClient:
    now = utc_now()

    user = User(
        username=(
            f"{role}-room-type-test"
        ),
        password_hash=(
            "unused-test-hash"
        ),
        role=role,
        is_active=True,
        created_at=now,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    raw_token = (
        "room-type-test-"
        f"{role}-"
        f"{user.id}-"
        f"{now.timestamp()}"
    )

    auth_session = AuthSession(
        user_id=user.id,
        token_hash=(
            hash_session_token(
                raw_token
            )
        ),
        expires_at=(
            now
            + timedelta(hours=1)
        ),
        created_at=now,
        revoked_at=None,
    )

    db.add(auth_session)
    db.commit()

    client = TestClient(app)

    client.cookies.set(
        settings.auth_cookie_name,
        raw_token,
        path="/",
    )

    return client


def add_cottage(
    db,
    *,
    code: str = "C01",
    name: str = "Test Cottage",
) -> Cottage:
    cottage = Cottage(
        code=code,
        name=name,
        description=None,
        capacity=None,
        base_rate=None,
        status="available",
        is_active=True,
        map_x=None,
        map_y=None,
    )

    db.add(cottage)
    db.commit()
    db.refresh(cottage)

    return cottage


def add_room(
    db,
    cottage: Cottage,
    *,
    code: str = "R1",
    name: str = "Room 1",
    room_type_id: int | None = None,
) -> Room:
    room = Room(
        cottage_id=cottage.id,
        room_type_id=room_type_id,
        code=code,
        name=name,
        description=None,
        capacity=None,
        base_rate=None,
        status="available",
        is_active=True,
    )

    db.add(room)
    db.commit()
    db.refresh(room)

    return room


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


def test_room_type_can_be_assigned(
    db,
):
    cottage = add_cottage(db)

    room = add_room(
        db,
        cottage,
    )

    room_type = add_room_type(
        db,
    )

    client = authenticated_client(
        db,
    )

    response = client.patch(
        (
            "/operator/cottages/"
            f"{cottage.id}/rooms/"
            f"{room.id}/room-type"
        ),
        json={
            "room_type_id":
                room_type.id,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert (
        body["room_type_id"]
        == room_type.id
    )

    db.refresh(room)

    assert (
        room.room_type_id
        == room_type.id
    )


def test_room_type_can_be_unassigned(
    db,
):
    cottage = add_cottage(db)

    room_type = add_room_type(
        db,
    )

    room = add_room(
        db,
        cottage,
        room_type_id=room_type.id,
    )

    client = authenticated_client(
        db,
    )

    response = client.patch(
        (
            "/operator/cottages/"
            f"{cottage.id}/rooms/"
            f"{room.id}/room-type"
        ),
        json={
            "room_type_id": None,
        },
    )

    assert response.status_code == 200

    assert (
        response.json()[
            "room_type_id"
        ]
        is None
    )

    db.refresh(room)

    assert room.room_type_id is None


def test_room_cannot_be_assigned_through_wrong_cottage(
    db,
):
    first_cottage = add_cottage(
        db,
        code="C01",
        name="First Cottage",
    )

    second_cottage = add_cottage(
        db,
        code="C02",
        name="Second Cottage",
    )

    room = add_room(
        db,
        first_cottage,
    )

    room_type = add_room_type(
        db,
    )

    client = authenticated_client(
        db,
    )

    response = client.patch(
        (
            "/operator/cottages/"
            f"{second_cottage.id}/"
            f"rooms/{room.id}/room-type"
        ),
        json={
            "room_type_id":
                room_type.id,
        },
    )

    assert response.status_code == 404

    db.refresh(room)

    assert room.room_type_id is None


def test_nonexistent_room_type_cannot_be_assigned(
    db,
):
    cottage = add_cottage(db)

    room = add_room(
        db,
        cottage,
    )

    client = authenticated_client(
        db,
    )

    response = client.patch(
        (
            "/operator/cottages/"
            f"{cottage.id}/rooms/"
            f"{room.id}/room-type"
        ),
        json={
            "room_type_id":
                999999,
        },
    )

    assert response.status_code == 404

    db.refresh(room)

    assert room.room_type_id is None


def test_inactive_room_type_cannot_be_assigned(
    db,
):
    cottage = add_cottage(db)

    room = add_room(
        db,
        cottage,
    )

    room_type = add_room_type(
        db,
        code="inactive-type",
        name="Inactive Room Type",
        is_active=False,
    )

    client = authenticated_client(
        db,
    )

    response = client.patch(
        (
            "/operator/cottages/"
            f"{cottage.id}/rooms/"
            f"{room.id}/room-type"
        ),
        json={
            "room_type_id":
                room_type.id,
        },
    )

    assert response.status_code == 422

    db.refresh(room)

    assert room.room_type_id is None
