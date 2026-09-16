from decimal import Decimal

from fastapi.testclient import TestClient

from app.main import app
from app.models import (
    ExtraCharge,
    RoomRate,
    RoomType,
)


client = TestClient(app)


def add_room_type(
    db,
    *,
    code: str,
    name: str,
    capacity: int,
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
    rate_plan: str,
    amount: Decimal,
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


def add_charge(
    db,
    *,
    code: str,
    name: str,
    amount: Decimal,
    is_active: bool = True,
) -> ExtraCharge:
    charge = ExtraCharge(
        code=code,
        name=name,
        amount=amount,
        is_active=is_active,
    )

    db.add(charge)
    db.commit()
    db.refresh(charge)

    return charge


def test_public_room_types_require_no_auth(
    db,
):
    room_type = add_room_type(
        db,
        code="couple",
        name="Couple Room",
        capacity=2,
    )

    add_rate(
        db,
        room_type,
        rate_plan="without_breakfast",
        amount=Decimal("1750.00"),
    )

    add_rate(
        db,
        room_type,
        rate_plan="with_breakfast",
        amount=Decimal("1950.00"),
    )

    response = client.get(
        "/pricing/room-types"
    )

    assert response.status_code == 200

    body = response.json()

    assert len(body) == 1
    assert body[0]["name"] == "Couple Room"
    assert body[0]["capacity"] == 2

    assert body[0]["rates"] == [
        {
            "rate_plan":
                "without_breakfast",
            "amount": "1750.00",
        },
        {
            "rate_plan":
                "with_breakfast",
            "amount": "1950.00",
        },
    ]


def test_inactive_room_types_are_hidden(
    db,
):
    add_room_type(
        db,
        code="active",
        name="Active Room",
        capacity=2,
        is_active=True,
    )

    add_room_type(
        db,
        code="inactive",
        name="Inactive Room",
        capacity=4,
        is_active=False,
    )

    response = client.get(
        "/pricing/room-types"
    )

    assert response.status_code == 200

    body = response.json()

    assert len(body) == 1
    assert body[0]["code"] == "active"


def test_inactive_room_rates_are_hidden(
    db,
):
    room_type = add_room_type(
        db,
        code="budget",
        name="Budget Room",
        capacity=4,
    )

    add_rate(
        db,
        room_type,
        rate_plan="without_breakfast",
        amount=Decimal("2350.00"),
        is_active=True,
    )

    add_rate(
        db,
        room_type,
        rate_plan="with_breakfast",
        amount=Decimal("2750.00"),
        is_active=False,
    )

    response = client.get(
        "/pricing/room-types"
    )

    assert response.status_code == 200

    rates = response.json()[0]["rates"]

    assert rates == [
        {
            "rate_plan":
                "without_breakfast",
            "amount": "2350.00",
        }
    ]


def test_public_extra_charges_only_show_active(
    db,
):
    add_charge(
        db,
        code="pet",
        name="Pet Charge",
        amount=Decimal("300.00"),
        is_active=True,
    )

    add_charge(
        db,
        code="old_charge",
        name="Old Charge",
        amount=Decimal("999.00"),
        is_active=False,
    )

    response = client.get(
        "/pricing/extra-charges"
    )

    assert response.status_code == 200

    body = response.json()

    assert body == [
        {
            "id": body[0]["id"],
            "code": "pet",
            "name": "Pet Charge",
            "amount": "300.00",
        }
    ]
