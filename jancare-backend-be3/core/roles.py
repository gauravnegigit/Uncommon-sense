"""
Role-based access helpers used across every care-workflow module.

require_staff          -> only DOCTOR / ASHA_WORKER
require_self_or_staff  -> the patient who owns the record, or staff
"""

from fastapi import HTTPException, status

from db.models import STAFF_ROLES, UserDB


def is_staff(user: UserDB) -> bool:
    return user.role in STAFF_ROLES


def require_staff(user: UserDB) -> None:
    """Allow only facility staff (doctor or ASHA worker)."""
    if not is_staff(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Healthcare-worker access required.",
        )


def require_self_or_staff(
    user: UserDB,
    owner_user_id: str | None,
) -> None:
    """
    Allow facility staff, or the patient whose account owns the record.

    `owner_user_id` is the `linked_user_id` of the patient profile. A walk-in
    patient registered by staff has no linked account, so only staff can read
    that record.
    """
    if is_staff(user):
        return

    if owner_user_id is not None and owner_user_id == user.id:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You are not allowed to access this record.",
    )
