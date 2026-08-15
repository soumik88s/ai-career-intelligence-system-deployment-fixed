import re
from typing import List, Dict, Any

DEGREE_PATTERNS = [
    ("B.Tech", r"\b(b\.?tech|bachelor\s+of\s+technology)\b"),
    ("B.E.", r"\b(b\.?e\.?|bachelor\s+of\s+engineering)\b"),
    ("B.S. / B.Sc", r"\b(b\.?s\.?|b\.?sc\.?|bachelor\s+of\s+science)\b"),
    ("M.Tech", r"\b(m\.?tech|master\s+of\s+technology)\b"),
    ("M.S. / M.Sc", r"\b(m\.?s\.?|m\.?sc\.?|master\s+of\s+science)\b"),
    ("MCA", r"\b(mca|master\s+of\s+computer\s+applications)\b"),
    ("MBA", r"\b(mba|master\s+of\s+business\s+administration)\b"),
    ("Ph.D.", r"\b(ph\.?d\.?|doctorate)\b"),
]

def extract_education(sections: Dict[str, str], full_text: str) -> List[Dict[str, Any]]:
    edu_text = sections.get("education", full_text)
    if not edu_text:
        return []

    results = []
    lines = [l.strip() for l in edu_text.split("\n") if l.strip()]

    for line in lines:
        for degree_name, pattern in DEGREE_PATTERNS:
            if re.search(pattern, line, re.IGNORECASE):
                inst_match = re.search(r"\b([A-Z][a-zA-Z0-9\s&,'\.-]+(University|College|Institute|School))\b", line)
                years = re.findall(r"\b(20\d{2}|19\d{2})\b", line)

                results.append({
                    "degree": degree_name,
                    "field": "Computer Science & Engineering" if "computer" in line.lower() else "",
                    "institution": inst_match.group(1) if inst_match else "University",
                    "start_year": int(years[0]) if len(years) >= 2 else None,
                    "end_year": int(years[1]) if len(years) >= 2 else (int(years[0]) if len(years) == 1 else None),
                    "score": "",
                    "raw_text": line,
                    "confidence": 0.90,
                    "is_user_corrected": False
                })
                break

    return results

def extract_experiences(sections: Dict[str, str], full_text: str) -> List[Dict[str, Any]]:
    exp_text = sections.get("experience", "")
    if not exp_text:
        return []

    results = []
    blocks = [b.strip() for b in exp_text.split("\n\n") if b.strip()]

    for block in blocks:
        lines = block.split("\n")
        title = lines[0] if lines else "Role"
        results.append({
            "company": "Organization",
            "job_title": title,
            "location": "",
            "start_date": "",
            "end_date": "",
            "duration": "",
            "description": block,
            "skills": [],
            "raw_text": block,
            "confidence": 0.85,
            "is_user_corrected": False
        })

    return results

def extract_projects(sections: Dict[str, str], full_text: str) -> List[Dict[str, Any]]:
    proj_text = sections.get("projects", "")
    if not proj_text:
        return []

    results = []
    blocks = [b.strip() for b in proj_text.split("\n\n") if b.strip()]

    for block in blocks:
        lines = block.split("\n")
        results.append({
            "title": lines[0] if lines else "Project",
            "description": block,
            "technologies": [],
            "domain": "",
            "link": "",
            "raw_text": block,
            "confidence": 0.85,
            "is_user_corrected": False
        })

    return results

def extract_certifications(sections: Dict[str, str], full_text: str) -> List[Dict[str, Any]]:
    cert_text = sections.get("certifications", "")
    if not cert_text:
        return []

    results = []
    lines = [l.strip() for l in cert_text.split("\n") if l.strip()]

    for line in lines:
        results.append({
            "certification_name": line,
            "issuing_organization": "",
            "issue_date": "",
            "credential_id": "",
            "credential_url": "",
            "raw_text": line,
            "confidence": 0.85,
            "is_user_corrected": False
        })

    return results
