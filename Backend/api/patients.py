"""
Patient profiles.
A Patient is the demographic/contact identity used by appointments,
queue management and future clinical records. A patient does not need
their own login: ASHA workers or facility staff can register patients
who may later be linked to a User account.
"""
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from api.auth import get_current_user_from_cookie
from core.roles import require_self_or_staff, require_staff
from db.models import UserDB
from db.mongo import get_db

router = APIRouter(prefix="/patients", tags=["patients"])

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class PatientCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    age: int | None = Field(default=None, ge=0, le=130)
    gender: str | None = Field(default=None, max_length=20)
    phone: str | None = Field(default=None, max_length=20)
    address: str | None = Field(default=None, max_length=300)
    pincode: str | None = Field(default=None, min_length=5, max_length=10)
    preferred_language: str = Field(default="hi", max_length=10)
    home_facility_id: str | None = None


class PatientUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    age: int | None = Field(default=None, ge=0, le=130)
    gender: str | None = Field(default=None, max_length=20)
    phone: str | None = Field(default=None, max_length=20)
    address: str | None = Field(default=None, max_length=300)
    pincode: str | None = Field(default=None, min_length=5, max_length=10)
    preferred_language: str | None = Field(default=None, max_length=10)
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


# ---------------------------------------------------------------------------
# Create patient
# ---------------------------------------------------------------------------

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
    require_staff(current_user)

    if payload.home_facility_id:
        facility = await db.facilities.find_one(
            {"_id": payload.home_facility_id},
            {"_id": 1},
        )
        if not facility:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Home facility not found.",
            )

    now = datetime.now(timezone.utc)

    doc = {
        "_id": str(uuid4()),
        **payload.model_dump(),
        "name": payload.name.strip(),
        "preferred_language": payload.preferred_language.lower(),
        "registered_by": current_user.id,
        "linked_user_id": None,
        "created_at": now,
        "updated_at": now,
    }

    await db.patients.insert_one(doc)
    return patient_response(doc)


# ---------------------------------------------------------------------------
# Get patient
# ---------------------------------------------------------------------------

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    patient = await db.patients.find_one({"_id": patient_id})

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )

    require_self_or_staff(current_user, patient.get("linked_user_id"))

    return patient_response(patient)


# ---------------------------------------------------------------------------
# Update patient
# ---------------------------------------------------------------------------

@router.patch("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: str,
    payload: PatientUpdateRequest,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    patient = await db.patients.find_one({"_id": patient_id})

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )

    require_self_or_staff(current_user, patient.get("linked_user_id"))

    if payload.home_facility_id:
        facility = await db.facilities.find_one(
            {"_id": payload.home_facility_id},
            {"_id": 1},
        )
        if not facility:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Home facility not found.",
            )

    updates = payload.model_dump(exclude_unset=True)

    if "name" in updates and updates["name"]:
        updates["name"] = updates["name"].strip()

    if "preferred_language" in updates and updates["preferred_language"]:
        updates["preferred_language"] = updates[
            "preferred_language"
        ].lower()

    if not updates:
        return patient_response(patient)

    updates["updated_at"] = datetime.now(timezone.utc)

    await db.patients.update_one(
        {"_id": patient_id},
        {"$set": updates},
    )

    updated = await db.patients.find_one({"_id": patient_id})
    return patient_response(updated)


# ---------------------------------------------------------------------------
# Link a patient profile to a login account
# ---------------------------------------------------------------------------

@router.post(
    "/{patient_id}/link-user/{user_id}",
    response_model=PatientResponse,
)
async def link_user(
    patient_id: str,
    user_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    require_staff(current_user)

    patient = await db.patients.find_one({"_id": patient_id})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )

    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    existing = await db.patients.find_one(
        {
            "linked_user_id": user_id,
            "_id": {"$ne": patient_id},
        }
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This user is already linked to another patient.",
        )

    await db.patients.update_one(
        {"_id": patient_id},
        {
            "$set": {
                "linked_user_id": user_id,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    updated = await db.patients.find_one({"_id": patient_id})
    return patient_response(updated)


# ---------------------------------------------------------------------------
# Staff patient search
# ---------------------------------------------------------------------------

@router.get("", response_model=list[PatientResponse])
async def search_patients(
    q: str | None = Query(
        default=None,
        description="Search by patient name or phone",
    ),
    facility_id: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    skip: int = Query(default=0, ge=0),
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    require_staff(current_user)

    query: dict = {}

    if facility_id:
        query["home_facility_id"] = facility_id

    if q:
        search = q.strip()
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
        ]
    cursor = (
        db.patients
        .find(query)
        .sort("name", 1)
        .skip(skip)
        .limit(limit)
    )
    return [patient_response(doc) async for doc in cursor]