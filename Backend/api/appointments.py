"""
Appointments + Queue Management

Responsibilities:
- Appointment booking and management
- Appointment check-in
- Walk-in queue/token issuance
- Queue state management
- Queue position and waiting-time calculation

Flow:
    Appointment
        ↓
    Patient arrives
        ↓
    Check-in
        ↓
    Queue token
        ↓
    WAITING → CALLED → IN_CONSULTATION → COMPLETED

Queue tokens are generated atomically per facility per day.
Queue dates use India Standard Time (Asia/Kolkata).
Timestamps are stored in UTC.
"""

from datetime import date, datetime, timezone
from enum import Enum
from uuid import uuid4
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field
from pymongo import ReturnDocument

from api.auth import get_current_user_from_cookie
from core.roles import require_self_or_staff, require_staff
from db.models import Priority, UserDB, UserRole
from db.mongo import get_db


router = APIRouter(
    prefix="/appointments",
    tags=["appointments"],
)

INDIA_TIMEZONE = ZoneInfo("Asia/Kolkata")
DEFAULT_AVG_CONSULT_MINUTES = 8


# ============================================================================
# ENUMS
# ============================================================================

class AppointmentStatus(str, Enum):
    BOOKED = "BOOKED"
    CHECKED_IN = "CHECKED_IN"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"


class PreferredSlot(str, Enum):
    MORNING = "MORNING"
    AFTERNOON = "AFTERNOON"
    EVENING = "EVENING"


class QueueStatus(str, Enum):
    WAITING = "WAITING"
    CALLED = "CALLED"
    IN_CONSULTATION = "IN_CONSULTATION"
    COMPLETED = "COMPLETED"
    SKIPPED = "SKIPPED"
    CANCELLED = "CANCELLED"


ACTIVE_QUEUE_STATUSES = {
    QueueStatus.WAITING.value,
    QueueStatus.CALLED.value,
    QueueStatus.IN_CONSULTATION.value,
}


VALID_QUEUE_TRANSITIONS = {
    QueueStatus.WAITING: {
        QueueStatus.CALLED,
        QueueStatus.SKIPPED,
        QueueStatus.CANCELLED,
    },
    QueueStatus.CALLED: {
        QueueStatus.IN_CONSULTATION,
        QueueStatus.SKIPPED,
        QueueStatus.CANCELLED,
    },
    QueueStatus.IN_CONSULTATION: {
        QueueStatus.COMPLETED,
    },
    QueueStatus.COMPLETED: set(),
    QueueStatus.SKIPPED: set(),
    QueueStatus.CANCELLED: set(),
}


# ============================================================================
# APPOINTMENT SCHEMAS
# ============================================================================

class AppointmentCreateRequest(BaseModel):
    patient_id: str
    facility_id: str
    requested_date: date
    preferred_slot: PreferredSlot = PreferredSlot.MORNING
    reason: str | None = None


class AppointmentResponse(BaseModel):
    id: str
    patient_id: str
    facility_id: str
    requested_date: date
    preferred_slot: str
    reason: str | None
    status: str
    queue_id: str | None = None
    booked_by: str
    created_at: datetime
    updated_at: datetime


# ============================================================================
# QUEUE SCHEMAS
# ============================================================================

class WalkInRequest(BaseModel):
    facility_id: str
    patient_id: str
    priority: Priority = Priority.NORMAL


class QueueEntryResponse(BaseModel):
    id: str
    facility_id: str
    patient_id: str
    appointment_id: str | None
    token_number: int
    queue_date: str
    status: str
    priority: str
    position: int | None = Field(
        default=None,
        description="Current 1-indexed position among active queue entries.",
    )
    estimated_wait_minutes: int | None = None
    created_at: datetime
    called_at: datetime | None
    completed_at: datetime | None


# ============================================================================
# GENERAL HELPERS
# ============================================================================

def _today_str() -> str:
    """Return today's date according to India Standard Time."""
    return datetime.now(INDIA_TIMEZONE).strftime("%Y-%m-%d")


async def _load_patient_or_404(
    db: AsyncIOMotorDatabase,
    patient_id: str,
) -> dict:
    patient = await db.patients.find_one({"_id": patient_id})

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )

    return patient


