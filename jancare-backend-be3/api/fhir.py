"""
FHIR-compatible export endpoints.

This is a read-only projection. JanCare's own collections remain the system
of record; nothing here writes, and no resource is stored in FHIR form. The
mapping itself lives in `interoperability/fhir_export.py`.

Endpoints
---------
GET /fhir/metadata                              CapabilityStatement
GET /fhir/Patient/{patient_id}                  Patient
GET /fhir/Patient/{patient_id}/$everything      Bundle — whole record
GET /fhir/Organization/{facility_id}            Organization
GET /fhir/ServiceRequest/referral/{id}          Referral as ServiceRequest
GET /fhir/ServiceRequest/diagnostic/{id}        Diagnostic order as request
GET /fhir/DiagnosticReport/{order_id}           Diagnostic report
GET /fhir/Task/{followup_id}                    Follow-up as Task
GET /fhir/Bundle/referral/{referral_id}         Referral transfer package

Access control mirrors the rest of the platform: staff can read any record,
a patient can read only the record linked to their own account, and a
walk-in profile with no linked account is staff-only.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from api.auth import get_current_user_from_cookie
from api.followups import _display_status
from core.roles import require_self_or_staff, require_staff
from db.models import UserDB
from db.mongo import get_db
from interoperability import fhir_export as fhir

router = APIRouter(prefix="/fhir", tags=["fhir export"])


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _fhir_json(resource: dict, status_code: int = 200) -> JSONResponse:
    """Serve every payload with the FHIR media type."""
    return JSONResponse(
        content=resource,
        status_code=status_code,
        media_type=fhir.FHIR_MEDIA_TYPE,
    )


async def _load_patient_or_404(
    db: AsyncIOMotorDatabase,
    patient_id: str,
) -> dict:
    patient = await db.patients.find_one({"_id": patient_id})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )
    return patient


def _authorize_patient_record(
    current_user: UserDB,
    patient: dict,
) -> None:
    """Staff, or the account the patient profile is linked to."""
    owner_id = patient.get("linked_user_id")
    if owner_id is None:
        require_staff(current_user)
    else:
        require_self_or_staff(current_user, owner_id)


async def _facilities(
    db: AsyncIOMotorDatabase,
    facility_ids: list[str | None],
) -> dict[str, dict]:
    """Load every referenced facility in one query, keyed by id."""
    wanted = list({fid for fid in facility_ids if fid})
    if not wanted:
        return {}

    return {
        doc["_id"]: doc
        async for doc in db.facilities.find({"_id": {"$in": wanted}})
    }


async def _facility_names(
    db: AsyncIOMotorDatabase,
    facility_ids: list[str | None],
) -> dict[str, str]:
    """Resolve facility ids to display names in a single query."""
    facilities = await _facilities(db, facility_ids)
    return {
        facility_id: doc.get("name", "")
        for facility_id, doc in facilities.items()
    }


# ---------------------------------------------------------------------------
# Capability statement
# ---------------------------------------------------------------------------

@router.get("/metadata")
async def get_capability_statement():
    """Describe the FHIR surface JanCare exposes. No authentication needed."""
    return _fhir_json(fhir.capability_statement())


# ---------------------------------------------------------------------------
# Patient
# ---------------------------------------------------------------------------

@router.get("/Patient/{patient_id}")
async def get_fhir_patient(
    patient_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    patient = await _load_patient_or_404(db, patient_id)
    _authorize_patient_record(current_user, patient)

    return _fhir_json(fhir.patient_resource(patient))


@router.get("/Patient/{patient_id}/$everything")
async def get_fhir_patient_everything(
    patient_id: str,
    include_consultations: bool = Query(
        True,
        description="Include AI-assisted SBAR summaries as Compositions.",
    ),
    limit_per_type: int = Query(100, ge=1, le=500),
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Export the patient's whole longitudinal record as one FHIR Bundle.

    This is the same information the `/patient-records/.../timeline`
    endpoint projects, expressed in standard resources so another system
    can consume it without knowing JanCare's internal schema.
    """
    patient = await _load_patient_or_404(db, patient_id)
    _authorize_patient_record(current_user, patient)

    patient_display = patient.get("name")
    resources: list[dict] = [fhir.patient_resource(patient)]
    facility_ids: list[str | None] = [patient.get("home_facility_id")]

    # Collect the source documents first so facility names can be
    # resolved in one query rather than once per resource.
    diagnostics = [
        doc
        async for doc in db.diagnostic_orders.find(
            {"patient_id": patient_id}
        )
        .sort("ordered_at", -1)
        .limit(limit_per_type)
    ]
    referrals = [
        doc
        async for doc in db.referrals.find({"patient_id": patient_id})
        .sort("created_at", -1)
        .limit(limit_per_type)
    ]
    followups = [
        doc
        async for doc in db.followups.find({"patient_id": patient_id})
        .sort("due_date", 1)
        .limit(limit_per_type)
    ]
    entries = [
        doc
        async for doc in db.record_entries.find({"patient_id": patient_id})
        .sort("created_at", -1)
        .limit(limit_per_type)
    ]

    for doc in diagnostics:
        facility_ids.append(doc.get("facility_id"))
    for doc in referrals:
        facility_ids.append(doc.get("from_facility_id"))
        facility_ids.append(doc.get("to_facility_id"))
    for doc in followups:
        facility_ids.append(doc.get("facility_id"))

    facilities = await _facilities(db, facility_ids)
    names = {
        facility_id: doc.get("name", "")
        for facility_id, doc in facilities.items()
    }

    for facility in facilities.values():
        resources.append(fhir.organization_resource(facility))

    for doc in diagnostics:
        facility_name = names.get(doc.get("facility_id"))
        resources.append(
            fhir.diagnostic_service_request(
                doc,
                patient_display=patient_display,
                facility_name=facility_name,
            )
        )
        resources.append(
            fhir.diagnostic_report(
                doc,
                patient_display=patient_display,
                facility_name=facility_name,
            )
        )

    for doc in referrals:
        resources.append(
            fhir.referral_service_request(
                doc,
                patient_display=patient_display,
                from_facility_name=names.get(doc.get("from_facility_id")),
                to_facility_name=names.get(doc.get("to_facility_id")),
            )
        )

    for doc in followups:
        resources.append(
            fhir.followup_task(
                doc,
                display_status=_display_status(doc),
                patient_display=patient_display,
                facility_name=names.get(doc.get("facility_id")),
            )
        )

    for doc in entries:
        resources.append(
            fhir.record_entry_observation(
                doc,
                patient_display=patient_display,
            )
        )

    linked_user_id = patient.get("linked_user_id")
    if include_consultations and linked_user_id:
        async for doc in db.clinical_summaries.find(
            {"user_id": linked_user_id}
        ).limit(limit_per_type):
            resources.append(
                fhir.sbar_composition(
                    doc,
                    patient_id=patient_id,
                    patient_display=patient_display,
                )
            )

    return _fhir_json(
        fhir.bundle(
            resources,
            bundle_type="searchset",
            bundle_id=f"everything-{patient_id}",
        )
    )


