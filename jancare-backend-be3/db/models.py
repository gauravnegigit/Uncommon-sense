"""
Shared database models and enums.

Owned by the platform/BE-2 track. Included in this bundle so the BE-3
continuity modules are importable and runnable on their own.
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class UserRole(str, Enum):
    PATIENT = "PATIENT"
    DOCTOR = "DOCTOR"
    ASHA_WORKER = "ASHA_WORKER"


STAFF_ROLES = {
    UserRole.DOCTOR.value,
    UserRole.ASHA_WORKER.value,
}


class Priority(str, Enum):
    NORMAL = "NORMAL"
    URGENT = "URGENT"


class UserDB(BaseModel):
    """User document as stored in MongoDB."""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="_id")
    name: str
    email: str | None = None
    phone: str | None = None
    hashed_password: str | None = None
    address: str | None = None
    pincode: str | None = None
    role: str = UserRole.PATIENT.value
    is_email_verified: bool = False
    is_phone_verified: bool = False
    created_at: datetime