async def _patient_owner_id(
    db: AsyncIOMotorDatabase,
    patient_id: str,
) -> str | None:
    patient = await db.patients.find_one(
        {"_id": patient_id},
        {"linked_user_id": 1},
    )
    return patient.get("linked_user_id") if patient else None


def appointment_response(doc: dict) -> AppointmentResponse:
    return AppointmentResponse(
        id=str(doc["_id"]),
        patient_id=doc["patient_id"],
        facility_id=doc["facility_id"],
        requested_date=doc["requested_date"],
        preferred_slot=doc["preferred_slot"],
        reason=doc.get("reason"),
        status=doc["status"],
        queue_id=doc.get("queue_id"),
        booked_by=doc["booked_by"],
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


def queue_response(
    doc: dict,
    position: int | None = None,
    estimated_wait_minutes: int | None = None,
) -> QueueEntryResponse:
    return QueueEntryResponse(
        id=str(doc["_id"]),
        facility_id=doc["facility_id"],
        patient_id=doc["patient_id"],
        appointment_id=doc.get("appointment_id"),
        token_number=doc["token_number"],
        queue_date=doc["queue_date"],
        status=doc["status"],
        priority=doc.get("priority", Priority.NORMAL.value),
        position=position,
        estimated_wait_minutes=estimated_wait_minutes,
        created_at=doc["created_at"],
        called_at=doc.get("called_at"),
        completed_at=doc.get("completed_at"),
    )


# ============================================================================
# QUEUE CORE
# ============================================================================

def _queue_sort_key(
    priority: str,
    token_number: int,
) -> tuple[int, int]:
    """
    URGENT patients are served before NORMAL patients.
    Token numbers themselves are never changed.
    """
    priority_rank = 0 if priority == Priority.URGENT.value else 1
    return priority_rank, token_number


async def issue_queue_token(
    db: AsyncIOMotorDatabase,
    facility_id: str,
    patient_id: str,
    appointment_id: str | None = None,
    priority: str = Priority.NORMAL.value,
) -> dict:
    """
    Atomically issue the next queue token for a facility for today.

    This is the single token-generation point for:
    - appointment check-ins
    - walk-in patients
    """
    if priority not in {
        Priority.NORMAL.value,
        Priority.URGENT.value,
    }:
        priority = Priority.NORMAL.value

    queue_date = _today_str()
    counter_key = f"{facility_id}_{queue_date}"

    counter = await db.queue_counters.find_one_and_update(
        {"_id": counter_key},
        {"$inc": {"last_token": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )

    token_number = counter["last_token"]
    now = datetime.now(timezone.utc)

    queue_doc = {
        "_id": str(uuid4()),
        "facility_id": facility_id,
        "patient_id": patient_id,
        "appointment_id": appointment_id,
        "token_number": token_number,
        "queue_date": queue_date,
        "status": QueueStatus.WAITING.value,
        "priority": priority,
        "created_at": now,
        "called_at": None,
        "completed_at": None,
    }

    await db.queue_entries.insert_one(queue_doc)
    return queue_doc


async def _calculate_position_and_wait(
    db: AsyncIOMotorDatabase,
    queue_doc: dict,
) -> tuple[int, int]:
    """Calculate active queue position and estimated waiting time."""
    current_key = _queue_sort_key(
        queue_doc.get("priority", Priority.NORMAL.value),
        queue_doc["token_number"],
    )

    ahead_count = 0

    cursor = db.queue_entries.find(
        {
            "facility_id": queue_doc["facility_id"],
            "queue_date": queue_doc["queue_date"],
            "status": {"$in": list(ACTIVE_QUEUE_STATUSES)},
        }
    )

    async for entry in cursor:
        entry_key = _queue_sort_key(
            entry.get("priority", Priority.NORMAL.value),
            entry["token_number"],
        )

        if (
            entry["_id"] != queue_doc["_id"]
            and entry_key < current_key
        ):
            ahead_count += 1

    facility = await db.facilities.find_one(
        {"_id": queue_doc["facility_id"]},
        {"avg_consult_minutes": 1},
    )

    average_minutes = (
        facility.get(
            "avg_consult_minutes",
            DEFAULT_AVG_CONSULT_MINUTES,
        )
        if facility
        else DEFAULT_AVG_CONSULT_MINUTES
    )

    return ahead_count + 1, ahead_count * average_minutes


async def _transition_queue_status(
    db: AsyncIOMotorDatabase,
    queue_id: str,
    new_status: QueueStatus,
    timestamp_field: str | None = None,
) -> dict:
    """Apply only valid queue state transitions."""
    queue_doc = await db.queue_entries.find_one(
        {"_id": queue_id}
    )

    if not queue_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Queue entry not found.",
        )

    try:
        current_status = QueueStatus(queue_doc["status"])
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Queue entry contains an invalid status.",
        )

    allowed_states = VALID_QUEUE_TRANSITIONS.get(
        current_status,
        set(),
    )

    if new_status not in allowed_states:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid queue transition: "
                f"{current_status.value} → {new_status.value}."
            ),
        )

    updates = {
        "status": new_status.value,
    }

    if timestamp_field:
        updates[timestamp_field] = datetime.now(timezone.utc)

    result = await db.queue_entries.update_one(
        {
            "_id": queue_id,
            "status": current_status.value,
        },
        {"$set": updates},
    )

    if result.modified_count != 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Queue entry changed. Please retry.",
        )

    queue_doc.update(updates)
    return queue_doc


