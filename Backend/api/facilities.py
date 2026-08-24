from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from api.auth import get_current_user
from db.models import UserDB
from db.mongo import get_db

router = APIRouter(prefix="/facilities", tags=["facilities"])


class FacilityCreateRequest(BaseModel):
    name: str
    facility_type: str
    specialties: list[str] = Field(default_factory=list)
    emergency_services: bool = False
    contact_number: str
    available_beds: int = Field(default=0, ge=0)
    location: dict


class FacilityResponse(BaseModel):
    id: str
    name: str
    facility_type: str
    specialties: list[str]
    emergency_services: bool
    contact_number: str
    available_beds: int
    location: dict
    distance_km: float | None = None


def facility_response(
    doc: dict,
    distance_km: float | None = None,
) -> FacilityResponse:
    return FacilityResponse(
        id=str(doc["_id"]),
        name=doc["name"],
        facility_type=doc["facility_type"],
        specialties=doc.get("specialties", []),
        emergency_services=doc.get("emergency_services", False),
        contact_number=doc.get("contact_number", ""),
        available_beds=doc.get("available_beds", 0),
        location=doc["location"],
        distance_km=distance_km,
    )


@router.get("/nearby", response_model=list[FacilityResponse])
async def nearby(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(15, gt=0, le=200),
    facility_type: str | None = None,
    specialty: str | None = None,
    emergency_services: bool | None = None,
    limit: int = Query(20, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    query = {}

    if facility_type:
        query["facility_type"] = facility_type
    if specialty:
        query["specialties"] = specialty
    if emergency_services is not None:
        query["emergency_services"] = emergency_services

    pipeline = [
        {
            "$geoNear": {
                "near": {"type": "Point", "coordinates": [lng, lat]},
                "distanceField": "distance_m",
                "maxDistance": radius_km * 1000,
                "spherical": True,
                "query": query,
            }
        },
        {"$limit": limit},
    ]

    results = []
    async for doc in db.facilities.aggregate(pipeline):
        distance = round(doc.pop("distance_m", 0) / 1000, 2)
        results.append(facility_response(doc, distance))

    return results


@router.get("/emergency", response_model=list[FacilityResponse])
async def emergency(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(25, gt=0, le=300),
    limit: int = Query(5, ge=1, le=20),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    pipeline = [
        {
            "$geoNear": {
                "near": {"type": "Point", "coordinates": [lng, lat]},
                "distanceField": "distance_m",
                "maxDistance": radius_km * 1000,
                "spherical": True,
                "query": {"emergency_services": True},
            }
        },
        {"$limit": limit},
    ]

    results = []
    async for doc in db.facilities.aggregate(pipeline):
        distance = round(doc.pop("distance_m", 0) / 1000, 2)
        results.append(facility_response(doc, distance))

    return results


@router.get("/{facility_id}", response_model=FacilityResponse)
async def get_facility(
    facility_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.facilities.find_one({"_id": facility_id})

    if not doc:
        raise HTTPException(404, "Facility not found.")

    return facility_response(doc)


@router.post(
    "",
    response_model=FacilityResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_facility(
    payload: FacilityCreateRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    if current_user.role not in {"DOCTOR", "ASHA_WORKER"}:
        raise HTTPException(
            403,
            "Doctor or ASHA worker access required.",
        )

    doc = {
        "_id": str(uuid4()),
        **payload.model_dump(),
    }

    await db.facilities.insert_one(doc)
    return facility_response(doc)