from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field
from typing import List, Optional

from db.models import UserDB
from db.mongo import get_db
from .agent import route_patient_query , workflow_controller
from api.auth import get_current_user, get_current_user_from_cookie
from core.config import settings

router = APIRouter(prefix="/triage", tags=["Triage & Decision Support"])

class TriageRequest(BaseModel):
    transcript: str = Field(..., example="I have severe chest pain and cold sweating")
    latitude: Optional[float] = Field(default=None, example=25.4358)
    longitude: Optional[float] = Field(default=None, example=81.8463)
    language: str = Field(default="hi-IN")

class TriageResponse(BaseModel):
    severity: str = Field(..., description="EMERGENCY , FACILITY_LOOKUP , SYMPTOM_ASSESSMENT")
    content: str

@router.post("/evaluate", response_model=TriageResponse)
async def evaluate_triage(
    payload: TriageRequest,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    # Inject DB or Retriever dependencies if needed
):
    transcript = payload.transcript.strip()
    if not transcript:
        raise HTTPException(status_code=400, detail="Transcript cannot be empty.")

    response = workflow_controller(transcript , current_user.id)

    return TriageResponse(
        severity= response["action"],
        content= response["message"],  
    )

@router.get("/history")
async def get_conversation_history(
    # STRICT AUTH: Rejects guests with 401 Unauthorized automatically
    current_user: UserDB = Depends(get_current_user_from_cookie), 
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    sessions = await db.triage_sessions.find({"user_id": current_user.id}).to_list(100)
    return sessions

 