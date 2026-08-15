from typing import Dict, Any, List

def normalize_profile(raw_extracted: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ensures consistent data structures, fallback null values, and clean types.
    """
    return {
        "summary": raw_extracted.get("summary", ""),
        "roles": raw_extracted.get("roles", []),
        "skills": raw_extracted.get("skills", []),
        "education": raw_extracted.get("education", []),
        "experience": raw_extracted.get("experience", []),
        "projects": raw_extracted.get("projects", []),
        "certifications": raw_extracted.get("certifications", []),
        "analyzer_version": "nlp-v1",
        "processing_status": "completed"
    }
