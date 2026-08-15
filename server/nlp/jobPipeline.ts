import { detectJobSections } from "./jobSectionDetector.js";
import { normalizeWorkMode, normalizeEmploymentType, normalizeJobRole } from "./jobNormalizer.js";
import { extractJobSkills, ExtractedJobSkill } from "./jobSkillExtractor.js";
import {
  extractJobExperienceRequirements,
  extractJobEducationRequirements,
  ExtractedJobExperience,
  ExtractedJobEducation
} from "./jobRequirementExtractor.js";

export interface JobNlpAnalysisResult {
  job_id?: string;
  original_title: string;
  normalized_title: string;
  company: string;
  work_mode: "Remote" | "Hybrid" | "On-site" | "Unknown";
  employment_type: "Full-time" | "Part-time" | "Internship" | "Contract" | "Temporary" | "Freelance" | "Unknown";
  skills: ExtractedJobSkill[];
  required_skills: string[];
  preferred_skills: string[];
  experience: ExtractedJobExperience[];
  experience_min: number | null;
  experience_max: number | null;
  education: ExtractedJobEducation[];
  education_requirement: string;
  summary: string;
  analyzer_version: string;
  analyzed_at: string;
  processing_status: "completed" | "failed";
  processing_error?: string;
}

export function processJobNlp(
  title: string,
  company: string,
  description: string,
  inputWorkMode?: string,
  inputEmploymentType?: string
): JobNlpAnalysisResult {
  if (!description || !description.trim()) {
    return {
      original_title: title || "",
      normalized_title: title || "Software Engineer",
      company: company || "",
      work_mode: "Unknown",
      employment_type: "Unknown",
      skills: [],
      required_skills: [],
      preferred_skills: [],
      experience: [],
      experience_min: null,
      experience_max: null,
      education: [],
      education_requirement: "",
      summary: "",
      analyzer_version: "job-nlp-v1",
      analyzed_at: new Date().toISOString(),
      processing_status: "failed",
      processing_error: "Empty job description provided"
    };
  }

  const sections = detectJobSections(description);
  const normalizedRole = normalizeJobRole(title);
  
  const workMode = (inputWorkMode && inputWorkMode !== "Unknown")
    ? (inputWorkMode as any)
    : normalizeWorkMode(description + " " + title);

  const employmentType = (inputEmploymentType && inputEmploymentType !== "Unknown")
    ? (inputEmploymentType as any)
    : normalizeEmploymentType(description + " " + title);

  const skills = extractJobSkills(sections, description);
  const requiredSkills = skills.filter((s) => s.skill_type === "required").map((s) => s.skill_name);
  const preferredSkills = skills.filter((s) => s.skill_type === "preferred").map((s) => s.skill_name);

  const experience = extractJobExperienceRequirements(sections, description);
  const expMin = experience.length > 0 ? experience[0].minimum_years : null;
  const expMax = experience.length > 0 ? experience[0].maximum_years : null;

  const education = extractJobEducationRequirements(sections, description);
  const eduReq = education.length > 0 ? education[0].original_text : "Not specified";

  // Deterministic Job Summary Generation
  let expSummaryStr = "Not specified";
  if (expMin !== null && expMax !== null) {
    expSummaryStr = `${expMin}–${expMax} years`;
  } else if (expMin !== null) {
    expSummaryStr = `${expMin}+ years`;
  }

  const summaryLines = [
    `Role: ${normalizedRole.normalizedTitle}`,
    `Company: ${company}`,
    `Work Mode: ${workMode}`,
    `Employment Type: ${employmentType}`,
    `Experience Required: ${expSummaryStr}`,
    `Education: ${eduReq}`,
    `Required Skills: ${requiredSkills.length > 0 ? requiredSkills.join(", ") : "None specified"}`,
    `Preferred Skills: ${preferredSkills.length > 0 ? preferredSkills.join(", ") : "None specified"}`
  ];

  return {
    original_title: title,
    normalized_title: normalizedRole.normalizedTitle,
    company: company,
    work_mode: workMode,
    employment_type: employmentType,
    skills,
    required_skills: requiredSkills,
    preferred_skills: preferredSkills,
    experience,
    experience_min: expMin,
    experience_max: expMax,
    education,
    education_requirement: eduReq,
    summary: summaryLines.join("\n"),
    analyzer_version: "job-nlp-v1",
    analyzed_at: new Date().toISOString(),
    processing_status: "completed"
  };
}
