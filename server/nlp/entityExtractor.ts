import { SectionMap } from "./sectionDetector.js";

export interface ExtractedEducation {
  degree: string;
  field: string;
  institution: string;
  start_year: number | null;
  end_year: number | null;
  score: string;
  raw_text: string;
  confidence: number;
}

export interface ExtractedExperience {
  company: string;
  job_title: string;
  location: string;
  start_date: string;
  end_date: string;
  duration: string;
  description: string;
  skills: string[];
  raw_text: string;
  confidence: number;
}

export interface ExtractedProject {
  title: string;
  description: string;
  technologies: string[];
  domain: string;
  link: string;
  raw_text: string;
  confidence: number;
}

export interface ExtractedCertification {
  certification_name: string;
  issuing_organization: string;
  issue_date: string;
  credential_id: string;
  credential_url: string;
  raw_text: string;
  confidence: number;
}

const DEGREE_PATTERNS = [
  { name: "B.Tech", regex: /\b(b\.?tech|bachelor\s+of\s+technology)\b/i },
  { name: "B.E.", regex: /\b(b\.?e\.?|bachelor\s+of\s+engineering)\b/i },
  { name: "B.S. / B.Sc", regex: /\b(b\.?s\.?|b\.?sc\.?|bachelor\s+of\s+science)\b/i },
  { name: "M.Tech", regex: /\b(m\.?tech|master\s+of\s+technology)\b/i },
  { name: "M.S. / M.Sc", regex: /\b(m\.?s\.?|m\.?sc\.?|master\s+of\s+science)\b/i },
  { name: "MCA", regex: /\b(mca|master\s+of\s+computer\s+applications)\b/i },
  { name: "MBA", regex: /\b(mba|master\s+of\s+business\s+administration)\b/i },
  { name: "Ph.D.", regex: /\b(ph\.?d\.?|doctorate)\b/i },
  { name: "Diploma", regex: /\b(diploma)\b/i },
  { name: "Class 12 / High School", regex: /\b(class\s+12|12th|high\s+school|higher\s+secondary)\b/i },
  { name: "Class 10", regex: /\b(class\s+10|10th|secondary\s+school)\b/i }
];

const JOB_TITLE_PATTERNS = [
  /\b(software\s+engineer|software\s+developer|full\s+stack\s+developer|frontend\s+developer|backend\s+developer)\b/i,
  /\b(machine\s+learning\s+engineer|ml\s+engineer|ai\s+engineer|data\s+scientist|data\s+analyst)\b/i,
  /\b(systems\s+engineer|devops\s+engineer|cloud\s+architect|cloud\s+engineer)\b/i,
  /\b(intern|software\s+engineering\s+intern|research\s+intern|ml\s+intern|data\s+intern)\b/i,
  /\b(technical\s+lead|team\s+lead|product\s+manager|project\s+manager)\b/i
];

/**
 * Extracts Education records from the resume text.
 */
export function extractEducation(sections: SectionMap): ExtractedEducation[] {
  const eduText = sections.education || sections.rawFullText;
  if (!eduText) return [];

  const results: ExtractedEducation[] = [];
  const lines = eduText.split("\n").map(l => l.trim()).filter(Boolean);

  let currentChunk: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hasDegreeMatch = DEGREE_PATTERNS.some(d => d.regex.test(line));

    if (hasDegreeMatch && currentChunk.length > 0) {
      const parsed = parseEducationChunk(currentChunk.join("\n"));
      if (parsed) results.push(parsed);
      currentChunk = [line];
    } else {
      currentChunk.push(line);
    }
  }

  if (currentChunk.length > 0) {
    const parsed = parseEducationChunk(currentChunk.join("\n"));
    if (parsed) results.push(parsed);
  }

  return results;
}

