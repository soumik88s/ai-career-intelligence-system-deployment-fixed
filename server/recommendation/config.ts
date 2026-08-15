export const RECOMMENDATION_CANDIDATE_POOL_SIZE = parseInt(
  process.env.RECOMMENDATION_CANDIDATE_POOL_SIZE || "100",
  10
);

export const RECOMMENDATION_TOP_K = parseInt(
  process.env.RECOMMENDATION_TOP_K || "10",
  10
);

export const RECOMMENDATION_ALGORITHM_VERSION = "rec-hybrid-v1.0";
