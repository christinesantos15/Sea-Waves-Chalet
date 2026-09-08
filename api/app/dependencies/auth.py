from collections.abc import Callable
from datetime import datetime, timezone

from fastapi import (
    Depends,
    HTTPException,
    Request,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import (
    AuthSession,
    User,
)
from app.security import (
    hash_session_token,
)


def utc_now() -> datetime:
    return datetime.now(
        timezone.utc
    )


def get_current_user(
    request: Request,
    db: Session = Depends(
        get_db
    ),
) -> User:
    token = request.cookies.get(
        settings.auth_cookie_name
    )

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    token_hash = hash_session_token(
        token
    )

    row = db.execute(
        select(
            AuthSession,
            User,
        )
        .join(
            User,
            User.id
            == AuthSession.user_id,
        )
        .where(
            AuthSession.token_hash
            == token_hash,
            AuthSession.revoked_at
            .is_(None),
            AuthSession.expires_at
            > utc_now(),
            User.is_active
            .is_(True),
        )
    ).first()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session is invalid or expired.",
        )

    _, user = row

    return user


def require_roles(
    *allowed_roles: str,
) -> Callable[..., User]:
    def dependency(
        user: User = Depends(
            get_current_user
        ),
    ) -> User:
        if (
            user.role
            not in allowed_roles
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource.",
            )

        return user

    return dependency