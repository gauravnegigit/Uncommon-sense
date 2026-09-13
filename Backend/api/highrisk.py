"""
High-risk follow-up and facility operational dashboard.
Follow-ups are used for continued care such as chronic-condition monitoring,
post-discharge checks and missed-referral follow-up.
The stored status remains OPEN/COMPLETED/CANCELLED. OPEN records are exposed
as UPCOMING, DUE or OVERDUE based on the due date, so the status never becomes
stale without requiring a background job.
"""

from datetime import date, datetime, timezone
from enum import Enum
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from api.appointments import ACTIVE_QUEUE_STATUSES
from api.auth import get_current_user_from_cookie
from api.diagnostics import DiagnosticStatus
from api.medicines import StockStatus
from api.referrals import OPEN_STATUSES as OPEN_REFERRAL_STATUSES
from core.roles import require_self_or_staff, require_staff
from db.models import UserDB
from db.mongo import get_db

router = APIRouter(tags=["high-risk & dashboard"])

class FollowUpStoredStatus(str, Enum):
    OPEN = "OPEN"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class FollowUpDisplayStatus(str, Enum):
    UPCOMING = "UPCOMING"
    DUE = "DUE"
    OVERDUE = "OVERDUE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

def _display_status(doc: dict) -> str:
    if doc["status"] != FollowUpStoredStatus.OPEN.value:
        return doc["status"]
    due = doc["due_date"]
    if isinstance(due, str):
        due = date.fromisoformat(due)
    today = datetime.now(timezone.utc).date()
    if due < today:
        return FollowUpDisplayStatus.OVERDUE.value
    if due == today:
        return FollowUpDisplayStatus.DUE.value
    return FollowUpDisplayStatus.UPCOMING.value

class FollowUpCreateRequest(BaseModel):
    patient_id: str
    facility_id: str
    reason: str = Field(..., min_length=2, max_length=1000)
    due_date: date
    is_high_risk: bool = False

class FollowUpResponse(BaseModel):
    id: str
    patient_id: str
    facility_id: str
    reason: str
    due_date: date
    is_high_risk: bool
    status: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None

