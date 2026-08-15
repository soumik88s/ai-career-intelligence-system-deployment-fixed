import {
  getResumeById,
  getCandidateAnalysis,
  getUserProfile,
  getJobsList,
  getJobById,
  saveRecommendations,
  getStoredRecommendations,
} from "../db.js";
import { hybridMatchingEngine } from "../matching/hybridEngine.js";
import {
  RECOMMENDATION_ALGORITHM_VERSION,
  RECOMMENDATION_CANDIDATE_POOL_SIZE,
  RECOMMENDATION_TOP_K,
} from "./config.js";
import { applyHardFilters, calculateSoftPreferences, RecommendationFilters } from "./candidateFilter.js";
import { retrieveCandidatePool } from "./candidateRetrieval.js";
import { rankAndDiversifyJobs } from "./ranking.js";
import { generateRecommendationExplanation } from "./explanation.js";

export interface GetRecommendationsParams {
  userId: string;
  resumeId: string;
  page?: number;
  pageSize?: number;
  filters?: RecommendationFilters;
  sortBy?: "best_match" | "most_recent" | "highest_skill" | "highest_semantic";
  forceRefresh?: boolean;
}

export interface RecommendationResponse {
  cold_start: boolean;
  reason?: string;
  message?: string;
  recommendations?: any[];
  total?: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
  generated_at?: string;
  resume_id?: string;
  algorithm_version?: string;
}

export class RecommendationService {
  /**
   * Generates or retrieves personalized job recommendations for a user's analyzed resume.
   */
  public async getRecommendations(params: GetRecommendationsParams): Promise<RecommendationResponse> {
    const { userId, resumeId, page = 1, pageSize = 10, filters = {}, sortBy = "best_match", forceRefresh = false } = params;

    // 1. Verify Resume Ownership & Existence
    const resume = await getResumeById(userId, resumeId);
    if (!resume) {
      return {
        cold_start: true,
        reason: "NO_RESUME",
        message: "No resume found matching the specified ID for this user.",
      };
    }

    // 2. Retrieve Candidate NLP Analysis Profile
    const candidateAnalysis = await getCandidateAnalysis(userId, resumeId);
    if (!candidateAnalysis || candidateAnalysis.processing_status !== "completed") {
      return {
        cold_start: true,
        reason: "NOT_ANALYZED",
        message: "Your resume has not been analyzed yet. Please analyze your resume to receive personalized job recommendations.",
      };
    }

    const candidateSkills = candidateAnalysis.skills || [];
    if (candidateSkills.length === 0 && !candidateAnalysis.summary) {
      return {
        cold_start: true,
        reason: "NO_SKILLS",
        message: "No technical skills or summary extracted from your resume. Re-analyze your resume or update profile skills.",
      };
    }

    // 3. Fetch User Profile for Preference Preferences
    const userProfile = await getUserProfile(userId);

    // 4. Check Stored Recommendation Cache (unless forceRefresh is true)
    if (!forceRefresh) {
      const cached = await getStoredRecommendations(userId, resumeId, RECOMMENDATION_ALGORITHM_VERSION);
      if (cached && cached.length > 0) {
        // Apply dynamic runtime filters on cached results
        let filteredCached = cached;

        if (filters.location && filters.location !== "All") {
          const locQ = filters.location.toLowerCase().trim();
          filteredCached = filteredCached.filter((r) =>
            (r.job_location || "").toLowerCase().includes(locQ) ||
            (locQ === "remote" && (r.job_work_mode || "").toLowerCase().includes("remote"))
          );
        }

        if (filters.work_mode && filters.work_mode !== "All") {
          const wm = filters.work_mode.toLowerCase().trim();
          filteredCached = filteredCached.filter((r) =>
            (r.job_work_mode || "hybrid").toLowerCase().includes(wm)
          );
        }

        if (filters.employment_type && filters.employment_type !== "All") {
          const et = filters.employment_type.toLowerCase().trim();
          filteredCached = filteredCached.filter((r) =>
            (r.job_employment_type || "full-time").toLowerCase().includes(et)
          );
        }

        if (filters.minimum_score !== undefined && filters.minimum_score > 0) {
          filteredCached = filteredCached.filter((r) => r.overall_score >= (filters.minimum_score || 0));
        }

        // Apply Sorting
        if (sortBy === "most_recent") {
          filteredCached.sort((a, b) => new Date(b.job_posted_at || b.generated_at).getTime() - new Date(a.job_posted_at || a.generated_at).getTime());
        } else if (sortBy === "highest_skill") {
          filteredCached.sort((a, b) => b.skill_score - a.skill_score);
        } else if (sortBy === "highest_semantic") {
          filteredCached.sort((a, b) => b.semantic_score - a.semantic_score);
        } else {
          filteredCached.sort((a, b) => a.rank - b.rank);
        }

        const total = filteredCached.length;
        const offset = (page - 1) * pageSize;
        const paginated = filteredCached.slice(offset, offset + pageSize);

        if (total > 0) {
          return {
            cold_start: false,
            recommendations: paginated,
            total,
            page,
            page_size: pageSize,
            total_pages: Math.ceil(total / pageSize) || 1,
            resume_id: resumeId,
            algorithm_version: RECOMMENDATION_ALGORITHM_VERSION,
          };
        }
      }
    }

    // 5. Execute Recommendation Pipeline
    // Fetch all available jobs in system
    const jobsRes = await getJobsList({ page: 1, page_size: 500 });
    const rawJobsList = jobsRes.jobs || [];

    if (rawJobsList.length === 0) {
      return {
        cold_start: true,
        reason: "NO_ACTIVE_JOBS",
        message: "No active job postings are currently available in the dataset.",
      };
    }

    // Step A: Hard Filters
    const { passedJobs } = applyHardFilters(rawJobsList, filters);
    if (passedJobs.length === 0) {
      return {
        cold_start: false,
        recommendations: [],
        total: 0,
        page,
        page_size: pageSize,
        total_pages: 1,
        message: "No jobs currently meet your selected filters.",
      };
    }

    // Step B: Candidate Retrieval Stage (Top 100-200 Pool)
    const candidatePool = retrieveCandidatePool(candidateAnalysis, passedJobs, RECOMMENDATION_CANDIDATE_POOL_SIZE);

    // Step C: Detailed Matching & Hybrid Match Computation
    const scoredItems: {
      job: any;
      matchResult: any;
      preferenceScore: number;
      reason: string;
    }[] = [];

    for (const job of candidatePool) {
      // Get full job details with skills & requirements
      const fullJob = await getJobById(job.id);
      if (!fullJob) continue;

      // Compute Phase 7 Multi-Factor Hybrid Match
      const matchResult = await hybridMatchingEngine.computeHybridMatch(
        resumeId,
        candidateAnalysis,
        resume.extracted_text || "",
        fullJob
      );

      // Filter out if below minimum_score filter
      if (filters.minimum_score !== undefined && matchResult.overall_score < filters.minimum_score) {
        continue;
      }

      // Compute Soft Preferences
      const prefScore = calculateSoftPreferences(fullJob, candidateAnalysis, userProfile);

      // Generate Deterministic Explanation
      const reason = generateRecommendationExplanation(matchResult, fullJob, candidateAnalysis);

      scoredItems.push({
        job: fullJob,
        matchResult,
        preferenceScore: prefScore,
        reason,
      });
    }

    if (scoredItems.length === 0) {
      return {
        cold_start: false,
        recommendations: [],
        total: 0,
        page,
        page_size: pageSize,
        total_pages: 1,
        message: "No job matches found meeting the minimum score threshold.",
      };
    }

    // Step D: Ranking & Diversity
    const rankedList = rankAndDiversifyJobs(scoredItems, sortBy);

    // Step E: Store in Database Cache
    await saveRecommendations(userId, resumeId, RECOMMENDATION_ALGORITHM_VERSION, rankedList);

    // Step F: Paginate and Return Result
    const total = rankedList.length;
    const offset = (page - 1) * pageSize;
    const paginated = rankedList.slice(offset, offset + pageSize);

    return {
      cold_start: false,
      recommendations: paginated,
      total,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(total / pageSize) || 1,
      generated_at: new Date().toISOString(),
      resume_id: resumeId,
      algorithm_version: RECOMMENDATION_ALGORITHM_VERSION,
    };
  }
}

export const recommendationService = new RecommendationService();
