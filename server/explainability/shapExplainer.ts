/**
 * SHAP (SHapley Additive exPlanations) Explainer Implementations
 *
 * Provides:
 * 1. LinearExplainer: Exact linear Shapley attribution for linear/logit models.
 * 2. KernelExplainer: Model-agnostic Kernel SHAP for non-linear models and function wrappers.
 */

export interface FeatureContribution {
  feature_index: number;
  feature_name: string;
  human_name: string;
  feature_value: number;
  shap_value: number;
}

export interface LocalShapExplanation {
  model_name: string;
  model_version: string;
  explainer_type: "LinearExplainer" | "KernelExplainer";
  feature_version: string;
  target_output_name: string;
  base_value: number; // E[f(x)] baseline score
  prediction_value: number; // f(x) prediction score
  shap_values: FeatureContribution[];
  is_additive_exact: boolean;
}

/**
 * LinearExplainer: Exact Shapley values for linear logit models f(x) = b + sum(w_j * x_j).
 *
 * For a background baseline vector x_bar (default all 0s or sample mean),
 * Shapley value phi_j = w_j * (x_j - x_bar_j).
 *
 * Additive Efficiency Property:
 * base_value + sum(phi_j) = f(x) holds exactly.
 */
export class LinearExplainer {
  private weights: number[]; // Feature weights for target class/logit
  private bias: number;
  private backgroundMean: number[]; // x_bar baseline vector
  private featureNames: string[];
  private modelName: string;
  private modelVersion: string;

  constructor(
    weights: number[],
    bias: number,
    featureNames: string[],
    backgroundMean?: number[],
    modelName: string = "Linear Classifier",
    modelVersion: string = "v1.0"
  ) {
    this.weights = weights;
    this.bias = bias;
    this.featureNames = featureNames;
    this.modelName = modelName;
    this.modelVersion = modelVersion;

    // Default background baseline is 0 vector if not provided
    this.backgroundMean = backgroundMean || new Array(weights.length).fill(0.0);
  }

  public explainInstance(
    featureVector: number[],
    targetOutputName: string = "Target Output"
  ): LocalShapExplanation {
    const numFeatures = Math.min(featureVector.length, this.weights.length);

    // Calculate baseline E[f(x)] = bias + sum(w_j * x_bar_j)
    let baseValue = this.bias;
    for (let i = 0; i < numFeatures; i++) {
      baseValue += this.weights[i] * (this.backgroundMean[i] || 0.0);
    }

    // Calculate SHAP value phi_j = w_j * (x_j - x_bar_j)
    const shapValues: FeatureContribution[] = [];
    let predictionValue = baseValue;

    for (let i = 0; i < numFeatures; i++) {
      const xVal = featureVector[i] || 0.0;
      const xBar = this.backgroundMean[i] || 0.0;
      const wVal = this.weights[i] || 0.0;

      const phi = wVal * (xVal - xBar);
      predictionValue += phi;

      const fName = this.featureNames[i] || `feature_${i}`;
      shapValues.push({
        feature_index: i,
        feature_name: fName,
        human_name: formatHumanFeatureName(fName),
        feature_value: Number(xVal.toFixed(4)),
        shap_value: Number(phi.toFixed(4))
      });
    }

    baseValue = Number(baseValue.toFixed(4));
    predictionValue = Number(predictionValue.toFixed(4));

    return {
      model_name: this.modelName,
      model_version: this.modelVersion,
      explainer_type: "LinearExplainer",
      feature_version: "features-v2",
      target_output_name: targetOutputName,
      base_value: baseValue,
      prediction_value: predictionValue,
      shap_values: shapValues,
      is_additive_exact: true
    };
  }
}

/**
 * KernelExplainer: Model-Agnostic Kernel SHAP for black-box or function wrappers f(x).
 */
export class KernelExplainer {
  private predictFn: (x: number[]) => number;
  private backgroundMean: number[];
  private featureNames: string[];
  private modelName: string;
  private modelVersion: string;

  constructor(
    predictFn: (x: number[]) => number,
    featureNames: string[],
    backgroundMean?: number[],
    modelName: string = "Hybrid Matching Engine",
    modelVersion: string = "hybrid-v1.0"
  ) {
    this.predictFn = predictFn;
    this.featureNames = featureNames;
    this.modelName = modelName;
    this.modelVersion = modelVersion;
    this.backgroundMean = backgroundMean || new Array(featureNames.length).fill(0.5);
  }

  public explainInstance(
    featureVector: number[],
    targetOutputName: string = "Overall Match Score"
  ): LocalShapExplanation {
    const M = this.featureNames.length;
    const baseValue = Number(this.predictFn(this.backgroundMean).toFixed(2));
    const predictionValue = Number(this.predictFn(featureVector).toFixed(2));

    // Exact Shapley value calculation across 2^M coalitions for small feature spaces (M <= 10)
    const shapValuesRaw = new Array(M).fill(0.0);
    const totalSubsets = 1 << M; // 2^M

    // Precalculate factorials for Shapley weighting w(|S|) = |S|!(M - |S| - 1)! / M!
    const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
    const MFact = fact(M);

    for (let mask = 0; mask < totalSubsets; mask++) {
      // Evaluate coalition without feature i vs with feature i
      for (let i = 0; i < M; i++) {
        if ((mask & (1 << i)) === 0) {
          // mask does not include feature i
          const SSize = countBits(mask);
          const weight = (fact(SSize) * fact(M - SSize - 1)) / MFact;

          // Vector S without i
          const vWithout = this.backgroundMean.slice();
          for (let k = 0; k < M; k++) {
            if (mask & (1 << k)) vWithout[k] = featureVector[k];
          }

          // Vector S with i
          const vWith = vWithout.slice();
          vWith[i] = featureVector[i];

          const valWithout = this.predictFn(vWithout);
          const valWith = this.predictFn(vWith);

          shapValuesRaw[i] += weight * (valWith - valWithout);
        }
      }
    }

    const shapContributions: FeatureContribution[] = this.featureNames.map((fName, idx) => ({
      feature_index: idx,
      feature_name: fName,
      human_name: formatHumanFeatureName(fName),
      feature_value: Number((featureVector[idx] || 0.0).toFixed(2)),
      shap_value: Number(shapValuesRaw[idx].toFixed(2))
    }));

    return {
      model_name: this.modelName,
      model_version: this.modelVersion,
      explainer_type: "KernelExplainer",
      feature_version: "features-v2",
      target_output_name: targetOutputName,
      base_value: baseValue,
      prediction_value: predictionValue,
      shap_values: shapContributions,
      is_additive_exact: true
    };
  }
}

function countBits(n: number): number {
  let count = 0;
  while (n > 0) {
    count += n & 1;
    n >>= 1;
  }
  return count;
}

export function formatHumanFeatureName(rawName: string): string {
  if (rawName.startsWith("skill_")) {
    return rawName.replace("skill_", "").trim();
  }
  if (rawName === "normalized_experience_years") {
    return "Years of Relevant Experience";
  }
  if (rawName === "education_level_score") {
    return "Education Degree Level";
  }
  if (rawName === "semantic_similarity") {
    return "Semantic Profile Match";
  }
  if (rawName === "required_skill_coverage") {
    return "Required Skills Alignment";
  }
  if (rawName === "preferred_skill_coverage") {
    return "Preferred Skills Bonus";
  }
  if (rawName === "experience_compatibility") {
    return "Experience Level Fit";
  }
  if (rawName === "education_compatibility") {
    return "Educational Requirement Fit";
  }
  if (rawName === "ats_format_score") {
    return "ATS Document Formatting";
  }
  return rawName.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}
