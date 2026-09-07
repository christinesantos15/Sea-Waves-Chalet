from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class AmenityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    description: str | None
    icon: str | None
    is_active: bool
    map_x: Decimal | None
    map_y: Decimal | None