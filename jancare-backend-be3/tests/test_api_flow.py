"""
End-to-end tests for the BE-3 continuity endpoints.

These run the real FastAPI app against an in-memory Mongo (mongomock-motor),
so no database server is needed:

    pip install mongomock-motor pytest httpx
    pytest tests/test_api_flow.py -v

They cover the whole golden path — patient, referral, diagnostic, follow-up,
dashboard, FHIR export — plus the access-control rules.
"""

import asyncio
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient

import main
from core.security import create_access_token
from core.timeutils import today_ist, today_ist_str
from db.mongo import get_db

NOW = datetime.now(timezone.utc)


def run(coro):
    """Drive a coroutine from a synchronous test."""
    return asyncio.run(coro)


@pytest.fixture()
def db():
    return AsyncMongoMockClient()["jancare_test"]


@pytest.fixture()
def client(db, monkeypatch):
    async def _get_db():
        return db

    async def _noop():
        return None

    # The real lifespan connects to MongoDB and builds indexes; the in-memory
    # database needs neither.
    monkeypatch.setattr(main, "ensure_indexes", _noop)
    monkeypatch.setattr(main, "close_db", _noop)

    main.app.dependency_overrides[get_db] = _get_db
    with TestClient(main.app) as test_client:
        yield test_client
    main.app.dependency_overrides.clear()


def _auth(client, user_id, role):
    """Log a user in by setting the cookie the app actually reads."""
    client.cookies.set(
        "access_token",
        create_access_token(subject=user_id, extra_claims={"role": role}),
    )


async def _seed(db):
    await db.users.insert_many(
        [
            {
                "_id": "usr-doc",
                "name": "Dr Rao",
                "email": "rao@phc.in",
                "phone": None,
                "role": "DOCTOR",
                "created_at": NOW,
            },
            {
                "_id": "usr-pat",
                "name": "Sunita Pawar",
                "email": "sunita@example.in",
                "phone": None,
                "role": "PATIENT",
                "created_at": NOW,
            },
            {
                "_id": "usr-other",
                "name": "Someone Else",
                "email": "other@example.in",
                "phone": None,
                "role": "PATIENT",
                "created_at": NOW,
            },
        ]
    )
    await db.facilities.insert_many(
        [
            {
                "_id": "fac-1",
                "name": "PHC Kondhwa",
                "facility_type": "PHC",
                "specialties": [],
                "emergency_services": False,
                "contact_number": "02012345678",
                "available_beds": 4,
                "location": {"type": "Point", "coordinates": [73.9, 18.4]},
                "avg_consult_minutes": 8,
            },
            {
                "_id": "fac-2",
                "name": "Rural Hospital Saswad",
                "facility_type": "RURAL_HOSPITAL",
                "specialties": ["medicine"],
                "emergency_services": True,
                "contact_number": "02087654321",
                "available_beds": 20,
                "location": {"type": "Point", "coordinates": [74.0, 18.3]},
                "avg_consult_minutes": 10,
            },
        ]
    )
    await db.patients.insert_one(
        {
            "_id": "pat-1",
            "name": "Sunita Pawar",
            "age": 34,
            "gender": "FEMALE",
            "phone": "+919812345678",
            "address": "Village Kondhwa",
            "pincode": "412105",
            "preferred_language": "mr",
            "linked_user_id": "usr-pat",
            "home_facility_id": "fac-1",
            "registered_by": None,
            "created_at": NOW,
            "updated_at": NOW,
        }
    )
    return db


@pytest.fixture()
def seeded(db):
    run(_seed(db))
    return db


