from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy import (
    select,
    update,
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import (
    require_roles,
)
from app.models import (
    Cottage,
    CottageMedia,
    Room,
    RoomType,
)
from app.schemas.cottage_media import (
    CottageMediaResponse,
)
from app.schemas.room import RoomResponse

from app.schemas.operator_cottage import (
    OperatorRoomTypeAssignment,
    CottageMediaCreate,
    CottageMediaUpdate,
    OperatorCottageDetail,
    OperatorCottageUpdate,
)


router = APIRouter(
    prefix="/operator/cottages",
    tags=["operator cottages"],
    dependencies=[
        Depends(
            require_roles(
                "owner",
                "operator",
            )
        )
    ],
)


def clean_optional(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    cleaned = value.strip()

    return (
        cleaned
        if cleaned
        else None
    )


def get_cottage_or_404(
    db: Session,
    cottage_id: int,
) -> Cottage:
    cottage = db.get(
        Cottage,
        cottage_id,
    )

    if cottage is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Cottage not found.",
        )

    return cottage


def get_media_or_404(
    db: Session,
    cottage_id: int,
    media_id: int,
) -> CottageMedia:
    media = db.scalar(
        select(CottageMedia)
        .where(
            CottageMedia.id
            == media_id,
            CottageMedia.cottage_id
            == cottage_id,
        )
    )

    if media is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "Cottage media not found."
            ),
        )

    return media


def get_rooms(
    db: Session,
    cottage_id: int,
):
    return list(
        db.scalars(
            select(Room)
            .where(
                Room.cottage_id
                == cottage_id,
            )
            .order_by(
                Room.code.asc()
            )
        ).all()
    )


def get_media(
    db: Session,
    cottage_id: int,
):
    return list(
        db.scalars(
            select(CottageMedia)
            .where(
                CottageMedia.cottage_id
                == cottage_id,
            )
            .order_by(
                CottageMedia.is_cover.desc(),
                CottageMedia.sort_order.asc(),
                CottageMedia.id.asc(),
            )
        ).all()
    )


def build_cottage_detail(
    db: Session,
    cottage: Cottage,
) -> OperatorCottageDetail:
    rooms = get_rooms(
        db,
        cottage.id,
    )

    media = get_media(
        db,
        cottage.id,
    )

    return OperatorCottageDetail(
        id=cottage.id,
        code=cottage.code,
        name=cottage.name,
        description=(
            cottage.description
        ),
        capacity=cottage.capacity,
        base_rate=cottage.base_rate,
        status=cottage.status,
        is_active=cottage.is_active,
        map_x=cottage.map_x,
        map_y=cottage.map_y,
        rooms=rooms,
        media=[
            CottageMediaResponse.model_validate(
                item
            )
            for item in media
        ],
    )


def clear_other_active_covers(
    db: Session,
    *,
    cottage_id: int,
    except_media_id: int | None = None,
) -> None:
    statement = (
        update(CottageMedia)
        .where(
            CottageMedia.cottage_id
            == cottage_id,
            CottageMedia.is_cover.is_(
                True
            ),
            CottageMedia.is_active.is_(
                True
            ),
        )
        .values(
            is_cover=False
        )
    )

    if except_media_id is not None:
        statement = statement.where(
            CottageMedia.id
            != except_media_id
        )

    db.execute(statement)


@router.get(
    "",
    response_model=list[
        OperatorCottageDetail
    ],
)
def list_cottages(
    db: Session = Depends(get_db),
):
    cottages = list(
        db.scalars(
            select(Cottage)
            .order_by(
                Cottage.code.asc()
            )
        ).all()
    )

    return [
        build_cottage_detail(
            db,
            cottage,
        )
        for cottage in cottages
    ]


@router.get(
    "/{cottage_id}",
    response_model=OperatorCottageDetail,
)
def get_cottage(
    cottage_id: int,
    db: Session = Depends(get_db),
):
    cottage = get_cottage_or_404(
        db,
        cottage_id,
    )

    return build_cottage_detail(
        db,
        cottage,
    )


