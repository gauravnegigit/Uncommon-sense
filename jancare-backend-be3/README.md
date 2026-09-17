# JanCare — BE-3 (Continuity Backend)

> Longitudinal patient record · Diagnostics · Referrals · Follow-ups · Dashboard · FHIR export

This is the "what happens after access" half of the JanCare backend. BE-2 gets the
patient to care (patients, facilities, appointments, queue, medicines); BE-3 makes
sure the information survives the journey.

---

## What's in this bundle

### BE-3 modules (owned by this track)

| File | Responsibility |
|---|---|
| `api/patient_records.py` | Longitudinal Patient Record — manual note/observation entries and the read-only care timeline that projects every workflow into one chronological view |
| `api/diagnostics.py` | Diagnostic lifecycle: `REQUESTED → SAMPLE_COLLECTED → PROCESSING → RESULT_AVAILABLE` |
| `api/referrals.py` | Closed-loop referrals: `CREATED → ACCEPTED → QUEUED → PATIENT_ARRIVED → COMPLETED` |
| `api/followups.py` | High-risk follow-ups (stored `OPEN/COMPLETED/CANCELLED`, displayed `UPCOMING/DUE/OVERDUE`) **and** the facility operational dashboard |
| `api/fhir.py` | **New** — FHIR-compatible export endpoints |
| `interoperability/fhir_export.py` | **New** — the JanCare → FHIR R4 mapping layer (pure functions, no DB) |
| `core/timeutils.py` | **New** — one definition of "today" in IST, shared by every module that compares calendar dates |
| `tests/` | **New** — 20 tests: FHIR mapping units plus end-to-end API tests against an in-memory Mongo |

### Included so the bundle actually runs

These belong to other tracks. They are here because the BE-3 modules import
them — do not treat them as the source of truth if your teammates have newer
versions. Replace with theirs at merge time.

`api/auth.py`, `api/patients.py`, `api/facilities.py`, `api/appointments.py`,
`api/medicines.py`, `core/config.py`, `core/security.py`, `core/roles.py`,
`db/models.py`, `db/mongo.py`, `main.py`

---

## Running it

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env             # then edit JWT_SECRET and MONGO_URI

