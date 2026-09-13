from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorDatabase,
)
from core.config import settings

class Mongo:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None

mongo = Mongo()

# ============================================================================
# CONNECTION
# ============================================================================
async def connect_to_mongo() -> None:
    """
    Create the MongoDB client, select the application database,
    verify the connection, and create required indexes.
    """
    mongo.client = AsyncIOMotorClient(
        settings.MONGO_URI,
        serverSelectionTimeoutMS=5000,
    )
    # Verify that MongoDB is reachable before the application starts.
    await mongo.client.admin.command("ping")
    mongo.db = mongo.client["rural_health"]
    await _ensure_indexes()

async def close_mongo_connection() -> None:
    """
    Close the MongoDB client when the FastAPI application shuts down.
    """
    if mongo.client is not None:
        mongo.client.close()
    mongo.client = None
    mongo.db = None

# ============================================================================
# DATABASE DEPENDENCY
# ============================================================================
def get_db() -> AsyncIOMotorDatabase:
    """
    FastAPI dependency returning the active MongoDB database.
    """
    if mongo.db is None:
        raise RuntimeError(
            "MongoDB connection has not been initialized."
        )
    return mongo.db

# ============================================================================
# INDEXES
# ============================================================================
async def _ensure_indexes() -> None:
    """
    Create indexes required by the application.
    Index creation is safe to run every time the application starts;
    MongoDB keeps existing indexes rather than creating duplicates.
    """
    if mongo.db is None:
        raise RuntimeError(
            "MongoDB database is not initialized."
        )
    db = mongo.db
    # AUTHENTICATION
    await db.users.create_index(
        "email",
        unique=True,
        sparse=True,
    )
    # FACILITIES
    # Required for MongoDB $geoNear queries.
    await db.facilities.create_index(
        [
            ("location", "2dsphere"),
        ]
    )
    await db.facilities.create_index(
        "specialties"
    )
    await db.facilities.create_index(
        "facility_type"
    )
    # Useful when filtering facilities by emergency capability.
    await db.facilities.create_index(
        "emergency_services"
    )
    # EXISTING TRIAGE / AI DATA
    await db.chat_histories.create_index(
        [("SessionId", 1)]
    )
    await db.clinical_summaries.create_index(
        [
            ("user_id", 1),
            ("summary_id", 1),
        ],
        unique=True,
    )
    # PENDING SIGNUPS
    await db.pending_signups.create_index(
        "expires_at",
        expireAfterSeconds=0,
    )
    await db.pending_signups.create_index(
        "pending_key",
        unique=True,
    )
    # ------------------------------------------------------------------------
    # PATIENTS
    # ------------------------------------------------------------------------
    # A login user can be linked to at most one patient profile.
    # Staff-created walk-in patients may have no linked_user_id.
    await db.patients.create_index(
        "linked_user_id",
        unique=True,
        sparse=True,
    )
    await db.patients.create_index(
        "phone"
    )
    await db.patients.create_index(
        "pincode"
    )
    await db.patients.create_index(
        "home_facility_id"
    )
    # ------------------------------------------------------------------------
    # APPOINTMENTS
    # ------------------------------------------------------------------------
    await db.appointments.create_index(
        "patient_id"
    )
    await db.appointments.create_index(
        [
            ("facility_id", 1),
            ("requested_date", 1),
        ]
    )
    await db.appointments.create_index(
        [
            ("patient_id", 1),
            ("requested_date", 1),
        ]
    )
    await db.appointments.create_index(
        "status"
    )
    # ------------------------------------------------------------------------
    # QUEUE / TOKENS
    # ------------------------------------------------------------------------
    # Token uniqueness is scoped to:
    #       facility + queue date + token number
    # Token generation itself is handled atomically using queue_counters
    # in api/appointments.py.
    await db.queue_entries.create_index(
        [
            ("facility_id", 1),
            ("queue_date", 1),
            ("token_number", 1),
        ],
        unique=True,
    )
    # Efficient facility queue retrieval.
    await db.queue_entries.create_index(
        [
            ("facility_id", 1),
            ("queue_date", 1),
            ("status", 1),
        ]
    )
    # Patient's current / historical queue entries.
    await db.queue_entries.create_index(
        "patient_id"
    )
    # Appointment → queue lookup.
    await db.queue_entries.create_index(
        "appointment_id"
    )
    # ------------------------------------------------------------------------
    # MEDICINE AVAILABILITY
    # ------------------------------------------------------------------------
    # One medicine entry per facility.
    await db.facility_medicines.create_index(
        [
            ("facility_id", 1),
            ("medicine_name_lower", 1),
        ],
        unique=True,
    )
    await db.facility_medicines.create_index(
        "medicine_name_lower"
    )
    # ------------------------------------------------------------------------
    # DIAGNOSTICS
    # ------------------------------------------------------------------------
    # These indexes support the diagnostic coordination workflow:
    #     ORDERED
    #       ↓
    #     SAMPLE_COLLECTED
    #       ↓
    #     PROCESSING
    #       ↓
    #     RESULT_AVAILABLE
    await db.diagnostic_orders.create_index(
        "patient_id"
    )
    await db.diagnostic_orders.create_index(
        "facility_id"
    )
    await db.diagnostic_orders.create_index(
        "status"
    )
    await db.diagnostic_orders.create_index(
        "ordered_at"
    )
    # Diagnostic reports need to be quickly attached to a patient/order.
    await db.diagnostic_reports.create_index(
        "patient_id"
    )
    await db.diagnostic_reports.create_index(
        "order_id"
    )
    # ------------------------------------------------------------------------
    # REFERRALS
    # ------------------------------------------------------------------------
    # Closed-loop referral flow:
    #     CREATED
    #       ↓
    #     ACCEPTED
    #       ↓
    #     APPOINTMENT_BOOKED
    #       ↓
    #     PATIENT_ARRIVED
    #       ↓
    #     COMPLETED
    await db.referrals.create_index(
        "patient_id"
    )
    await db.referrals.create_index(
        "from_facility"
    )
    await db.referrals.create_index(
        "to_facility"
    )
    await db.referrals.create_index(
        "status"
    )
    await db.referrals.create_index(
        "created_at"
    )
    # ------------------------------------------------------------------------
    # HIGH-RISK FOLLOW-UP
    # ------------------------------------------------------------------------
    # Follow-up tasks are deliberately kept simple:
    #     patient → risk category → task → due date → completion
    await db.followups.create_index(
        "patient_id"
    )
    await db.followups.create_index(
        "facility_id"
    )
    await db.followups.create_index(
        "status"
    )
    await db.followups.create_index(
        "due_date"
    )