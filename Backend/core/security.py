# Password hashing and JWT helpers

from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import JWTError, jwt

from core.config import settings


# ============================================================================
# PASSWORD HASHING
# ============================================================================

def hash_password(plain_password: str) -> str:
    """
    Hash a plaintext password using bcrypt.

    The plaintext password is never stored in the database.
    """

    password_bytes = plain_password.encode("utf-8")

    salt = bcrypt.gensalt()

    hashed = bcrypt.hashpw(
        password_bytes,
        salt,
    )

    return hashed.decode("utf-8")


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    """
    Verify a plaintext password against a stored bcrypt hash.
    """

    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )

    except (
        ValueError,
        TypeError,
        bcrypt.errors.InvalidHash,
    ):
        return False


# ============================================================================
# JWT
# ============================================================================

def _create_token(
    data: dict[str, Any],
    expires_delta: timedelta,
    token_type: str,
) -> str:
    """
    Internal helper used to create access/refresh JWTs.
    """

    payload = data.copy()

    expire = (
        datetime.now(timezone.utc)
        + expires_delta
    )

    payload.update(
        {
            "exp": expire,
            "type": token_type,
        }
    )

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_access_token(
    subject: str,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    """
    Create a short-lived access token.

    `sub` contains the authenticated user's ID.
    """

    data = {
        "sub": subject,
        **(extra_claims or {}),
    }

    return _create_token(
        data=data,
        expires_delta=timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        ),
        token_type="access",
    )


def create_refresh_token(
    subject: str,
) -> str:
    """
    Create a longer-lived refresh token.
    """

    return _create_token(
        data={
            "sub": subject,
        },
        expires_delta=timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        ),
        token_type="refresh",
    )


def decode_token(
    token: str,
) -> dict[str, Any] | None:
    """
    Decode and validate a JWT.

    Returns None if:
    - token is malformed
    - signature is invalid
    - token is expired
    - token is otherwise invalid
    """

    try:

        return jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[
                settings.JWT_ALGORITHM
            ],
        )

    except JWTError:
        return None