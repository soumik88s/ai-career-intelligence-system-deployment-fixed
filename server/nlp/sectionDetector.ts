export interface SectionMap {
  summary?: string;
  skills?: string;
  experience?: string;
  education?: string;
  projects?: string;
  certifications?: string;
  achievements?: string;
  languages?: string;
  other?: string;
  rawFullText: string;
}

export type SectionType =
  | "summary"
  | "skills"
  | "experience"
  | "education"
  | "projects"
  | "certifications"
  | "achievements"
  | "languages"
  | "other";

const SECTION_HEADERS: { type: SectionType; regex: RegExp }[] = [
  {
    type: "summary",
    regex: /^(summary|objective|profile|about\s+me|career\s+summary|executive\s+summary|professional\s+summary)[\:\-\s]*$/i,
  },
  {
    type: "skills",
    regex: /^(technical\s+skills|skills\s+(&|and)\s+technologies|core\s+competencies|technical\s+expertise|skills|technologies|tools\s+(&|and)\s+technologies|tech\s+stack)[\:\-\s]*$/i,
  },
  {
    type: "experience",
    regex: /^(work\s+experience|professional\s+experience|employment\s+history|experience|work\s+history|internship\s+experience|internships|employment)[\:\-\s]*$/i,
  },
  {
    type: "education",
    regex: /^(education\s+(&|and)\s+qualifications|academic\s+background|academic\s+qualifications|education|academic\s+history)[\:\-\s]*$/i,
  },
  {
    type: "projects",
    regex: /^(key\s+projects|academic\s+projects|personal\s+projects|projects|major\s+projects|selected\s+projects)[\:\-\s]*$/i,
  },
  {
    type: "certifications",
    regex: /^(certifications\s+(&|and)\s+licenses|licenses\s+(&|and)\s+certifications|certifications|certificates|courses\s+(&|and)\s+certifications)[\:\-\s]*$/i,
  },
  {
    type: "achievements",
    regex: /^(honors\s+(&|and)\s+awards|awards\s+(&|and)\s+achievements|achievements|awards|publications)[\:\-\s]*$/i,
  },
  {
    type: "languages",
    regex: /^(languages\s+spoken|languages|known\s+languages)[\:\-\s]*$/i,
  },
];

/**
 * Detects section headers in the resume text and chunks text by section.
 */
export function detectResumeSections(rawText: string): SectionMap {
  const result: SectionMap = {
    rawFullText: rawText || "",
  };

  if (!rawText || !rawText.trim()) {
    return result;
  }

  const lines = rawText.split("\n");
  const sectionSpans: { type: SectionType; startLine: number }[] = [];

  // Identify lines that match section headers
  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();
    if (!trimmedLine || trimmedLine.length > 60) continue;

    // Check if line matches a known header pattern
    for (const headerDef of SECTION_HEADERS) {
      if (headerDef.regex.test(trimmedLine)) {
        sectionSpans.push({ type: headerDef.type, startLine: i });
        break;
      }
    }
  }

  if (sectionSpans.length === 0) {
    // If no explicit section headers detected, assign entire text to other
    result.other = rawText;
    return result;
  }

  // Slice lines between detected section headers
  for (let idx = 0; idx < sectionSpans.length; idx++) {
    const current = sectionSpans[idx];
    const nextStart = idx + 1 < sectionSpans.length ? sectionSpans[idx + 1].startLine : lines.length;

    // Content lines exclude the header line itself
    const contentLines = lines.slice(current.startLine + 1, nextStart);
    const sectionText = contentLines.join("\n").trim();

    if (sectionText) {
      const existing = (result as any)[current.type] || "";
      (result as any)[current.type] = existing ? `${existing}\n\n${sectionText}` : sectionText;
    }
  }

  return result;
}
