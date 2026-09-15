"""
Security helpers: password hashing, JWT creation/decoding, auth cookies and
OTP generation/delivery.

Owned by the auth/BE-2 track. Included in this bundle so the BE-3 modules,
which depend on `get_current_user_from_cookie`, are runnable on their own.
"""

import logging
import re
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

import jwt
from fastapi import Response
from passlib.context import CryptContext

from core.config import settings

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_PATTERN = re.compile(r"^\+?\d{10,15}$")


# ---------------------------------------------------------------------------
# Passwords
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str | None) -> bool:
    if not hashed_password:
        return False
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except ValueError:
        return False


# ---------------------------------------------------------------------------
# Tokens
# ---------------------------------------------------------------------------

def _create_token(
    subject: str,
    token_type: str,
    expires_delta: timedelta,
    extra_claims: dict | None = None,
) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(
        payload,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_access_token(
    subject: str,
    extra_claims: dict | None = None,
) -> str:
    return _create_token(
        subject,
        "access",
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        extra_claims,
    )


def create_refresh_token(subject: str) -> str:
    return _create_token(
        subject,
        "refresh",
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str | None) -> dict | None:
    if not token:
        return None
    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except jwt.PyJWTError:
        return None


def set_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
) -> None:
    is_prod = settings.ENV != "development"

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        path="/",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        path="/",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )


# ---------------------------------------------------------------------------
# Identifiers and OTP
# ---------------------------------------------------------------------------

def is_email(value: str | None) -> bool:
    return bool(value and EMAIL_PATTERN.match(value.strip()))


def is_phone(value: str | None) -> bool:
    return bool(value and PHONE_PATTERN.match(value.strip().replace(" ", "")))


def generate_otp() -> str:
    """Cryptographically secure 6-digit OTP."""
    return f"{secrets.randbelow(900000) + 100000}"


def send_email_otp(email: str, otp: str) -> None:
    """Deliver an OTP by email. Falls back to logging when SMTP is unset."""
    if not settings.SMTP_HOST:
        logger.info("[DEV] Email OTP for %s: %s", email, otp)
        return

    message = EmailMessage()
    message["Subject"] = "Your JanCare verification code"
    message["From"] = settings.SMTP_USER or "no-reply@jancare.local"
    message["To"] = email
    message.set_content(
        f"Your JanCare verification code is {otp}.\n"
        "It is valid for 10 minutes.\n\n"
        "If you did not request this, you can ignore this message."
    )

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
    except Exception:
        logger.exception("Failed to send email OTP to %s", email)


def send_sms_otp(phone_number: str, otp: str) -> None:
    """Deliver an OTP by SMS. Falls back to logging when no gateway is set."""
    if not settings.SMS_API_KEY:
        logger.info("[DEV] SMS OTP for %s: %s", phone_number, otp)
        return

    # Plug the chosen SMS gateway in here.
    logger.info("Dispatching SMS OTP to %s", phone_number)
