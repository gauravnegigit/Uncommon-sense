"""
FHIR-compatible representation of JanCare records (FHIR R4 / 4.0.1).

This module is pure mapping logic: JanCare Mongo document in, FHIR-shaped
dict out. It performs no database access and no authorization, which keeps
it easy to unit-test and keeps the HTTP layer (api/fhir.py) thin.

JanCare concept          FHIR resource
-----------------------  -------------------------------------------------
Patient profile          Patient
Facility                 Organization
Referral                 ServiceRequest (+ Bundle for the transfer package)
Diagnostic order         ServiceRequest / DiagnosticReport
Follow-up                Task
Record entry (note)      Observation
AI consultation summary  Composition (SBAR sections)
Whole patient record     Bundle (searchset)

Codings use JanCare-local CodeSystem URLs. A production deployment would
replace them with SNOMED CT / LOINC / ICD-10 codes after clinical review;
the resource shapes themselves do not change when that happens.
"""

from datetime import date, datetime, timezone

from core.config import settings

FHIR_VERSION = "4.0.1"
FHIR_MEDIA_TYPE = "application/fhir+json"

BASE_URL = settings.FHIR_BASE_URL.rstrip("/")

SYSTEM_PATIENT_ID = f"{BASE_URL}/identifier/patient"
SYSTEM_FACILITY_ID = f"{BASE_URL}/identifier/facility"
SYSTEM_REFERRAL_ID = f"{BASE_URL}/identifier/referral"
SYSTEM_DIAGNOSTIC_ID = f"{BASE_URL}/identifier/diagnostic-order"
SYSTEM_FOLLOWUP_ID = f"{BASE_URL}/identifier/followup"

CS_REFERRAL_STATUS = f"{BASE_URL}/CodeSystem/referral-status"
CS_DIAGNOSTIC_STATUS = f"{BASE_URL}/CodeSystem/diagnostic-status"
CS_FOLLOWUP_STATUS = f"{BASE_URL}/CodeSystem/followup-status"
CS_SERVICE_TYPE = f"{BASE_URL}/CodeSystem/service-type"

EXT_PATIENT_AGE = f"{BASE_URL}/StructureDefinition/patient-age"
EXT_JANCARE_STATUS = f"{BASE_URL}/StructureDefinition/jancare-status"
EXT_QUEUE_ENTRY = f"{BASE_URL}/StructureDefinition/queue-entry"

LANGUAGE_CODES = {
    "hi": ("hi-IN", "Hindi (India)"),
    "mr": ("mr-IN", "Marathi (India)"),
    "en": ("en-IN", "English (India)"),
}

GENDER_CODES = {
    "MALE": "male",
    "FEMALE": "female",
    "OTHER": "other",
}

# JanCare referral status -> FHIR ServiceRequest.status
REFERRAL_STATUS_MAP = {
    "CREATED": "active",
    "ACCEPTED": "active",
    "QUEUED": "active",
    "PATIENT_ARRIVED": "active",
    "COMPLETED": "completed",
    "REJECTED": "revoked",
    "CANCELLED": "revoked",
}

# JanCare diagnostic status -> FHIR ServiceRequest.status
DIAGNOSTIC_REQUEST_STATUS_MAP = {
    "REQUESTED": "active",
    "SAMPLE_COLLECTED": "active",
    "PROCESSING": "active",
    "RESULT_AVAILABLE": "completed",
    "CANCELLED": "revoked",
}

# JanCare diagnostic status -> FHIR DiagnosticReport.status
DIAGNOSTIC_REPORT_STATUS_MAP = {
    "REQUESTED": "registered",
    "SAMPLE_COLLECTED": "registered",
    "PROCESSING": "preliminary",
    "RESULT_AVAILABLE": "final",
    "CANCELLED": "cancelled",
}

# JanCare stored follow-up status -> FHIR Task.status
FOLLOWUP_STATUS_MAP = {
    "OPEN": "requested",
    "COMPLETED": "completed",
    "CANCELLED": "cancelled",
}

PRIORITY_MAP = {
    "NORMAL": "routine",
    "URGENT": "urgent",
}


# ---------------------------------------------------------------------------
# Primitive helpers
# ---------------------------------------------------------------------------

def instant(value: datetime | None) -> str | None:
    """FHIR `instant` / `dateTime` — always UTC, always offset-aware."""
    if value is None:
        return None
    if isinstance(value, str):
        return value
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def fhir_date(value: date | datetime | str | None) -> str | None:
    """FHIR `date` (YYYY-MM-DD)."""
    if value is None:
        return None
    if isinstance(value, str):
        return value[:10]
    if isinstance(value, datetime):
        return value.date().isoformat()
    return value.isoformat()