@router.patch(
    "/{cottage_id}",
    response_model=OperatorCottageDetail,
)
def update_cottage(
    cottage_id: int,
    data: OperatorCottageUpdate,
    db: Session = Depends(get_db),
):
    cottage = get_cottage_or_404(
        db,
        cottage_id,
    )

    fields = data.model_fields_set

    try:
        if "name" in fields:
            cleaned_name = (
                clean_optional(
                    data.name
                )
            )

            if cleaned_name is None:
                raise HTTPException(
                    status_code=(
                        status.HTTP_422_UNPROCESSABLE_CONTENT
                    ),
                    detail=(
                        "Cottage name is required."
                    ),
                )

            cottage.name = cleaned_name

        if "description" in fields:
            cottage.description = (
                clean_optional(
                    data.description
                )
            )

        if "capacity" in fields:
            cottage.capacity = (
                data.capacity
            )

        if "base_rate" in fields:
            cottage.base_rate = (
                data.base_rate
            )

        if "status" in fields:
            cleaned_status = (
                clean_optional(
                    data.status
                )
            )

            if cleaned_status is None:
                raise HTTPException(
                    status_code=(
                        status.HTTP_422_UNPROCESSABLE_CONTENT
                    ),
                    detail=(
                        "Cottage status cannot be blank."
                    ),
                )

            cottage.status = (
                cleaned_status
            )

        if "is_active" in fields:
            cottage.is_active = bool(
                data.is_active
            )

        db.flush()

        response = (
            build_cottage_detail(
                db,
                cottage,
            )
        )

        db.commit()

        return response

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


@router.get(
    "/{cottage_id}/media",
    response_model=list[
        CottageMediaResponse
    ],
)
def list_cottage_media(
    cottage_id: int,
    db: Session = Depends(get_db),
):
    get_cottage_or_404(
        db,
        cottage_id,
    )

    return [
        CottageMediaResponse.model_validate(
            item
        )
        for item in get_media(
            db,
            cottage_id,
        )
    ]


@router.post(
    "/{cottage_id}/media",
    response_model=CottageMediaResponse,
    status_code=(
        status.HTTP_201_CREATED
    ),
)
def create_cottage_media(
    cottage_id: int,
    data: CottageMediaCreate,
    db: Session = Depends(get_db),
):
    get_cottage_or_404(
        db,
        cottage_id,
    )

    cleaned_url = (
        clean_optional(
            data.url
        )
    )

    if cleaned_url is None:
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_CONTENT
            ),
            detail="Media URL is required.",
        )

    if (
        data.is_cover
        and not data.is_active
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_CONTENT
            ),
            detail=(
                "An inactive media item "
                "cannot be the cover."
            ),
        )

    try:
        if data.is_cover:
            clear_other_active_covers(
                db,
                cottage_id=cottage_id,
            )

        media = CottageMedia(
            cottage_id=cottage_id,
            media_type=data.media_type,
            url=cleaned_url,
            alt_text=clean_optional(
                data.alt_text
            ),
            caption=clean_optional(
                data.caption
            ),
            sort_order=data.sort_order,
            is_cover=data.is_cover,
            is_active=data.is_active,
        )

        db.add(media)
        db.flush()

        response = (
            CottageMediaResponse
            .model_validate(
                media
            )
        )

        db.commit()

        return response

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