uvicorn main:app --reload
```

Open http://127.0.0.1:8000/docs for the interactive API.

MongoDB must be reachable at `MONGO_URI`. Indexes (including the `2dsphere`
index the facility search needs) are created automatically on startup by
`db.mongo.ensure_indexes()`.

## Tests

20 tests, no database server needed — the API tests run the real app against
an in-memory Mongo:

```bash
pip install -r requirements-dev.txt
pytest tests/ -v
```

| File | Covers |
|---|---|
| `tests/test_fhir_export.py` | The mapping layer as pure functions — status maps, optional fields, Bundle integrity |
| `tests/test_api_flow.py` | The golden path end to end: observation → diagnostic lifecycle → referral loop → follow-up → timeline → dashboard → FHIR export, plus the access-control rules |
| `tests/test_timeutils.py` | The IST/UTC regression described below |

---

## Endpoints

### Longitudinal patient record
```
POST   /patient-records/patients/{patient_id}/entries     add a note / observation
GET    /patient-records/patients/{patient_id}/timeline    one chronological care view
```

### Diagnostics
```
POST   /diagnostics                        create a diagnostic order
GET    /diagnostics                        list (patient-scoped or facility-scoped)
GET    /diagnostics/{order_id}
PATCH  /diagnostics/{order_id}/status      advance the lifecycle
```

### Referrals
```
POST   /referrals                          create an inter-facility referral
GET    /referrals                          filter by patient / facility / direction
GET    /referrals/{referral_id}
PATCH  /referrals/{referral_id}/status     advance the closed loop
```

### Follow-ups and dashboard
```
POST   /followups
GET    /followups                          filter by display status, high-risk only
PATCH  /followups/{followup_id}/complete
PATCH  /followups/{followup_id}/cancel
GET    /dashboard/facility/{facility_id}   everything a facility must act on today
```

### FHIR export (new)
```
GET /fhir/metadata                             CapabilityStatement
GET /fhir/Patient/{patient_id}                 Patient
GET /fhir/Patient/{patient_id}/$everything     Bundle — the whole record
GET /fhir/Organization/{facility_id}           Organization
GET /fhir/ServiceRequest/referral/{id}         Referral as ServiceRequest
GET /fhir/Bundle/referral/{referral_id}        Referral transfer package
GET /fhir/ServiceRequest/diagnostic/{id}       Diagnostic order as ServiceRequest
GET /fhir/DiagnosticReport/{order_id}          Diagnostic report
GET /fhir/Task/{followup_id}                   Follow-up as Task
```

---

## About the FHIR layer

**It is read-only.** JanCare's Mongo collections stay the system of record;
nothing is ever stored in FHIR form, and there are no FHIR write operations.
The export is a projection, exactly like the patient timeline is.

**The mapping**

| JanCare | FHIR R4 resource |
|---|---|
| Patient profile | `Patient` |
| Facility | `Organization` |
| Referral | `ServiceRequest` (referring facility = `requester`, receiving = `performer`) |
| Diagnostic order | `ServiceRequest` + `DiagnosticReport` |
| Follow-up | `Task` (derived UPCOMING/DUE/OVERDUE goes in `businessStatus`) |
| Record entry | `Observation` |
| AI SBAR summary | `Composition` with Situation/Background/Assessment/Recommendation sections |
| Whole record | `Bundle` |

**Two design decisions worth defending to judges**

1. *Workflow states are not flattened.* FHIR's `ServiceRequest.status` only has
   `active`, so `CREATED`, `ACCEPTED`, `QUEUED` and `PATIENT_ARRIVED` would all
   collapse into one value and the closed loop would be lost. The exact JanCare
   stage is preserved in a `jancare-status` extension alongside the standard
   status, so a receiving system gets both the interoperable value and the real one.

2. *`/fhir/Bundle/referral/{id}` is the interesting endpoint.* A bare referral
   resource is not clinically useful on its own. That endpoint returns what the
   receiving facility actually needs in a single call: the referral, the patient,
   both organizations, and recent diagnostic and follow-up context.

**Codes.** Codings currently use JanCare-local `CodeSystem` URLs built from
`FHIR_BASE_URL`. A production deployment would map them to SNOMED CT / LOINC
after clinical review — the resource shapes do not change when that happens.
Age is carried in an extension because JanCare stores age, not date of birth.

**Access control** matches the rest of the platform: staff read anything, a
patient reads only the record linked to their own account, and a walk-in
profile with no linked account is staff-only. `/fhir/metadata` and
`/fhir/Organization/{id}` are open, since facility data is already public.

---

## Fixes applied to the existing modules

These were pre-existing bugs in the code as handed over, fixed here rather
than carried into the demo. Mention them to whoever owns each file.

**The one that would have shown on stage.** `followups.py` computed "today"
with `datetime.now(timezone.utc)` while `appointments.py` wrote `queue_date`
in IST. After 18:30 IST every day the dashboard queried tomorrow's date and
both queue counters read zero, and a follow-up due today flipped to OVERDUE
5.5 hours early. All calendar-date logic now goes through `core/timeutils.py`,
covered by `tests/test_timeutils.py`.

- `auth.py` — `verify_signup` called `.strip()` on `email_otp` / `phone_otp`
  without a None check, returning 500 on a request that omitted them. Now a
  400, and the comparison is constant-time via `secrets.compare_digest`.
  Expiry handling also tolerates an already-aware `expires_at`.
- `appointments.py` — `cancel_appointment` wrote queue status with a raw
  `$set`, bypassing `_transition_queue_status` and its guards. It now goes
  through the state machine, so a patient already in consultation is never
  silently cancelled. The past-date check also uses the IST date.
- `followups.py` — `list_followups` applied the derived UPCOMING/DUE/OVERDUE
  filter *after* the database `limit`, so a page could come back short or
  empty. Filtering now precedes pagination, bounded by `MAX_FOLLOWUP_SCAN`.
- `fhir_export.py` — the referral's `supportingInfo` pointed at an
  `Encounter` resource JanCare never exports. The queue token is now an
  extension value. `DiagnosticReport` no longer reuses its `ServiceRequest`
  id, so both are addressable inside one Bundle.

---

## Merge notes for the team

- `api/fhir.py` imports `_display_status` from `api/followups.py` so a Task's
  UPCOMING/DUE/OVERDUE value is derived in exactly one place. If follow-up
  status logic changes, the FHIR export follows automatically.
- Register the new router in whichever `main.py` the team ends up using:
  `app.include_router(fhir.router)`.
- `interoperability/` is a separate package on purpose — the mapping is pure
  functions with no database access, which is why it can be unit-tested
  without Mongo or a running server.
