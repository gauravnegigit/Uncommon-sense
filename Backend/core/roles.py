"""
Shared role-based access control helpers.

UserRole is defined centrally in db.models. This module contains the
authorization rules used by the API routers.
"""

from fastapi import HTTPException, status

from db.models import UserDB, UserRole


# Healthcare workers who can operate facility-side workflows.
STAFF_ROLES = {
    UserRole.DOCTOR,
    UserRole.ASHA_WORKER,
}


def require_staff(current_user: UserDB) -> None:
    """Allow only doctors and ASHA workers."""
    if current_user.role not in STAFF_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Healthcare worker access required.",
        )


def require_patient(current_user: UserDB) -> None:
    """Allow only patients."""
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patient access required.",
        )


def require_self_or_staff(
    current_user: UserDB,
    owner_user_id: str | None,
) -> None:
    """
    Allow the patient who owns the record or a healthcare worker.
    """
    if current_user.role in STAFF_ROLES:
        return

    if owner_user_id and current_user.id == owner_user_id:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have access to this record.",
    )