from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorDatabase,
)
from core.config import settings

class Mongo:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None

mongo = Mongo()

# CONNECTION
async def connect_to_mongo() -> None:
    """
    Create the MongoDB client, select the application database,
    verify the connection, and create required indexes.
    """
    mongo.client = AsyncIOMotorClient(
        settings.MONGODB_URI,
        serverSelectionTimeoutMS=5000,
    )
    # Verify MongoDB is actually reachable.
    await mongo.client.admin.command(
        "ping"
    )
    mongo.db = mongo.client[
        "rural_health"
    ]
    await _ensure_indexes()

async def close_mongo_connection() -> None:
    """
    Close the MongoDB client when the FastAPI application shuts down.
    """

    if mongo.client is not None:
        mongo.client.close()
        mongo.client = None
        mongo.db = None

# DATABASE DEPENDENCY
def get_db() -> AsyncIOMotorDatabase:
    """
    FastAPI dependency that returns the active Mongo database.
    """
    if mongo.db is None:
        raise RuntimeError(
            "MongoDB connection has not been initialized."
        )
    return mongo.db

# INDEXES
async def _ensure_indexes() -> None:
    """
    Create indexes required by the backend.
    MongoDB will safely keep these indexes once created.
    """
    if mongo.db is None:
        raise RuntimeError(
            "MongoDB database is not initialized."
        )
    db = mongo.db
    await db.users.create_index(
        "email",
        unique=True,
        sparse = True,
    )
    # Facilities
    # GeoJSON Point -> 2dsphere index.
    # This is required for $geoNear queries.
    await db.facilities.create_index(
        [
            (
                "location",
                "2dsphere",
            )
        ]
    )
    await db.facilities.create_index(
        "specialties"
    )
    await db.facilities.create_index(
        "facility_type"
    )
    # Triage sessions
    await db.triage_sessions.create_index(
        [
            (
                "user_id",
                1,
            ),
            (
                "created_at",
                -1,
            ),
        ]
    )
    # Patient summaries
    await db.patient_summaries.create_index(
        "triage_session_id",
        unique=True,
    )
