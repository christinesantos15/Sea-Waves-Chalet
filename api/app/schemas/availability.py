from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class RoomAvailabilityResponse(BaseModel):
    id: int
    code: str
    name: str
    capacity: int | None
    base_rate: Decimal | None
    status: str
    available: bool


class CottageAvailabilityResponse(BaseModel):
    cottage_id: int
    cottage_code: str
    cottage_name: str
    check_in: date
    check_out: date
    rooms: list[RoomAvailabilityResponse]