def reference(
    resource_type: str,
    resource_id: str | None,
    display: str | None = None,
) -> dict | None:
    if not resource_id:
        return None
    ref: dict = {"reference": f"{resource_type}/{resource_id}"}
    if display:
        ref["display"] = display
    return ref


def _prune(resource: dict) -> dict:
    """Drop None / empty values so the output stays valid FHIR."""
    cleaned = {}
    for key, value in resource.items():
        if value is None:
            continue
        if isinstance(value, (list, dict, str)) and len(value) == 0:
            continue
        cleaned[key] = value
    return cleaned


def _codeable(
    system: str,
    code: str,
    display: str | None = None,
    text: str | None = None,
) -> dict:
    return _prune(
        {
            "coding": [
                _prune(
                    {
                        "system": system,
                        "code": code,
                        "display": display,
                    }
                )
            ],
            "text": text or display or code,
        }
    )


def _jancare_status_extension(status_value: str) -> dict:
    """Preserve the exact JanCare workflow state alongside the FHIR status."""
    return {
        "url": EXT_JANCARE_STATUS,
        "valueString": status_value,
    }


# ---------------------------------------------------------------------------
# Patient
# ---------------------------------------------------------------------------

def patient_resource(doc: dict) -> dict:
    """JanCare patient profile -> FHIR Patient."""
    language_code, language_display = LANGUAGE_CODES.get(
        doc.get("preferred_language", "hi"),
        ("hi-IN", "Hindi (India)"),
    )

    telecom = []
    if doc.get("phone"):
        telecom.append(
            {
                "system": "phone",
                "value": doc["phone"],
                "use": "mobile",
            }
        )

    address = []
    if doc.get("address") or doc.get("pincode"):
        address.append(
            _prune(
                {
                    "use": "home",
                    "text": doc.get("address"),
                    "postalCode": doc.get("pincode"),
                    "country": "IN",
                }
            )
        )

    extensions = []
    if doc.get("age") is not None:
        extensions.append(
            {
                "url": EXT_PATIENT_AGE,
                "valueInteger": doc["age"],
            }
        )

    return _prune(
        {
            "resourceType": "Patient",
            "id": str(doc["_id"]),
            "meta": {"lastUpdated": instant(doc.get("updated_at"))},
            "extension": extensions,
            "identifier": [
                {
                    "use": "official",
                    "system": SYSTEM_PATIENT_ID,
                    "value": str(doc["_id"]),
                }
            ],
            "active": True,
            "name": [
                {
                    "use": "official",
                    "text": doc.get("name"),
                }
            ],
            "telecom": telecom,
            "gender": GENDER_CODES.get(
                (doc.get("gender") or "").upper(),
                "unknown",
            ),
            "address": address,
            "communication": [
                {
                    "language": _codeable(
                        "urn:ietf:bcp:47",
                        language_code,
                        language_display,
                    ),
                    "preferred": True,
                }
            ],
            "managingOrganization": reference(
                "Organization",
                doc.get("home_facility_id"),
            ),
        }
    )


# ---------------------------------------------------------------------------
# Organization (facility)
# ---------------------------------------------------------------------------

def organization_resource(doc: dict) -> dict:
    """JanCare facility -> FHIR Organization."""
    telecom = []
    if doc.get("contact_number"):
        telecom.append(
            {
                "system": "phone",
                "value": doc["contact_number"],
            }
        )

    address = []
    location = doc.get("location") or {}
    coordinates = location.get("coordinates")
    if coordinates and len(coordinates) == 2:
        address.append(
            {
                "text": (
                    f"GeoJSON Point "
                    f"[{coordinates[0]}, {coordinates[1]}]"
                ),
                "country": "IN",
            }
        )

    return _prune(
        {
            "resourceType": "Organization",
            "id": str(doc["_id"]),
            "identifier": [
                {
                    "system": SYSTEM_FACILITY_ID,
                    "value": str(doc["_id"]),
                }
            ],
            "active": True,
            "type": [
                _codeable(
                    CS_SERVICE_TYPE,
                    (doc.get("facility_type") or "FACILITY").upper(),
                    doc.get("facility_type"),
                )
            ],
            "name": doc.get("name"),
            "telecom": telecom,
            "address": address,
        }
    )


