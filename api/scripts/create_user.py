import getpass

from sqlalchemy import (
    func,
    select,
)

from app.database import SessionLocal
from app.models import User
from app.security import hash_password


ALLOWED_ROLES = {
    "owner",
    "operator",
    "staff",
}


def main() -> None:
    username = (
        input(
            "Username: "
        )
        .strip()
        .lower()
    )

    role = (
        input(
            "Role "
            "(owner/operator/staff): "
        )
        .strip()
        .lower()
    )

    if not username:
        raise SystemExit(
            "Username is required."
        )

    if role not in ALLOWED_ROLES:
        raise SystemExit(
            "Invalid role."
        )

    password = getpass.getpass(
        "Password: "
    )

    confirm_password = (
        getpass.getpass(
            "Confirm password: "
        )
    )

    if password != confirm_password:
        raise SystemExit(
            "Passwords do not match."
        )

    try:
        password_hash = (
            hash_password(
                password
            )
        )
    except ValueError as error:
        raise SystemExit(
            str(error)
        ) from error

    with SessionLocal() as db:
        existing_user = db.scalar(
            select(User)
            .where(
                func.lower(
                    User.username
                )
                == username,
            )
        )

        if existing_user is not None:
            raise SystemExit(
                "Username already exists."
            )

        user = User(
            username=username,
            password_hash=(
                password_hash
            ),
            role=role,
            is_active=True,
        )

        db.add(
            user
        )

        db.commit()

        db.refresh(
            user
        )

        print(
            f"Created user "
            f"{user.username!r} "
            f"with role "
            f"{user.role!r} "
            f"and id "
            f"{user.id}."
        )


if __name__ == "__main__":
    main()