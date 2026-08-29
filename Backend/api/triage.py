import uuid
from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, File , status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field
from typing import List, Optional
from db.models import UserDB
from db.mongo import get_db
from .agent import  delete_session_history, get_session_history, workflow_controller
from api.auth import  get_current_user_from_cookie
from core.config import settings

import tempfile
import os
import requests
from pydub import AudioSegment
from core.config import settings

router = APIRouter(prefix="/triage", tags=["Triage & Decision Support"])

class TriageRequest(BaseModel):
    transcript: str = Field(..., example="I have severe chest pain and cold sweating")
    chat_id: str = Field(..., example="123e4567-e89b-12d3-a456-426614174000")
    language: str = Field(default="hi-IN")

class TriageResponse(BaseModel):
    severity: str = Field(..., description="EMERGENCY , FACILITY_LOOKUP , SYMPTOM_ASSESSMENT")
    content: str

# Start a brand-new distinct chat session
@router.post("/chat/new")
async def start_new_chat(
    current_user: UserDB = Depends(get_current_user_from_cookie)
):
    """
    Creates a new isolated chat session with a unique UUID without touching existing chats.
    """
    new_chat_id = str(uuid.uuid4())
    return {
        "status": "success",
        "chat_id": new_chat_id,
        "user_id": current_user.id
    }

@router.post("/evaluate", response_model=TriageResponse)
async def evaluate_text(
    payload: TriageRequest,
    current_user: UserDB = Depends(get_current_user_from_cookie),
    # Inject DB or Retriever dependencies if needed
):
    transcript = payload.transcript.strip()
    if not transcript:
        raise HTTPException(status_code=400, detail="Transcript cannot be empty.")

    response = workflow_controller(transcript, current_user.id, payload.chat_id)

    return TriageResponse(
        severity= response["action"],
        content= response["message"],  
    )

@router.post("/evaluate-audio-file")
async def evaluate_audio_file(
    file: UploadFile = File(...),
    chat_id: Optional[str] = Form(default="default") ,
    current_user: UserDB = Depends(get_current_user_from_cookie)):
    raw_path = None
    wav_path = None

    try:
        # 1. Save incoming browser payload (webm/ogg/any format) to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_raw:
            content = await file.read()
            temp_raw.write(content)
            raw_path = temp_raw.name

        # 2. Convert raw audio to 16kHz mono WAV format (Required by Sarvam AI)
        audio = AudioSegment.from_file(raw_path)
        audio = audio.set_frame_rate(16000).set_channels(1)

        wav_temp = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        wav_path = wav_temp.name
        wav_temp.close()

        # Export as standard WAV PCM
        audio.export(wav_path, format="wav")

        # 3. Call Sarvam AI Speech-to-Text API (Hindi / Indian Languages to English)
        url = "https://api.sarvam.ai/speech-to-text"
        headers = {
            "api-subscription-key": settings.SARVAM_API_KEY
        }
        
        with open(wav_path, "rb") as wav_file:
            files = {
                "file": ("recording.wav", wav_file, "audio/wav")
            }
            data = {
                "model": "saarika:v1",  # Or saaras:v1 depending on your model endpoint
                "language_code": "hi-IN",
                "with_timestamps": "false"
            }
            response = requests.post(url, headers=headers, files=files, data=data)

        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Sarvam AI Error: {response.text}")

        sarvam_data = response.json()
        transcript = sarvam_data.get("transcript", "")

        if not transcript.strip():
            raise HTTPException(status_code=400, detail="No speech could be recognized in the audio recording.")

        response = workflow_controller(transcript , current_user.id , chat_id)

        return TriageResponse(
            severity= response["action"],
            content= response["message"],  
        )

    finally:
        # Cleanup temporary audio files
        for path in [raw_path, wav_path]:
            if path and os.path.exists(path):
                try :
                    os.remove(path)
                except Exception as e :
                    pass 

@router.get("/chat/{chat_id}/history")
async def get_chat_history(
    chat_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie), 
):
    sessions = get_session_history(user_id=current_user.id, chat_id=chat_id)
    return sessions.messages

@router.delete("/chat/{chat_id}")
async def delete_chat(
    chat_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie)
):
    delete_session_history(user_id=current_user.id, chat_id=chat_id)
    return {
        "status": "success",
        "message": f"Chat {chat_id} deleted."
    }

 

 
