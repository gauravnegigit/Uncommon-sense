from rag.prompt import PROMPT
from typing import Literal
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain.messages import SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

# 1. Output Schema
class QueryRoute(BaseModel):
    intent: Literal["EMERGENCY", "FACILITY_LOOKUP", "SYMPTOM_ASSESSMENT"] = Field(
        description="The primary operational path for the patient's query."
    )
    is_vague: bool = Field(
        description="True if the symptom report lacks duration, severity, or specifics needed for safe triage."
    )
    reasoning: str = Field(
        description="A concise 1-sentence medical justification for the routing decision."
    )

# 2. Router Setup
ROUTER_SYSTEM_PROMPT = PROMPT

def route_patient_query(user_query: str) -> QueryRoute:
    llm =   ChatGoogleGenerativeAI(model="gemini-3.6-flash", temperature=0.0)
    structured_router = llm.with_structured_output(QueryRoute)
    
    prompt = ChatPromptTemplate.from_messages([
        SystemMessage(ROUTER_SYSTEM_PROMPT),
        ("human", "Patient Input: {input}")
    ])
    
    chain = prompt | structured_router
    return chain.invoke({"input": user_query})