@router.patch(
    "/{cottage_id}/media/{media_id}",
    response_model=CottageMediaResponse,
)
def update_cottage_media(
    cottage_id: int,
    media_id: int,
    data: CottageMediaUpdate,
    db: Session = Depends(get_db),
):
    get_cottage_or_404(
        db,
        cottage_id,
    )

    media = get_media_or_404(
        db,
        cottage_id,
        media_id,
    )

    fields = data.model_fields_set

    try:
        if "media_type" in fields:
            if data.media_type is None:
                raise HTTPException(
                    status_code=(
                        status.HTTP_422_UNPROCESSABLE_CONTENT
                    ),
                    detail=(
                        "Media type is required."
                    ),
                )

            media.media_type = (
                data.media_type
            )

        if "url" in fields:
            cleaned_url = (
                clean_optional(
                    data.url
                )
            )

            if cleaned_url is None:
                raise HTTPException(
                    status_code=(
                        status.HTTP_422_UNPROCESSABLE_CONTENT
                    ),
                    detail=(
                        "Media URL is required."
                    ),
                )

            media.url = cleaned_url

        if "alt_text" in fields:
            media.alt_text = (
                clean_optional(
                    data.alt_text
                )
            )

        if "caption" in fields:
            media.caption = (
                clean_optional(
                    data.caption
                )
            )

        if "sort_order" in fields:
            if data.sort_order is None:
                raise HTTPException(
                    status_code=(
                        status.HTTP_422_UNPROCESSABLE_CONTENT
                    ),
                    detail=(
                        "Sort order is required."
                    ),
                )

            media.sort_order = (
                data.sort_order
            )

        if "is_active" in fields:
            media.is_active = bool(
                data.is_active
            )

            if not media.is_active:
                media.is_cover = False

        if "is_cover" in fields:
            requested_cover = bool(
                data.is_cover
            )

            if (
                requested_cover
                and not media.is_active
            ):
                raise HTTPException(
                    status_code=(
                        status.HTTP_422_UNPROCESSABLE_CONTENT
                    ),
                    detail=(
                        "An inactive media item "
                        "cannot be the cover."
                    ),
                )

            if requested_cover:
                clear_other_active_covers(
                    db,
                    cottage_id=cottage_id,
                    except_media_id=(
                        media.id
                    ),
                )

            media.is_cover = (
                requested_cover
            )

        db.flush()

        response = (
            CottageMediaResponse
            .model_validate(
                media
            )
        )

        db.commit()

        return response

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


@router.delete(
    "/{cottage_id}/media/{media_id}",
    status_code=(
        status.HTTP_204_NO_CONTENT
    ),
)
def deactivate_cottage_media(
    cottage_id: int,
    media_id: int,
    db: Session = Depends(get_db),
):
    get_cottage_or_404(
        db,
        cottage_id,
    )

    media = get_media_or_404(
        db,
        cottage_id,
        media_id,
    )

    try:
        media.is_active = False
        media.is_cover = False

        db.commit()

    except Exception:
        db.rollback()
        raise


@router.patch(
    "/{cottage_id}/rooms/{room_id}/room-type",
    response_model=RoomResponse,
)
def assign_room_type(
    cottage_id: int,
    room_id: int,
    data: OperatorRoomTypeAssignment,
    db: Session = Depends(get_db),
) -> RoomResponse:
    try:
        room = db.scalar(
            select(Room)
            .where(
                Room.id == room_id,
                Room.cottage_id
                == cottage_id,
            )
            .with_for_update()
        )

        if room is None:
            raise HTTPException(
                status_code=(
                    status.HTTP_404_NOT_FOUND
                ),
                detail=(
                    "Room not found for this cottage."
                ),
            )

        if data.room_type_id is not None:
            room_type = db.get(
                RoomType,
                data.room_type_id,
            )

            if room_type is None:
                raise HTTPException(
                    status_code=(
                        status.HTTP_404_NOT_FOUND
                    ),
                    detail=(
                        "Room type not found."
                    ),
                )

            if not room_type.is_active:
                raise HTTPException(
                    status_code=(
                        status.HTTP_422_UNPROCESSABLE_CONTENT
                    ),
                    detail=(
                        "Inactive room types "
                        "cannot be assigned."
                    ),
                )

        room.room_type_id = (
            data.room_type_id
        )

        db.flush()

        response = (
            RoomResponse.model_validate(
                room
            )
        )

        db.commit()

        return response

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise
