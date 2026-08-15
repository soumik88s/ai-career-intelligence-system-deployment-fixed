import { tfidfMatcher } from "../embeddings/tfidf.js";
import { RECOMMENDATION_CANDIDATE_POOL_SIZE } from "./config.js";

export function retrieveCandidatePool(
  candidateProfile: any,
  allJobs: any[],
  poolSize: number = RECOMMENDATION_CANDIDATE_POOL_SIZE
): any[] {
  if (!allJobs || allJobs.length === 0) return [];
  if (allJobs.length <= poolSize) return allJobs;

  // Extract candidate tokens
  const candidateSkills = (candidateProfile.skills || []).map((s: any) =>
    typeof s === "string" ? s : s.skill_name || s.normalized_name || ""
  );
  const summaryText = candidateProfile.summary || "";
  const candidateCorpus = `${candidateSkills.join(" ")} ${summaryText}`.trim();

  if (!candidateCorpus) return allJobs.slice(0, poolSize);

  // Compute fast TF-IDF similarity for each job
  const scoredJobs = allJobs.map((job) => {
    const jobText = `${job.title} ${job.company} ${job.description} ${(job.required_skills || []).join(" ")}`.trim();
    const sim = tfidfMatcher.computeSimilarity(candidateCorpus, jobText);
    return {
      job,
      coarseScore: typeof sim === "number" ? sim : (sim?.score ?? 0),
    };
  });

  // Sort by coarseScore descending and take top poolSize
  scoredJobs.sort((a, b) => b.coarseScore - a.coarseScore);
  return scoredJobs.slice(0, poolSize).map((sj) => sj.job);
}
