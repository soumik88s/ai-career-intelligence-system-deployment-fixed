import { CandidateAnalysisProfile } from "../../src/types/index.js";
import { CareerPredictionResult } from "./model.js";

export interface RolePredictionEvidence {
  role: string;
  score: number;
  evidence_signals: string[];
  matched_skills: string[];
  missing_skills: string[];
  experience_signal?: string;
  education_signal?: string;
}

export function generatePredictionEvidence(
  prediction: CareerPredictionResult,
  candidateProfile: Partial<CandidateAnalysisProfile>
): RolePredictionEvidence {
  const candidateSkills = (candidateProfile.skills || []).map(s => (s.normalized_name || s.skill_name || "").toLowerCase());
  
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  prediction.required_skills.forEach(reqSkill => {
    const normReq = reqSkill.toLowerCase();
    const isMatched = candidateSkills.some(cs => cs === normReq || cs.includes(normReq) || normReq.includes(cs));
    if (isMatched) {
      matchedSkills.push(reqSkill);
    } else {
      missingSkills.push(reqSkill);
    }
  });

  const evidenceSignals: string[] = [];

  // Skill signal
  if (matchedSkills.length > 0) {
    evidenceSignals.push(`Strong profile alignment in key required technologies: ${matchedSkills.slice(0, 4).join(", ")}.`);
  }

  // Experience signal
  let experienceSignal = "";
  if (candidateProfile.experience && candidateProfile.experience.length > 0) {
    const expCount = candidateProfile.experience.length;
    const expTitles = candidateProfile.experience.map(e => e.job_title).filter(Boolean).join(", ");
    experienceSignal = `Relevant work experience background (${expCount} roles listed including ${expTitles || 'Engineering roles'}).`;
    evidenceSignals.push(experienceSignal);
  }

  // Education signal
  let educationSignal = "";
  if (candidateProfile.education && candidateProfile.education.length > 0) {
    const edu = candidateProfile.education[0];
    if (edu.degree || edu.field) {
      educationSignal = `Academic background in ${edu.degree || ''} ${edu.field || ''}.`;
      evidenceSignals.push(educationSignal);
    }
  }

  // Project signal
  if (candidateProfile.projects && candidateProfile.projects.length > 0) {
    const projectTech = candidateProfile.projects.flatMap(p => p.technologies || []).slice(0, 3);
    if (projectTech.length > 0) {
      evidenceSignals.push(`Hands-on project work demonstrating expertise with ${projectTech.join(", ")}.`);
    }
  }

  if (evidenceSignals.length === 0) {
    evidenceSignals.push(`General profile domain compatibility with ${prediction.category} role requirements.`);
  }

  return {
    role: prediction.role,
    score: prediction.score,
    evidence_signals: evidenceSignals,
    matched_skills: matchedSkills,
    missing_skills: missingSkills,
    experience_signal: experienceSignal,
    education_signal: educationSignal
  };
}