# ---------------------------------------------------------------------------
# Organization
# ---------------------------------------------------------------------------

@router.get("/Organization/{facility_id}")
async def get_fhir_organization(
    facility_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Facility data is already public in JanCare, so this needs no login."""
    facility = await db.facilities.find_one({"_id": facility_id})
    if not facility:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facility not found.",
        )
    return _fhir_json(fhir.organization_resource(facility))


# ---------------------------------------------------------------------------
# Referral
# ---------------------------------------------------------------------------

@router.get("/ServiceRequest/referral/{referral_id}")
async def get_fhir_referral(
    referral_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Single referral as a FHIR ServiceRequest."""
    referral = await db.referrals.find_one({"_id": referral_id})
    if not referral:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referral not found.",
        )

    patient = await _load_patient_or_404(db, referral["patient_id"])
    _authorize_patient_record(current_user, patient)

    names = await _facility_names(
        db,
        [referral.get("from_facility_id"), referral.get("to_facility_id")],
    )

    return _fhir_json(
        fhir.referral_service_request(
            referral,
            patient_display=patient.get("name"),
            from_facility_name=names.get(referral.get("from_facility_id")),
            to_facility_name=names.get(referral.get("to_facility_id")),
        )
    )


@router.get("/Bundle/referral/{referral_id}")
async def get_fhir_referral_package(
    referral_id: str,
    include_diagnostics: bool = Query(True),
    include_followups: bool = Query(True),
    limit_per_type: int = Query(20, ge=1, le=100),
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    The referral transfer package.

    This is what the receiving facility actually needs in one call: the
    referral itself, the patient, both organizations, and the recent
    diagnostic and follow-up context that makes the referral interpretable.
    """
    referral = await db.referrals.find_one({"_id": referral_id})
    if not referral:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referral not found.",
        )

    patient_id = referral["patient_id"]
    patient = await _load_patient_or_404(db, patient_id)
    _authorize_patient_record(current_user, patient)

    patient_display = patient.get("name")
    from_id = referral.get("from_facility_id")
    to_id = referral.get("to_facility_id")
    facilities = await _facilities(db, [from_id, to_id])
    names = {
        facility_id: doc.get("name", "")
        for facility_id, doc in facilities.items()
    }

    resources: list[dict] = [fhir.patient_resource(patient)]

    for facility_id in (from_id, to_id):
        facility = facilities.get(facility_id)
        if facility:
            resources.append(fhir.organization_resource(facility))

    resources.append(
        fhir.referral_service_request(
            referral,
            patient_display=patient_display,
            from_facility_name=names.get(from_id),
            to_facility_name=names.get(to_id),
        )
    )

    if include_diagnostics:
        async for doc in db.diagnostic_orders.find(
            {"patient_id": patient_id}
        ).sort("ordered_at", -1).limit(limit_per_type):
            resources.append(
                fhir.diagnostic_report(
                    doc,
                    patient_display=patient_display,
                )
            )

    if include_followups:
        async for doc in db.followups.find(
            {"patient_id": patient_id}
        ).sort("due_date", 1).limit(limit_per_type):
            resources.append(
                fhir.followup_task(
                    doc,
                    display_status=_display_status(doc),
                    patient_display=patient_display,
                )
            )

    return _fhir_json(
        fhir.bundle(
            resources,
            bundle_type="collection",
            bundle_id=f"referral-{referral_id}",
        )
    )


# ---------------------------------------------------------------------------
# Diagnostics
# ---------------------------------------------------------------------------

@router.get("/ServiceRequest/diagnostic/{order_id}")
async def get_fhir_diagnostic_request(
    order_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    order = await db.diagnostic_orders.find_one({"_id": order_id})
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diagnostic order not found.",
        )

    patient = await _load_patient_or_404(db, order["patient_id"])
    _authorize_patient_record(current_user, patient)

    names = await _facility_names(db, [order.get("facility_id")])

    return _fhir_json(
        fhir.diagnostic_service_request(
            order,
            patient_display=patient.get("name"),
            facility_name=names.get(order.get("facility_id")),
        )
    )


@router.get("/DiagnosticReport/{order_id}")
async def get_fhir_diagnostic_report(
    order_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    order = await db.diagnostic_orders.find_one({"_id": order_id})
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diagnostic order not found.",
        )

    patient = await _load_patient_or_404(db, order["patient_id"])
    _authorize_patient_record(current_user, patient)

    names = await _facility_names(db, [order.get("facility_id")])

    return _fhir_json(
        fhir.diagnostic_report(
            order,
            patient_display=patient.get("name"),
            facility_name=names.get(order.get("facility_id")),
        )
    )


# ---------------------------------------------------------------------------
# Follow-up
# ---------------------------------------------------------------------------

@router.get("/Task/{followup_id}")
async def get_fhir_followup_task(
    followup_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    followup = await db.followups.find_one({"_id": followup_id})
    if not followup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up not found.",
        )

    patient = await _load_patient_or_404(db, followup["patient_id"])
    _authorize_patient_record(current_user, patient)

    names = await _facility_names(db, [followup.get("facility_id")])

    return _fhir_json(
        fhir.followup_task(
            followup,
            display_status=_display_status(followup),
            patient_display=patient.get("name"),
            facility_name=names.get(followup.get("facility_id")),
        )
    )