def test_continuity_golden_path(client, seeded):
    db = seeded
    _auth(client, "usr-doc", "DOCTOR")

    # 1. A staff observation lands on the record.
    entry = client.post(
        "/patient-records/patients/pat-1/entries",
        json={
            "facility_id": "fac-1",
            "entry_type": "OBSERVATION",
            "content": "Reports fatigue on exertion for three weeks.",
        },
    )
    assert entry.status_code == 201

    # 2. A diagnostic order runs its full lifecycle.
    order = client.post(
        "/diagnostics",
        json={
            "patient_id": "pat-1",
            "facility_id": "fac-1",
            "test_name": "Haemoglobin",
        },
    ).json()
    order_id = order["id"]
    assert order["status"] == "REQUESTED"

    for target in ("SAMPLE_COLLECTED", "PROCESSING"):
        step = client.patch(
            f"/diagnostics/{order_id}/status",
            json={"new_status": target},
        )
        assert step.status_code == 200, step.text

    # Skipping a stage is rejected.
    assert (
        client.patch(
            f"/diagnostics/{order_id}/status",
            json={"new_status": "SAMPLE_COLLECTED"},
        ).status_code
        == 409
    )

    # A result requires a summary.
    assert (
        client.patch(
            f"/diagnostics/{order_id}/status",
            json={"new_status": "RESULT_AVAILABLE"},
        ).status_code
        == 400
    )

    done = client.patch(
        f"/diagnostics/{order_id}/status",
        json={
            "new_status": "RESULT_AVAILABLE",
            "result_summary": "Hb 9.1 g/dL",
        },
    ).json()
    assert done["status"] == "RESULT_AVAILABLE"
    assert done["result_available_at"] is not None

    # 3. A referral to the rural hospital.
    referral = client.post(
        "/referrals",
        json={
            "patient_id": "pat-1",
            "from_facility_id": "fac-1",
            "to_facility_id": "fac-2",
            "reason": "Anaemia, needs specialist review",
            "priority": "URGENT",
        },
    ).json()
    referral_id = referral["id"]
    assert referral["status"] == "CREATED"

    # Self-referral is rejected.
    assert (
        client.post(
            "/referrals",
            json={
                "patient_id": "pat-1",
                "from_facility_id": "fac-1",
                "to_facility_id": "fac-1",
                "reason": "Invalid",
            },
        ).status_code
        == 400
    )

    accepted = client.patch(
        f"/referrals/{referral_id}/status",
        json={"new_status": "ACCEPTED"},
    )
    assert accepted.status_code == 200

    # QUEUED without a queue token is refused.
    assert (
        client.patch(
            f"/referrals/{referral_id}/status",
            json={"new_status": "QUEUED"},
        ).status_code
        == 400
    )

    run(db.queue_entries.insert_one(
        {
            "_id": "queue-9",
            "facility_id": "fac-2",
            "patient_id": "pat-1",
            "appointment_id": None,
            "token_number": 4,
            "queue_date": today_ist_str(),
            "status": "WAITING",
            "priority": "URGENT",
            "created_at": NOW,
            "called_at": None,
            "completed_at": None,
        }
    ))

    queued = client.patch(
        f"/referrals/{referral_id}/status",
        json={"new_status": "QUEUED", "queue_id": "queue-9"},
    ).json()
    assert queued["status"] == "QUEUED"
    assert queued["queue_id"] == "queue-9"

    # 4. A high-risk follow-up, due today.
    followup = client.post(
        "/followups",
        json={
            "patient_id": "pat-1",
            "facility_id": "fac-1",
            "reason": "Repeat Hb",
            "due_date": today_ist().isoformat(),
            "is_high_risk": True,
        },
    ).json()
    assert followup["status"] == "DUE"

    overdue = client.post(
        "/followups",
        json={
            "patient_id": "pat-1",
            "facility_id": "fac-1",
            "reason": "Missed review",
            "due_date": (today_ist() - timedelta(days=3)).isoformat(),
            "is_high_risk": True,
        },
    ).json()
    assert overdue["status"] == "OVERDUE"

    # 5. The timeline pulls every workflow together.
    timeline = client.get(
        "/patient-records/patients/pat-1/timeline"
    ).json()
    types = {event["type"] for event in timeline}
    assert {"OBSERVATION", "DIAGNOSTIC", "REFERRAL", "FOLLOW_UP"} <= types

    # 6. The dashboard counts what needs attention.
    dashboard = client.get("/dashboard/facility/fac-1").json()
    assert dashboard["followups_due_today"] == 1
    assert dashboard["followups_overdue"] == 1
    assert dashboard["open_referrals_outgoing"] == 1
    assert dashboard["open_referrals_incoming"] == 0
    assert dashboard["diagnostics_in_progress"] == 0

    incoming = client.get("/dashboard/facility/fac-2").json()
    assert incoming["open_referrals_incoming"] == 1
    assert incoming["queue_waiting"] == 1


def test_followup_display_filter_paginates_after_filtering(client, seeded):
    _auth(client, "usr-doc", "DOCTOR")

    # Ten completed follow-ups sorted ahead of the one overdue record.
    for index in range(10):
        created = client.post(
            "/followups",
            json={
                "patient_id": "pat-1",
                "facility_id": "fac-1",
                "reason": f"Old review {index}",
                "due_date": (
                    today_ist() - timedelta(days=30 + index)
                ).isoformat(),
            },
        ).json()
        assert (
            client.patch(
                f"/followups/{created['id']}/complete"
            ).status_code
            == 200
        )

    client.post(
        "/followups",
        json={
            "patient_id": "pat-1",
            "facility_id": "fac-1",
            "reason": "Needs chasing",
            "due_date": (today_ist() - timedelta(days=1)).isoformat(),
        },
    )

    # With a small page size the overdue record is not in the first ten
    # documents by due date. Filtering must happen before pagination.
    overdue = client.get(
        "/followups",
        params={"display_status": "OVERDUE", "limit": 5},
    ).json()

    assert len(overdue) == 1
    assert overdue[0]["reason"] == "Needs chasing"


