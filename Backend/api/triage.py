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
import json  , httpx , os , tempfile 
from core.config import settings
from fastapi.concurrency import run_in_threadpool

import static_ffmpeg
# Automatically fetches and adds standalone FFmpeg binaries to system PATH
static_ffmpeg.add_paths()
from pydub import AudioSegment  # Works natively now!


router = APIRouter(prefix="/triage", tags=["Triage & Decision Support"])


class TriageRequest(BaseModel):
    transcript: str = Field(..., example="I have severe chest pain and cold sweating")
    chat_id: str = Field(..., example="123e4567-e89b-12d3-a456-426614174000")
    language: str = Field(default="hi-IN")

class TriageResponse(BaseModel):
    severity: str = Field(..., description="EMERGENCY , FACILITY_LOOKUP , SYMPTOM_ASSESSMENT")
    content: str

def _convert_audio_sync(raw_path: str, wav_path: str):
    """Synchronous CPU-heavy audio conversion function."""
    audio = AudioSegment.from_file(raw_path)
    audio = audio.set_frame_rate(16000).set_channels(1)
    audio.export(wav_path, format="wav")

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

@router.post("/evaluate-audio-file", response_model=TriageResponse)
async def evaluate_audio_file(
    file: UploadFile = File(...),
    chat_id: Optional[str] = Form(default="default"),
    current_user: UserDB = Depends(get_current_user_from_cookie)
):
    raw_path = None
    wav_path = None

    try:
        ext = os.path.splitext(file.filename)[1] if file.filename else ".webm"
        if not ext:
            ext = ".webm"

        # 1. Save upload stream to temporary raw file
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_raw:
            content = await file.read()
            temp_raw.write(content)
            raw_path = temp_raw.name

        # 2. Prepare temp target WAV file
        wav_temp = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        wav_path = wav_temp.name
        wav_temp.close()

        # 3. Offload blocking pydub conversion to thread pool
        await run_in_threadpool(_convert_audio_sync, raw_path, wav_path)

        # 4. Async API request to Sarvam AI
        url = "https://api.sarvam.ai/speech-to-text"
        headers = {"api-subscription-key": settings.SARVAM_API_KEY}
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            with open(wav_path, "rb") as wav_file:
                files = {"file": ("recording.wav", wav_file, "audio/wav")}
                data = {
                    "model": "saaras:v3",
                    "language_code": "hi-IN",
                    "with_timestamps": "false"
                }
                sarvam_res = await client.post(url, headers=headers, files=files, data=data)

        if sarvam_res.status_code != 200:
            raise HTTPException(
                status_code=500, 
                detail=f"Sarvam AI Error: {sarvam_res.text}"
            )

        sarvam_data = sarvam_res.json()
        transcript = sarvam_data.get("transcript", "").strip()

        if not transcript:
            raise HTTPException(
                status_code=400, 
                detail="No speech could be recognized in the audio recording."
            )

        # 5. Populate workflow response using valid dictionary keys
        workflow_res = workflow_controller(transcript , current_user.id , chat_id)

        return TriageResponse(
            severity=workflow_res["action"],
            content=workflow_res["message"]  
        )

    except HTTPException:
        # Re-raise standard HTTP exceptions so frontend gets proper 4xx/5xx status codes
        raise

    except Exception as e:
        # Pass unexpected server errors as HTTP 500
        raise HTTPException(status_code=500, detail=f"Internal Audio Processing Error: {str(e)}")

    finally:
        # Cleanup temp files
        for path in (raw_path, wav_path):
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except OSError:
                    pass

@router.get("/chat/{chat_id}/history")
async def get_chat_history(
    chat_id: str,
    current_user: UserDB = Depends(get_current_user_from_cookie), 
):
    sessions = get_session_history(user_id=current_user.id, chat_id=chat_id)
    serialized = []
    for msg in sessions.messages:
        role = "user" if getattr(msg, "type", "") in ["human", "HumanMessage"] else "assistant"
        content = getattr(msg, "content", "")
        serialized.append({
            "role": role,
            "type": getattr(msg, "type", "ai"),
            "content": content
        })
    return serialized

