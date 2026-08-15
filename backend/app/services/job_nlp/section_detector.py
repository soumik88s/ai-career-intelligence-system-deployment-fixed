import re
from typing import Dict

def detect_job_sections(text: str) -> Dict[str, str]:
    sections = {
        "overview": "",
        "responsibilities": "",
        "required_qualifications": "",
        "preferred_qualifications": "",
        "education": "",
        "experience": "",
        "benefits": "",
        "other": ""
    }

    if not text or not text.strip():
        return sections

    lines = text.split("\n")
    current_section = "overview"

    headers_map = [
        ("preferred_qualifications", [
            r"^(preferred|nice to have|bonus|plus|desired|desirable|good to have) (qualifications|skills|requirements|experience)?:?",
            r"^(preferred|desired|plus|bonus):?"
        ]),
        ("required_qualifications", [
            r"^(required|must have|essential|minimum|basic) (qualifications|skills|requirements|prerequisites|experience)?:?",
            r"^(requirements|qualifications|what you need|what we look for):?"
        ]),
        ("responsibilities", [
            r"^(responsibilities|what you will do|key responsibilities|role description|duties|job duties):?"
        ]),
        ("education", [
            r"^(education|academic background|degree requirements|educational qualification):?"
        ]),
        ("experience", [
            r"^(experience|work experience|years of experience|background required):?"
        ]),
        ("benefits", [
            r"^(benefits|what we offer|perks|compensation|package):?"
        ]),
        ("overview", [
            r"^(about the role|about us|job overview|summary|position summary|company overview):?"
        ])
    ]

    for line in lines:
        trimmed = line.strip()
        if not trimmed:
            continue

        matched_header = False
        for sec_key, patterns in headers_map:
            for pattern in patterns:
                if re.match(pattern, trimmed, re.IGNORECASE):
                    current_section = sec_key
                    matched_header = True
                    break
            if matched_header:
                break

        if not matched_header:
            if sections[current_section]:
                sections[current_section] += "\n" + trimmed
            else:
                sections[current_section] = trimmed

    return sections
