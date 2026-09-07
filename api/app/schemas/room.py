from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class RoomResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cottage_id: int
    code: str
    name: str
    description: str | None
    capacity: int | None
    base_rate: Decimal | None
    status: str
    is_active: bool