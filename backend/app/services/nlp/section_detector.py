import re
from typing import Dict, Any

SECTION_PATTERNS = {
    "summary": r"^(summary|objective|profile|about\s+me|career\s+summary|executive\s+summary)[\:\-\s]*$",
    "skills": r"^(technical\s+skills|skills\s+(&|and)\s+technologies|core\s+competencies|technical\s+expertise|skills|technologies|tools)[\:\-\s]*$",
    "experience": r"^(work\s+experience|professional\s+experience|employment\s+history|experience|work\s+history|internships)[\:\-\s]*$",
    "education": r"^(education\s+(&|and)\s+qualifications|academic\s+background|academic\s+qualifications|education)[\:\-\s]*$",
    "projects": r"^(key\s+projects|academic\s+projects|personal\s+projects|projects|selected\s+projects)[\:\-\s]*$",
    "certifications": r"^(certifications\s+(&|and)\s+licenses|licenses\s+(&|and)\s+certifications|certifications|certificates)[\:\-\s]*$",
    "achievements": r"^(honors\s+(&|and)\s+awards|awards\s+(&|and)\s+achievements|achievements|awards)[\:\-\s]*$",
}

def detect_sections(text: str) -> Dict[str, str]:
    if not text:
        return {}

    lines = text.split("\n")
    spans = []

    for idx, line in enumerate(lines):
        clean = line.strip().lower()
        if not clean or len(clean) > 60:
            continue
        
        for sec_type, pattern in SECTION_PATTERNS.items():
            if re.match(pattern, clean, re.IGNORECASE):
                spans.append((sec_type, idx))
                break

    if not spans:
        return {"other": text}

    result = {}
    for i in range(len(spans)):
        sec_type, start_idx = spans[i]
        end_idx = spans[i + 1][1] if i + 1 < len(spans) else len(lines)
        section_content = "\n".join(lines[start_idx + 1:end_idx]).strip()
        result[sec_type] = section_content

    return result
