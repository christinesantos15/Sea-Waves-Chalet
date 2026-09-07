from decimal import Decimal

from sqlalchemy import select

from app.database import SessionLocal
from app.models import Amenity, Cottage, Room


COTTAGES = [
    {
        "code": "C01",
        "name": "Cottage 1",
        "x": 50.37,
        "y": 39.71,
    },
    {
        "code": "C02",
        "name": "Cottage 2",
        "x": 56.93,
        "y": 46.33,
    },
    {
        "code": "C03",
        "name": "Cottage 3",
        "x": 63.61,
        "y": 53.83,
    },
    {
        "code": "C04",
        "name": "Cottage 4",
        "x": 71.91,
        "y": 60.60,
    },
    {
        "code": "C05",
        "name": "Cottage 5",
        "x": 78.34,
        "y": 67.80,
    },
    {
        "code": "C06",
        "name": "Cottage 6",
        "x": 82.92,
        "y": 75.60,
    },
    {
        "code": "C07",
        "name": "Cottage 7",
        "x": 35.52,
        "y": 57.07,
    },
    {
        "code": "C08",
        "name": "Cottage 8",
        "x": 43.44,
        "y": 63.68,
    },
    {
        "code": "C09",
        "name": "Cottage 9",
        "x": 48.64,
        "y": 72.07,
    },
    {
        "code": "C10",
        "name": "Cottage 10",
        "x": 55.07,
        "y": 79.12,
    },
    {
        "code": "C11",
        "name": "Cottage 11",
        "x": 65.47,
        "y": 84.86,
    },
    {
        "code": "C12",
        "name": "Cottage 12",
        "x": 71.04,
        "y": 91.92,
    },
]


AMENITIES = [
    {
        "code": "SWIMMING_POOL",
        "name": "Swimming Pool",
        "description": "Main swimming pool area.",
        "icon": "pool",
        "x": 29.61,
        "y": 19.41,
    },
    {
        "code": "EVENT_HALL",
        "name": "Event Hall",
        "description": "Main events and function area.",
        "icon": "event",
        "x": 60.97,
        "y": 66.32,
    },
    {
        "code": "BILLIARDS",
        "name": "Billiards / 8-Ball Pool & Lounge",
        "description": (
            "Billiards and lounge area opposite "
            "the swimming pool."
        ),
        "icon": "billiards",
        "x": 27.91,
        "y": 40.49,
    },
    {
        "code": "BEACH_ACCESS",
        "name": "Beach Access",
        "description": "Access toward the beach.",
        "icon": "beach",
        "x": 15.08,
        "y": 18.93,
    },
    {
        "code": "MAIN_ENTRANCE",
        "name": "Main Entrance",
        "description": "Main resort entrance and gate.",
        "icon": "entrance",
        "x": 83.32,
        "y": 87.99,
    },
]


def decimal_coordinate(value: float) -> Decimal:
    return Decimal(str(value))


def seed_amenities(db) -> None:
    for data in AMENITIES:
        existing = db.scalar(
            select(Amenity).where(
                Amenity.code == data["code"]
            )
        )

        if existing is not None:
            continue

        amenity = Amenity(
            code=data["code"],
            name=data["name"],
            description=data["description"],
            icon=data["icon"],
            is_active=True,
            map_x=decimal_coordinate(data["x"]),
            map_y=decimal_coordinate(data["y"]),
        )

        db.add(amenity)


def seed_cottages_and_rooms(db) -> None:
    for data in COTTAGES:
        cottage = db.scalar(
            select(Cottage).where(
                Cottage.code == data["code"]
            )
        )

        if cottage is None:
            cottage = Cottage(
                code=data["code"],
                name=data["name"],
                description=(
                    "Temporary cottage record. "
                    "Official property details "
                    "are still to be confirmed."
                ),
                capacity=None,
                base_rate=None,
                status="available",
                is_active=True,
                map_x=decimal_coordinate(data["x"]),
                map_y=decimal_coordinate(data["y"]),
            )

            db.add(cottage)
            db.flush()

        for room_number in (1, 2):
            room_code = f"R{room_number}"

            room = db.scalar(
                select(Room).where(
                    Room.cottage_id == cottage.id,
                    Room.code == room_code,
                )
            )

            if room is not None:
                continue

            db.add(
                Room(
                    cottage_id=cottage.id,
                    code=room_code,
                    name=f"Room {room_number}",
                    description=(
                        "Room details are still "
                        "to be confirmed."
                    ),
                    capacity=None,
                    base_rate=None,
                    status="available",
                    is_active=True,
                )
            )


def main() -> None:
    with SessionLocal() as db:
        try:
            seed_amenities(db)
            seed_cottages_and_rooms(db)

            db.commit()

            print("Sea Waves resort seed complete.")

        except Exception:
            db.rollback()
            raise


if __name__ == "__main__":
    main()