/**
 * Feature Explainer & Factor Categorization
 *
 * Provides:
 * 1. Factor Categorization (positive vs negative SHAP contributions)
 * 2. Distinction between SHAP contributions and missing skill gaps
 * 3. Global Model Feature Importance aggregation
 */

import { LocalShapExplanation, FeatureContribution, formatHumanFeatureName } from "./shapExplainer.js";

export interface CategorizedFactor {
  feature_name: string;
  human_name: string;
  feature_value: number;
  shap_value: number;
  impact_level: "HIGH" | "MEDIUM" | "LOW";
  explanation_note: string;
}

export interface ExplainerFactorBreakdown {
  positive_factors: CategorizedFactor[];
  negative_factors: CategorizedFactor[];
  neutral_factors: CategorizedFactor[];
  skill_gaps: string[]; // Explicitly separated from SHAP contributions
}

export interface GlobalFeatureImportanceItem {
  feature_name: string;
  human_name: string;
  importance_score: number;
  rank: number;
}

export function categorizeFeatureFactors(
  explanation: LocalShapExplanation,
  topLimit: number = 10,
  skillGapsList: string[] = []
): ExplainerFactorBreakdown {
  const sortedByAbs = [...explanation.shap_values].sort(
    (a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value)
  );

  const positive: CategorizedFactor[] = [];
  const negative: CategorizedFactor[] = [];
  const neutral: CategorizedFactor[] = [];

  for (const item of sortedByAbs) {
    const absVal = Math.abs(item.shap_value);
    const impactLevel: "HIGH" | "MEDIUM" | "LOW" =
      absVal >= 0.15 ? "HIGH" : absVal >= 0.05 ? "MEDIUM" : "LOW";

    let note = "";
    if (item.shap_value > 0) {
      note = `Presence of ${item.human_name} increased the prediction logit by +${item.shap_value.toFixed(2)}.`;
    } else if (item.shap_value < 0) {
      note = `${item.human_name} reduced the model prediction confidence by ${item.shap_value.toFixed(2)}.`;
    } else {
      note = `${item.human_name} had a neutral baseline effect on the model.`;
    }

    const catFactor: CategorizedFactor = {
      feature_name: item.feature_name,
      human_name: item.human_name,
      feature_value: item.feature_value,
      shap_value: item.shap_value,
      impact_level: impactLevel,
      explanation_note: note
    };

    if (item.shap_value > 0.001) {
      positive.push(catFactor);
    } else if (item.shap_value < -0.001) {
      negative.push(catFactor);
    } else {
      neutral.push(catFactor);
    }
  }

  return {
    positive_factors: positive.slice(0, topLimit),
    negative_factors: negative.slice(0, topLimit),
    neutral_factors: neutral.slice(0, topLimit),
    skill_gaps: skillGapsList // Distinct list from model SHAP values
  };
}

/**
 * Calculates global model-level feature importances from model weight matrix
 */
export function calculateGlobalFeatureImportance(
  weights: number[][],
  featureNames: string[]
): GlobalFeatureImportanceItem[] {
  if (!weights || weights.length === 0) return [];

  const numFeatures = featureNames.length;
  const numRoles = weights.length;
  const importanceScores = new Array(numFeatures).fill(0.0);

  // Compute mean absolute weight across all role classes
  for (let fIdx = 0; fIdx < numFeatures; fIdx++) {
    let sumAbs = 0.0;
    for (let rIdx = 0; rIdx < numRoles; rIdx++) {
      sumAbs += Math.abs(weights[rIdx][fIdx] || 0.0);
    }
    importanceScores[fIdx] = Number((sumAbs / numRoles).toFixed(4));
  }

  const items: GlobalFeatureImportanceItem[] = featureNames.map((fName, idx) => ({
    feature_name: fName,
    human_name: formatHumanFeatureName(fName),
    importance_score: importanceScores[idx],
    rank: 0
  }));

  items.sort((a, b) => b.importance_score - a.importance_score);
  items.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return items;
}