@router.get("/chat_ids")
async def get_user_chat_ids(
    current_user: UserDB = Depends(get_current_user_from_cookie),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Returns all previous chat sessions of the currently logged-in user.
    Uses a MongoDB Aggregation Pipeline to extract ONLY the 1st human question 
    per distinct chat_id, generating a 5-6 word title for fast UI execution.
    """
    # 1. Fetch relevant fields chronologically
    cursor = db["chat_histories"].find(
        {
            "$or": [
                {"SessionId": {"$regex": f"^{current_user.id}:"}},
                {"session_id": {"$regex": f"^{current_user.id}:"}}
            ]
        },
        {"SessionId": 1, "session_id": 1, "History": 1, "history": 1, "messages": 1}
    ).sort("_id", 1)  # Earliest documents first

    chat_sessions = {}

    async for doc in cursor:
        session_id_str = doc.get("SessionId") or doc.get("session_id") or ""
        if ":" not in session_id_str:
            continue

        # Extract actual chat_id from composite string (e.g. "user_id:chat_id")
        chat_id = session_id_str.split(":", 1)[1]

        # Get document creation timestamp from ObjectId
        doc_time = doc["_id"].generation_time if ("_id" in doc and hasattr(doc["_id"], "generation_time")) else None

        # Track session timestamps
        if chat_id not in chat_sessions:
            chat_sessions[chat_id] = {
                "first_question": "",
                "first_time": doc_time,
                "last_time": doc_time
            }
        else:
            if doc_time:
                chat_sessions[chat_id]["last_time"] = doc_time

        # Skip question parsing if we already found the first question for this session
        if chat_sessions[chat_id]["first_question"]:
            continue

        # Extract Raw History Field
        raw_history = doc.get("History") or doc.get("history") or doc.get("messages")
        
        # --- FIX: Parse JSON string if stored as string ---
        parsed_history = raw_history
        if isinstance(raw_history, str):
            try:
                parsed_history = json.loads(raw_history)
            except Exception:
                parsed_history = raw_history

        first_q = ""

        # Case A: Parsed as Dictionary
        if isinstance(parsed_history, dict):
            msg_type = parsed_history.get("type", "")
            data = parsed_history.get("data", {})
            content = data.get("content", "") if isinstance(data, dict) else parsed_history.get("content", "")
            
            if msg_type in ["human", "HumanMessage"] and content and isinstance(content, str):
                first_q = content.strip()

        # Case B: Parsed as List
        elif isinstance(parsed_history, list):
            for msg in parsed_history:
                if isinstance(msg, dict):
                    msg_type = msg.get("type", "")
                    data = msg.get("data", {})
                    content = data.get("content", "") if isinstance(data, dict) else msg.get("content", "")
                    if msg_type in ["human", "HumanMessage"] and content and isinstance(content, str):
                        first_q = content.strip()
                        break

        # Save extracted question
        if first_q:
            chat_sessions[chat_id]["first_question"] = first_q

    # 2. Format Results (Sorted by newest activity first)
    results = []
    sorted_chats = sorted(
        chat_sessions.items(),
        key=lambda item: item[1]["last_time"] or item[1]["first_time"] or 0,
        reverse=True
    )

    for chat_id, data in sorted_chats:
        first_question = data["first_question"]

        # Generate 5-6 word title
        words = first_question.strip().split() if first_question else []
        if words:
            selected_words = words[:6]
            title = " ".join(selected_words)
            if len(words) > 6:
                title += "..."
        else:
            title = "Consultation"

        t = data["last_time"] or data["first_time"]
        date_str = t.strftime("%d %b %Y, %I:%M %p") if t else "Today"

        results.append({
            "chat_id": chat_id,
            "title": title,
            "date": date_str
        })

    return results

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

 

 
