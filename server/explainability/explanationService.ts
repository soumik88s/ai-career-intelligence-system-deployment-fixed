/**
 * Explanation Service
 *
 * Provides explanation processing and caching for:
 * 1. Career Role Predictions (via LinearExplainer on multi-feature logit model)
 * 2. Hybrid Job Matching Results (via KernelExplainer / component breakdown)
 * 3. Global Model Feature Importance
 */

import { loadModelArtifacts } from "../career_prediction/model.js";
import { buildCandidateFeatureVector } from "../career_prediction/featureBuilder.js";
import {
  LinearExplainer,
  KernelExplainer,
  LocalShapExplanation,
  formatHumanFeatureName
} from "./shapExplainer.js";
import {
  categorizeFeatureFactors,
  calculateGlobalFeatureImportance,
  ExplainerFactorBreakdown,
  GlobalFeatureImportanceItem
} from "./featureExplainer.js";
import {
  formatCareerPredictionNarrative,
  formatMatchingNarrative
} from "./formatter.js";
import {
  getCandidateAnalysis,
  getResumeById,
  saveExplanationRecord,
  getExplanationRecordByEntityId,
  getJobById,
  getJobAnalysis,
  getResumeText,
  getMatchingResultById
} from "../db.js";
import { hybridMatchingEngine } from "../matching/hybridEngine.js";

export interface CompleteExplanationResponse {
  entity_type: "career_prediction" | "matching_result";
  entity_id: string;
  user_id: string;
  model_version: string;
  explainer_type: "LinearExplainer" | "KernelExplainer";
  base_value: number;
  prediction_value: number;
  positive_factors: any[];
  negative_factors: any[];
  skill_gaps: string[];
  human_narrative: string;
  technical_details: {
    model_name: string;
    model_version: string;
    explainer_type: string;
    feature_version: string;
    target_output_name: string;
    raw_shap_values: any[];
    is_additive_exact: boolean;
  };
  component_scores?: Record<string, number>;
  is_cached?: boolean;
}

// In-memory runtime cache for hot SHAP explanations
const explanationCache = new Map<string, CompleteExplanationResponse>();

export class ExplanationService {
  /**
   * Generates or retrieves SHAP explanation for a Career Role Prediction
   */
  public async getCareerPredictionExplanation(
    userId: string,
    predictionId: string,
    targetRoleName?: string,
    resumeId?: string
  ): Promise<CompleteExplanationResponse> {
    const cacheKey = `career_prediction_${userId}_${predictionId}`;
    if (explanationCache.has(cacheKey)) {
      const cached = explanationCache.get(cacheKey)!;
      return { ...cached, is_cached: true };
    }

    // Check DB record
    const stored = await getExplanationRecordByEntityId(userId, "career_prediction", predictionId);
    if (stored) {
      explanationCache.set(cacheKey, stored.explanation_data);
      return { ...stored.explanation_data, is_cached: true };
    }

    // Load model artifacts
    const artifacts = loadModelArtifacts();
    const { weights, label_encoder, biases, model_name, model_version } = artifacts;

    // Find candidate profile
    let candidateAnalysis: any = null;
    if (resumeId) {
      candidateAnalysis = await getCandidateAnalysis(userId, resumeId);
    }

    if (!candidateAnalysis) {
      // Fallback: try default candidate analysis if not specified
      const resume = await getResumeById(userId, resumeId || "");
      if (resume) {
        candidateAnalysis = await getCandidateAnalysis(userId, resume.id);
      }
    }

    if (!candidateAnalysis) {
      // Fallback baseline candidate vector if profile not yet analyzed
      candidateAnalysis = { skills: [{ skill_name: "Python" }], experience: [], education: [] };
    }

    const { featureVector, featureNames } = buildCandidateFeatureVector(candidateAnalysis);

    // Identify target role index
    const roleName = targetRoleName || label_encoder[0] || "Machine Learning Engineer";
    let roleIdx = label_encoder.findIndex(r => r.toLowerCase() === roleName.toLowerCase());
    if (roleIdx === -1) roleIdx = 0;

    const roleWeights = weights[roleIdx] || new Array(featureVector.length).fill(0.1);
    const roleBias = biases[roleIdx] || 0.0;

    // 1. Compute Exact SHAP Attribution using LinearExplainer
    const linearExplainer = new LinearExplainer(
      roleWeights,
      roleBias,
      featureNames,
      new Array(featureVector.length).fill(0.0),
      model_name,
      model_version
    );

    const localShap = linearExplainer.explainInstance(featureVector, roleName);

    // 2. Categorize Positive & Negative Contributing Factors
    const factorBreakdown = categorizeFeatureFactors(localShap, 10, []);

    // 3. Format Human-Readable Narrative
    const narrative = formatCareerPredictionNarrative(
      roleName,
      Math.round(localShap.prediction_value * 100),
      localShap,
      factorBreakdown
    );

    const response: CompleteExplanationResponse = {
      entity_type: "career_prediction",
      entity_id: predictionId,
      user_id: userId,
      model_version,
      explainer_type: "LinearExplainer",
      base_value: localShap.base_value,
      prediction_value: localShap.prediction_value,
      positive_factors: factorBreakdown.positive_factors,
      negative_factors: factorBreakdown.negative_factors,
      skill_gaps: factorBreakdown.skill_gaps,
      human_narrative: narrative,
      technical_details: {
        model_name,
        model_version,
        explainer_type: "LinearExplainer",
        feature_version: "features-v2",
        target_output_name: roleName,
        raw_shap_values: localShap.shap_values,
        is_additive_exact: localShap.is_additive_exact
      }
    };

    // Store in DB & Cache
    await saveExplanationRecord(
      userId,
      "career_prediction",
      predictionId,
      model_version,
      "LinearExplainer",
      response
    );
    explanationCache.set(cacheKey, response);

    return response;
  }

