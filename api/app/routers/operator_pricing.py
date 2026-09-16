from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import (
    require_roles,
)
from app.models import (
    ExtraCharge,
    RoomRate,
    RoomType,
)
from app.schemas.operator_pricing import (
    ExtraChargeResponse,
    ExtraChargeUpdate,
    RoomRateResponse,
    RoomRateUpdate,
    RoomTypePricingResponse,
    RoomTypeUpdate,
)


router = APIRouter(
    prefix="/operator/pricing",
    tags=["operator pricing"],
    dependencies=[
        Depends(
            require_roles(
                "owner",
                "operator",
            )
        )
    ],
)


def clean_required(
    value: str | None,
) -> str:
    cleaned = (
        value.strip()
        if value is not None
        else ""
    )

    if not cleaned:
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_CONTENT
            ),
            detail="Value cannot be blank.",
        )

    return cleaned


def get_room_type_or_404(
    db: Session,
    room_type_id: int,
) -> RoomType:
    room_type = db.get(
        RoomType,
        room_type_id,
    )

    if room_type is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Room type not found.",
        )

    return room_type


def get_room_rate_or_404(
    db: Session,
    room_type_id: int,
    rate_id: int,
) -> RoomRate:
    rate = db.scalar(
        select(RoomRate)
        .where(
            RoomRate.id == rate_id,
            RoomRate.room_type_id
            == room_type_id,
        )
    )

    if rate is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Room rate not found.",
        )

    return rate


def get_extra_charge_or_404(
    db: Session,
    charge_id: int,
) -> ExtraCharge:
    charge = db.get(
        ExtraCharge,
        charge_id,
    )

    if charge is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Extra charge not found.",
        )

    return charge


def build_room_type(
    db: Session,
    room_type: RoomType,
) -> RoomTypePricingResponse:
    rates = list(
        db.scalars(
            select(RoomRate)
            .where(
                RoomRate.room_type_id
                == room_type.id
            )
            .order_by(
                RoomRate.rate_plan.asc()
            )
        ).all()
    )

    return RoomTypePricingResponse(
        id=room_type.id,
        code=room_type.code,
        name=room_type.name,
        capacity=room_type.capacity,
        is_active=room_type.is_active,
        rates=[
            RoomRateResponse.model_validate(
                rate
            )
            for rate in rates
        ],
    )


@router.get(
    "/room-types",
    response_model=list[
        RoomTypePricingResponse
    ],
)
def list_room_types(
    db: Session = Depends(get_db),
):
    room_types = list(
        db.scalars(
            select(RoomType)
            .order_by(
                RoomType.id.asc()
            )
        ).all()
    )

    return [
        build_room_type(
            db,
            room_type,
        )
        for room_type in room_types
    ]


@router.patch(
    "/room-types/{room_type_id}",
    response_model=(
        RoomTypePricingResponse
    ),
)
def update_room_type(
    room_type_id: int,
    data: RoomTypeUpdate,
    db: Session = Depends(get_db),
):
    room_type = get_room_type_or_404(
        db,
        room_type_id,
    )

    fields = data.model_fields_set

    try:
        if "name" in fields:
            room_type.name = (
                clean_required(
                    data.name
                )
            )

        if "capacity" in fields:
            if data.capacity is None:
                raise HTTPException(
                    status_code=(
                        status.HTTP_422_UNPROCESSABLE_CONTENT
                    ),
                    detail=(
                        "Capacity is required."
                    ),
                )

            room_type.capacity = (
                data.capacity
            )

        if "is_active" in fields:
            room_type.is_active = bool(
                data.is_active
            )

        db.flush()

        response = build_room_type(
            db,
            room_type,
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
    "/room-types/{room_type_id}/rates/{rate_id}",
    response_model=RoomRateResponse,
)
def update_room_rate(
    room_type_id: int,
    rate_id: int,
    data: RoomRateUpdate,
    db: Session = Depends(get_db),
):
    get_room_type_or_404(
        db,
        room_type_id,
    )

    rate = get_room_rate_or_404(
        db,
        room_type_id,
        rate_id,
    )

    fields = data.model_fields_set

    try:
        if "amount" in fields:
            if data.amount is None:
                raise HTTPException(
                    status_code=(
                        status.HTTP_422_UNPROCESSABLE_CONTENT
                    ),
                    detail=(
                        "Rate amount is required."
                    ),
                )

            rate.amount = data.amount

        if "is_active" in fields:
            rate.is_active = bool(
                data.is_active
            )

        db.flush()

        response = (
            RoomRateResponse
            .model_validate(
                rate
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
    "/extra-charges",
    response_model=list[
        ExtraChargeResponse
    ],
)
def list_extra_charges(
    db: Session = Depends(get_db),
):
    return list(
        db.scalars(
            select(ExtraCharge)
            .order_by(
                ExtraCharge.id.asc()
            )
        ).all()
    )


@router.patch(
    "/extra-charges/{charge_id}",
    response_model=ExtraChargeResponse,
)
def update_extra_charge(
    charge_id: int,
    data: ExtraChargeUpdate,
    db: Session = Depends(get_db),
):
    charge = get_extra_charge_or_404(
        db,
        charge_id,
    )

    fields = data.model_fields_set

    try:
        if "name" in fields:
            charge.name = (
                clean_required(
                    data.name
                )
            )

        if "amount" in fields:
            if data.amount is None:
                raise HTTPException(
                    status_code=(
                        status.HTTP_422_UNPROCESSABLE_CONTENT
                    ),
                    detail=(
                        "Charge amount is required."
                    ),
                )

            charge.amount = (
                data.amount
            )

        if "is_active" in fields:
            charge.is_active = bool(
                data.is_active
            )

        db.flush()

        response = (
            ExtraChargeResponse
            .model_validate(
                charge
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
