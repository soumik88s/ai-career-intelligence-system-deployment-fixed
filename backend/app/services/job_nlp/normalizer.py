from typing import Dict, Any

def normalize_work_mode(text: str) -> str:
    if not text:
        return "Unknown"
    lower = text.lower()
    if "remote" in lower or "work from home" in lower or "wfh" in lower or "telecommute" in lower:
        return "Remote"
    if "hybrid" in lower or "flexible office" in lower or "partially remote" in lower:
        return "Hybrid"
    if "on-site" in lower or "onsite" in lower or "in-office" in lower or "office-based" in lower:
        return "On-site"
    return "Unknown"

def normalize_employment_type(text: str) -> str:
    if not text:
        return "Unknown"
    lower = text.lower()
    if "full-time" in lower or "full time" in lower or "permanent" in lower:
        return "Full-time"
    if "part-time" in lower or "part time" in lower:
        return "Part-time"
    if "internship" in lower or "intern" in lower or "co-op" in lower:
        return "Internship"
    if "contract" in lower or "contractor" in lower or "c2c" in lower:
        return "Contract"
    if "temporary" in lower or "temp" in lower:
        return "Temporary"
    if "freelance" in lower or "freelancer" in lower:
        return "Freelance"
    return "Unknown"

def normalize_job_role(raw_title: str) -> Dict[str, str]:
    if not raw_title or not raw_title.strip():
        return {"original_title": "", "normalized_title": "Software Engineer"}
    cleaned = raw_title.strip()
    lower = cleaned.lower()

    if "machine learning" in lower or "ml engineer" in lower or "ai engineer" in lower:
        return {"original_title": cleaned, "normalized_title": "Machine Learning Engineer"}
    if "data scientist" in lower or "data science" in lower:
        return {"original_title": cleaned, "normalized_title": "Data Scientist"}
    if "data engineer" in lower:
        return {"original_title": cleaned, "normalized_title": "Data Engineer"}
    if "frontend" in lower or "front-end" in lower or "react developer" in lower:
        return {"original_title": cleaned, "normalized_title": "Frontend Engineer"}
    if "backend" in lower or "back-end" in lower or "node engineer" in lower:
        return {"original_title": cleaned, "normalized_title": "Backend Engineer"}
    if "fullstack" in lower or "full-stack" in lower or "full stack" in lower:
        return {"original_title": cleaned, "normalized_title": "Full Stack Engineer"}
    if "devops" in lower or "sre" in lower or "cloud engineer" in lower:
        return {"original_title": cleaned, "normalized_title": "DevOps / Cloud Engineer"}

    return {"original_title": cleaned, "normalized_title": cleaned}
