import { detectResumeSections, SectionMap } from "./sectionDetector.js";
import { extractSkillsFromResume, ExtractedSkill } from "./skillExtractor.js";
import {
  extractEducation,
  extractExperiences,
  extractProjects,
  extractCertifications,
  extractRoles,
  extractSummary,
  ExtractedEducation,
  ExtractedExperience,
  ExtractedProject,
  ExtractedCertification
} from "./entityExtractor.js";

export interface CandidateNlpProfile {
  summary: string;
  roles: string[];
  skills: ExtractedSkill[];
  education: ExtractedEducation[];
  experience: ExtractedExperience[];
  projects: ExtractedProject[];
  certifications: ExtractedCertification[];
  analyzer_version: string;
  analyzed_at: string;
  processing_status: "completed" | "failed";
  processing_error?: string;
}

/**
 * Executes the full modular NLP processing pipeline on raw resume text.
 * Stage 1: Text Cleaning & Section Detection
 * Stage 2: Skill Extraction & Normalization
 * Stage 3: Education & Experience Extraction
 * Stage 4: Project & Certification Extraction
 * Stage 5: Role & Summary Synthesis
 */
export function analyzeResumeText(rawText: string): CandidateNlpProfile {
  const now = new Date().toISOString();

  if (!rawText || !rawText.trim()) {
    return {
      summary: "",
      roles: [],
      skills: [],
      education: [],
      experience: [],
      projects: [],
      certifications: [],
      analyzer_version: "nlp-v1",
      analyzed_at: now,
      processing_status: "failed",
      processing_error: "Empty or machine-unreadable document text provided."
    };
  }

  try {
    // 1. Detect Sections
    const sections: SectionMap = detectResumeSections(rawText);

    // 2. Extract Skills
    const skills = extractSkillsFromResume(sections);

    // 3. Extract Entities
    const education = extractEducation(sections);
    const experience = extractExperiences(sections);
    const projects = extractProjects(sections);
    const certifications = extractCertifications(sections);
    const roles = extractRoles(sections);
    const summary = extractSummary(sections);

    return {
      summary,
      roles,
      skills,
      education,
      experience,
      projects,
      certifications,
      analyzer_version: "nlp-v1",
      analyzed_at: now,
      processing_status: "completed"
    };
  } catch (err: any) {
    return {
      summary: "",
      roles: [],
      skills: [],
      education: [],
      experience: [],
      projects: [],
      certifications: [],
      analyzer_version: "nlp-v1",
      analyzed_at: now,
      processing_status: "failed",
      processing_error: `NLP Analysis failed: ${err.message || "Pipeline execution error."}`
    };
  }
}
