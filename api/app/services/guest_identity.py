import re
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Guest


IDENTITY_FIELDS = (
    "phone",
    "email",
    "facebook_name",
    "messenger_psid",
)


@dataclass(frozen=True)
class GuestIdentityMatch:
    field: str
    value: str


def clean_optional(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    cleaned = value.strip()

    return cleaned if cleaned else None


def normalize_phone(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    normalized = re.sub(
        r"\D",
        "",
        value,
    )

    return normalized or None


def normalize_email(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    normalized = (
        value.strip().casefold()
    )

    return normalized or None


def normalize_name(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    normalized = " ".join(
        value.split()
    ).casefold()

    return normalized or None


def normalize_psid(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    normalized = value.strip()

    return normalized or None


def guest_identity_values(
    guest: Guest,
) -> dict[str, str]:
    values: dict[str, str] = {}

    phone = normalize_phone(
        guest.phone
    )

    if phone:
        values["phone"] = phone

    email = normalize_email(
        guest.email
    )

    if email:
        values["email"] = email

    facebook_name = normalize_name(
        guest.facebook_name
    )

    if facebook_name:
        values["facebook_name"] = (
            facebook_name
        )

    messenger_psid = normalize_psid(
        guest.messenger_psid
    )

    if messenger_psid:
        values["messenger_psid"] = (
            messenger_psid
        )

    return values


def compare_guest_identity(
    first: Guest,
    second: Guest,
) -> list[GuestIdentityMatch]:
    first_values = (
        guest_identity_values(
            first
        )
    )

    second_values = (
        guest_identity_values(
            second
        )
    )

    matches: list[
        GuestIdentityMatch
    ] = []

    for field in IDENTITY_FIELDS:
        first_value = (
            first_values.get(
                field
            )
        )

        second_value = (
            second_values.get(
                field
            )
        )

        if (
            first_value
            and second_value
            and first_value
            == second_value
        ):
            matches.append(
                GuestIdentityMatch(
                    field=field,
                    value=(
                        first_value
                    ),
                )
            )

    return matches


def find_reusable_guest(
    db: Session,
    *,
    phone: str | None = None,
    email: str | None = None,
    messenger_psid: str | None = None,
) -> Guest | None:
    incoming_phone = (
        normalize_phone(
            phone
        )
    )

    incoming_email = (
        normalize_email(
            email
        )
    )

    incoming_psid = (
        normalize_psid(
            messenger_psid
        )
    )

    guests = list(
        db.scalars(
            select(Guest).order_by(
                Guest.id.asc()
            )
        ).all()
    )

    strong_matches: list[int] = []


    # Messenger PSID is a strong identity.
    if incoming_psid:
        psid_matches = [
            guest
            for guest in guests
            if normalize_psid(
                guest.messenger_psid
            )
            == incoming_psid
        ]

        # Ambiguous identity:
        # do not guess which record
        # should be reused.
        if len(psid_matches) > 1:
            return None

        if len(psid_matches) == 1:
            strong_matches.append(
                psid_matches[0].id
            )


    # Phone alone or email alone is
    # intentionally not enough.
    #
    # Phone + email together form a
    # strong identity signal.
    if (
        incoming_phone
        and incoming_email
    ):
        pair_matches = [
            guest
            for guest in guests
            if (
                normalize_phone(
                    guest.phone
                )
                == incoming_phone
                and
                normalize_email(
                    guest.email
                )
                == incoming_email
            )
        ]

        if len(pair_matches) > 1:
            return None

        if len(pair_matches) == 1:
            strong_matches.append(
                pair_matches[0].id
            )


    if not strong_matches:
        return None


    # If PSID and phone+email both
    # identify someone, they must point
    # to the same guest.
    unique_guest_ids = set(
        strong_matches
    )

    if len(unique_guest_ids) != 1:
        return None


    reusable_guest_id = next(
        iter(
            unique_guest_ids
        )
    )

    return next(
        (
            guest
            for guest in guests
            if guest.id
            == reusable_guest_id
        ),
        None,
    )


def fill_missing_guest_contacts(
    guest: Guest,
    *,
    phone: str | None = None,
    email: str | None = None,
    facebook_name: str | None = None,
    messenger_psid: str | None = None,
) -> None:
    incoming_values = {
        "phone":
            clean_optional(
                phone
            ),

        "email":
            clean_optional(
                email
            ),

        "facebook_name":
            clean_optional(
                facebook_name
            ),

        "messenger_psid":
            clean_optional(
                messenger_psid
            ),
    }

    for (
        field,
        incoming_value,
    ) in incoming_values.items():
        existing_value = (
            clean_optional(
                getattr(
                    guest,
                    field,
                )
            )
        )

        if (
            not existing_value
            and incoming_value
        ):
            setattr(
                guest,
                field,
                incoming_value,
            )


def get_or_create_guest(
    db: Session,
    *,
    full_name: str,
    phone: str | None = None,
    email: str | None = None,
    facebook_name: str | None = None,
    messenger_psid: str | None = None,
    creation_note: str,
) -> tuple[Guest, bool]:
    reusable_guest = (
        find_reusable_guest(
            db,
            phone=phone,
            email=email,
            messenger_psid=(
                messenger_psid
            ),
        )
    )

    if reusable_guest is not None:
        fill_missing_guest_contacts(
            reusable_guest,
            phone=phone,
            email=email,
            facebook_name=(
                facebook_name
            ),
            messenger_psid=(
                messenger_psid
            ),
        )

        db.flush()

        return (
            reusable_guest,
            False,
        )


    guest = Guest(
        full_name=full_name.strip(),
        phone=clean_optional(
            phone
        ),
        email=clean_optional(
            email
        ),
        facebook_name=clean_optional(
            facebook_name
        ),
        messenger_psid=clean_optional(
            messenger_psid
        ),
        notes=creation_note,
    )

    db.add(guest)
    db.flush()

    return (
        guest,
        True,
    )