def test_patient_can_read_own_record_but_not_someone_elses(client, seeded):
    _auth(client, "usr-doc", "DOCTOR")
    order_id = client.post(
        "/diagnostics",
        json={
            "patient_id": "pat-1",
            "facility_id": "fac-1",
            "test_name": "Haemoglobin",
        },
    ).json()["id"]

    # The linked patient can read their own diagnostic order.
    _auth(client, "usr-pat", "PATIENT")
    assert client.get(f"/diagnostics/{order_id}").status_code == 200

    # A different patient account cannot.
    _auth(client, "usr-other", "PATIENT")
    assert client.get(f"/diagnostics/{order_id}").status_code == 403

    # And cannot create clinical records at all.
    assert (
        client.post(
            "/patient-records/patients/pat-1/entries",
            json={"entry_type": "NOTE", "content": "not allowed"},
        ).status_code
        == 403
    )


def test_walkin_patient_without_account_is_staff_only(client, seeded):
    db = seeded
    run(db.patients.insert_one(
        {
            "_id": "pat-walkin",
            "name": "Walk-in",
            "preferred_language": "hi",
            "linked_user_id": None,
            "created_at": NOW,
            "updated_at": NOW,
        }
    ))

    _auth(client, "usr-doc", "DOCTOR")
    order_id = client.post(
        "/diagnostics",
        json={
            "patient_id": "pat-walkin",
            "facility_id": "fac-1",
            "test_name": "Blood sugar",
        },
    ).json()["id"]

    _auth(client, "usr-pat", "PATIENT")
    assert client.get(f"/diagnostics/{order_id}").status_code == 403


def test_fhir_export_endpoints(client, seeded):
    _auth(client, "usr-doc", "DOCTOR")

    referral_id = client.post(
        "/referrals",
        json={
            "patient_id": "pat-1",
            "from_facility_id": "fac-1",
            "to_facility_id": "fac-2",
            "reason": "Anaemia",
            "priority": "URGENT",
        },
    ).json()["id"]

    order_id = client.post(
        "/diagnostics",
        json={
            "patient_id": "pat-1",
            "facility_id": "fac-1",
            "test_name": "Haemoglobin",
        },
    ).json()["id"]

    client.post(
        "/followups",
        json={
            "patient_id": "pat-1",
            "facility_id": "fac-1",
            "reason": "Repeat Hb",
            "due_date": (today_ist() + timedelta(days=28)).isoformat(),
        },
    )

    # Capability statement needs no auth.
    metadata = client.get("/fhir/metadata")
    assert metadata.status_code == 200
    assert metadata.json()["fhirVersion"] == "4.0.1"
    assert metadata.headers["content-type"].startswith(
        "application/fhir+json"
    )

    patient = client.get("/fhir/Patient/pat-1").json()
    assert patient["resourceType"] == "Patient"
    assert patient["gender"] == "female"

    service_request = client.get(
        f"/fhir/ServiceRequest/referral/{referral_id}"
    ).json()
    assert service_request["resourceType"] == "ServiceRequest"
    assert service_request["requester"]["display"] == "PHC Kondhwa"
    assert (
        service_request["performer"][0]["display"]
        == "Rural Hospital Saswad"
    )

    report = client.get(f"/fhir/DiagnosticReport/{order_id}").json()
    assert report["id"] == f"{order_id}-report"

    package = client.get(f"/fhir/Bundle/referral/{referral_id}").json()
    assert package["type"] == "collection"
    kinds = {
        entry["resource"]["resourceType"] for entry in package["entry"]
    }
    assert {
        "Patient",
        "Organization",
        "ServiceRequest",
        "DiagnosticReport",
        "Task",
    } <= kinds

    everything = client.get("/fhir/Patient/pat-1/$everything").json()
    assert everything["type"] == "searchset"
    full_urls = [entry["fullUrl"] for entry in everything["entry"]]
    assert len(full_urls) == len(set(full_urls))

    # A patient reads their own record; an unrelated account does not.
    _auth(client, "usr-pat", "PATIENT")
    assert client.get("/fhir/Patient/pat-1").status_code == 200
    _auth(client, "usr-other", "PATIENT")
    assert client.get("/fhir/Patient/pat-1").status_code == 403


def test_signup_verify_rejects_missing_otp_without_crashing(client, seeded):
    db = seeded
    run(
        db.pending_signups.insert_one(
            {
                "_id": "pending-1",
                "pending_key": "new@example.in_",
                "name": "New User",
                "password": "hashed",
                "email": "new@example.in",
                "phone": None,
                "email_otp": "123456",
                "phone_otp": None,
                "expires_at": NOW + timedelta(minutes=10),
                "address": None,
                "pincode": None,
                "role": "PATIENT",
                "created_at": NOW,
            }
        )
    )

    # No otp supplied at all — a bad request, not a 500.
    missing = client.post(
        "/auth/signup/verify",
        json={"email": "new@example.in"},
    )
    assert missing.status_code == 400

    wrong = client.post(
        "/auth/signup/verify",
        json={"email": "new@example.in", "email_otp": "000000"},
    )
    assert wrong.status_code == 400

    correct = client.post(
        "/auth/signup/verify",
        json={"email": "new@example.in", "email_otp": "123456"},
    )
    assert correct.status_code == 201
    assert correct.json()["email"] == "new@example.in"
