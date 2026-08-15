export interface RankedRecommendationItem {
  job_id: string;
  rank: number;
  overall_score: number;
  semantic_score: number;
  skill_score: number;
  experience_score: number;
  education_score: number;
  ats_score: number;
  preference_score: number;
  final_rank_score: number;
  matched_skills: string[];
  missing_skills: string[];
  recommendation_reason: string;
  job: any;
}

export function rankAndDiversifyJobs(
  scoredItems: {
    job: any;
    matchResult: any;
    preferenceScore: number;
    reason: string;
  }[],
  sortBy: "best_match" | "most_recent" | "highest_skill" | "highest_semantic" = "best_match",
  maxPerCompany: number = 3
): RankedRecommendationItem[] {
  if (!scoredItems || scoredItems.length === 0) return [];

  // 1. Calculate final_rank_score
  let items = scoredItems.map((item) => {
    const res = item.matchResult;
    const finalRankScore = Math.min(100, Math.round((res.overall_score || 0) + item.preferenceScore));
    return {
      job_id: item.job.id,
      rank: 0,
      overall_score: res.overall_score || 0,
      semantic_score: res.semantic_score || 0,
      skill_score: res.skill_score || 0,
      experience_score: res.experience_score || 0,
      education_score: res.education_score || 0,
      ats_score: res.ats_score || 0,
      preference_score: item.preferenceScore,
      final_rank_score: finalRankScore,
      matched_skills: res.matched_required_skills || [],
      missing_skills: res.missing_required_skills || [],
      recommendation_reason: item.reason,
      job: item.job,
    };
  });

  // 2. Primary Sort based on requested criteria
  items.sort((a, b) => {
    if (sortBy === "most_recent") {
      const timeA = new Date(a.job.posted_at || a.job.created_at || 0).getTime();
      const timeB = new Date(b.job.posted_at || b.job.created_at || 0).getTime();
      return timeB - timeA;
    }
    if (sortBy === "highest_skill") {
      return b.skill_score - a.skill_score || b.final_rank_score - a.final_rank_score;
    }
    if (sortBy === "highest_semantic") {
      return b.semantic_score - a.semantic_score || b.final_rank_score - a.final_rank_score;
    }
    // Default: best_match
    return b.final_rank_score - a.final_rank_score;
  });

  // 3. Apply Diversity Mechanism (Limit company dominance)
  const companyCounts = new Map<string, number>();
  const diversified: typeof items = [];
  const deferred: typeof items = [];

  for (const item of items) {
    const company = (item.job.company || "Unknown").toLowerCase().trim();
    const count = companyCounts.get(company) || 0;
    if (count < maxPerCompany) {
      companyCounts.set(company, count + 1);
      diversified.push(item);
    } else {
      deferred.push(item);
    }
  }

  // Combine diversified top list with remaining deferred items
  const finalOrdered = [...diversified, ...deferred];

  // Assign sequential 1-based ranks
  finalOrdered.forEach((item, index) => {
    item.rank = index + 1;
  });

  return finalOrdered;
}
