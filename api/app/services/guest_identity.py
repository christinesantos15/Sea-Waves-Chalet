import re
from dataclasses import dataclass

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
