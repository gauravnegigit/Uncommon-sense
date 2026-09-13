from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field, field_validator

from api.auth import get_current_user
from db.models import UserDB
from db.mongo import get_db

router = APIRouter(prefix="/facilities", tags=["facilities"])

class FacilityCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    facility_type: str = Field(..., min_length=2, max_length=50)
    specialties: list[str] = Field(default_factory=list)
    emergency_services: bool = False
    contact_number: str = Field(..., min_length=5, max_length=20)
    available_beds: int = Field(default=0, ge=0)
    location: dict
    avg_consult_minutes: int = Field(
        default=8,
        ge=1,
        le=120,
        description="Average consultation time used for queue estimates",
    )
    
    @field_validator("location")
    @classmethod
    def validate_location(cls, value: dict) -> dict:
        if value.get("type") != "Point":
            raise ValueError("Location must be a GeoJSON Point.")

        coordinates = value.get("coordinates")

        if (
            not isinstance(coordinates, list)
            or len(coordinates) != 2
            or not all(isinstance(x, (int, float)) for x in coordinates)
        ):
            raise ValueError(
                "Location coordinates must be [longitude, latitude]."
            )

        lng, lat = coordinates

        if not -180 <= lng <= 180:
            raise ValueError("Longitude must be between -180 and 180.")

        if not -90 <= lat <= 90:
            raise ValueError("Latitude must be between -90 and 90.")

        return value


class FacilityCapacityUpdate(BaseModel):
    available_beds: int = Field(..., ge=0)


class FacilityResponse(BaseModel):
    id: str
    name: str
    facility_type: str
    specialties: list[str]
    emergency_services: bool
    contact_number: str
    available_beds: int
    location: dict
    avg_consult_minutes: int
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
        avg_consult_minutes=doc.get("avg_consult_minutes", 8),
        distance_km=distance_km,
    )


def _nearby_pipeline(
    lat: float,
    lng: float,
    radius_km: float,
    query: dict,
    limit: int,
) -> list[dict]:
    return [
        {
            "$geoNear": {
                "near": {
                    "type": "Point",
                    "coordinates": [lng, lat],
                },
                "distanceField": "distance_m",
                "maxDistance": radius_km * 1000,
                "spherical": True,
                "query": query,
            }
        },
        {"$limit": limit},
    ]


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

    results = []

    async for doc in db.facilities.aggregate(
        _nearby_pipeline(lat, lng, radius_km, query, limit)
    ):
        distance_km = round(doc.pop("distance_m", 0) / 1000, 2)
        results.append(facility_response(doc, distance_km))

    return results


@router.get("/emergency", response_model=list[FacilityResponse])
async def emergency_facilities(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(25, gt=0, le=300),
    limit: int = Query(5, ge=1, le=20),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    results = []

    async for doc in db.facilities.aggregate(
        _nearby_pipeline(
            lat,
            lng,
            radius_km,
            {"emergency_services": True},
            limit,
        )
    ):
        distance_km = round(doc.pop("distance_m", 0) / 1000, 2)
        results.append(facility_response(doc, distance_km))

    return results


@router.get("", response_model=list[FacilityResponse])
async def list_facilities(
    q: str | None = Query(
        None,
        description="Search by facility name",
    ),
    facility_type: str | None = None,
    specialty: str | None = None,
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    query = {}

    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if facility_type:
        query["facility_type"] = facility_type
    if specialty:
        query["specialties"] = specialty

    cursor = (
        db.facilities
        .find(query)
        .sort("name", 1)
        .skip(skip)
        .limit(limit)
    )

    return [facility_response(doc) async for doc in cursor]


@router.get("/{facility_id}", response_model=FacilityResponse)
async def get_facility(
    facility_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.facilities.find_one({"_id": facility_id})

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facility not found.",
        )

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
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor or ASHA worker access required.",
        )

    existing = await db.facilities.find_one(
        {"name": payload.name}
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A facility with this name already exists.",
        )

    doc = {
        "_id": str(uuid4()),
        **payload.model_dump(),
    }

    await db.facilities.insert_one(doc)

    return facility_response(doc)


@router.patch(
    "/{facility_id}/capacity",
    response_model=FacilityResponse,
)
async def update_capacity(
    facility_id: str,
    payload: FacilityCapacityUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    if current_user.role not in {"DOCTOR", "ASHA_WORKER"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff access required.",
        )
    result = await db.facilities.find_one_and_update(
        {"_id": facility_id},
        {"$set": {"available_beds": payload.available_beds}},
        return_document=True,
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facility not found.",
        )
    return facility_response(result)