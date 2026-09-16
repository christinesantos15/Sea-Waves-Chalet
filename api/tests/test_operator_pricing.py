from datetime import (
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
    ExtraCharge,
    RoomRate,
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
    role: str,
) -> TestClient:
    now = utc_now()

    user = User(
        username=f"{role}-pricing-test",
        password_hash="unused-test-hash",
        role=role,
        is_active=True,
        created_at=now,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    raw_token = (
        f"pricing-test-"
        f"{role}-"
        f"{user.id}-"
        f"{now.timestamp()}"
    )

    auth_session = AuthSession(
        user_id=user.id,
        token_hash=hash_session_token(
            raw_token
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


def add_room_type(
    db,
    *,
    code="test_type",
    name="Test Room",
    capacity=4,
) -> RoomType:
    room_type = RoomType(
        code=code,
        name=name,
        capacity=capacity,
        is_active=True,
    )

    db.add(room_type)
    db.commit()
    db.refresh(room_type)

    return room_type


def add_rate(
    db,
    room_type: RoomType,
    *,
    rate_plan="with_breakfast",
    amount=Decimal("2500.00"),
) -> RoomRate:
    rate = RoomRate(
        room_type_id=room_type.id,
        rate_plan=rate_plan,
        amount=amount,
        is_active=True,
    )

    db.add(rate)
    db.commit()
    db.refresh(rate)

    return rate


def add_extra_charge(
    db,
    *,
    code="test_charge",
    name="Test Charge",
    amount=Decimal("300.00"),
) -> ExtraCharge:
    charge = ExtraCharge(
        code=code,
        name=name,
        amount=amount,
        is_active=True,
    )

    db.add(charge)
    db.commit()
    db.refresh(charge)

    return charge


@pytest.mark.parametrize(
    "role",
    [
        "owner",
        "operator",
    ],
)
def test_owner_and_operator_can_access_pricing(
    db,
    role,
):
    add_room_type(db)

    client = authenticated_client(
        db,
        role=role,
    )

    response = client.get(
        "/operator/pricing/room-types"
    )

    assert response.status_code == 200


def test_logged_out_user_cannot_access_pricing(
    db,
):
    add_room_type(db)

    client = TestClient(app)

    response = client.get(
        "/operator/pricing/room-types"
    )

    assert response.status_code == 401


def test_staff_cannot_access_pricing(
    db,
):
    add_room_type(db)

    client = authenticated_client(
        db,
        role="staff",
    )

    response = client.get(
        "/operator/pricing/room-types"
    )

    assert response.status_code == 403


def test_room_type_list_contains_rates(
    db,
):
    room_type = add_room_type(
        db,
        name="Automated Couple Room",
        capacity=2,
    )

    add_rate(
        db,
        room_type,
        rate_plan="with_breakfast",
        amount=Decimal("1950.00"),
    )

    add_rate(
        db,
        room_type,
        rate_plan="without_breakfast",
        amount=Decimal("1750.00"),
    )

    client = authenticated_client(
        db,
        role="operator",
    )

    response = client.get(
        "/operator/pricing/room-types"
    )

    assert response.status_code == 200

    body = response.json()

    assert len(body) == 1
    assert body[0]["capacity"] == 2
    assert len(body[0]["rates"]) == 2

    amounts = {
        item["rate_plan"]:
            Decimal(item["amount"])
        for item in body[0]["rates"]
    }

    assert (
        amounts["with_breakfast"]
        == Decimal("1950.00")
    )

    assert (
        amounts["without_breakfast"]
        == Decimal("1750.00")
    )


def test_room_type_can_be_updated(
    db,
):
    room_type = add_room_type(
        db
    )

    client = authenticated_client(
        db,
        role="operator",
    )

    response = client.patch(
        (
            "/operator/pricing/"
            f"room-types/{room_type.id}"
        ),
        json={
            "name": "Updated Test Room",
            "capacity": 6,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert (
        body["name"]
        == "Updated Test Room"
    )
    assert body["capacity"] == 6


def test_room_rate_can_be_updated(
    db,
):
    room_type = add_room_type(
        db
    )

    rate = add_rate(
        db,
        room_type,
    )

    client = authenticated_client(
        db,
        role="operator",
    )

    response = client.patch(
        (
            "/operator/pricing/"
            f"room-types/{room_type.id}/"
            f"rates/{rate.id}"
        ),
        json={
            "amount": 2999.50,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert (
        Decimal(body["amount"])
        == Decimal("2999.50")
    )


def test_rate_cannot_be_updated_through_wrong_room_type(
    db,
):
    first_type = add_room_type(
        db,
        code="first",
        name="First Test Room",
    )

    second_type = add_room_type(
        db,
        code="second",
        name="Second Test Room",
    )

    rate = add_rate(
        db,
        first_type,
    )

    client = authenticated_client(
        db,
        role="operator",
    )

    response = client.patch(
        (
            "/operator/pricing/"
            f"room-types/{second_type.id}/"
            f"rates/{rate.id}"
        ),
        json={
            "amount": 9999,
        },
    )

    assert response.status_code == 404

    db.refresh(rate)

    assert (
        rate.amount
        == Decimal("2500.00")
    )


def test_extra_charges_can_be_listed(
    db,
):
    charge = add_extra_charge(
        db,
        name="Pet Charge",
        amount=Decimal("300.00"),
    )

    client = authenticated_client(
        db,
        role="operator",
    )

    response = client.get(
        "/operator/pricing/extra-charges"
    )

    assert response.status_code == 200

    body = response.json()

    assert len(body) == 1
    assert body[0]["id"] == charge.id
    assert body[0]["name"] == "Pet Charge"

    assert (
        Decimal(body[0]["amount"])
        == Decimal("300.00")
    )


def test_extra_charge_can_be_updated(
    db,
):
    charge = add_extra_charge(
        db
    )

    client = authenticated_client(
        db,
        role="operator",
    )

    response = client.patch(
        (
            "/operator/pricing/"
            f"extra-charges/{charge.id}"
        ),
        json={
            "name": "Updated Charge",
            "amount": 425,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert (
        body["name"]
        == "Updated Charge"
    )

    assert (
        Decimal(body["amount"])
        == Decimal("425.00")
    )
