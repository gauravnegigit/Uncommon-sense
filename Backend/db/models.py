from pydantic import BaseModel , EmailStr , Field
from typing import List , Optional
from datetime import datetime 


# --- Auth Models --- 
class UserRole: 
    PATIENT = "PATIENT"

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = UserRole.PATIENT

class UserDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    hashed_password: str
    address: Optional[str] = None
    pincode: Optional[str] = None
    is_email_verified: bool = False
    is_phone_verified: bool = False
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


class ClinicalSummaryResponse(BaseModel):
    summary_id: str = Field(..., description="ID of the logged-in user generating the summary")
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # SBAR Structured Format
    situation: str = Field(..., description="Primary presenting complaint and triage status")
    background: str = Field(..., description="Timeline of symptoms, relevant context, or reported patient history")
    assessment: str = Field(..., description="Key clinical findings derived from STWs and rule evaluation")
    recommendation: str = Field(..., description="Suggested triage level, facility type, and immediate action steps")
    
    # Metadata for Handoff UI & Print PDF
    severity_level: str = Field(..., example="RED")
    guideline_references: List[str] = Field(default_factory=list, example=["ICMR Paediatric STW - Fever"])
    target_facility_type: str = Field(..., example="Community Health Centre (CHC)")
