from pydantic import (
    BaseModel,
    ConfigDict,
)


class CottageMediaResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    cottage_id: int

    media_type: str
    url: str

    alt_text: str | None
    caption: str | None

    sort_order: int
    is_cover: bool
    is_active: bool
