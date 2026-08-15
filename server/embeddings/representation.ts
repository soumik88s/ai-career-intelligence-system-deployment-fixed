import crypto from "crypto";

export interface CandidateStructuredRepresentations {
  overallText: string;
  skillsText: string;
  experienceText: string;
  educationText: string;
  contentHash: string;
}

export interface JobStructuredRepresentations {
  overallText: string;
  skillsText: string;
  experienceText: string;
  educationText: string;
  contentHash: string;
}

/**
 * Builds structured text representations and content hash for a candidate NLP profile.
 */
export function buildCandidateRepresentations(candidateAnalysis: any): CandidateStructuredRepresentations {
  const summary = candidateAnalysis.summary || "";
  
  // Skills string
  const skillsList = (candidateAnalysis.skills || []).map((s: any) => 
    typeof s === "string" ? s : (s.skill_name || s.name || "")
  ).filter(Boolean);
  const skillsText = skillsList.length > 0 
    ? `Skills and Technical Proficiencies: ${skillsList.join(", ")}` 
    : "";

  // Experience string
  const expItems = candidateAnalysis.experience || candidateAnalysis.experiences || [];
  const expParts = expItems.map((e: any) => {
    const title = e.job_title || e.title || "";
    const company = e.company || "";
    const desc = e.description || e.raw_text || "";
    return `${title} at ${company}. ${desc}`.trim();
  });
  const experienceText = expParts.length > 0 
    ? `Professional Experience and Work History:\n${expParts.join("\n")}` 
    : "";

  // Education string
  const eduItems = candidateAnalysis.education || [];
  const eduParts = eduItems.map((ed: any) => {
    const degree = ed.degree || "";
    const field = ed.field || "";
    const inst = ed.institution || "";
    return `${degree} in ${field} from ${inst}`.trim();
  });
  const educationText = eduParts.length > 0 
    ? `Educational Background and Academic Qualifications:\n${eduParts.join("; ")}` 
    : "";

  // Projects string
  const projItems = candidateAnalysis.projects || [];
  const projParts = projItems.map((p: any) => `${p.title || ""}: ${p.description || ""}`).filter(b => b.length > 3);
  const projectsText = projParts.length > 0 ? `Projects: ${projParts.join("; ")}` : "";

  // Overall structured text
  const overallText = [
    `Candidate Profile Summary: ${summary}`,
    skillsText,
    experienceText,
    educationText,
    projectsText
  ].filter(Boolean).join("\n\n");

  // Generate SHA-256 content hash
  const contentHash = crypto.createHash("sha256").update(overallText).digest("hex");

  return {
    overallText,
    skillsText: skillsText || summary,
    experienceText: experienceText || summary,
    educationText: educationText || summary,
    contentHash
  };
}

/**
 * Builds structured text representations and content hash for a job NLP profile / posting.
 */
export function buildJobRepresentations(jobRecord: any, jobAnalysis?: any): JobStructuredRepresentations {
  const title = jobRecord.title || "";
  const company = jobRecord.company || "";
  const desc = jobRecord.description || "";
  const location = jobRecord.location || "";
  const workMode = jobRecord.work_mode || "";

  // Skills
  const reqSkills = jobAnalysis?.required_skills || jobRecord.required_skills || [];
  const prefSkills = jobAnalysis?.preferred_skills || jobRecord.preferred_skills || [];
  const skillsText = `Required Skills: ${reqSkills.join(", ")}. Preferred Skills: ${prefSkills.join(", ")}.`;

  // Experience requirements
  const minExp = jobAnalysis?.experience_min ?? jobRecord.experience_min;
  const maxExp = jobAnalysis?.experience_max ?? jobRecord.experience_max;
  const expText = minExp !== null && minExp !== undefined 
    ? `Required Experience: ${minExp}${maxExp ? ` to ${maxExp}` : "+"} years in relevant roles.`
    : "Experience Requirement: Entry to Mid Level.";

  // Education requirements
  const eduText = jobAnalysis?.education_requirement || jobRecord.education_requirement || "Education Requirement: Bachelor's degree or equivalent experience.";

  // Overall structured text
  const overallText = [
    `Job Title: ${title} at ${company}`,
    `Location & Work Mode: ${location} (${workMode})`,
    `Job Description: ${desc}`,
    skillsText,
    expText,
    eduText
  ].filter(Boolean).join("\n\n");

  // Content Hash
  const contentHash = crypto.createHash("sha256").update(overallText).digest("hex");

  return {
    overallText,
    skillsText,
    experienceText: expText,
    educationText: eduText,
    contentHash
  };
}
