import re
from typing import List, Dict, Any

SKILL_TAXONOMY = {
    "Python": {"category": "Programming Languages", "aliases": ["python3", "py"], "canonical": "Python"},
    "JavaScript": {"category": "Programming Languages", "aliases": ["js", "es6"], "canonical": "JavaScript"},
    "TypeScript": {"category": "Programming Languages", "aliases": ["ts"], "canonical": "TypeScript"},
    "Java": {"category": "Programming Languages", "aliases": ["java8", "java11", "java17"], "canonical": "Java"},
    "C++": {"category": "Programming Languages", "aliases": ["cpp", "c plus plus"], "canonical": "C++"},
    "C": {"category": "Programming Languages", "aliases": ["ansi c"], "canonical": "C"},
    "SQL": {"category": "Programming Languages", "aliases": ["psql", "t-sql"], "canonical": "SQL"},
    "React": {"category": "Frameworks & Libraries", "aliases": ["reactjs", "react.js"], "canonical": "React"},
    "FastAPI": {"category": "Frameworks & Libraries", "aliases": ["fast api"], "canonical": "FastAPI"},
    "Express.js": {"category": "Frameworks & Libraries", "aliases": ["express", "expressjs"], "canonical": "Express.js"},
    "Django": {"category": "Frameworks & Libraries", "aliases": ["drf"], "canonical": "Django"},
    "PostgreSQL": {"category": "Databases", "aliases": ["postgres", "postgresql"], "canonical": "PostgreSQL"},
    "MongoDB": {"category": "Databases", "aliases": ["mongo"], "canonical": "MongoDB"},
    "Redis": {"category": "Databases", "aliases": ["redis cache"], "canonical": "Redis"},
    "AWS": {"category": "Cloud & DevOps", "aliases": ["amazon web services", "ec2", "s3"], "canonical": "AWS"},
    "Docker": {"category": "Cloud & DevOps", "aliases": ["docker compose"], "canonical": "Docker"},
    "Kubernetes": {"category": "Cloud & DevOps", "aliases": ["k8s"], "canonical": "Kubernetes"},
    "Scikit-learn": {"category": "AI & Machine Learning", "aliases": ["sklearn", "scikit learn"], "canonical": "Scikit-learn"},
    "PyTorch": {"category": "AI & Machine Learning", "aliases": ["torch"], "canonical": "PyTorch"},
    "TensorFlow": {"category": "AI & Machine Learning", "aliases": ["tf"], "canonical": "TensorFlow"},
    "Git": {"category": "Tools & Technologies", "aliases": ["github", "gitlab"], "canonical": "Git"},
}

def extract_skills(sections: Dict[str, str], full_text: str) -> List[Dict[str, Any]]:
    extracted = {}
    
    text_to_scan = sections.get("skills", "") + "\n" + full_text

    for skill_name, info in SKILL_TAXONOMY.items():
        canonical = info["canonical"]
        category = info["category"]
        aliases = [skill_name] + info["aliases"]

        for alias in aliases:
            escaped = re.escape(alias)
            if alias.lower() == "c":
                pattern = r"(^|[\s,:\/\(])C([\s,;\/\)]|$)"
            elif alias.lower() == "java":
                pattern = r"(^|[^\w])java([^\w\.]|$)"
            else:
                pattern = rf"(^|[^\w#\+]){escaped}([^\w#\+]|$)"

            if re.search(pattern, text_to_scan, re.IGNORECASE):
                extracted[canonical] = {
                    "skill_name": canonical,
                    "normalized_name": canonical.lower(),
                    "category": category,
                    "original_text": alias,
                    "confidence": 0.95 if "skills" in sections and alias in sections["skills"] else 0.85,
                    "source": "section_skills" if "skills" in sections and alias in sections["skills"] else "text_scan",
                    "is_user_corrected": False
                }
                break

    return list(extracted.values())
