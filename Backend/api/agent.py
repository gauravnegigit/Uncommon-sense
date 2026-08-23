from triage import route_patient_query
from Backend.rag.retriever import hybrid_retriever
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

def handle_symptom_path(user_query: str, is_vague: bool, hybrid_retriever):
    if is_vague: 
        pass 

    retrieved_docs = hybrid_retriever.invoke(user_query)
    # Branch B: Execute Full Hybrid RAG Pipeline
    retrieved_docs = hybrid_retriever.invoke(user_query)
    context_text = "\n\n".join([doc.page_content for doc in retrieved_docs])
    
    prompt_template = """
    You are a clinical decision-support assistant for rural health workers in India.
    Analyze the patient query using ONLY the provided WHO triage guidelines and detailed info about diseases and symptoms from gale encyclopedia.
    
    Context Guidelines:
    {context}
    
    Patient Query: {query}
    
    Generate a JSON response with:
    1. "patient_guidance": Clear, non-diagnostic guidance emphasizing doctor consultation.
    2. "doctor_summary_english": Structured clinical and detailed notes for a PHC doctor using the context guidelines .
    """
    llm = ChatGoogleGenerativeAI(model="gemini-3.6-flash", temperature=0.0)
    prompt = PromptTemplate(template=prompt_template, input_variables=["context", "query"])
    
    chain = prompt | llm
    llm_response = chain.invoke({"context": context_text, "query": user_query})

    return llm_response.content


def workflow_controller(user_query) : 
    decision = route_patient_query(user_query)
    
    if decision.intent == "EMERGENCY":
        return {
            "action" : decision.intent ,
            "message": f"Critical condition detected. Seek immediate emergency medical care. \n\n {decision.reasoning}"
        }

    elif decision.intent == "FACILITY_LOOKUP":
        return {
            "action" : decision.intent , 
            "message" : decision.reasoning
        }
    else :
        handle_symptom_path(user_query , decision.is_vague , hybrid_retriever)