# ============================================================================
# QUEUE: WALK-IN
# ============================================================================

@router.post(
    "/queue/walk-in",
    response_model=QueueEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def check_in_walk_in(
    payload: WalkInRequest,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Issue a queue token directly for a walk-in patient."""
    require_staff(current_user)

    if not await db.facilities.find_one(
        {"_id": payload.facility_id}
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facility not found.",
        )

    await _load_patient_or_404(
        db,
        payload.patient_id,
    )

    queue_doc = await issue_queue_token(
        db,
        facility_id=payload.facility_id,
        patient_id=payload.patient_id,
        priority=payload.priority.value,
    )

    position, wait_minutes = await _calculate_position_and_wait(
        db,
        queue_doc,
    )

    return queue_response(
        queue_doc,
        position=position,
        estimated_wait_minutes=wait_minutes,
    )


# ============================================================================
# QUEUE: FACILITY VIEW
# ============================================================================

@router.get(
    "/queue/facility/{facility_id}",
    response_model=list[QueueEntryResponse],
)
async def get_facility_queue(
    facility_id: str,
    status_filter: QueueStatus | None = None,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Return today's queue for the healthcare-worker dashboard."""
    require_staff(current_user)

    if not await db.facilities.find_one(
        {"_id": facility_id},
        {"_id": 1},
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facility not found.",
        )

    query = {
        "facility_id": facility_id,
        "queue_date": _today_str(),
    }

    if status_filter:
        query["status"] = status_filter.value

    entries = [
        doc async for doc in db.queue_entries.find(query)
    ]

    entries.sort(
        key=lambda doc: _queue_sort_key(
            doc.get("priority", Priority.NORMAL.value),
            doc["token_number"],
        )
    )

    responses = []
    active_position = 0

    for doc in entries:
        if doc["status"] in ACTIVE_QUEUE_STATUSES:
            active_position += 1
            responses.append(
                queue_response(
                    doc,
                    position=active_position,
                )
            )
        else:
            responses.append(queue_response(doc))

    return responses


# ============================================================================
# QUEUE: PATIENT VIEW
# ============================================================================

@router.get(
    "/queue/{queue_id}",
    response_model=QueueEntryResponse,
)
async def get_queue_entry(
    queue_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Return token status, queue position and estimated waiting time."""
    queue_doc = await db.queue_entries.find_one(
        {"_id": queue_id}
    )

    if not queue_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Queue entry not found.",
        )

    require_self_or_staff(
        current_user,
        await _patient_owner_id(
            db,
            queue_doc["patient_id"],
        ),
    )

    if queue_doc["status"] not in ACTIVE_QUEUE_STATUSES:
        return queue_response(queue_doc)

    position, wait_minutes = await _calculate_position_and_wait(
        db,
        queue_doc,
    )

    return queue_response(
        queue_doc,
        position=position,
        estimated_wait_minutes=wait_minutes,
    )


# ============================================================================
# QUEUE: STATE TRANSITIONS
# ============================================================================

@router.patch(
    "/queue/{queue_id}/call",
    response_model=QueueEntryResponse,
)
async def call_patient(
    queue_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    require_staff(current_user)

    queue_doc = await _transition_queue_status(
        db,
        queue_id,
        QueueStatus.CALLED,
        "called_at",
    )

    return queue_response(queue_doc)


@router.patch(
    "/queue/{queue_id}/start",
    response_model=QueueEntryResponse,
)
async def start_consultation(
    queue_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    require_staff(current_user)

    queue_doc = await _transition_queue_status(
        db,
        queue_id,
        QueueStatus.IN_CONSULTATION,
    )

    return queue_response(queue_doc)


@router.patch(
    "/queue/{queue_id}/complete",
    response_model=QueueEntryResponse,
)
async def complete_consultation(
    queue_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    require_staff(current_user)

    queue_doc = await _transition_queue_status(
        db,
        queue_id,
        QueueStatus.COMPLETED,
        "completed_at",
    )

    # Keep linked appointment status synchronized.
    appointment_id = queue_doc.get("appointment_id")

    if appointment_id:
        await db.appointments.update_one(
            {"_id": appointment_id},
            {
                "$set": {
                    "status": AppointmentStatus.COMPLETED.value,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

    return queue_response(queue_doc)


@router.patch(
    "/queue/{queue_id}/skip",
    response_model=QueueEntryResponse,
)
async def skip_patient(
    queue_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    require_staff(current_user)

    queue_doc = await _transition_queue_status(
        db,
        queue_id,
        QueueStatus.SKIPPED,
    )

    return queue_response(queue_doc)


@router.delete(
    "/queue/{queue_id}",
    response_model=QueueEntryResponse,
)
async def cancel_queue_entry(
    queue_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    queue_doc = await db.queue_entries.find_one(
        {"_id": queue_id}
    )

    if not queue_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Queue entry not found.",
        )

    require_self_or_staff(
        current_user,
        await _patient_owner_id(
            db,
            queue_doc["patient_id"],
        ),
    )

    queue_doc = await _transition_queue_status(
        db,
        queue_id,
        QueueStatus.CANCELLED,
    )

    appointment_id = queue_doc.get("appointment_id")

    if appointment_id:
        await db.appointments.update_one(
            {"_id": appointment_id},
            {
                "$set": {
                    "status": AppointmentStatus.CANCELLED.value,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

    return queue_response(queue_doc)


# ============================================================================
# APPOINTMENTS
# ============================================================================

@router.post(
    "",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def book_appointment(
    payload: AppointmentCreateRequest,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    patient = await _load_patient_or_404(
        db,
        payload.patient_id,
    )

    require_self_or_staff(
        current_user,
        patient.get("linked_user_id"),
    )

    if not await db.facilities.find_one(
        {"_id": payload.facility_id}
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facility not found.",
        )

    if payload.requested_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointment date cannot be in the past.",
        )

    now = datetime.now(timezone.utc)

    doc = {
        "_id": str(uuid4()),
        "patient_id": payload.patient_id,
        "facility_id": payload.facility_id,
        "requested_date": payload.requested_date.isoformat(),
        "preferred_slot": payload.preferred_slot.value,
        "reason": payload.reason,
        "status": AppointmentStatus.BOOKED.value,
        "queue_id": None,
        "booked_by": current_user.id,
        "created_at": now,
        "updated_at": now,
    }

    await db.appointments.insert_one(doc)

    return appointment_response(doc)


@router.get(
    "",
    response_model=list[AppointmentResponse],
)
async def list_appointments(
    patient_id: str | None = None,
    facility_id: str | None = None,
    status_filter: AppointmentStatus | None = None,
    requested_date: date | None = None,
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    query: dict = {}

    if current_user.role == UserRole.PATIENT.value:
        own_patient = await db.patients.find_one(
            {"linked_user_id": current_user.id}
        )

        if not own_patient:
            return []

        query["patient_id"] = own_patient["_id"]

    else:
        require_staff(current_user)

        if patient_id:
            query["patient_id"] = patient_id

        if facility_id:
            query["facility_id"] = facility_id

    if status_filter:
        query["status"] = status_filter.value

    if requested_date:
        query["requested_date"] = requested_date.isoformat()

    cursor = (
        db.appointments
        .find(query)
        .sort(
            [
                ("requested_date", 1),
                ("created_at", 1),
            ]
        )
        .skip(skip)
        .limit(limit)
    )

    return [
        appointment_response(doc)
        async for doc in cursor
    ]


@router.get(
    "/{appointment_id}",
    response_model=AppointmentResponse,
)
async def get_appointment(
    appointment_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.appointments.find_one(
        {"_id": appointment_id}
    )

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found.",
        )

    require_self_or_staff(
        current_user,
        await _patient_owner_id(
            db,
            doc["patient_id"],
        ),
    )

    return appointment_response(doc)


@router.post(
    "/{appointment_id}/check-in",
    response_model=QueueEntryResponse,
)
async def check_in_appointment(
    appointment_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Convert today's booked appointment into a live queue token.
    Only facility staff perform physical check-in.
    """
    require_staff(current_user)

    appointment = await db.appointments.find_one(
        {"_id": appointment_id}
    )

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found.",
        )

    if appointment["status"] != AppointmentStatus.BOOKED.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Appointment is already "
                f"{appointment['status']}."
            ),
        )

    if appointment["requested_date"] != _today_str():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Only appointments scheduled for today "
                "can be checked in."
            ),
        )

    # Claim the appointment first so concurrent check-ins cannot
    # create multiple queue tokens.
    claim = await db.appointments.update_one(
        {
            "_id": appointment_id,
            "status": AppointmentStatus.BOOKED.value,
        },
        {
            "$set": {
                "status": AppointmentStatus.CHECKED_IN.value,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    if claim.modified_count != 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Appointment was already checked in.",
        )

    try:
        queue_doc = await issue_queue_token(
            db,
            facility_id=appointment["facility_id"],
            patient_id=appointment["patient_id"],
            appointment_id=appointment_id,
        )

        await db.appointments.update_one(
            {"_id": appointment_id},
            {
                "$set": {
                    "queue_id": queue_doc["_id"],
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

    except Exception:
        # Roll back appointment state if queue creation fails.
        await db.appointments.update_one(
            {"_id": appointment_id},
            {
                "$set": {
                    "status": AppointmentStatus.BOOKED.value,
                    "updated_at": datetime.now(timezone.utc),
                },
                "$unset": {
                    "queue_id": "",
                },
            },
        )
        raise

    position, wait_minutes = await _calculate_position_and_wait(
        db,
        queue_doc,
    )

    return queue_response(
        queue_doc,
        position=position,
        estimated_wait_minutes=wait_minutes,
    )


@router.patch(
    "/{appointment_id}/cancel",
    response_model=AppointmentResponse,
)
async def cancel_appointment(
    appointment_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.appointments.find_one(
        {"_id": appointment_id}
    )

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found.",
        )

    require_self_or_staff(
        current_user,
        await _patient_owner_id(
            db,
            doc["patient_id"],
        ),
    )

    if doc["status"] in {
        AppointmentStatus.COMPLETED.value,
        AppointmentStatus.CANCELLED.value,
    }:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Appointment is already "
                f"{doc['status']}."
            ),
        )

    updates = {
        "status": AppointmentStatus.CANCELLED.value,
        "updated_at": datetime.now(timezone.utc),
    }

    await db.appointments.update_one(
        {"_id": appointment_id},
        {"$set": updates},
    )

    # Remove the patient from the active queue if already checked in.
    queue_id = doc.get("queue_id")

    if queue_id:
        queue_doc = await db.queue_entries.find_one(
            {"_id": queue_id}
        )

        if queue_doc and queue_doc["status"] in {
            QueueStatus.WAITING.value,
            QueueStatus.CALLED.value,
        }:
            await db.queue_entries.update_one(
                {"_id": queue_id},
                {
                    "$set": {
                        "status": QueueStatus.CANCELLED.value,
                    }
                },
            )

    doc.update(updates)

    return appointment_response(doc)


@router.patch(
    "/{appointment_id}/status",
    response_model=AppointmentResponse,
)
async def update_appointment_status(
    appointment_id: str,
    new_status: AppointmentStatus,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Staff-only administrative appointment status update.

    Primarily useful for:
    - NO_SHOW
    - COMPLETED
    - administrative corrections

    Normal queue flow should use the dedicated queue endpoints.
    """
    require_staff(current_user)

    doc = await db.appointments.find_one(
        {"_id": appointment_id}
    )

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found.",
        )

    updates = {
        "status": new_status.value,
        "updated_at": datetime.now(timezone.utc),
    }

    await db.appointments.update_one(
        {"_id": appointment_id},
        {"$set": updates},
    )

    doc.update(updates)

    return appointment_response(doc)