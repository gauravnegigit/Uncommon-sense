from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field
from pymongo import ReturnDocument

from api.auth import get_current_user_from_cookie
from core.roles import require_staff
from db.models import UserDB
from db.mongo import get_db

router = APIRouter(prefix="/medicines", tags=["medicines"])

class StockStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    LOW_STOCK = "LOW_STOCK"
    UNAVAILABLE = "UNAVAILABLE"

class MedicineUpsertRequest(BaseModel):
    medicine_name: str = Field(..., min_length=2, max_length=150)
    category: str | None = Field(default=None, max_length=100)
    status: StockStatus
    quantity: int | None = Field(default=None, ge=0)

class MedicineResponse(BaseModel):
    id: str
    facility_id: str
    medicine_name: str
    category: str | None = None
    status: str
    quantity: int | None = None
    updated_by: str
    updated_at: datetime

class MedicineFacilityMatch(BaseModel):
    facility_id: str
    facility_name: str
    distance_km: float
    medicine_name: str
    status: str
    quantity: int | None = None

def medicine_response(doc: dict) -> MedicineResponse:
    return MedicineResponse(
        id=str(doc["_id"]),
        facility_id=doc["facility_id"],
        medicine_name=doc["medicine_name"],
        category=doc.get("category"),
        status=doc["status"],
        quantity=doc.get("quantity"),
        updated_by=doc["updated_by"],
        updated_at=doc["updated_at"],
    )

@router.put("/facility/{facility_id}", response_model=MedicineResponse)
async def upsert_medicine_stock(
    facility_id: str,
    payload: MedicineUpsertRequest,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    require_staff(current_user)
    if not await db.facilities.find_one({"_id": facility_id}, {"_id": 1}):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facility not found.",
        )
    medicine_name = payload.medicine_name.strip()
    name_lower = medicine_name.lower()
    if not medicine_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Medicine name cannot be empty.",
        )
    now = datetime.now(timezone.utc)
    doc = await db.facility_medicines.find_one_and_update(
        {
            "facility_id": facility_id,
            "medicine_name_lower": name_lower,
        },
        {
            "$set": {
                "facility_id": facility_id,
                "medicine_name": medicine_name,
                "medicine_name_lower": name_lower,
                "category": payload.category,
                "status": payload.status.value,
                "quantity": payload.quantity,
                "updated_by": current_user.id,
                "updated_at": now,
            },
            "$setOnInsert": {
                "_id": str(uuid4()),
            },
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return medicine_response(doc)

@router.delete(
    "/facility/{facility_id}/{medicine_name}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_medicine_entry(
    facility_id: str,
    medicine_name: str,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    require_staff(current_user)
    result = await db.facility_medicines.delete_one(
        {
            "facility_id": facility_id,
            "medicine_name_lower": medicine_name.strip().lower(),
        }
    )
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine entry not found.",
        )

@router.get(
    "/facility/{facility_id}",
    response_model=list[MedicineResponse],
)
async def list_facility_medicines(
    facility_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if not await db.facilities.find_one({"_id": facility_id}, {"_id": 1}):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facility not found.",
        )
    cursor = (
        db.facility_medicines
        .find({"facility_id": facility_id})
        .sort("medicine_name", 1)
    )
    return [medicine_response(doc) async for doc in cursor]

@router.get(
    "/search",
    response_model=list[MedicineFacilityMatch],
)
async def search_medicine_nearby(
    medicine_name: str = Query(..., min_length=2, max_length=150),
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(15, gt=0, le=200),
    include_low_stock: bool = Query(True),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Find nearby facilities reporting the requested medicine as available
    or, optionally, low in stock. Results are ordered by distance.
    """
    name_lower = medicine_name.strip().lower()
    if not name_lower:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Medicine name cannot be empty.",
        )
    allowed_statuses = [StockStatus.AVAILABLE.value]
    if include_low_stock:
        allowed_statuses.append(StockStatus.LOW_STOCK.value)
    nearby_pipeline = [
        {
            "$geoNear": {
                "near": {
                    "type": "Point",
                    "coordinates": [lng, lat],
                },
                "distanceField": "distance_m",
                "maxDistance": radius_km * 1000,
                "spherical": True,
            }
        },
        {
            "$project": {
                "_id": 1,
                "name": 1,
                "distance_m": 1,
            }
        },
    ]
    nearby_facilities = {}
    async for facility in db.facilities.aggregate(nearby_pipeline):
        nearby_facilities[facility["_id"]] = {
            "name": facility["name"],
            "distance_km": round(facility["distance_m"] / 1000, 2),
        }
    if not nearby_facilities:
        return []
    medicine_cursor = db.facility_medicines.find(
        {
            "facility_id": {
                "$in": list(nearby_facilities.keys())
            },
            "medicine_name_lower": {
                "$regex": name_lower.replace("\\", "\\\\")
            },
            "status": {"$in": allowed_statuses},
        }
    )
    matches = []
    async for medicine in medicine_cursor:
        facility = nearby_facilities[medicine["facility_id"]]
        matches.append(
            MedicineFacilityMatch(
                facility_id=medicine["facility_id"],
                facility_name=facility["name"],
                distance_km=facility["distance_km"],
                medicine_name=medicine["medicine_name"],
                status=medicine["status"],
                quantity=medicine.get("quantity"),
            )
        )
    matches.sort(key=lambda item: item.distance_km)
    return matches[:limit]
