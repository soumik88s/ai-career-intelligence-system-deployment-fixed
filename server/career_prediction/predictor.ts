import { getCandidateAnalysis, getResumeById, saveCareerPredictions, getCareerPredictionsByResume } from "../db.js";
import { buildCandidateFeatureVector } from "./featureBuilder.js";
import { predictCareerRolesFromVector, loadModelArtifacts, CareerPredictionResult } from "./model.js";
import { generatePredictionEvidence, RolePredictionEvidence } from "./evidenceGenerator.js";

export interface FormattedCareerPredictionResponse {
  model_name: string;
  model_version: string;
  resume_id: string;
  candidate_summary?: string;
  extracted_skill_count: number;
  total_experience_years: number;
  predictions: {
    role: string;
    score: number;
    rank: number;
    category: string;
    description: string;
    matched_skills: string[];
    missing_skills: string[];
    evidence_signals: string[];
  }[];
  disclaimer: string;
  generated_at: string;
}

export class CareerPredictionService {
  async predictForResume(
    userId: string,
    resumeId: string,
    topK: number = 5
  ): Promise<FormattedCareerPredictionResponse> {
    // 1. Verify Resume
    const resume = await getResumeById(userId, resumeId);
    if (!resume) {
      throw new Error("Resume record not found");
    }

    if (resume.user_id !== userId) {
      throw new Error("Unauthorized: Resume does not belong to the authenticated user");
    }

    // 2. Retrieve Analyzed Profile
    const candidateProfile = await getCandidateAnalysis(userId, resumeId);
    if (!candidateProfile || candidateProfile.processing_status !== "completed") {
      throw new Error("Resume NLP analysis is incomplete. Please analyze your resume before generating career predictions.");
    }

    // 3. Cold Start Check
    const skills = candidateProfile.skills || [];
    if (skills.length === 0 && (!candidateProfile.experience || candidateProfile.experience.length === 0)) {
      throw new Error("Candidate profile lacks extracted skills or experience. Unable to build feature representation for ML prediction.");
    }

    // 4. Feature Extraction
    const featureData = buildCandidateFeatureVector(candidateProfile);

    // 5. ML Predict
    const modelArtifacts = loadModelArtifacts();
    const rawPredictions: CareerPredictionResult[] = predictCareerRolesFromVector(featureData.featureVector, topK);

    // 6. Generate Evidence
    const predictionsWithEvidence = rawPredictions.map(pred => {
      const evidence: RolePredictionEvidence = generatePredictionEvidence(pred, candidateProfile);
      return {
        role: pred.role,
        score: pred.score,
        rank: pred.rank,
        category: pred.category,
        description: pred.description,
        matched_skills: evidence.matched_skills,
        missing_skills: evidence.missing_skills,
        evidence_signals: evidence.evidence_signals
      };
    });

    const generatedAt = new Date().toISOString();

    // 7. Persist Predictions
    await saveCareerPredictions(
      userId,
      resumeId,
      modelArtifacts.model_version,
      predictionsWithEvidence
    );

    return {
      model_name: modelArtifacts.model_name,
      model_version: modelArtifacts.model_version,
      resume_id: resumeId,
      candidate_summary: candidateProfile.summary || "",
      extracted_skill_count: skills.length,
      total_experience_years: featureData.totalExperienceYears,
      predictions: predictionsWithEvidence,
      disclaimer: "These predictions are ML-based estimates derived from your candidate profile signals and training data. They represent career alignment probabilities and are not guarantees of employment outcomes.",
      generated_at: generatedAt
    };
  }

  async getHistoryForResume(userId: string, resumeId: string) {
    const resume = await getResumeById(userId, resumeId);
    if (!resume) {
      throw new Error("Resume record not found");
    }
    if (resume.user_id !== userId) {
      throw new Error("Unauthorized: Resume does not belong to authenticated user");
    }

    return await getCareerPredictionsByResume(resumeId);
  }
}

export const careerPredictionService = new CareerPredictionService();
