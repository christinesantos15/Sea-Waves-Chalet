from datetime import (
    datetime,
    timedelta,
    timezone,
)

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    Response,
    status,
)
from sqlalchemy import (
    func,
    select,
)
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies.auth import (
    get_current_user,
)
from app.models import (
    AuthSession,
    User,
)
from app.schemas.auth import (
    AuthUserResponse,
    LoginRequest,
    LogoutResponse,
)
from app.security import (
    create_session_token,
    hash_session_token,
    verify_password,
)


router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


def utc_now() -> datetime:
    return datetime.now(
        timezone.utc
    )


def build_user_response(
    user: User,
) -> AuthUserResponse:
    return AuthUserResponse(
        id=user.id,
        username=user.username,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
    )


@router.post(
    "/login",
    response_model=AuthUserResponse,
)
def login(
    data: LoginRequest,
    response: Response,
    db: Session = Depends(
        get_db
    ),
) -> AuthUserResponse:
    username = (
        data.username
        .strip()
        .lower()
    )

    user = db.scalar(
        select(User)
        .where(
            func.lower(
                User.username
            )
            == username,
        )
    )

    if (
        user is None
        or not user.is_active
        or not verify_password(
            data.password,
            user.password_hash,
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )

    token = create_session_token()

    expires_at = (
        utc_now()
        + timedelta(
            hours=(
                settings.auth_session_hours
            )
        )
    )

    session = AuthSession(
        user_id=user.id,
        token_hash=(
            hash_session_token(
                token
            )
        ),
        expires_at=expires_at,
    )

    db.add(
        session
    )

    db.commit()

    max_age = (
        settings.auth_session_hours
        * 60
        * 60
    )

    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        max_age=max_age,
        httponly=True,
        secure=(
            settings.auth_cookie_secure
        ),
        samesite="lax",
        path="/",
    )

    return build_user_response(
        user
    )


@router.get(
    "/me",
    response_model=AuthUserResponse,
)
def me(
    user: User = Depends(
        get_current_user
    ),
) -> AuthUserResponse:
    return build_user_response(
        user
    )


@router.post(
    "/logout",
    response_model=LogoutResponse,
)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(
        get_db
    ),
) -> LogoutResponse:
    token = request.cookies.get(
        settings.auth_cookie_name
    )

    if token:
        token_hash = (
            hash_session_token(
                token
            )
        )

        session = db.scalar(
            select(
                AuthSession
            )
            .where(
                AuthSession.token_hash
                == token_hash,
                AuthSession.revoked_at
                .is_(None),
            )
        )

        if session is not None:
            session.revoked_at = (
                utc_now()
            )

            db.commit()

    response.delete_cookie(
        key=settings.auth_cookie_name,
        path="/",
        httponly=True,
        secure=(
            settings.auth_cookie_secure
        ),
        samesite="lax",
    )

    return LogoutResponse(
        status="ok"
    )