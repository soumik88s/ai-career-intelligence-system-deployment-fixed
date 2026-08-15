import re
from typing import List, Dict, Any

def extract_job_experience_requirements(sections: Dict[str, str], full_text: str) -> List[Dict[str, Any]]:
    experiences = []
    text_to_scan = sections.get("required_qualifications", "") + "\n" + sections.get("experience", "") + "\n" + full_text

    range_match = re.search(r'(\d+)\s*(?:-|to|–)\s*(\d+)\+?\s*(?:years|yrs|year)', text_to_scan, re.I)
    if range_match:
        experiences.append({
            "minimum_years": int(range_match.group(1)),
            "maximum_years": int(range_match.group(2)),
            "job_role": "Software Engineering",
            "original_text": range_match.group(0)
        })

    if not experiences:
        min_match = re.search(r'(\d+)\+?\s*(?:years|yrs|year)\s*(?:of\s+)?(?:relevant\s+)?(?:experience)?', text_to_scan, re.I)
        if min_match:
            experiences.append({
                "minimum_years": int(min_match.group(1)),
                "maximum_years": None,
                "job_role": "Software Engineering",
                "original_text": min_match.group(0)
            })

    if not experiences:
        if re.search(r'fresher|entry level|0[- ]1\s*year', text_to_scan, re.I):
            experiences.append({
                "minimum_years": 0,
                "maximum_years": 1,
                "job_role": "Entry Level / Graduate",
                "original_text": "Freshers welcome / Entry Level"
            })

    return experiences

def extract_job_education_requirements(sections: Dict[str, str], full_text: str) -> List[Dict[str, Any]]:
    education = []
    text_to_scan = sections.get("education", "") + "\n" + sections.get("required_qualifications", "") + "\n" + full_text

    degree = ""
    if re.search(r'\b(b\.?s\.?|b\.?tech\.?|b\.?e\.?|bachelor|bachelors)\b', text_to_scan, re.I):
        degree = "Bachelor's"
    elif re.search(r'\b(m\.?s\.?|m\.?tech\.?|master|masters)\b', text_to_scan, re.I):
        degree = "Master's"
    elif re.search(r'\b(ph\.?d\.?|doctorate)\b', text_to_scan, re.I):
        degree = "Ph.D."

    field = ""
    if re.search(r'computer science', text_to_scan, re.I):
        field = "Computer Science"
    elif re.search(r'information technology', text_to_scan, re.I):
        field = "Information Technology"

    if degree or field:
        education.append({
            "degree": degree or "Bachelor's Degree",
            "field": field or "Computer Science or related technical field",
            "institution_type": "Accredited University",
            "required": True,
            "original_text": f"{degree} in {field}" if degree and field else (degree or field)
        })

    return education
