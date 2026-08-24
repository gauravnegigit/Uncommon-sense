from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime


# --- Auth Models ---

class UserRole:
    PATIENT = "PATIENT"
    ASHA_WORKER = "ASHA_WORKER"
    DOCTOR = "DOCTOR"

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = UserRole.PATIENT

class UserDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    email: EmailStr
    hashed_password: str
    role: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# --- Geospatial Facility Model ---
class Location(BaseModel):
    type: str = "Point"
    coordinates: List[float]

class HealthFacility(BaseModel):
    name: str
    facility_type: str
    location: Location
    specialties: List[str]
    emergency_services: bool
    contact_number: str
    available_beds: int

# --- Red Flags & Triage Model ---
class TriageRecord(BaseModel):
    patient_id: str
    symptoms_text: str
    detected_red_flags: List[str]
    is_emergency: bool
    recommended_facility_type: str
    summary_text: str
    created_at: datetime = Field(default_factory=datetime.utcnow)