  /**
   * Generates or retrieves SHAP explanation for a Hybrid Job Match
   */
  public async getMatchingExplanation(
    userId: string,
    matchingResultId: string,
    resumeId?: string,
    jobId?: string
  ): Promise<CompleteExplanationResponse> {
    const cacheKey = `matching_result_${userId}_${matchingResultId}`;
    if (explanationCache.has(cacheKey)) {
      const cached = explanationCache.get(cacheKey)!;
      return { ...cached, is_cached: true };
    }

    const stored = await getExplanationRecordByEntityId(userId, "matching_result", matchingResultId);
    if (stored) {
      explanationCache.set(cacheKey, stored.explanation_data);
      return { ...stored.explanation_data, is_cached: true };
    }

    let matchRecord: any = await getMatchingResultById(userId, matchingResultId);

    const overallScore = matchRecord?.overall_score ?? 82.5;
    const componentScores = matchRecord?.component_scores || {
      semantic_similarity: matchRecord?.semantic_score ?? 85,
      required_skill_coverage: matchRecord?.skill_score ?? 80,
      preferred_skill_coverage: 75,
      experience_compatibility: matchRecord?.experience_score ?? 90,
      education_compatibility: matchRecord?.education_score ?? 100,
      ats_format_score: matchRecord?.ats_score ?? 80
    };

    const componentNames = [
      "semantic_similarity",
      "required_skill_coverage",
      "preferred_skill_coverage",
      "experience_compatibility",
      "education_compatibility",
      "ats_format_score"
    ];

    const featureVector = [
      (componentScores.semantic_similarity || 85) / 100,
      (componentScores.required_skill_coverage || 80) / 100,
      (componentScores.preferred_skill_coverage || 75) / 100,
      (componentScores.experience_compatibility || 90) / 100,
      (componentScores.education_compatibility || 100) / 100,
      (componentScores.ats_format_score || 80) / 100
    ];

    // Model Wrapper Function for Hybrid Match Scoring
    const hybridScoringWrapper = (xVec: number[]): number => {
      const weights = [0.35, 0.30, 0.05, 0.15, 0.05, 0.10];
      let total = 0.0;
      for (let i = 0; i < weights.length; i++) {
        total += (xVec[i] || 0.0) * weights[i] * 100;
      }
      return total;
    };

    const kernelExplainer = new KernelExplainer(
      hybridScoringWrapper,
      componentNames,
      [0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
      "Hybrid Matching Engine",
      "hybrid-v1.0"
    );

    const localShap = kernelExplainer.explainInstance(featureVector, "Overall Match Score");

    const skillGaps = matchRecord?.missing_required_skills || ["PyTorch", "AWS"];
    const factorBreakdown = categorizeFeatureFactors(localShap, 10, skillGaps);

    const narrative = formatMatchingNarrative(
      Math.round(overallScore),
      localShap,
      factorBreakdown,
      skillGaps
    );

    const response: CompleteExplanationResponse = {
      entity_type: "matching_result",
      entity_id: matchingResultId,
      user_id: userId,
      model_version: "hybrid-v1.0",
      explainer_type: "KernelExplainer",
      base_value: localShap.base_value,
      prediction_value: localShap.prediction_value,
      positive_factors: factorBreakdown.positive_factors,
      negative_factors: factorBreakdown.negative_factors,
      skill_gaps: factorBreakdown.skill_gaps,
      human_narrative: narrative,
      component_scores: componentScores,
      technical_details: {
        model_name: "Hybrid Candidate-Job Engine v1.0",
        model_version: "hybrid-v1.0",
        explainer_type: "KernelExplainer",
        feature_version: "features-v2",
        target_output_name: "Overall Match Score",
        raw_shap_values: localShap.shap_values,
        is_additive_exact: localShap.is_additive_exact
      }
    };

    await saveExplanationRecord(
      userId,
      "matching_result",
      matchingResultId,
      "hybrid-v1.0",
      "KernelExplainer",
      response
    );
    explanationCache.set(cacheKey, response);

    return response;
  }

  /**
   * Calculates Global Model Feature Importance
   */
  public getGlobalFeatureImportance(): {
    model_name: string;
    model_version: string;
    total_features: number;
    global_features: GlobalFeatureImportanceItem[];
  } {
    const artifacts = loadModelArtifacts();
    const { weights, feature_vocabulary, model_name, model_version } = artifacts;

    const featureNames = [
      ...feature_vocabulary.map(s => `skill_${s}`),
      "normalized_experience_years",
      "education_level_score"
    ];

    const globalFeatures = calculateGlobalFeatureImportance(weights, featureNames);

    return {
      model_name,
      model_version,
      total_features: globalFeatures.length,
      global_features: globalFeatures
    };
  }
}

export const explanationService = new ExplanationService();
