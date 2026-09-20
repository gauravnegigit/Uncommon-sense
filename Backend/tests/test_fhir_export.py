"""
Tests for the FHIR mapping layer.

These need no database and no running server — the mapper is pure functions,
so `pytest` from the backend root is enough:

    pytest tests/test_fhir_export.py -v
"""

import json
from datetime import datetime, timezone

from interoperability import fhir_export as fhir

NOW = datetime(2026, 1, 20, 9, 0, tzinfo=timezone.utc)

PATIENT = {
    "_id": "pat-1",
    "name": "Sunita Pawar",
    "age": 34,
    "gender": "FEMALE",
    "phone": "+919812345678",
    "address": "Village Kondhwa",
    "pincode": "412105",
    "preferred_language": "mr",
    "linked_user_id": "usr-1",
    "home_facility_id": "fac-1",
    "created_at": NOW,
    "updated_at": NOW,
}

FACILITY = {
    "_id": "fac-1",
    "name": "PHC Kondhwa",
    "facility_type": "PHC",
    "contact_number": "02012345678",
    "location": {"type": "Point", "coordinates": [73.9, 18.4]},
}

REFERRAL = {
    "_id": "ref-1",
    "patient_id": "pat-1",
    "from_facility_id": "fac-1",
    "to_facility_id": "fac-2",
    "reason": "Suspected anaemia, needs specialist review",
    "priority": "URGENT",
    "status": "QUEUED",
    "queue_id": "queue-9",
    "created_by": "usr-2",
    "created_at": NOW,
    "updated_at": NOW,
}

ORDER = {
    "_id": "dx-1",
    "patient_id": "pat-1",
    "facility_id": "fac-1",
    "test_name": "Haemoglobin",
    "notes": "Fasting not required",
    "status": "RESULT_AVAILABLE",
    "result_summary": "Hb 9.1 g/dL",
    "ordered_by": "usr-2",
    "ordered_at": NOW,
    "updated_at": NOW,
    "result_available_at": NOW,
}

FOLLOWUP = {
    "_id": "fu-1",
    "patient_id": "pat-1",
    "facility_id": "fac-1",
    "reason": "Repeat Hb in 4 weeks",
    "due_date": "2026-02-17",
    "is_high_risk": True,
    "status": "OPEN",
    "created_by": "usr-2",
    "created_at": NOW,
    "updated_at": NOW,
    "completed_at": None,
}


def test_patient_maps_core_demographics():
    resource = fhir.patient_resource(PATIENT)

    assert resource["resourceType"] == "Patient"
    assert resource["id"] == "pat-1"
    assert resource["gender"] == "female"
    assert resource["name"][0]["text"] == "Sunita Pawar"
    assert resource["telecom"][0]["value"] == "+919812345678"
    assert resource["address"][0]["postalCode"] == "412105"
    assert (
        resource["communication"][0]["language"]["coding"][0]["code"]
        == "mr-IN"
    )
    assert resource["extension"][0]["valueInteger"] == 34


def test_patient_without_optional_fields_is_still_valid():
    minimal = {
        "_id": "pat-2",
        "name": "Walk-in patient",
        "preferred_language": "hi",
        "created_at": NOW,
        "updated_at": NOW,
    }
    resource = fhir.patient_resource(minimal)

    assert resource["gender"] == "unknown"
    assert "telecom" not in resource
    assert "address" not in resource
    assert "managingOrganization" not in resource


def test_referral_becomes_service_request_with_direction():
    resource = fhir.referral_service_request(
        REFERRAL,
        patient_display="Sunita Pawar",
        from_facility_name="PHC Kondhwa",
        to_facility_name="Rural Hospital",
    )

    assert resource["resourceType"] == "ServiceRequest"
    assert resource["status"] == "active"
    assert resource["intent"] == "order"
    assert resource["priority"] == "urgent"
    assert resource["requester"]["reference"] == "Organization/fac-1"
    assert resource["performer"][0]["reference"] == "Organization/fac-2"
    assert resource["subject"]["reference"] == "Patient/pat-1"
    # The precise JanCare workflow stage survives the mapping.
    assert resource["extension"][0]["valueString"] == "QUEUED"
    # The queue token is carried as a value, not as a Reference to a
    # resource JanCare never exports.
    queue_ext = [
        ext
        for ext in resource["extension"]
        if ext["url"].endswith("/queue-entry")
    ]
    assert queue_ext[0]["valueString"] == "queue-9"
    assert "supportingInfo" not in resource


def test_closed_referral_statuses_map_correctly():
    for jancare_status, expected in [
        ("CREATED", "active"),
        ("COMPLETED", "completed"),
        ("REJECTED", "revoked"),
        ("CANCELLED", "revoked"),
    ]:
        doc = {**REFERRAL, "status": jancare_status}
        assert (
            fhir.referral_service_request(doc)["status"] == expected
        )


def test_diagnostic_report_does_not_collide_with_its_service_request():
    request = fhir.diagnostic_service_request(ORDER)
    report = fhir.diagnostic_report(ORDER)

    assert request["id"] == "dx-1"
    assert report["id"] == "dx-1-report"
    assert report["basedOn"][0]["reference"] == "ServiceRequest/dx-1"


def test_diagnostic_report_carries_result_only_when_available():
    final = fhir.diagnostic_report(ORDER)
    assert final["status"] == "final"
    assert final["conclusion"] == "Hb 9.1 g/dL"

    pending = fhir.diagnostic_report(
        {**ORDER, "status": "PROCESSING", "result_summary": None,
         "result_available_at": None}
    )
    assert pending["status"] == "preliminary"
    assert "conclusion" not in pending
    assert "issued" not in pending


def test_followup_task_keeps_derived_display_status():
    resource = fhir.followup_task(FOLLOWUP, display_status="OVERDUE")

    assert resource["resourceType"] == "Task"
    assert resource["status"] == "requested"
    assert resource["businessStatus"]["coding"][0]["code"] == "OVERDUE"
    assert resource["priority"] == "urgent"
    assert resource["restriction"]["period"]["end"] == "2026-02-17"


def test_bundle_is_json_serialisable_and_counts_entries():
    resources = [
        fhir.patient_resource(PATIENT),
        fhir.organization_resource(FACILITY),
        fhir.referral_service_request(REFERRAL),
        fhir.diagnostic_report(ORDER),
        fhir.followup_task(FOLLOWUP, display_status="UPCOMING"),
    ]
    bundle = fhir.bundle(resources, bundle_type="collection")

    assert bundle["type"] == "collection"
    assert bundle["total"] == 5
    assert bundle["entry"][0]["fullUrl"].endswith("/Patient/pat-1")
    json.dumps(bundle)

    # Every entry in a Bundle must be individually addressable.
    full_urls = [entry["fullUrl"] for entry in bundle["entry"]]
    assert len(full_urls) == len(set(full_urls))


def test_instant_normalises_naive_timestamps_to_utc():
    naive = datetime(2026, 1, 20, 9, 0)
    assert fhir.instant(naive) == "2026-01-20T09:00:00Z"


def test_referral_without_queue_token_has_no_queue_extension():
    doc = {**REFERRAL, "status": "CREATED", "queue_id": None}
    resource = fhir.referral_service_request(doc)

    assert len(resource["extension"]) == 1
    assert resource["extension"][0]["valueString"] == "CREATED"
