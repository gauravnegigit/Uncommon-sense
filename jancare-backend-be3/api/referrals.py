"""
Closed-loop inter-facility referral tracking.
Workflow:
    CREATED → ACCEPTED → QUEUED → PATIENT_ARRIVED → COMPLETED
       └──→ REJECTED
    Any open stage → CANCELLED
The referral records the transfer of care between facilities. The receiving
facility's normal queue remains the source of truth for queue management and
is linked through `queue_id`.
"""

from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from api.auth import get_current_user_from_cookie
from core.roles import require_self_or_staff, require_staff
from db.models import Priority, UserDB
from db.mongo import get_db

router = APIRouter(prefix="/referrals", tags=["referrals"])


class ReferralStatus(str, Enum):
    CREATED = "CREATED"
    ACCEPTED = "ACCEPTED"
    QUEUED = "QUEUED"
    PATIENT_ARRIVED = "PATIENT_ARRIVED"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


OPEN_STATUSES = {
    ReferralStatus.CREATED.value,
    ReferralStatus.ACCEPTED.value,
    ReferralStatus.QUEUED.value,
    ReferralStatus.PATIENT_ARRIVED.value,
}

ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    ReferralStatus.CREATED.value: {
        ReferralStatus.ACCEPTED.value,
        ReferralStatus.REJECTED.value,
        ReferralStatus.CANCELLED.value,
    },
    ReferralStatus.ACCEPTED.value: {
        ReferralStatus.QUEUED.value,
        ReferralStatus.CANCELLED.value,
    },
    ReferralStatus.QUEUED.value: {
        ReferralStatus.PATIENT_ARRIVED.value,
        ReferralStatus.CANCELLED.value,
    },
    ReferralStatus.PATIENT_ARRIVED.value: {
        ReferralStatus.COMPLETED.value,
        ReferralStatus.CANCELLED.value,
    },
    ReferralStatus.COMPLETED.value: set(),
    ReferralStatus.REJECTED.value: set(),
    ReferralStatus.CANCELLED.value: set(),
}


class ReferralCreateRequest(BaseModel):
    patient_id: str
    from_facility_id: str
    to_facility_id: str
    reason: str = Field(..., min_length=2, max_length=2000)
    priority: Priority = Priority.NORMAL


class ReferralStatusUpdateRequest(BaseModel):
    new_status: ReferralStatus
    queue_id: str | None = None


class ReferralResponse(BaseModel):
    id: str
    patient_id: str
    from_facility_id: str
    to_facility_id: str
    reason: str
    priority: str
    status: str
    queue_id: str | None = None
    created_by: str
    created_at: datetime
    updated_at: datetime


