from datetime import (
    datetime,
    timezone,
)

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy import (
    func,
    select,
    update,
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import require_roles
from app.models import (
    AuthSession,
    User,
)
from app.schemas.owner_user import (
    OwnerUserActiveUpdate,
    OwnerUserCreate,
    OwnerUserPasswordReset,
    OwnerUserPasswordResetResponse,
    OwnerUserResponse,
)
from app.security import hash_password


router = APIRouter(
    prefix="/owner/users",
    tags=["owner users"],
    dependencies=[
        Depends(
            require_roles(
                "owner",
            )
        )
    ],
)


def utc_now() -> datetime:
    return datetime.now(
        timezone.utc,
    )


def revoke_user_sessions(
    db: Session,
    user_id: int,
) -> None:
    db.execute(
        update(
            AuthSession,
        )
        .where(
            AuthSession.user_id
            == user_id,
            AuthSession.revoked_at.is_(
                None,
            ),
        )
        .values(
            revoked_at=utc_now(),
        )
    )


@router.get(
    "",
    response_model=list[
        OwnerUserResponse
    ],
)
def list_users(
    db: Session = Depends(get_db),
) -> list[User]:
    statement = (
        select(User)
        .order_by(
            User.id,
        )
    )

    return list(
        db.scalars(
            statement,
        ).all()
    )


@router.post(
    "",
    response_model=OwnerUserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    data: OwnerUserCreate,
    db: Session = Depends(get_db),
) -> User:
    username = (
        data.username
        .strip()
        .lower()
    )

    if not username:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username is required.",
        )

    existing_user = db.scalar(
        select(User).where(
            func.lower(
                User.username,
            )
            == username
        )
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists.",
        )

    try:
        password_hash = hash_password(
            data.password,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error

    user = User(
        username=username,
        password_hash=password_hash,
        role=data.role,
        is_active=True,
    )

    db.add(
        user,
    )
    db.commit()
    db.refresh(
        user,
    )

    return user


@router.patch(
    "/{user_id}/active",
    response_model=OwnerUserResponse,
)
def update_user_active_status(
    user_id: int,
    data: OwnerUserActiveUpdate,
    current_user: User = Depends(
        require_roles(
            "owner",
        )
    ),
    db: Session = Depends(get_db),
) -> User:
    user = db.get(
        User,
        user_id,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if (
        user.id
        == current_user.id
        and not data.is_active
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "You cannot deactivate "
                "your own account."
            ),
        )

    if (
        user.is_active
        == data.is_active
    ):
        return user

    user.is_active = (
        data.is_active
    )

    if not data.is_active:
        revoke_user_sessions(
            db,
            user.id,
        )

    db.commit()
    db.refresh(
        user,
    )

    return user


@router.patch(
    "/{user_id}/password",
    response_model=OwnerUserPasswordResetResponse,
)
def reset_user_password(
    user_id: int,
    data: OwnerUserPasswordReset,
    db: Session = Depends(get_db),
) -> OwnerUserPasswordResetResponse:
    user = db.get(
        User,
        user_id,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if user.role == "owner":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Owner passwords cannot be reset "
                "through user management."
            ),
        )

    try:
        password_hash = hash_password(
            data.password,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error

    user.password_hash = (
        password_hash
    )

    revoke_user_sessions(
        db,
        user.id,
    )

    db.commit()

    return OwnerUserPasswordResetResponse(
        status="password_reset",
        user_id=user.id,
        username=user.username,
    )