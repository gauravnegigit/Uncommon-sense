"""
JanCare backend application entrypoint.

Run with:
    uvicorn main:app --reload
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import (
    appointments,
    auth,
    diagnostics,
    facilities,
    fhir,
    followups,
    medicines,
    patient_records,
    patients,
    referrals,
)
from core.config import settings
from db.mongo import close_db, ensure_indexes


@asynccontextmanager
async def lifespan(app: FastAPI):
    await ensure_indexes()
    yield
    await close_db()


app = FastAPI(
    title="JanCare API",
    description=(
        "Rural public healthcare access and care-continuity platform. "
        "From reaching healthcare to continuing care."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Access half (BE-2) ----------------------------------------------------
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(facilities.router)
app.include_router(appointments.router)
app.include_router(medicines.router)

# --- Continuity half (BE-3) ------------------------------------------------
app.include_router(patient_records.router)
app.include_router(diagnostics.router)
app.include_router(referrals.router)
app.include_router(followups.router)
app.include_router(fhir.router)


@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok", "env": settings.ENV}