def referral_response(doc: dict) -> ReferralResponse:
    return ReferralResponse(
        id=str(doc["_id"]),
        patient_id=doc["patient_id"],
        from_facility_id=doc["from_facility_id"],
        to_facility_id=doc["to_facility_id"],
        reason=doc["reason"],
        priority=doc.get("priority", Priority.NORMAL.value),
        status=doc["status"],
        queue_id=doc.get("queue_id"),
        created_by=doc["created_by"],
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


async def _patient_owner_id(
    db: AsyncIOMotorDatabase,
    patient_id: str,
) -> str | None:
    patient = await db.patients.find_one(
        {"_id": patient_id},
        {"linked_user_id": 1},
    )
    return patient.get("linked_user_id") if patient else None


@router.post(
    "",
    response_model=ReferralResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_referral(
    payload: ReferralCreateRequest,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Create a referral from one facility to another."""
    require_staff(current_user)

    patient = await db.patients.find_one(
        {"_id": payload.patient_id},
        {"_id": 1},
    )
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )

    source = await db.facilities.find_one(
        {"_id": payload.from_facility_id},
        {"_id": 1},
    )
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source facility not found.",
        )

    destination = await db.facilities.find_one(
        {"_id": payload.to_facility_id},
        {"_id": 1},
    )
    if not destination:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receiving facility not found.",
        )

    if payload.from_facility_id == payload.to_facility_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A referral must target a different facility.",
        )

    now = datetime.now(timezone.utc)
    doc = {
        "_id": str(uuid4()),
        "patient_id": payload.patient_id,
        "from_facility_id": payload.from_facility_id,
        "to_facility_id": payload.to_facility_id,
        "reason": payload.reason.strip(),
        "priority": payload.priority.value,
        "status": ReferralStatus.CREATED.value,
        "queue_id": None,
        "created_by": current_user.id,
        "created_at": now,
        "updated_at": now,
    }

    await db.referrals.insert_one(doc)
    return referral_response(doc)


@router.get("", response_model=list[ReferralResponse])
async def list_referrals(
    patient_id: str | None = None,
    facility_id: str | None = None,
    direction: str | None = Query(
        None,
        description="Use 'incoming' or 'outgoing' with facility_id.",
    ),
    status_filter: ReferralStatus | None = None,
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    query: dict = {}

    if direction and direction not in {"incoming", "outgoing"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="direction must be 'incoming' or 'outgoing'.",
        )

    if patient_id:
        owner_id = await _patient_owner_id(db, patient_id)
        if owner_id is None:
            require_staff(current_user)
        else:
            require_self_or_staff(current_user, owner_id)
        query["patient_id"] = patient_id
    else:
        require_staff(current_user)

        if facility_id and direction == "incoming":
            query["to_facility_id"] = facility_id
        elif facility_id and direction == "outgoing":
            query["from_facility_id"] = facility_id
        elif facility_id:
            query["$or"] = [
                {"to_facility_id": facility_id},
                {"from_facility_id": facility_id},
            ]

    if status_filter:
        query["status"] = status_filter.value

    cursor = (
        db.referrals
        .find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    return [referral_response(doc) async for doc in cursor]


@router.get("/{referral_id}", response_model=ReferralResponse)
async def get_referral(
    referral_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.referrals.find_one({"_id": referral_id})

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referral not found.",
        )

    owner_id = await _patient_owner_id(db, doc["patient_id"])
    if owner_id is None:
        require_staff(current_user)
    else:
        require_self_or_staff(current_user, owner_id)

    return referral_response(doc)


@router.patch(
    "/{referral_id}/status",
    response_model=ReferralResponse,
)
async def update_referral_status(
    referral_id: str,
    payload: ReferralStatusUpdateRequest,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Move the referral through its closed-loop workflow.

    Receiving-facility staff can progress accepted referrals into their
    queue and mark the patient as arrived. Staff can cancel open referrals.
    """
    require_staff(current_user)

    doc = await db.referrals.find_one({"_id": referral_id})

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referral not found.",
        )

    current_status = doc["status"]
    target_status = payload.new_status.value

    if target_status not in ALLOWED_TRANSITIONS.get(current_status, set()):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot move a {current_status} referral "
                f"to {target_status}."
            ),
        )

    # A queue token can only be attached once the receiving facility
    # actually places the referred patient into its queue.
    if payload.queue_id:
        if target_status != ReferralStatus.QUEUED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="queue_id can only be supplied when queueing a referral.",
            )

        queue_entry = await db.queue_entries.find_one(
            {
                "_id": payload.queue_id,
                "patient_id": doc["patient_id"],
                "facility_id": doc["to_facility_id"],
            },
            {"_id": 1},
        )

        if not queue_entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Matching receiving-facility queue entry not found.",
            )

    if target_status == ReferralStatus.QUEUED.value and not payload.queue_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="queue_id is required when queueing a referral.",
        )

    now = datetime.now(timezone.utc)
    updates = {
        "status": target_status,
        "updated_at": now,
    }

    if payload.queue_id:
        updates["queue_id"] = payload.queue_id

    await db.referrals.update_one(
        {"_id": referral_id},
        {"$set": updates},
    )

    doc.update(updates)
    return referral_response(doc)
