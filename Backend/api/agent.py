from typing import Literal, Optional
from pydantic import BaseModel, Field

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_mongodb import MongoDBChatMessageHistory

from rag.prompt import ROUTER_PROMPT
from rag.retriever import setup_hybrid_retriever
from core.config import settings

MONGO_URI = settings.MONGO_URI
DB_NAME = settings.MONGO_DB_NAME
COLLECTION_NAME = "chat_histories"

# --- 1. Schemas ---
class QueryRoute(BaseModel):
    intent: Literal["EMERGENCY", "FACILITY_LOOKUP", "SYMPTOM_ASSESSMENT"] = Field(
        description="The primary operational path for the patient's query."
    )
    is_vague: bool = Field(
        description="True if the symptom report lacks duration, severity, or specifics."
    )
    reasoning: str = Field(
        description="A concise 1-sentence medical justification for the routing decision."
    )

class Assessment(BaseModel):
    patient_guidance: str = Field(
        description="A concise 3-4 lines clear, non-diagnostic guidance emphasizing doctor consultation."
    )
    reasoning: str = Field(
        description="Detailed structured notes for PHC doctor"
    )

    question: Optional[str] = Field( default="",
        description="A follow-up question to clarify vague symptom reports."
    )

# --- 2. History Helper functions ---

def format_session_id(user_id: str, chat_id: str) -> str:
    """Creates a predictable composite session ID."""
    return f"{user_id}:{chat_id}"

def get_session_history(user_id: str, chat_id: str) -> MongoDBChatMessageHistory:
    session_id = format_session_id(user_id, chat_id)
    return MongoDBChatMessageHistory(
        connection_string=MONGO_URI,
        session_id=session_id,
        database_name=DB_NAME,
        collection_name=COLLECTION_NAME
    )

def delete_session_history(user_id: str, chat_id: str) -> bool:
    """Clears all chat history for a given session/user ID."""
    history = get_session_history(user_id, chat_id)
    history.clear()
    return True

# --- 3. Context-Aware Pipeline Functions ---

def route_patient_query(user_query: str, chat_history: list) -> QueryRoute:
    llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash", temperature=0.0)
    structured_router = llm.with_structured_output(QueryRoute)
    
    prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content=ROUTER_PROMPT),
        MessagesPlaceholder(variable_name="chat_history"),  # Injects previous turns
        ("human", "{input}")
    ])
    
    chain = prompt | structured_router
    return chain.invoke({
        "input": user_query,
        "chat_history": chat_history
    })

def handle_symptom_path(user_query: str, chat_history: list, hybrid_retriever , reason , is_vague):
    if is_vague :
        return Assessment(
            patient_guidance="Your symptom report is vague. Please provide more details about the duration, severity, and associated symptoms. Consult a doctor for proper evaluation.",
            reasoning="Vague symptom report lacking sufficient clinical context for safe triage.",
            question="Can you specify how long you've been experiencing these symptoms and their severity?"
        )
    retrieved_docs = hybrid_retriever.invoke(user_query)
    context_text = "\n\n".join([doc.page_content for doc in retrieved_docs])

    prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content=f"""
        You are a clinical decision-support assistant for rural health workers in India.
        Analyze the patient query using ONLY the provided symptoms and triage guidelines.
        
        Reasoning for symptom assesment : 
        {reason}
        Context Guidelines:
        {context_text}
        Generate a JSON response with:
        1. "patient_guidance": Clear, non-diagnostic guidance emphasizing doctor consultation.
        2. "doctor_summary_english": Detailed 5-10 lines Structured clinical notes for a PHC doctor.
        3. "question": Leave the question field empty if the symptom report is clear. If the symptom report is vague, provide a follow-up question to clarify the patient's symptoms.
        """),
        MessagesPlaceholder(variable_name="chat_history"),  # Allows LLM to remember past context
        ("human", "Patient Query: {query}")
    ])
    
    llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash", temperature=0.0).with_structured_output(Assessment)
    chain = prompt | llm
    
    return chain.invoke({
        "query": user_query,
        "chat_history": chat_history
    })

# --- 4. Main Workflow Controller ---

def workflow_controller(user_query: str, user_id: str , chat_id: str):
    # 1. Fetch History from MongoDB
    history_db = get_session_history(user_id , chat_id)
    chat_history = history_db.messages  # Converts DB records into LangChain Message objects

    # 2. Route Query with History Context
    decision = route_patient_query(user_query, chat_history)
    
    if decision.intent == "EMERGENCY":
        response_content = decision.reasoning
    elif decision.intent == "FACILITY_LOOKUP":
        response_content = decision.reasoning
    else:
        hybrid_retriever = setup_hybrid_retriever()
        assessment = handle_symptom_path(user_query, chat_history, hybrid_retriever , decision.reasoning , decision.is_vague)
        response_content = f"Patient Guidance:\n {assessment.patient_guidance}\n\n Reasoning:\n {assessment.reasoning}\n\n Follow-up Question:\n {assessment.question}"

    # 3. Append latest turn to MongoDB for future requests
    history_db.add_user_message(user_query)
    history_db.add_ai_message(response_content)

    return {
        "action": decision.intent,
        "message": response_content 
    }


    return {
        "action": decision.intent,
        "message": response_content 
    }
