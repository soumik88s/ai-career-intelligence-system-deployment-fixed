export interface ExperienceMatchResult {
  experienceScore: number; // 0 - 100
  candidateYears: number;
  requiredMinYears: number | null;
  requiredMaxYears: number | null;
  status: "MEETS_REQUIREMENT" | "EXCEEDS_REQUIREMENT" | "BELOW_REQUIREMENT" | "NOT_SPECIFIED";
  explanation: string;
}

/**
 * Monotonic and explainable candidate vs job experience scoring function
 */
export function calculateExperienceMatch(
  candidateYears: number | undefined | null,
  minYearsReq: number | undefined | null,
  maxYearsReq: number | undefined | null
): ExperienceMatchResult {
  const years = Math.max(0, Number(candidateYears || 0));
  const minYears = minYearsReq !== null && minYearsReq !== undefined && !isNaN(Number(minYearsReq))
    ? Math.max(0, Number(minYearsReq))
    : null;
  const maxYears = maxYearsReq !== null && maxYearsReq !== undefined && !isNaN(Number(maxYearsReq))
    ? Math.max(0, Number(maxYearsReq))
    : null;

  // Case 1: Job specifies no experience requirement
  if ((minYears === null || minYears === 0) && (maxYears === null || maxYears === 0)) {
    return {
      experienceScore: 100,
      candidateYears: years,
      requiredMinYears: null,
      requiredMaxYears: null,
      status: "NOT_SPECIFIED",
      explanation: `Candidate has ${years} ${years === 1 ? "year" : "years"} of experience. Job position has no strict minimum experience requirement.`,
    };
  }

  const effectiveMin = minYears || 0;

  // Case 2: Candidate meets or exceeds minimum required experience
  if (years >= effectiveMin) {
    if (maxYears && years > maxYears + 5) {
      // Significantly overqualified (e.g., 15 yrs vs 2-5 yrs) - soft cap at 95%
      return {
        experienceScore: 95,
        candidateYears: years,
        requiredMinYears: minYears,
        requiredMaxYears: maxYears,
        status: "EXCEEDS_REQUIREMENT",
        explanation: `Candidate has ${years} years of experience, exceeding the required range (${effectiveMin}-${maxYears} years).`,
      };
    }

    return {
      experienceScore: 100,
      candidateYears: years,
      requiredMinYears: minYears,
      requiredMaxYears: maxYears,
      status: "MEETS_REQUIREMENT",
      explanation: `Candidate experience (${years} ${years === 1 ? "year" : "years"}) satisfies job requirement (minimum ${effectiveMin} ${effectiveMin === 1 ? "year" : "years"}).`,
    };
  }

  // Case 3: Candidate below minimum required experience
  // Ratio-based linear scaling with 20% base floor for entry attempts
  const ratio = years / Math.max(1, effectiveMin);
  const score = Math.max(20, Math.min(95, Math.round(ratio * 100)));

  return {
    experienceScore: score,
    candidateYears: years,
    requiredMinYears: minYears,
    requiredMaxYears: maxYears,
    status: "BELOW_REQUIREMENT",
    explanation: `Candidate has ${years} ${years === 1 ? "year" : "years"} of experience, which is below the target minimum of ${effectiveMin} years (${score}% match ratio).`,
  };
}
