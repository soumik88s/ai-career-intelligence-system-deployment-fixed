// Phase 7 Hybrid Matching Configuration & Weights
export const HYBRID_MATCH_CONFIG = {
  // Algorithm Versioning
  ALGORITHM_VERSION: "hybrid-v1.0",

  // Default Component Weights (Must sum to 1.0)
  WEIGHTS: {
    SEMANTIC: parseFloat(process.env.MATCH_WEIGHT_SEMANTIC || "0.35"),
    SKILL: parseFloat(process.env.MATCH_WEIGHT_SKILL || "0.30"),
    EXPERIENCE: parseFloat(process.env.MATCH_WEIGHT_EXPERIENCE || "0.15"),
    EDUCATION: parseFloat(process.env.MATCH_WEIGHT_EDUCATION || "0.10"),
    ATS: parseFloat(process.env.MATCH_WEIGHT_ATS || "0.10"),
  },

  // Skill Scorer Weights
  SKILL_WEIGHTS: {
    REQUIRED: parseFloat(process.env.SKILL_WEIGHT_REQUIRED || "0.80"),
    PREFERRED: parseFloat(process.env.SKILL_WEIGHT_PREFERRED || "0.20"),
    RELATED_MATCH_CREDIT: 0.50, // Partial credit (50%) for related technology
  },

  // ATS Scorer Weights
  ATS_WEIGHTS: {
    SKILL_COVERAGE: 0.40,
    TERMINOLOGY_COVERAGE: 0.35,
    SECTION_COMPLETENESS: 0.25,
  }
};

/**
 * Validates and normalizes weights to ensure they strictly sum to 1.0
 */
export function getNormalizedWeights() {
  const w = HYBRID_MATCH_CONFIG.WEIGHTS;
  const sum = w.SEMANTIC + w.SKILL + w.EXPERIENCE + w.EDUCATION + w.ATS;

  if (sum <= 0) {
    return { SEMANTIC: 0.35, SKILL: 0.30, EXPERIENCE: 0.15, EDUCATION: 0.10, ATS: 0.10 };
  }

  return {
    SEMANTIC: w.SEMANTIC / sum,
    SKILL: w.SKILL / sum,
    EXPERIENCE: w.EXPERIENCE / sum,
    EDUCATION: w.EDUCATION / sum,
    ATS: w.ATS / sum,
  };
}
