import { matchingEngine } from "../embeddings/embeddingService.js";
import { getNormalizedWeights, HYBRID_MATCH_CONFIG } from "./config.js";
import { calculateSkillMatch, SkillMatchResult } from "./skillScorer.js";
import { calculateExperienceMatch, ExperienceMatchResult } from "./experienceScorer.js";
import { calculateEducationMatch, EducationMatchResult } from "./educationScorer.js";
import { calculateAtsCompatibility, AtsMatchResult } from "./atsScorer.js";

export interface HybridMatchResult {
  overall_score: number; // 0 - 100
  semantic_score: number;
  skill_score: number;
  experience_score: number;
  education_score: number;
  ats_score: number;

  semantic_similarity: number;
  tfidf_score: number;
  tfidf_similarity: number;
  model_name: string;

  matched_required_skills: string[];
  missing_required_skills: string[];
  matched_preferred_skills: string[];
  missing_preferred_skills: string[];
  related_skills: any[];

  strengths: string[];
  weaknesses: string[];
  explanation: string;

  algorithm_version: string;
  weight_configuration: Record<string, number>;
  calculated_at: string;

  // Detailed sub-breakdowns for UI drilldown
  breakdown: {
    skills: SkillMatchResult;
    experience: ExperienceMatchResult;
    education: EducationMatchResult;
    ats: AtsMatchResult;
  };
}

export class HybridMatchingEngine {
  /**
   * Executes multi-factor hybrid matching evaluation
   */
  public async computeHybridMatch(
    resumeId: string,
    candidateAnalysis: any,
    rawResumeText: string = "",
    jobRecord: any
  ): Promise<HybridMatchResult> {
    // 1. Calculate Sentence-BERT Semantic Score (Phase 6 Engine)
    const semanticResult = await matchingEngine.computeMatch(
      resumeId,
      candidateAnalysis,
      jobRecord
    );

    const semanticScore = semanticResult.semantic_score;
    const semanticSimilarity = semanticResult.semantic_similarity;
    const tfidfScore = semanticResult.tfidf_score || 0;
    const tfidfSimilarity = semanticResult.tfidf_similarity || 0.0;
    const modelName = semanticResult.model_name;

    // 2. Skill Match & Gap Engine
    const reqSkills = jobRecord.required_skills || jobRecord.requiredSkills || [];
    const prefSkills = jobRecord.preferred_skills || jobRecord.preferredSkills || [];
    const candidateSkills = candidateAnalysis.skills || candidateAnalysis.extractedSkills || [];

    const skillResult = calculateSkillMatch(
      candidateSkills,
      reqSkills,
      prefSkills
    );

    // 3. Experience Match Engine
    const expYears = candidateAnalysis.total_experience_years !== undefined
      ? candidateAnalysis.total_experience_years
      : candidateAnalysis.parsedExperienceYears;

    const minExp = jobRecord.minimum_years !== undefined ? jobRecord.minimum_years : jobRecord.experience_min;
    const maxExp = jobRecord.maximum_years !== undefined ? jobRecord.maximum_years : jobRecord.experience_max;

    const experienceResult = calculateExperienceMatch(
      expYears,
      minExp,
      maxExp
    );

    // 4. Education Match Engine
    const eduRequirement = jobRecord.education_requirement || jobRecord.educationRequirement || jobRecord.description;
    const candidateEdu = candidateAnalysis.education || [];

    const educationResult = calculateEducationMatch(
      candidateEdu,
      eduRequirement
    );

    // 5. ATS Compatibility Engine
    const atsResult = calculateAtsCompatibility(
      rawResumeText || candidateAnalysis.summary || "",
      candidateSkills,
      candidateAnalysis,
      jobRecord.title || "",
      jobRecord.description || "",
      reqSkills
    );

    // 6. Weighted Hybrid Score Aggregation
    const weights = getNormalizedWeights();
    const rawOverall = (
      weights.SEMANTIC * semanticScore +
      weights.SKILL * skillResult.skillScore +
      weights.EXPERIENCE * experienceResult.experienceScore +
      weights.EDUCATION * educationResult.educationScore +
      weights.ATS * atsResult.atsScore
    );

    const overallScore = Math.max(0, Math.min(100, Math.round(rawOverall)));

    // 7. Generate Deterministic Strengths & Weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (skillResult.matchedRequiredSkills.length > 0) {
      strengths.push(`Satisfies key required skills: ${skillResult.matchedRequiredSkills.slice(0, 4).join(", ")}.`);
    }
    if (semanticScore >= 80) {
      strengths.push("High Sentence-BERT contextual semantic similarity with job description.");
    }
    if (experienceResult.experienceScore >= 85) {
      strengths.push(`Candidate work experience (${experienceResult.candidateYears} yrs) satisfies job requirement.`);
    }
    if (educationResult.educationScore >= 85) {
      strengths.push(`Educational background satisfies profile requirements (${educationResult.candidateDegree}).`);
    }

    if (skillResult.missingRequiredSkills.length > 0) {
      weaknesses.push(`Missing essential required skill(s): ${skillResult.missingRequiredSkills.slice(0, 4).join(", ")}.`);
    }
    if (experienceResult.experienceScore < 70) {
      weaknesses.push(`Candidate total experience (${experienceResult.candidateYears} yrs) is below minimum threshold.`);
    }
    if (atsResult.atsScore < 70) {
      weaknesses.push("ATS compatibility is reduced due to missing domain terminology keywords or incomplete sections.");
    }

    // Default fallbacks if empty
    if (strengths.length === 0) {
      strengths.push("Candidate profile contains general technical foundational background.");
    }
    if (weaknesses.length === 0) {
      weaknesses.push("No critical skill or experience deficiencies identified.");
    }

    // 8. Generate Human-Readable Deterministic Explanation
    const explanation = [
      `Overall hybrid fit score is ${overallScore}%.`,
      `Skill match (${skillResult.skillScore}%) satisfies ${skillResult.matchedRequiredSkills.length}/${reqSkills.length || 1} required skills.`,
      skillResult.missingRequiredSkills.length > 0
        ? `Key skill gap: ${skillResult.missingRequiredSkills.join(", ")}.`
        : "All essential required skills are satisfied.",
      experienceResult.explanation,
      `Semantic similarity score is ${semanticScore}% (${modelName}).`
    ].join(" ");

    return {
      overall_score: overallScore,
      semantic_score: semanticScore,
      skill_score: skillResult.skillScore,
      experience_score: experienceResult.experienceScore,
      education_score: educationResult.educationScore,
      ats_score: atsResult.atsScore,

      semantic_similarity: semanticSimilarity,
      tfidf_score: tfidfScore,
      tfidf_similarity: tfidfSimilarity,
      model_name: modelName,

      matched_required_skills: skillResult.matchedRequiredSkills,
      missing_required_skills: skillResult.missingRequiredSkills,
      matched_preferred_skills: skillResult.matchedPreferredSkills,
      missing_preferred_skills: skillResult.missingPreferredSkills,
      related_skills: skillResult.relatedSkills,

      strengths,
      weaknesses,
      explanation,

      algorithm_version: HYBRID_MATCH_CONFIG.ALGORITHM_VERSION,
      weight_configuration: weights,
      calculated_at: new Date().toISOString(),

      breakdown: {
        skills: skillResult,
        experience: experienceResult,
        education: educationResult,
        ats: atsResult,
      },
    };
  }
}

export const hybridMatchingEngine = new HybridMatchingEngine();
