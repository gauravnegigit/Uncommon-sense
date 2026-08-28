from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List
from datetime import datetime
from .agent import get_session_history
from api.auth import get_current_user_from_cookie
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import get_buffer_string
from langchain_core.prompts import ChatPromptTemplate
from db.models import ClinicalSummaryResponse
from db.mongo import get_db
from db.models import UserDB

router = APIRouter(prefix="/summary", tags=["Clinical Summary Generation"])

class Summary(BaseModel):
    situation: str
    background: str
    assessment: str
    recommendation: str
    severity_level: str
    guideline_references: List[str]
    target_facility_type: str

SUMMARY_PROMPT = """You are a Clinical Triage & Summary Router for a health decision-support system in India. 

YOUR PRIMARY RESPONSIBILITIES:
1. Synthesize the multi-turn conversation history into a structured, clinical summary.
2. Evaluate patient symptoms against clinical triage guidelines to determine severity.
3. Determine if the information provided by the patient is complete or too vague for a safe decision.
4. Route the patient to the appropriate operational path.

---

### INPUT DATA AVAILABLE TO YOU:
- Conversation History: Previous messages between the patient and the assistant.
---

### CLASSIFICATION & ROUTING RULES:

INTENT CATEGORIES:
   - "EMERGENCY": Red-flag symptoms requiring immediate high-priority medical intervention (e.g., severe chest pain, extreme difficulty breathing, sudden stroke-like symptoms, unyielding severe bleeding, loss of consciousness, severe trauma).
   - "FACILITY_LOOKUP": Non-clinical queries where the patient is explicitly asking for physical health center locations, primary health center (PHC) operating hours, contact numbers, or logistical navigation.
   - "SYMPTOM_ASSESSMENT": Standard or non-emergent symptom assessment, monitoring follow-ups, general health inquiries, or requests for non-diagnostic home care guidance.

### OUTPUT REQUIREMENTS:
You must output ONLY a valid JSON object matching the following structure:

situation: Must contain a concise summary of the patient's primary presenting complaint and triage status.
background= Must provide a timeline of symptoms, relevant context, or reported patient history.
assessment: Must include key clinical findings derived from the conversation history and guideline evaluation.
recommendation= Must suggest a triage level, facility type, and immediate action steps.
severity_level: Must indicate the triage severity level . Answer only in one of the following: "RED", "YELLOW", or "GREEN". RED indicates high-risk emergency, YELLOW indicates moderate risk requiring prompt attention, and GREEN indicates low-risk or routine cases.
guideline_references: Must list any relevant clinical guidelines referenced during the assessment.
target_facility_type: Must specify the recommended facility type for patient referral (e.g., "Primary Health Centre (PHC)", "Community Health Centre (CHC)", "District Hospital", etc.).

### CONSTRAINTS & BEHAVIOR:
- PRIORITIZE SAFETY: Always err on the side of caution. If any red-flag emergency signs appear in past turns or the latest message, override to "EMERGENCY".
- DO NOT DIAGNOSE: Don't suggest specific medical diagnoses, conditions, or drug prescriptions in your summary or question if you are not sure about it .
- CONTEXT CONSOLIDATION: Read the entire conversation history. Do NOT ask the patient for information they have already provided in previous turns."""


@router.get("/generate", response_model=ClinicalSummaryResponse)
async def generate_patient_summary(
    chat_id: str ,
    current_user: UserDB = Depends(get_current_user_from_cookie), 
    db = Depends(get_db)):
    """
    Generates a structured SBAR clinical handover note from full conversation history.
    Used for displaying receiving doctor cards and generating printable referral notes.
    """  

    prompt = ChatPromptTemplate.from_messages([
        ("system", SUMMARY_PROMPT),
        ("user", "Conversation History:{history}"),  
    ])

    llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash", temperature=0.0).with_structured_output(Summary)
    chain = prompt | llm
    raw_messages = get_session_history(str(current_user.id) , chat_id).messages
    formatted_history = get_buffer_string(raw_messages)
    chain_response = chain.invoke({"history":formatted_history})

    summary = {
        "summary_id": chat_id,
        "user_id": current_user.id,
        "updated_at": datetime.utcnow() , 
        "situation": chain_response.situation,
        "background": chain_response.background,
        "assessment": chain_response.assessment,
        "recommendation": chain_response.recommendation,
        "severity_level": chain_response.severity_level,
        "guideline_references": chain_response.guideline_references,
        "target_facility_type": chain_response.target_facility_type
    }

    await db["clinical_summaries"].replace_one(
        filter={
            "user_id": current_user.id, 
            "summary_id": chat_id
        },
        replacement=summary,
        upsert=True
    )

    # Structured response matching SBAR framework
    return ClinicalSummaryResponse(
        **summary
    )
