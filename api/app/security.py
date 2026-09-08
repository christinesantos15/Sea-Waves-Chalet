import base64
import hashlib
import hmac
import os
import secrets


SCRYPT_N = 2**14
SCRYPT_R = 8
SCRYPT_P = 1
SCRYPT_DKLEN = 64


def _encode(
    value: bytes,
) -> str:
    return (
        base64.urlsafe_b64encode(
            value
        )
        .decode("ascii")
        .rstrip("=")
    )


def _decode(
    value: str,
) -> bytes:
    padding = "=" * (
        (-len(value)) % 4
    )

    return (
        base64.urlsafe_b64decode(
            value + padding
        )
    )


def hash_password(
    password: str,
) -> str:
    if len(password) < 10:
        raise ValueError(
            "Password must contain at least 10 characters."
        )

    salt = os.urandom(16)

    derived_key = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=SCRYPT_N,
        r=SCRYPT_R,
        p=SCRYPT_P,
        dklen=SCRYPT_DKLEN,
    )

    return (
        f"scrypt$"
        f"{SCRYPT_N}$"
        f"{SCRYPT_R}$"
        f"{SCRYPT_P}$"
        f"{_encode(salt)}$"
        f"{_encode(derived_key)}"
    )


def verify_password(
    password: str,
    stored_hash: str,
) -> bool:
    try:
        (
            algorithm,
            n_value,
            r_value,
            p_value,
            salt_value,
            hash_value,
        ) = stored_hash.split(
            "$",
            5,
        )

        if algorithm != "scrypt":
            return False

        salt = _decode(
            salt_value
        )

        expected_hash = _decode(
            hash_value
        )

        actual_hash = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=int(n_value),
            r=int(r_value),
            p=int(p_value),
            dklen=len(
                expected_hash
            ),
        )

        return hmac.compare_digest(
            actual_hash,
            expected_hash,
        )
    except (
        ValueError,
        TypeError,
    ):
        return False


def create_session_token() -> str:
    return secrets.token_urlsafe(
        48
    )


def hash_session_token(
    token: str,
) -> str:
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()