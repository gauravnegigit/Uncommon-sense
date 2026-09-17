"""
Patient records:
A Patient is a lightweight demographic + contact profile — NOT the clinical
longitudinal record. It exists separately because an ASHA worker or facility
staff member may register a walk-in patient who does not have a login.
User (optional login) <-- linked_user_id --> Patient profile
Appointments, queue entries and clinical records reference patient_id.
"""

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from api.auth import get_current_user_from_cookie
from core.roles import require_self_or_staff, require_staff
from db.models import UserDB, UserRole
from db.mongo import get_db

router = APIRouter(prefix="/patients", tags=["patients"])


class PatientCreateRequest(BaseModel):
    name: str
    age: int | None = Field(default=None, ge=0, le=130)
    gender: str | None = Field(
        default=None,
        description="MALE, FEMALE, or OTHER",
    )
    phone: str | None = None
    address: str | None = None
    pincode: str | None = None
    preferred_language: str = Field(
        default="hi",
        description="hi, mr, or en",
    )
    home_facility_id: str | None = None


class PatientUpdateRequest(BaseModel):
    name: str | None = None
    age: int | None = Field(default=None, ge=0, le=130)
    gender: str | None = None
    phone: str | None = None
    address: str | None = None
    pincode: str | None = None
    preferred_language: str | None = None
    home_facility_id: str | None = None


class PatientResponse(BaseModel):
    id: str
    name: str
    age: int | None = None
    gender: str | None = None
    phone: str | None = None
    address: str | None = None
    pincode: str | None = None
    preferred_language: str
    linked_user_id: str | None = None
    home_facility_id: str | None = None
    registered_by: str | None = None
    created_at: datetime
    updated_at: datetime


def patient_response(doc: dict) -> PatientResponse:
    return PatientResponse(
        id=str(doc["_id"]),
        name=doc["name"],
        age=doc.get("age"),
        gender=doc.get("gender"),
        phone=doc.get("phone"),
        address=doc.get("address"),
        pincode=doc.get("pincode"),
        preferred_language=doc.get("preferred_language", "hi"),
        linked_user_id=doc.get("linked_user_id"),
        home_facility_id=doc.get("home_facility_id"),
        registered_by=doc.get("registered_by"),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


@router.post(
    "",
    response_model=PatientResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_patient(
    payload: PatientCreateRequest,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Patients can create their own profile once.
    Doctors and ASHA workers can register walk-in patients.
    """
    linked_user_id: str | None = None

    if current_user.role == UserRole.PATIENT.value:
        existing = await db.patients.find_one(
            {"linked_user_id": current_user.id}
        )
        if existing:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "A patient profile is already linked to this account.",
            )
        linked_user_id = current_user.id
    else:
        require_staff(current_user)

    now = datetime.now(timezone.utc)
    doc = {
        "_id": str(uuid4()),
        **payload.model_dump(),
        "linked_user_id": linked_user_id,
        "registered_by": (
            current_user.id
            if current_user.role in {
                UserRole.DOCTOR.value,
                UserRole.ASHA_WORKER.value,
            }
            else None
        ),
        "created_at": now,
        "updated_at": now,
    }

    await db.patients.insert_one(doc)
    return patient_response(doc)


@router.get("/me", response_model=PatientResponse)
async def get_my_patient_profile(
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.patients.find_one(
        {"linked_user_id": current_user.id}
    )

    if not doc:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "No patient profile linked to this account yet.",
        )

    return patient_response(doc)


@router.get("", response_model=list[PatientResponse])
async def search_patients(
    name: str | None = None,
    phone: str | None = None,
    pincode: str | None = None,
    home_facility_id: str | None = None,
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Facility staff search for existing patient profiles."""
    require_staff(current_user)

    query: dict = {}

    if name:
        query["name"] = {
            "$regex": name,
            "$options": "i",
        }
    if phone:
        query["phone"] = phone
    if pincode:
        query["pincode"] = pincode
    if home_facility_id:
        query["home_facility_id"] = home_facility_id

    cursor = (
        db.patients
        .find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    return [
        patient_response(doc)
        async for doc in cursor
    ]


@router.get(
    "/{patient_id}",
    response_model=PatientResponse,
)
async def get_patient(
    patient_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.patients.find_one(
        {"_id": patient_id}
    )

    if not doc:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Patient not found.",
        )

    require_self_or_staff(
        current_user,
        doc.get("linked_user_id"),
    )

    return patient_response(doc)


@router.patch(
    "/{patient_id}",
    response_model=PatientResponse,
)
async def update_patient(
    patient_id: str,
    payload: PatientUpdateRequest,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.patients.find_one(
        {"_id": patient_id}
    )

    if not doc:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Patient not found.",
        )

    require_self_or_staff(
        current_user,
        doc.get("linked_user_id"),
    )

    updates = {
        key: value
        for key, value in payload.model_dump().items()
        if value is not None
    }

    if updates:
        updates["updated_at"] = datetime.now(timezone.utc)

        await db.patients.update_one(
            {"_id": patient_id},
            {"$set": updates},
        )

        doc.update(updates)

    return patient_response(doc)
