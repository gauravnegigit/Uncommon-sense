"""
Longitudinal Patient Record (LPR).

This module does not own the patient profile. `patients.py` owns demographic
and identity information. This module provides the patient's continuous care
timeline by combining events from the different care workflows.

Each source module remains the owner of its own data:
    consultations  -> clinical_summaries
    diagnostics    -> diagnostic_orders
    referrals      -> referrals
    follow-ups     -> followups
    manual notes   -> record_entries

The timeline is therefore a read-only projection rather than a second copy
of the patient's medical data.
"""

from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from api.auth import get_current_user_from_cookie
from core.roles import require_self_or_staff, require_staff
from db.models import UserDB
from db.mongo import get_db

router = APIRouter(prefix="/patient-records", tags=["patient records"])


# ---------------------------------------------------------------------------
# Manual record entries
# ---------------------------------------------------------------------------

class RecordEntryType(str, Enum):
    NOTE = "NOTE"
    OBSERVATION = "OBSERVATION"


class RecordEntryCreateRequest(BaseModel):
    facility_id: str | None = None
    entry_type: RecordEntryType = RecordEntryType.NOTE
    content: str = Field(..., min_length=1, max_length=2000)


class RecordEntryResponse(BaseModel):
    id: str
    patient_id: str
    facility_id: str | None = None
    entry_type: str
    content: str
    recorded_by: str
    created_at: datetime


@router.post(
    "/patients/{patient_id}/entries",
    response_model=RecordEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_record_entry(
    patient_id: str,
    payload: RecordEntryCreateRequest,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Add a staff observation that does not belong to another workflow."""
    require_staff(current_user)

    if not await db.patients.find_one({"_id": patient_id}, {"_id": 1}):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )

    if payload.facility_id and not await db.facilities.find_one(
        {"_id": payload.facility_id},
        {"_id": 1},
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facility not found.",
        )

    doc = {
        "_id": str(uuid4()),
        "patient_id": patient_id,
        "facility_id": payload.facility_id,
        "entry_type": payload.entry_type.value,
        "content": payload.content.strip(),
        "recorded_by": current_user.id,
        "created_at": datetime.now(timezone.utc),
    }

    await db.record_entries.insert_one(doc)

    return RecordEntryResponse(
        id=doc["_id"],
        patient_id=doc["patient_id"],
        facility_id=doc["facility_id"],
        entry_type=doc["entry_type"],
        content=doc["content"],
        recorded_by=doc["recorded_by"],
        created_at=doc["created_at"],
    )


# ---------------------------------------------------------------------------
# Timeline
# ---------------------------------------------------------------------------

class TimelineEvent(BaseModel):
    type: str
    id: str
    date: datetime
    title: str
    summary: str
    facility_id: str | None = None


def _aware(dt: datetime | None) -> datetime:
    """Normalize legacy naive timestamps to UTC-aware datetimes."""
    if dt is None:
        return datetime.now(timezone.utc)
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


@router.get(
    "/patients/{patient_id}/timeline",
    response_model=list[TimelineEvent],
)
async def get_patient_timeline(
    patient_id: str,
    limit: int = Query(100, ge=1, le=500),
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Return one chronological view of the patient's care journey.

    No source record is modified here. The endpoint simply projects the
    relevant information from each workflow into a common timeline format.
    """
    patient = await db.patients.find_one({"_id": patient_id})

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )

    require_self_or_staff(
        current_user,
        patient.get("linked_user_id"),
    )

    events: list[TimelineEvent] = []

    # Manual observations / notes.
    async for doc in db.record_entries.find(
        {"patient_id": patient_id}
    ):
        events.append(
            TimelineEvent(
                type=doc["entry_type"],
                id=str(doc["_id"]),
                date=_aware(doc.get("created_at")),
                title=doc["entry_type"].title(),
                summary=doc["content"],
                facility_id=doc.get("facility_id"),
            )
        )

    # Existing AI-assisted consultation summaries belong to the user account.
    # They can only be associated with the LPR when the patient has a linked
    # login account.
    linked_user_id = patient.get("linked_user_id")

    if linked_user_id:
        async for doc in db.clinical_summaries.find(
            {"user_id": linked_user_id}
        ):
            events.append(
                TimelineEvent(
                    type="CONSULTATION",
                    id=str(
                        doc.get(
                            "summary_id",
                            doc.get("_id"),
                        )
                    ),
                    date=_aware(
                        doc.get(
                            "updated_at",
                            doc.get("created_at"),
                        )
                    ),
                    title="Consultation",
                    summary=doc.get(
                        "situation",
                        doc.get("summary", "Consultation recorded."),
                    ),
                    facility_id=doc.get("facility_id"),
                )
            )

    # Diagnostic workflow.
    async for doc in db.diagnostic_orders.find(
        {"patient_id": patient_id}
    ):
        test_name = doc.get(
            "test_name",
            doc.get("investigation", "Diagnostic investigation"),
        )
        result = doc.get("result_summary")

        events.append(
            TimelineEvent(
                type="DIAGNOSTIC",
                id=str(doc["_id"]),
                date=_aware(
                    doc.get(
                        "updated_at",
                        doc.get("ordered_at"),
                    )
                ),
                title=f"Diagnostic — {test_name}",
                summary=(
                    result
                    if result
                    else f"Status: {doc.get('status', 'UNKNOWN')}"
                ),
                facility_id=doc.get("facility_id"),
            )
        )

    # Referral workflow.
    async for doc in db.referrals.find(
        {"patient_id": patient_id}
    ):
        events.append(
            TimelineEvent(
                type="REFERRAL",
                id=str(doc["_id"]),
                date=_aware(
                    doc.get(
                        "updated_at",
                        doc.get("created_at"),
                    )
                ),
                title=f"Referral — {doc.get('status', 'UNKNOWN')}",
                summary=doc.get(
                    "reason",
                    "Referral recorded.",
                ),
                facility_id=doc.get(
                    "to_facility_id",
                    doc.get("to_facility"),
                ),
            )
        )

    # Follow-up workflow.
    async for doc in db.followups.find(
        {"patient_id": patient_id}
    ):
        events.append(
            TimelineEvent(
                type="FOLLOW_UP",
                id=str(doc["_id"]),
                date=_aware(
                    doc.get(
                        "updated_at",
                        doc.get("created_at"),
                    )
                ),
                title=f"Follow-up — {doc.get('status', 'UNKNOWN')}",
                summary=doc.get(
                    "reason",
                    "Follow-up recorded.",
                ),
                facility_id=doc.get("facility_id"),
            )
        )

    events.sort(key=lambda event: event.date, reverse=True)
    return events[:limit]