# ---------------------------------------------------------------------------
# Referral -> ServiceRequest
# ---------------------------------------------------------------------------

def referral_service_request(
    doc: dict,
    patient_display: str | None = None,
    from_facility_name: str | None = None,
    to_facility_name: str | None = None,
) -> dict:
    """
    JanCare referral -> FHIR ServiceRequest.

    The referring facility is the `requester`, the receiving facility is the
    `performer`, and the JanCare workflow state is preserved in an extension
    so a closed-loop referral is not flattened into a plain "active".
    """
    jancare_status = doc.get("status", "CREATED")

    extensions = [_jancare_status_extension(jancare_status)]

    # The receiving facility's queue token. JanCare does not export queue
    # entries as Encounter resources, so this is carried as a valueString
    # rather than a Reference — a Reference here would not resolve.
    if doc.get("queue_id"):
        extensions.append(
            {
                "url": EXT_QUEUE_ENTRY,
                "valueString": doc["queue_id"],
            }
        )

    return _prune(
        {
            "resourceType": "ServiceRequest",
            "id": str(doc["_id"]),
            "meta": {"lastUpdated": instant(doc.get("updated_at"))},
            "extension": extensions,
            "identifier": [
                {
                    "system": SYSTEM_REFERRAL_ID,
                    "value": str(doc["_id"]),
                }
            ],
            "status": REFERRAL_STATUS_MAP.get(jancare_status, "unknown"),
            "intent": "order",
            "priority": PRIORITY_MAP.get(
                doc.get("priority", "NORMAL"),
                "routine",
            ),
            "category": [
                _codeable(
                    CS_SERVICE_TYPE,
                    "REFERRAL",
                    "Inter-facility referral",
                )
            ],
            "code": _codeable(
                CS_REFERRAL_STATUS,
                jancare_status,
                f"Referral — {jancare_status}",
            ),
            "subject": reference(
                "Patient",
                doc.get("patient_id"),
                patient_display,
            ),
            "requester": reference(
                "Organization",
                doc.get("from_facility_id"),
                from_facility_name,
            ),
            "performer": [
                ref
                for ref in [
                    reference(
                        "Organization",
                        doc.get("to_facility_id"),
                        to_facility_name,
                    )
                ]
                if ref
            ],
            "authoredOn": instant(doc.get("created_at")),
            "reasonCode": [{"text": doc.get("reason")}]
            if doc.get("reason")
            else None,
        }
    )


# ---------------------------------------------------------------------------
# Diagnostics -> ServiceRequest / DiagnosticReport
# ---------------------------------------------------------------------------

def diagnostic_service_request(
    doc: dict,
    patient_display: str | None = None,
    facility_name: str | None = None,
) -> dict:
    """JanCare diagnostic order -> FHIR ServiceRequest (the request itself)."""
    jancare_status = doc.get("status", "REQUESTED")
    test_name = doc.get("test_name", "Diagnostic investigation")

    return _prune(
        {
            "resourceType": "ServiceRequest",
            "id": str(doc["_id"]),
            "meta": {"lastUpdated": instant(doc.get("updated_at"))},
            "extension": [_jancare_status_extension(jancare_status)],
            "identifier": [
                {
                    "system": SYSTEM_DIAGNOSTIC_ID,
                    "value": str(doc["_id"]),
                }
            ],
            "status": DIAGNOSTIC_REQUEST_STATUS_MAP.get(
                jancare_status,
                "unknown",
            ),
            "intent": "order",
            "category": [
                _codeable(
                    CS_SERVICE_TYPE,
                    "DIAGNOSTIC",
                    "Diagnostic investigation",
                )
            ],
            "code": {"text": test_name},
            "subject": reference(
                "Patient",
                doc.get("patient_id"),
                patient_display,
            ),
            "performer": [
                ref
                for ref in [
                    reference(
                        "Organization",
                        doc.get("facility_id"),
                        facility_name,
                    )
                ]
                if ref
            ],
            "authoredOn": instant(doc.get("ordered_at")),
            "note": [{"text": doc["notes"]}] if doc.get("notes") else None,
        }
    )


