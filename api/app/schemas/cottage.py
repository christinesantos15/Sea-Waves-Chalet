from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.schemas.room import RoomResponse


class CottageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    description: str | None
    capacity: int | None
    base_rate: Decimal | None
    status: str
    is_active: bool
    map_x: Decimal | None
    map_y: Decimal | None


class CottageDetailResponse(CottageResponse):
    rooms: list[RoomResponse]