def followup_response(doc: dict) -> FollowUpResponse:
    due_date = doc["due_date"]
    if isinstance(due_date, str):
        due_date = date.fromisoformat(due_date)
    return FollowUpResponse(
        id=str(doc["_id"]),
        patient_id=doc["patient_id"],
        facility_id=doc["facility_id"],
        reason=doc["reason"],
        due_date=due_date,
        is_high_risk=doc.get("is_high_risk", False),
        status=_display_status(doc),
        created_by=doc["created_by"],
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
        completed_at=doc.get("completed_at"),
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
    "/followups",
    response_model=FollowUpResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_followup(
    payload: FollowUpCreateRequest,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Create a follow-up task for a patient."""
    require_staff(current_user)
    if not await db.patients.find_one(
        {"_id": payload.patient_id},
        {"_id": 1},
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )
    if not await db.facilities.find_one(
        {"_id": payload.facility_id},
        {"_id": 1},
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facility not found.",
        )
    now = datetime.now(timezone.utc)
    doc = {
        "_id": str(uuid4()),
        "patient_id": payload.patient_id,
        "facility_id": payload.facility_id,
        "reason": payload.reason.strip(),
        "due_date": payload.due_date.isoformat(),
        "is_high_risk": payload.is_high_risk,
        "status": FollowUpStoredStatus.OPEN.value,
        "created_by": current_user.id,
        "created_at": now,
        "updated_at": now,
        "completed_at": None,
    }
    await db.followups.insert_one(doc)
    return followup_response(doc)

@router.get(
    "/followups",
    response_model=list[FollowUpResponse],
)
async def list_followups(
    patient_id: str | None = None,
    facility_id: str | None = None,
    display_status: FollowUpDisplayStatus | None = None,
    high_risk_only: bool = False,
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0),
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    query: dict = {}
    if patient_id:
        owner_id = await _patient_owner_id(db, patient_id)
        if owner_id is None:
            require_staff(current_user)
        else:
            require_self_or_staff(current_user, owner_id)
        query["patient_id"] = patient_id
    else:
        require_staff(current_user)
        if facility_id:
            query["facility_id"] = facility_id
    if high_risk_only:
        query["is_high_risk"] = True
    cursor = (
        db.followups
        .find(query)
        .sort("due_date", 1)
        .skip(skip)
        .limit(limit)
    )
    results = [followup_response(doc) async for doc in cursor]
    if display_status:
        results = [
            item
            for item in results
            if item.status == display_status.value
        ]
    return results[:limit]

@router.patch(
    "/followups/{followup_id}/complete",
    response_model=FollowUpResponse,
)
async def complete_followup(
    followup_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    require_staff(current_user)
    doc = await db.followups.find_one({"_id": followup_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up not found.",
        )
    if doc["status"] != FollowUpStoredStatus.OPEN.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only an open follow-up can be completed.",
        )
    now = datetime.now(timezone.utc)
    updates = {
        "status": FollowUpStoredStatus.COMPLETED.value,
        "updated_at": now,
        "completed_at": now,
    }
    await db.followups.update_one(
        {"_id": followup_id},
        {"$set": updates},
    )
    doc.update(updates)
    return followup_response(doc)

@router.patch(
    "/followups/{followup_id}/cancel",
    response_model=FollowUpResponse,
)
async def cancel_followup(
    followup_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    require_staff(current_user)
    doc = await db.followups.find_one({"_id": followup_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up not found.",
        )
    if doc["status"] != FollowUpStoredStatus.OPEN.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only an open follow-up can be cancelled.",
        )
    updates = {
        "status": FollowUpStoredStatus.CANCELLED.value,
        "updated_at": datetime.now(timezone.utc),
    }
    await db.followups.update_one(
        {"_id": followup_id},
        {"$set": updates},
    )
    doc.update(updates)
    return followup_response(doc)

# ---------------------------------------------------------------------------
# Facility operational dashboard
# ---------------------------------------------------------------------------
class DashboardResponse(BaseModel):
    facility_id: str
    queue_waiting: int
    queue_active_total: int
    open_referrals_incoming: int
    open_referrals_outgoing: int
    diagnostics_in_progress: int
    followups_due_today: int
    followups_overdue: int
    medicines_low_or_out: int

@router.get(
    "/dashboard/facility/{facility_id}",
    response_model=DashboardResponse,
)
async def get_facility_dashboard(
    facility_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Return the operational items a facility needs to act on."""
    require_staff(current_user)
    if not await db.facilities.find_one(
        {"_id": facility_id},
        {"_id": 1},
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facility not found.",
        )
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    queue_waiting = await db.queue_entries.count_documents({
        "facility_id": facility_id,
        "queue_date": today_str,
        "status": "WAITING",
    })
    queue_active_total = await db.queue_entries.count_documents({
        "facility_id": facility_id,
        "queue_date": today_str,
        "status": {"$in": list(ACTIVE_QUEUE_STATUSES)},
    })
    open_referrals_incoming = await db.referrals.count_documents({
        "to_facility_id": facility_id,
        "status": {"$in": list(OPEN_REFERRAL_STATUSES)},
    })
    open_referrals_outgoing = await db.referrals.count_documents({
        "from_facility_id": facility_id,
        "status": {"$in": list(OPEN_REFERRAL_STATUSES)},
    })
    diagnostics_in_progress = await db.diagnostic_orders.count_documents({
        "facility_id": facility_id,
        "status": {
            "$in": [
                DiagnosticStatus.REQUESTED.value,
                DiagnosticStatus.SAMPLE_COLLECTED.value,
                DiagnosticStatus.PROCESSING.value,
            ]
        },
    })
    medicines_low_or_out = await db.facility_medicines.count_documents({
        "facility_id": facility_id,
        "status": {
            "$in": [
                StockStatus.LOW_STOCK.value,
                StockStatus.UNAVAILABLE.value,
            ]
        },
    })
    followups_due_today = 0
    followups_overdue = 0
    async for doc in db.followups.find({
        "facility_id": facility_id,
        "status": FollowUpStoredStatus.OPEN.value,
    }):
        display = _display_status(doc)
        if display == FollowUpDisplayStatus.DUE.value:
            followups_due_today += 1
        elif display == FollowUpDisplayStatus.OVERDUE.value:
            followups_overdue += 1
    return DashboardResponse(
        facility_id=facility_id,
        queue_waiting=queue_waiting,
        queue_active_total=queue_active_total,
        open_referrals_incoming=open_referrals_incoming,
        open_referrals_outgoing=open_referrals_outgoing,
        diagnostics_in_progress=diagnostics_in_progress,
        followups_due_today=followups_due_today,
        followups_overdue=followups_overdue,
        medicines_low_or_out=medicines_low_or_out,
    )