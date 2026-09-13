"""
Diagnostic coordination and sample tracking.

Lifecycle:
    REQUESTED → SAMPLE_COLLECTED → PROCESSING → RESULT_AVAILABLE
                                      └────────→ CANCELLED

The diagnostic order remains in `diagnostic_orders` and is surfaced by
the longitudinal patient timeline; no duplicate clinical record is created.
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

router = APIRouter(prefix="/diagnostics", tags=["diagnostics"])


class DiagnosticStatus(str, Enum):
    REQUESTED = "REQUESTED"
    SAMPLE_COLLECTED = "SAMPLE_COLLECTED"
    PROCESSING = "PROCESSING"
    RESULT_AVAILABLE = "RESULT_AVAILABLE"
    CANCELLED = "CANCELLED"


# Prevents staff from skipping important stages in the diagnostic workflow.
ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    DiagnosticStatus.REQUESTED.value: {
        DiagnosticStatus.SAMPLE_COLLECTED.value,
        DiagnosticStatus.CANCELLED.value,
    },
    DiagnosticStatus.SAMPLE_COLLECTED.value: {
        DiagnosticStatus.PROCESSING.value,
        DiagnosticStatus.CANCELLED.value,
    },
    DiagnosticStatus.PROCESSING.value: {
        DiagnosticStatus.RESULT_AVAILABLE.value,
        DiagnosticStatus.CANCELLED.value,
    },
    DiagnosticStatus.RESULT_AVAILABLE.value: set(),
    DiagnosticStatus.CANCELLED.value: set(),
}


class DiagnosticOrderCreateRequest(BaseModel):
    patient_id: str
    facility_id: str
    test_name: str = Field(..., min_length=2, max_length=150)
    notes: str | None = Field(default=None, max_length=1000)


class DiagnosticStatusUpdateRequest(BaseModel):
    new_status: DiagnosticStatus
    result_summary: str | None = Field(default=None, max_length=3000)


class DiagnosticOrderResponse(BaseModel):
    id: str
    patient_id: str
    facility_id: str
    test_name: str
    notes: str | None
    status: str
    result_summary: str | None
    ordered_by: str
    ordered_at: datetime
    updated_at: datetime
    result_available_at: datetime | None


def order_response(doc: dict) -> DiagnosticOrderResponse:
    return DiagnosticOrderResponse(
        id=str(doc["_id"]),
        patient_id=doc["patient_id"],
        facility_id=doc["facility_id"],
        test_name=doc["test_name"],
        notes=doc.get("notes"),
        status=doc["status"],
        result_summary=doc.get("result_summary"),
        ordered_by=doc["ordered_by"],
        ordered_at=doc["ordered_at"],
        updated_at=doc["updated_at"],
        result_available_at=doc.get("result_available_at"),
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
    response_model=DiagnosticOrderResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_diagnostic_order(
    payload: DiagnosticOrderCreateRequest,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Create a diagnostic request for a registered patient."""
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

    facility = await db.facilities.find_one(
        {"_id": payload.facility_id},
        {"_id": 1},
    )
    if not facility:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facility not found.",
        )

    now = datetime.now(timezone.utc)
    doc = {
        "_id": str(uuid4()),
        "patient_id": payload.patient_id,
        "facility_id": payload.facility_id,
        "test_name": payload.test_name.strip(),
        "notes": payload.notes.strip() if payload.notes else None,
        "status": DiagnosticStatus.REQUESTED.value,
        "result_summary": None,
        "ordered_by": current_user.id,
        "ordered_at": now,
        "updated_at": now,
        "result_available_at": None,
    }

    await db.diagnostic_orders.insert_one(doc)
    return order_response(doc)


@router.get("", response_model=list[DiagnosticOrderResponse])
async def list_diagnostic_orders(
    patient_id: str | None = None,
    facility_id: str | None = None,
    status_filter: DiagnosticStatus | None = None,
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Patients can view their own diagnostic orders.
    Staff can view orders across patients and optionally filter by facility.
    """
    query: dict = {}

    if patient_id:
        owner_id = await _patient_owner_id(db, patient_id)
        if owner_id is None:
            # An unlinked patient has no self-service account, so only staff
            # should be able to retrieve their diagnostic information.
            require_staff(current_user)
        else:
            require_self_or_staff(current_user, owner_id)
        query["patient_id"] = patient_id
    else:
        require_staff(current_user)
        if facility_id:
            query["facility_id"] = facility_id

    if status_filter:
        query["status"] = status_filter.value

    cursor = (
        db.diagnostic_orders
        .find(query)
        .sort("ordered_at", -1)
        .skip(skip)
        .limit(limit)
    )
    return [order_response(doc) async for doc in cursor]


@router.get("/{order_id}", response_model=DiagnosticOrderResponse)
async def get_diagnostic_order(
    order_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.diagnostic_orders.find_one({"_id": order_id})

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diagnostic order not found.",
        )

    owner_id = await _patient_owner_id(db, doc["patient_id"])
    if owner_id is None:
        require_staff(current_user)
    else:
        require_self_or_staff(current_user, owner_id)

    return order_response(doc)


@router.patch(
    "/{order_id}/status",
    response_model=DiagnosticOrderResponse,
)
async def update_diagnostic_status(
    order_id: str,
    payload: DiagnosticStatusUpdateRequest,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Advance a diagnostic order through its real-world lifecycle."""
    require_staff(current_user)

    doc = await db.diagnostic_orders.find_one({"_id": order_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diagnostic order not found.",
        )

    current_status = doc["status"]
    target_status = payload.new_status.value

    if target_status not in ALLOWED_TRANSITIONS.get(current_status, set()):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot move a {current_status} order "
                f"to {target_status}."
            ),
        )

    if (
        target_status == DiagnosticStatus.RESULT_AVAILABLE.value
        and not payload.result_summary
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "result_summary is required when marking "
                "a result available."
            ),
        )

    now = datetime.now(timezone.utc)
    updates = {
        "status": target_status,
        "updated_at": now,
    }

    if payload.result_summary:
        updates["result_summary"] = payload.result_summary.strip()

    if target_status == DiagnosticStatus.RESULT_AVAILABLE.value:
        updates["result_available_at"] = now

    await db.diagnostic_orders.update_one(
        {"_id": order_id},
        {"$set": updates},
    )

    doc.update(updates)
    return order_response(doc)