function parseEducationChunk(chunkText: string): ExtractedEducation | null {
  if (!chunkText) return null;

  let degree = "";
  for (const pattern of DEGREE_PATTERNS) {
    if (pattern.regex.test(chunkText)) {
      degree = pattern.name;
      break;
    }
  }

  if (!degree && !/\b(university|college|institute|school|gpa)\b/i.test(chunkText)) {
    return null; // Not an education entry
  }

  // Institution
  let institution = "";
  const instMatch = chunkText.match(/\b([A-Z][a-zA-Z0-9\s&,'\.-]+(University|College|Institute|School|Academy|Polytechnic))\b/);
  if (instMatch) {
    institution = instMatch[1].trim();
  }

  // Major / Field
  let field = "";
  const fieldMatch = chunkText.match(/\bin\s+([A-Za-z\s&]{4,40})(,|$|\n|\d)/i);
  if (fieldMatch) {
    field = fieldMatch[1].trim();
  } else if (/\b(computer\s+science|data\s+science|electrical|information\s+technology|software\s+engineering)\b/i.test(chunkText)) {
    const m = chunkText.match(/\b(computer\s+science\s*(&|and)?\s*engineering|computer\s+science|data\s+science|electrical\s+engineering|information\s+technology)\b/i);
    if (m) field = m[1].trim();
  }

  // Years (e.g. 2020 - 2024 or 2023)
  let startYear: number | null = null;
  let endYear: number | null = null;
  const yearMatches = chunkText.match(/\b(20\d{2}|19\d{2})\b/g);
  if (yearMatches && yearMatches.length >= 2) {
    startYear = parseInt(yearMatches[0], 10);
    endYear = parseInt(yearMatches[1], 10);
  } else if (yearMatches && yearMatches.length === 1) {
    endYear = parseInt(yearMatches[0], 10);
  }

  // Score / CGPA
  let score = "";
  const cgpaMatch = chunkText.match(/\b(GPA|CGPA|Score)[\:\s]*([\d\.]+(\s*\/\s*[\d\.]+)?|\d+%\b)/i);
  if (cgpaMatch) {
    score = cgpaMatch[0].trim();
  } else {
    const rawGpa = chunkText.match(/\b[34]\.\d{1,2}\s*\/\s*4\.0|\b[6789]\.\d{1,2}\s*\/\s*10(\.0)?|\b\d{2}%\b/i);
    if (rawGpa) score = rawGpa[0].trim();
  }

  return {
    degree: degree || "Higher Education Degree",
    field: field || "",
    institution: institution || "Academic Institution",
    start_year: startYear,
    end_year: endYear,
    score: score || "",
    raw_text: chunkText,
    confidence: degree ? 0.92 : 0.75
  };
}

/**
 * Extracts Work Experience records from the resume text.
 */
export function extractExperiences(sections: SectionMap): ExtractedExperience[] {
  const expText = sections.experience;
  if (!expText) return [];

  const results: ExtractedExperience[] = [];
  const blocks = expText.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);

  for (const block of blocks) {
    let jobTitle = "";
    for (const pat of JOB_TITLE_PATTERNS) {
      const match = block.match(pat);
      if (match) {
        jobTitle = match[1].trim();
        break;
      }
    }

    // Company match
    let company = "";
    const lines = block.split("\n");
    if (lines.length > 0) {
      const firstLine = lines[0];
      const compMatch = firstLine.match(/\b([A-Z][a-zA-Z0-9\s&,'\.-]{2,35})\b/);
      if (compMatch && !/experience|work|history|skills/i.test(compMatch[1])) {
        company = compMatch[1].trim();
      }
    }

    // Dates & Duration
    let startDate = "";
    let endDate = "";
    let duration = "";
    const dateMatch = block.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)?\s*(20\d{2}|19\d{2})\s*(-|–|to)\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)?\s*(20\d{2}|Present|Current)\b/i);
    
    if (dateMatch) {
      startDate = `${dateMatch[1] || ""} ${dateMatch[2]}`.trim();
      endDate = `${dateMatch[4] || ""} ${dateMatch[5]}`.trim();
    }

    results.push({
      company: company || "Organization",
      job_title: jobTitle || lines[0] || "Professional Role",
      location: "",
      start_date: startDate,
      end_date: endDate,
      duration: duration,
      description: block,
      skills: [],
      raw_text: block,
      confidence: jobTitle ? 0.90 : 0.75
    });
  }

  return results;
}

/**
 * Extracts Project records from the resume text.
 */
export function extractProjects(sections: SectionMap): ExtractedProject[] {
  const projText = sections.projects;
  if (!projText) return [];

  const results: ExtractedProject[] = [];
  const blocks = projText.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split("\n");
    const title = lines[0] || "Project";

    // Tech stack in project
    const techMatch = block.match(/(Technologies|Tech Stack|Tools|Built with)[\:\s]*(.+)/i);
    const technologies: string[] = [];
    if (techMatch && techMatch[2]) {
      techMatch[2].split(/[,\|]/).forEach(t => {
        const cleaned = t.trim();
        if (cleaned) technologies.push(cleaned);
      });
    }

    // Links (GitHub / Live Demo)
    const linkMatch = block.match(/(https?:\/\/[^\s\)]+)/i);

    results.push({
      title: title.replace(/^[\s•\-\*]+/, ""),
      description: block,
      technologies,
      domain: "",
      link: linkMatch ? linkMatch[1] : "",
      raw_text: block,
      confidence: 0.88
    });
  }

  return results;
}

/**
 * Extracts Certifications from the resume text.
 */
export function extractCertifications(sections: SectionMap): ExtractedCertification[] {
  const certText = sections.certifications;
  if (!certText) return [];

  const results: ExtractedCertification[] = [];
  const lines = certText.split("\n").map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    if (line.length < 5) continue;

    let org = "";
    if (/\b(AWS|Amazon|Google|Microsoft|Coursera|Udemy|Meta|IBM|NVIDIA|Oracle|Cisco)\b/i.test(line)) {
      const match = line.match(/\b(AWS|Amazon|Google|Microsoft|Coursera|Udemy|Meta|IBM|NVIDIA|Oracle|Cisco)\b/i);
      if (match) org = match[1];
    }

    results.push({
      certification_name: line.replace(/^[\s•\-\*]+/, ""),
      issuing_organization: org,
      issue_date: "",
      credential_id: "",
      credential_url: "",
      raw_text: line,
      confidence: 0.85
    });
  }

  return results;
}

/**
 * Identifies target roles/job titles from sections.
 */
export function extractRoles(sections: SectionMap): string[] {
  const fullText = sections.rawFullText;
  const rolesSet = new Set<string>();

  for (const pat of JOB_TITLE_PATTERNS) {
    const matches = fullText.matchAll(new RegExp(pat, "gi"));
    for (const m of matches) {
      if (m[1]) {
        // Capitalize title
        const formatted = m[1].split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
        rolesSet.add(formatted);
      }
    }
  }

  return Array.from(rolesSet);
}

/**
 * Extracts candidate summary / objective paragraph.
 */
export function extractSummary(sections: SectionMap): string {
  if (sections.summary) return sections.summary;

  // Fallback: search for first paragraph in text
  const firstPara = sections.rawFullText.split("\n\n")[0] || "";
  if (firstPara.length > 50 && firstPara.length < 500 && !/education|experience|skills/i.test(firstPara)) {
    return firstPara.trim();
  }

  return "";
}
