from .triage import route_patient_query
from rag.retriever import setup_hybrid_retriever
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel , Field 

class Assesment(BaseModel):
    patien_guidance: str = Field(
        description="A concise 3-4 lines clear, non-diagnostic guidance emphasizing doctor consultation."
    )
    reasoning: str = Field(
        description="Detailed structured notes for phc doctor"
    )

def handle_symptom_path(user_query: str, is_vague: bool, hybrid_retriever):
    if is_vague: 
        pass 

    retrieved_docs = hybrid_retriever.invoke(user_query)
    # Branch B: Execute Full Hybrid RAG Pipeline
    retrieved_docs = hybrid_retriever.invoke(user_query)
    context_text = "\n\n".join([doc.page_content for doc in retrieved_docs])
    
    prompt_template = """
    You are a clinical decision-support assistant for rural health workers in India.
    Analyze the patient query using ONLY the provided WHO symptoms and triage guidelines.
    
    Context Guidelines:
    {context}
    
    Patient Query: {query}
    
    Generate a JSON response with:
    1. "patient_guidance": Clear, non-diagnostic guidance emphasizing doctor consultation.
    2. "doctor_summary_english": Detailed 5-10 lines Structured clinical notes for a PHC doctor.
    """
    llm = ChatGoogleGenerativeAI(model="gemini-3.6-flash", temperature=0.0).with_structured_output(Assesment)
    prompt = PromptTemplate(template=prompt_template, input_variables=["context", "query"])
    
    chain = prompt | llm
    llm_response = chain.invoke({"context": context_text, "query": user_query})

    return llm_response

def workflow_controller(user_query) : 
    decision = route_patient_query(user_query)
    
    if decision.intent == "EMERGENCY":
        return {
            "action" : decision.intent ,
            "message": decision.reasoning
        }

    elif decision.intent == "FACILITY_LOOKUP":
        return {
            "action" : decision.intent , 
            "message" : decision.reasoning
        }
    else :
        hybrid_retriever = setup_hybrid_retriever()
        content = handle_symptom_path(user_query , decision.is_vague , hybrid_retriever)

        return {
            "action" : decision.intent , 
            "message" : content
        }