def diagnostic_report(
    doc: dict,
    patient_display: str | None = None,
    facility_name: str | None = None,
) -> dict:
    """
    JanCare diagnostic order -> FHIR DiagnosticReport.

    Emitted for every order so the receiving system can see work in progress;
    `conclusion` is only populated once a result summary exists.
    """
    jancare_status = doc.get("status", "REQUESTED")
    test_name = doc.get("test_name", "Diagnostic investigation")
    order_id = str(doc["_id"])

    return _prune(
        {
            "resourceType": "DiagnosticReport",
            # A distinct id from the ServiceRequest built off the same order,
            # so the two never collide inside one Bundle.
            "id": f"{order_id}-report",
            "meta": {"lastUpdated": instant(doc.get("updated_at"))},
            "extension": [_jancare_status_extension(jancare_status)],
            "identifier": [
                {
                    "system": SYSTEM_DIAGNOSTIC_ID,
                    "value": order_id,
                }
            ],
            "basedOn": [
                ref
                for ref in [reference("ServiceRequest", order_id)]
                if ref
            ],
            "status": DIAGNOSTIC_REPORT_STATUS_MAP.get(
                jancare_status,
                "unknown",
            ),
            "category": [
                _codeable(
                    CS_DIAGNOSTIC_STATUS,
                    jancare_status,
                    f"Diagnostic — {jancare_status}",
                )
            ],
            "code": {"text": test_name},
            "subject": reference(
                "Patient",
                doc.get("patient_id"),
                patient_display,
            ),
            "performer": [
                ref
                for ref in [
                    reference(
                        "Organization",
                        doc.get("facility_id"),
                        facility_name,
                    )
                ]
                if ref
            ],
            "effectiveDateTime": instant(doc.get("ordered_at")),
            "issued": instant(doc.get("result_available_at")),
            "conclusion": doc.get("result_summary"),
        }
    )


# ---------------------------------------------------------------------------
# Follow-up -> Task
# ---------------------------------------------------------------------------

def followup_task(
    doc: dict,
    display_status: str | None = None,
    patient_display: str | None = None,
    facility_name: str | None = None,
) -> dict:
    """
    JanCare follow-up -> FHIR Task.

    `display_status` is the derived UPCOMING / DUE / OVERDUE value; it is
    carried in `businessStatus` because FHIR Task.status has no equivalent.
    """
    stored_status = doc.get("status", "OPEN")
    due_date = fhir_date(doc.get("due_date"))

    return _prune(
        {
            "resourceType": "Task",
            "id": str(doc["_id"]),
            "meta": {"lastUpdated": instant(doc.get("updated_at"))},
            "extension": [_jancare_status_extension(stored_status)],
            "identifier": [
                {
                    "system": SYSTEM_FOLLOWUP_ID,
                    "value": str(doc["_id"]),
                }
            ],
            "status": FOLLOWUP_STATUS_MAP.get(stored_status, "requested"),
            "businessStatus": _codeable(
                CS_FOLLOWUP_STATUS,
                display_status or stored_status,
                f"Follow-up — {display_status or stored_status}",
            ),
            "intent": "order",
            "priority": "urgent"
            if doc.get("is_high_risk")
            else "routine",
            "code": _codeable(
                CS_SERVICE_TYPE,
                "FOLLOW_UP",
                "Care follow-up",
            ),
            "description": doc.get("reason"),
            "for": reference(
                "Patient",
                doc.get("patient_id"),
                patient_display,
            ),
            "owner": reference(
                "Organization",
                doc.get("facility_id"),
                facility_name,
            ),
            "authoredOn": instant(doc.get("created_at")),
            "lastModified": instant(doc.get("updated_at")),
            "restriction": {"period": {"end": due_date}}
            if due_date
            else None,
            "executionPeriod": {"end": instant(doc.get("completed_at"))}
            if doc.get("completed_at")
            else None,
        }
    )


# ---------------------------------------------------------------------------
# Record entry -> Observation
# ---------------------------------------------------------------------------

def record_entry_observation(
    doc: dict,
    patient_display: str | None = None,
) -> dict:
    """JanCare manual note / observation -> FHIR Observation."""
    entry_type = doc.get("entry_type", "NOTE")

    return _prune(
        {
            "resourceType": "Observation",
            "id": str(doc["_id"]),
            "meta": {"lastUpdated": instant(doc.get("created_at"))},
            "status": "final",
            "category": [
                _codeable(
                    CS_SERVICE_TYPE,
                    entry_type,
                    entry_type.title(),
                )
            ],
            "code": _codeable(
                CS_SERVICE_TYPE,
                f"CLINICAL_{entry_type}",
                f"Clinical {entry_type.lower()}",
            ),
            "subject": reference(
                "Patient",
                doc.get("patient_id"),
                patient_display,
            ),
            "effectiveDateTime": instant(doc.get("created_at")),
            "issued": instant(doc.get("created_at")),
            "valueString": doc.get("content"),
        }
    )


