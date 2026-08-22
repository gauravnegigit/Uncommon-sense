import json 
import re 
from typing import Dict , Any 

with open("red_flags.json" , "r" , encoding="utf-8") as f:
    RED_FLAGS_DATA = json.load(f)

def evaluate_emergency_rules(user_transcript: str)-> Dict[str , Any]:
    text_lower = user_transcript.lower()

    # 1. Checking for RED Category rules 
    for rule in RED_FLAGS_DATA["rules"]:
        if rule["category"] != "RED":
            continue

        has_exclusion = any(ex.lower() in text_lower for ex in rule.get("exclusion_keywords", []))
        if has_exclusion:
            continue

        for kw in  rule["keywords"]:

            # checking for servere emergency keywords , if they exist bypass the llm part 

            if re.search(rf"\b{re.escape(kw.lower())}\b", text_lower):
                return {
                    "is_emergency": True,
                    "category": "RED",
                    "matched_rule_id": rule["id"],
                    "symptom": rule["symptom"],
                    "action": RED_FLAGS_DATA["triage_categories"]["RED"]["action"],
                    "recommended_facility": rule["recommended_facility"],
                    "bypass_llm": True  
                }             

    # 2. Checking for YELLOW Rules 
    for rule in RED_FLAGS_DATA["rules"]:
        if rule["category"] == "YELLOW":
            for kw in rule["keywords"]:
                if kw.lower() in text_lower:
                    return {
                        "is_emergency": False,
                        "category": "YELLOW",
                        "matched_rule_id": rule["id"],
                        "symptom": rule["symptom"],
                        "action": RED_FLAGS_DATA["triage_categories"]["YELLOW"]["action"],
                        "recommended_facility": rule["recommended_facility"],
                        "bypass_llm": False     # Pass to RAG LLM for detailed guidelines
                    }

    # 2. Default GREEN Category
    return {
        "is_emergency": False,
        "category": "GREEN",
        "matched_rule_id": None,
        "symptom": "Routine Symptoms",
        "action": RED_FLAGS_DATA["triage_categories"]["GREEN"]["action"],
        "recommended_facility": "Sub-Centre / ASHA Worker",
        "bypass_llm": False
    }