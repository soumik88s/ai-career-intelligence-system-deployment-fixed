/**
 * Explanation Narrative Formatter
 *
 * Converts numerical SHAP values and factor breakdowns into clear,
 * human-readable explanation narratives.
 */

import { LocalShapExplanation } from "./shapExplainer.js";
import { ExplainerFactorBreakdown } from "./featureExplainer.js";

export function formatCareerPredictionNarrative(
  roleName: string,
  predictionScore: number,
  explanation: LocalShapExplanation,
  factors: ExplainerFactorBreakdown
): string {
  const topPositives = factors.positive_factors.slice(0, 4).map(f => f.human_name);
  const topNegatives = factors.negative_factors.slice(0, 3).map(f => f.human_name);

  let summary = `The AI Model predicted **${roleName}** with **${predictionScore}% confidence** using ${explanation.explainer_type} SHAP attribution.`;

  if (topPositives.length > 0) {
    summary += ` The strongest positive signal drivers were **${topPositives.join(", ")}**, which significantly raised the model logit above the baseline score of ${explanation.base_value}.`;
  }

  if (topNegatives.length > 0) {
    summary += ` Conversely, lower evidence in **${topNegatives.join(", ")}** exerted negative pull on the model's confidence.`;
  }

  return summary;
}

export function formatMatchingNarrative(
  overallScore: number,
  explanation: LocalShapExplanation,
  factors: ExplainerFactorBreakdown,
  skillGaps: string[]
): string {
  const topPositives = factors.positive_factors.slice(0, 3).map(f => f.human_name);

  let summary = `The Hybrid Matching Engine generated an overall match score of **${overallScore}%**.`;

  if (topPositives.length > 0) {
    summary += ` Main contributing factors include **${topPositives.join(", ")}**.`;
  }

  if (skillGaps.length > 0) {
    summary += ` Key identified skill gaps for this job posting include **${skillGaps.slice(0, 4).join(", ")}**.`;
  }

  return summary;
}
