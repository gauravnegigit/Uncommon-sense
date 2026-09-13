from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from core.config import settings


class Mongo:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None


mongo = Mongo()


async def connect_to_mongo() -> None:
    """Connect to MongoDB and create required indexes."""
    mongo.client = AsyncIOMotorClient(
        settings.MONGO_URI,
        serverSelectionTimeoutMS=5000,
    )
    await mongo.client.admin.command("ping")
    mongo.db = mongo.client[settings.MONGO_DB_NAME]
    await _ensure_indexes()


async def close_mongo_connection() -> None:
    """Close the MongoDB connection."""
    if mongo.client is not None:
        mongo.client.close()
        mongo.client = None
        mongo.db = None


def get_db() -> AsyncIOMotorDatabase:
    """Return the active database for FastAPI dependencies."""
    if mongo.db is None:
        raise RuntimeError("MongoDB connection has not been initialized.")
    return mongo.db


async def _ensure_indexes() -> None:
    """Create indexes used by the application's API workflows."""
    db = get_db()

    # Users / authentication
    await db.users.create_index("email", unique=True, sparse=True)

    # Facilities
    await db.facilities.create_index([("location", "2dsphere")])
    await db.facilities.create_index("specialties")
    await db.facilities.create_index("facility_type")

    # Existing triage / consultation system
    await db.chat_histories.create_index([("SessionId", 1)])
    await db.clinical_summaries.create_index(
        [("user_id", 1), ("summary_id", 1)],
        unique=True,
    )

    # OTP / pending signup records
    await db.pending_signups.create_index(
        "expires_at",
        expireAfterSeconds=0,
    )
    await db.pending_signups.create_index(
        "pending_key",
        unique=True,
    )

    # Patients
    await db.patients.create_index(
        "linked_user_id",
        unique=True,
        sparse=True,
    )
    await db.patients.create_index("phone")
    await db.patients.create_index("pincode")
    await db.patients.create_index("home_facility_id")

    # Appointments
    await db.appointments.create_index("patient_id")
    await db.appointments.create_index(
        [("facility_id", 1), ("requested_date", 1)]
    )
    await db.appointments.create_index("status")

    # Queue
    await db.queue_entries.create_index(
        [
            ("facility_id", 1),
            ("queue_date", 1),
            ("token_number", 1),
        ],
        unique=True,
    )
    await db.queue_entries.create_index(
        [
            ("facility_id", 1),
            ("queue_date", 1),
            ("status", 1),
        ]
    )
    await db.queue_entries.create_index("patient_id")

    # Medicine availability
    await db.facility_medicines.create_index(
        [
            ("facility_id", 1),
            ("medicine_name_lower", 1),
        ],
        unique=True,
    )
    await db.facility_medicines.create_index("medicine_name_lower")
    await db.facility_medicines.create_index(
        [("facility_id", 1), ("category", 1)]
    )

    # Longitudinal patient records
    await db.record_entries.create_index("patient_id")

    # Diagnostics
    await db.diagnostic_orders.create_index("patient_id")
    await db.diagnostic_orders.create_index(
        [("facility_id", 1), ("status", 1)]
    )

    # Referrals
    await db.referrals.create_index("patient_id")
    await db.referrals.create_index(
        [("to_facility_id", 1), ("status", 1)]
    )
    await db.referrals.create_index(
        [("from_facility_id", 1), ("status", 1)]
    )

    # Follow-ups / high-risk patients
    await db.followups.create_index("patient_id")
    await db.followups.create_index(
        [
            ("facility_id", 1),
            ("status", 1),
            ("due_date", 1),
        ]
    )
    await db.followups.create_index("is_high_risk")