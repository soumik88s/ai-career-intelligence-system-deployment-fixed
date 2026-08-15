import re
from typing import List, Dict, Any

# Knowledge Base Dictionary
SKILL_KB = [
    {"skill_name": "Python", "normalized_name": "python", "category": "Programming Languages", "aliases": ["python3", "py"]},
    {"skill_name": "JavaScript", "normalized_name": "javascript", "category": "Programming Languages", "aliases": ["js", "es6"]},
    {"skill_name": "TypeScript", "normalized_name": "typescript", "category": "Programming Languages", "aliases": ["ts"]},
    {"skill_name": "Java", "normalized_name": "java", "category": "Programming Languages", "aliases": ["java8", "java11", "java17"]},
    {"skill_name": "C++", "normalized_name": "cpp", "category": "Programming Languages", "aliases": ["c plus plus", "c/c++"]},
    {"skill_name": "React", "normalized_name": "react", "category": "Frameworks & Libraries", "aliases": ["reactjs", "react.js"]},
    {"skill_name": "PyTorch", "normalized_name": "pytorch", "category": "AI & Machine Learning", "aliases": ["torch"]},
    {"skill_name": "TensorFlow", "normalized_name": "tensorflow", "category": "AI & Machine Learning", "aliases": ["tf", "keras"]},
    {"skill_name": "PostgreSQL", "normalized_name": "postgresql", "category": "Databases", "aliases": ["postgres", "pg"]},
    {"skill_name": "Docker", "normalized_name": "docker", "category": "Cloud & DevOps", "aliases": ["containerization"]},
    {"skill_name": "AWS", "normalized_name": "aws", "category": "Cloud & DevOps", "aliases": ["amazon web services", "ec2", "s3"]}
]

def extract_job_skills(sections: Dict[str, str], full_text: str) -> List[Dict[str, Any]]:
    extracted_map = {}
    lower_text = full_text.lower()

    preferred_text = (sections.get("preferred_qualifications", "") + "\n" + sections.get("other", "")).lower()
    required_text = (sections.get("required_qualifications", "") + "\n" + sections.get("responsibilities", "")).lower()

    for item in SKILL_KB:
        terms = [item["skill_name"].lower(), item["normalized_name"]] + item["aliases"]
        found = False
        matched_term = item["skill_name"]

        for term in terms:
            if len(term) <= 2:
                if re.search(r'\b' + re.escape(term) + r'\b', lower_text, re.I):
                    found = True
                    matched_term = term
                    break
            else:
                if term in lower_text:
                    found = True
                    matched_term = term
                    break

        if found:
            skill_type = "required"
            if matched_term in preferred_text and matched_term not in required_text:
                skill_type = "preferred"

            key = item["normalized_name"]
            extracted_map[key] = {
                "skill_name": item["skill_name"],
                "normalized_name": item["normalized_name"],
                "category": item["category"],
                "skill_type": skill_type,
                "confidence": 0.95,
                "original_text": matched_term
            }

    return list(extracted_map.values())
