from datetime import datetime
from typing import Dict, Any

from .section_detector import detect_sections
from .skill_extractor import extract_skills
from .entity_extractor import extract_education, extract_experiences, extract_projects, extract_certifications
from .normalizer import normalize_profile

def process_resume_nlp(raw_text: str) -> Dict[str, Any]:
    if not raw_text or not raw_text.strip():
        return {
            "summary": "",
            "roles": [],
            "skills": [],
            "education": [],
            "experience": [],
            "projects": [],
            "certifications": [],
            "analyzer_version": "nlp-v1",
            "analyzed_at": datetime.utcnow().isoformat(),
            "processing_status": "failed",
            "processing_error": "Empty text provided"
        }

    sections = detect_sections(raw_text)
    skills = extract_skills(sections, raw_text)
    education = extract_education(sections, raw_text)
    experience = extract_experiences(sections, raw_text)
    projects = extract_projects(sections, raw_text)
    certifications = extract_certifications(sections, raw_text)

    summary = sections.get("summary", "")

    result = normalize_profile({
        "summary": summary,
        "roles": [],
        "skills": skills,
        "education": education,
        "experience": experience,
        "projects": projects,
        "certifications": certifications
    })
    result["analyzed_at"] = datetime.utcnow().isoformat()
    return result
