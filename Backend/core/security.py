from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import JWTError, jwt

from core.config import settings

# contacts and otp related imports
import os
from aiosmtplib import send
from email.message import EmailMessage
from twilio.rest import Client
import re 
import secrets 

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
# SMTP email
# ============================================================================

# Send Email via Async SMTP (e.g., Gmail SMTP or SendGrid SMTP)
async def send_email_otp(email: str, otp: str):
    msg = EmailMessage()
    msg["From"] = settings.SMTP_SERVER_EMAIL
    msg["To"] = email
    msg["Subject"] = "Your Password Reset OTP"
    msg.set_content(f"Your password reset OTP is: {otp}. It expires in 10 minutes.")

    await send(
        msg,
        hostname=os.getenv("SMTP_HOST", "smtp.gmail.com"),
        port=587,
        start_tls=True,
        username=settings.SMTP_SERVER_EMAIL,
        password="ship ckav qygt nrba",
    )

# Send SMS via Twilio
def send_sms_otp(phone_number: str, otp: str):
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_number = os.getenv("TWILIO_PHONE_NUMBER")

    client = Client(account_sid, auth_token)
    client.messages.create(
        body=f"Your verification code is {otp}. Do not share this code.",
        from_=twilio_number,
        to=phone_number
    )

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

    if not token:
        return None

    # Strip 'Bearer ' if present
    if token.lower().startswith("bearer "):
        token = token.split(" ", 1)[1].strip()

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

def set_cookies(response , access_token , refresh_token):
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        secure=settings.ENV != "development",  
        samesite="lax",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        secure=settings.ENV != "development",
        samesite="lax",
    )

def is_email(contact: str) -> bool:
    email_regex = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(email_regex, contact))

def is_phone(contact: str) -> bool :
    phone_regex = r"^\+[1-9]\d{1,14}$"
    return bool(re.match(phone_regex, contact))

def generate_otp() -> str:
    return "".join([secrets.choice("0123456789") for _ in range(6)])
