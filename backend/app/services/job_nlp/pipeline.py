import datetime
from typing import Dict, Any

from .section_detector import detect_job_sections
from .normalizer import normalize_work_mode, normalize_employment_type, normalize_job_role
from .skill_extractor import extract_job_skills
from .requirement_extractor import extract_job_experience_requirements, extract_job_education_requirements

def process_job_nlp(title: str, company: str, description: str, work_mode: str = "Unknown", employment_type: str = "Unknown") -> Dict[str, Any]:
    if not description or not description.strip():
        return {
            "original_title": title,
            "normalized_title": title or "Software Engineer",
            "company": company,
            "work_mode": "Unknown",
            "employment_type": "Unknown",
            "skills": [],
            "required_skills": [],
            "preferred_skills": [],
            "experience": [],
            "experience_min": None,
            "experience_max": None,
            "education": [],
            "education_requirement": "",
            "summary": "",
            "analyzer_version": "job-nlp-v1",
            "analyzed_at": datetime.datetime.now().isoformat(),
            "processing_status": "failed",
            "processing_error": "Empty description"
        }

    sections = detect_job_sections(description)
    normalized_role = normalize_job_role(title)

    final_work_mode = work_mode if work_mode != "Unknown" else normalize_work_mode(description + " " + title)
    final_employment_type = employment_type if employment_type != "Unknown" else normalize_employment_type(description + " " + title)

    skills = extract_job_skills(sections, description)
    required_skills = [s["skill_name"] for s in skills if s["skill_type"] == "required"]
    preferred_skills = [s["skill_name"] for s in skills if s["skill_type"] == "preferred"]

    experience = extract_job_experience_requirements(sections, description)
    exp_min = experience[0]["minimum_years"] if experience else None
    exp_max = experience[0]["maximum_years"] if experience else None

    education = extract_job_education_requirements(sections, description)
    edu_req = education[0]["original_text"] if education else "Not specified"

    summary = f"Role: {normalized_role['normalized_title']}\nCompany: {company}\nWork Mode: {final_work_mode}\nEmployment Type: {final_employment_type}"

    return {
        "original_title": title,
        "normalized_title": normalized_role["normalized_title"],
        "company": company,
        "work_mode": final_work_mode,
        "employment_type": final_employment_type,
        "skills": skills,
        "required_skills": required_skills,
        "preferred_skills": preferred_skills,
        "experience": experience,
        "experience_min": exp_min,
        "experience_max": exp_max,
        "education": education,
        "education_requirement": edu_req,
        "summary": summary,
        "analyzer_version": "job-nlp-v1",
        "analyzed_at": datetime.datetime.now().isoformat(),
        "processing_status": "completed"
    }