# ---------------------------------------------------------------------------
# AI consultation summary -> Composition (SBAR)
# ---------------------------------------------------------------------------

def sbar_composition(
    doc: dict,
    patient_id: str,
    patient_display: str | None = None,
) -> dict:
    """
    AI-assisted SBAR handover summary -> FHIR Composition.

    Only the sections that exist on the stored summary are emitted, so a
    partially filled SBAR still produces a valid document.
    """
    section_fields = [
        ("situation", "Situation"),
        ("background", "Background"),
        ("assessment", "Assessment"),
        ("recommendation", "Recommendation"),
    ]

    sections = []
    for field, title in section_fields:
        value = doc.get(field)
        if value:
            sections.append(
                {
                    "title": title,
                    "text": {
                        "status": "generated",
                        "div": (
                            '<div xmlns="http://www.w3.org/1999/xhtml">'
                            f"{value}</div>"
                        ),
                    },
                }
            )

    if not sections and doc.get("summary"):
        sections.append(
            {
                "title": "Summary",
                "text": {
                    "status": "generated",
                    "div": (
                        '<div xmlns="http://www.w3.org/1999/xhtml">'
                        f"{doc['summary']}</div>"
                    ),
                },
            }
        )

    composition_id = str(doc.get("summary_id", doc.get("_id")))

    return _prune(
        {
            "resourceType": "Composition",
            "id": composition_id,
            "status": "final",
            "type": _codeable(
                CS_SERVICE_TYPE,
                "SBAR_HANDOVER",
                "SBAR handover summary",
            ),
            "subject": reference("Patient", patient_id, patient_display),
            "date": instant(
                doc.get("updated_at", doc.get("created_at"))
            ),
            "title": "AI-assisted consultation summary (SBAR)",
            "custodian": reference(
                "Organization",
                doc.get("facility_id"),
            ),
            "section": sections,
        }
    )


# ---------------------------------------------------------------------------
# Bundles
# ---------------------------------------------------------------------------

def bundle(
    resources: list[dict],
    bundle_type: str = "searchset",
    bundle_id: str | None = None,
) -> dict:
    """Wrap resources in a FHIR Bundle with resolvable fullUrl entries."""
    entries = [
        {
            "fullUrl": (
                f"{BASE_URL}/{resource['resourceType']}/{resource['id']}"
            ),
            "resource": resource,
        }
        for resource in resources
        if resource
    ]

    return _prune(
        {
            "resourceType": "Bundle",
            "id": bundle_id,
            "meta": {"lastUpdated": instant(datetime.now(timezone.utc))},
            "type": bundle_type,
            "timestamp": instant(datetime.now(timezone.utc)),
            "total": len(entries),
            "entry": entries,
        }
    )


def operation_outcome(
    severity: str,
    code: str,
    diagnostics: str,
) -> dict:
    """FHIR error payload."""
    return {
        "resourceType": "OperationOutcome",
        "issue": [
            {
                "severity": severity,
                "code": code,
                "diagnostics": diagnostics,
            }
        ],
    }


def capability_statement() -> dict:
    """Minimal CapabilityStatement describing what JanCare exports."""
    resources = [
        ("Patient", ["read", "search-type"]),
        ("Organization", ["read"]),
        ("ServiceRequest", ["read"]),
        ("DiagnosticReport", ["read"]),
        ("Task", ["read"]),
        ("Observation", ["read"]),
        ("Composition", ["read"]),
        ("Bundle", ["read"]),
    ]

    return {
        "resourceType": "CapabilityStatement",
        "status": "active",
        "date": instant(datetime.now(timezone.utc)),
        "publisher": "JanCare",
        "kind": "instance",
        "implementation": {
            "description": "JanCare FHIR-compatible read-only export",
            "url": BASE_URL,
        },
        "fhirVersion": FHIR_VERSION,
        "format": ["application/fhir+json"],
        "rest": [
            {
                "mode": "server",
                "documentation": (
                    "Read-only export. JanCare remains the system of record; "
                    "no FHIR write operations are supported."
                ),
                "resource": [
                    {
                        "type": resource_type,
                        "interaction": [
                            {"code": interaction}
                            for interaction in interactions
                        ],
                    }
                    for resource_type, interactions in resources
                ],
            }
        ],
    }
