from fastapi import (
    APIRouter,
    Depends,
)
from sqlalchemy import (
    case,
    select,
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    ExtraCharge,
    RoomRate,
    RoomType,
)
from app.schemas.public_pricing import (
    PublicExtraChargeResponse,
    PublicRoomRateResponse,
    PublicRoomTypePricingResponse,
)


router = APIRouter(
    prefix="/pricing",
    tags=["pricing"],
)


@router.get(
    "/room-types",
    response_model=list[
        PublicRoomTypePricingResponse
    ],
)
def list_public_room_types(
    db: Session = Depends(get_db),
):
    room_types = list(
        db.scalars(
            select(RoomType)
            .where(
                RoomType.is_active.is_(
                    True
                )
            )
            .order_by(
                RoomType.id.asc()
            )
        ).all()
    )

    result = []

    for room_type in room_types:
        rates = list(
            db.scalars(
                select(RoomRate)
                .where(
                    RoomRate.room_type_id
                    == room_type.id,
                    RoomRate.is_active.is_(
                        True
                    ),
                )
                .order_by(
                    case(
                        (
                            RoomRate.rate_plan
                            == "without_breakfast",
                            0,
                        ),
                        (
                            RoomRate.rate_plan
                            == "with_breakfast",
                            1,
                        ),
                        else_=2,
                    ),
                    RoomRate.id.asc(),
                )
            ).all()
        )

        result.append(
            PublicRoomTypePricingResponse(
                id=room_type.id,
                code=room_type.code,
                name=room_type.name,
                capacity=room_type.capacity,
                rates=[
                    PublicRoomRateResponse(
                        rate_plan=
                            rate.rate_plan,
                        amount=rate.amount,
                    )
                    for rate in rates
                ],
            )
        )

    return result


@router.get(
    "/extra-charges",
    response_model=list[
        PublicExtraChargeResponse
    ],
)
def list_public_extra_charges(
    db: Session = Depends(get_db),
):
    charges = list(
        db.scalars(
            select(ExtraCharge)
            .where(
                ExtraCharge.is_active.is_(
                    True
                )
            )
            .order_by(
                ExtraCharge.id.asc()
            )
        ).all()
    )

    return [
        PublicExtraChargeResponse(
            id=charge.id,
            code=charge.code,
            name=charge.name,
            amount=charge.amount,
        )
        for charge in charges
    ]
