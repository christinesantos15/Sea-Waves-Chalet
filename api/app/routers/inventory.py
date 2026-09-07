from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Amenity, Cottage, Room
from app.schemas.amenity import AmenityResponse
from app.schemas.cottage import (
    CottageDetailResponse,
    CottageResponse,
)
from app.schemas.room import RoomResponse


router = APIRouter(
    tags=["inventory"],
)


@router.get(
    "/cottages",
    response_model=list[CottageResponse],
)
def get_cottages(
    db: Session = Depends(get_db),
) -> list[Cottage]:
    statement = (
        select(Cottage)
        .where(Cottage.is_active.is_(True))
        .order_by(Cottage.code)
    )

    return list(db.scalars(statement).all())


@router.get(
    "/cottages/{cottage_id}",
    response_model=CottageDetailResponse,
)
def get_cottage(
    cottage_id: int,
    db: Session = Depends(get_db),
) -> CottageDetailResponse:
    cottage = db.get(Cottage, cottage_id)

    if cottage is None or not cottage.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cottage not found.",
        )

    room_statement = (
        select(Room)
        .where(
            Room.cottage_id == cottage.id,
            Room.is_active.is_(True),
        )
        .order_by(Room.code)
    )

    rooms = list(db.scalars(room_statement).all())

    return CottageDetailResponse(
        id=cottage.id,
        code=cottage.code,
        name=cottage.name,
        description=cottage.description,
        capacity=cottage.capacity,
        base_rate=cottage.base_rate,
        status=cottage.status,
        is_active=cottage.is_active,
        map_x=cottage.map_x,
        map_y=cottage.map_y,
        rooms=[
            RoomResponse.model_validate(room)
            for room in rooms
        ],
    )


@router.get(
    "/cottages/{cottage_id}/rooms",
    response_model=list[RoomResponse],
)
def get_cottage_rooms(
    cottage_id: int,
    db: Session = Depends(get_db),
) -> list[Room]:
    cottage = db.get(Cottage, cottage_id)

    if cottage is None or not cottage.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cottage not found.",
        )

    statement = (
        select(Room)
        .where(
            Room.cottage_id == cottage_id,
            Room.is_active.is_(True),
        )
        .order_by(Room.code)
    )

    return list(db.scalars(statement).all())


@router.get(
    "/amenities",
    response_model=list[AmenityResponse],
)
def get_amenities(
    db: Session = Depends(get_db),
) -> list[Amenity]:
    statement = (
        select(Amenity)
        .where(Amenity.is_active.is_(True))
        .order_by(Amenity.name)
    )

    return list(db.scalars(statement).all())