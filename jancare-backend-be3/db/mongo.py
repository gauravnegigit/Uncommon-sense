"""
MongoDB connection and index bootstrap.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, GEOSPHERE

from core.config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.MONGO_URI)
    return _client


async def get_db() -> AsyncIOMotorDatabase:
    """FastAPI dependency returning the application database."""
    return get_client()[settings.MONGO_DB_NAME]


async def close_db() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


async def ensure_indexes() -> None:
    """Create the indexes the BE-3 workflows rely on. Safe to re-run."""
    db = get_client()[settings.MONGO_DB_NAME]

    await db.facilities.create_index([("location", GEOSPHERE)])
    await db.facilities.create_index([("name", ASCENDING)])

    await db.patients.create_index([("linked_user_id", ASCENDING)])
    await db.patients.create_index([("phone", ASCENDING)])
    await db.patients.create_index([("created_at", DESCENDING)])

    await db.queue_entries.create_index(
        [
            ("facility_id", ASCENDING),
            ("queue_date", ASCENDING),
            ("status", ASCENDING),
        ]
    )

    await db.diagnostic_orders.create_index(
        [("patient_id", ASCENDING), ("ordered_at", DESCENDING)]
    )
    await db.diagnostic_orders.create_index(
        [("facility_id", ASCENDING), ("status", ASCENDING)]
    )

    await db.referrals.create_index(
        [("patient_id", ASCENDING), ("created_at", DESCENDING)]
    )
    await db.referrals.create_index(
        [("to_facility_id", ASCENDING), ("status", ASCENDING)]
    )
    await db.referrals.create_index(
        [("from_facility_id", ASCENDING), ("status", ASCENDING)]
    )

    await db.followups.create_index(
        [("facility_id", ASCENDING), ("status", ASCENDING)]
    )
    await db.followups.create_index(
        [("patient_id", ASCENDING), ("due_date", ASCENDING)]
    )

    await db.record_entries.create_index(
        [("patient_id", ASCENDING), ("created_at", DESCENDING)]
    )

    await db.facility_medicines.create_index(
        [("facility_id", ASCENDING), ("medicine_name_lower", ASCENDING)],
        unique=True,
    )
