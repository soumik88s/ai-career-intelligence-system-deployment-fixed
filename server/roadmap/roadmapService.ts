import {
  getResumeById,
  getCandidateAnalysis,
  getJobsList,
  saveRoadmapRecord,
  getRoadmapRecordById,
  getUserRoadmapsRecord,
  updateMilestoneProgressRecord
} from "../db.js";
import { generatePersonalizedRoadmap, CareerRoadmapData } from "./generator.js";
import { evaluateRoadmapConsistency, RoadmapEvaluationReport } from "./evaluator.js";

export class RoadmapService {
  async generateRoadmap(
    userId: string,
    resumeId: string,
    targetRole: string,
    durationMonths: number = 6
  ): Promise<{ roadmap: CareerRoadmapData; evaluation: RoadmapEvaluationReport }> {
    // 1. Verify Resume Ownership & Existence
    const resume = await getResumeById(userId, resumeId);
    if (!resume) {
      throw new Error("Resume record not found");
    }

    // 2. Retrieve Candidate Profile
    const candidateProfile = await getCandidateAnalysis(userId, resumeId);
    if (!candidateProfile || candidateProfile.processing_status !== "completed") {
      throw new Error("Resume NLP analysis is incomplete. Please analyze your resume before generating a career roadmap.");
    }

    // 3. Retrieve Stored Job Dataset for Market Signals Calculation
    const jobsListResponse = await getJobsList({ page: 1, page_size: 200 });
    const jobsList = jobsListResponse.jobs || [];

    // 4. Synthesize Personalized Roadmap
    const roadmap = generatePersonalizedRoadmap({
      userId,
      resumeId,
      candidateProfile,
      targetRole,
      durationMonths,
      jobsList
    });

    // 5. Evaluate Logical Consistency
    const evaluation = evaluateRoadmapConsistency(roadmap, candidateProfile);

    // 6. Save to Database
    await saveRoadmapRecord(userId, resumeId, targetRole, durationMonths, roadmap);

    return { roadmap, evaluation };
  }

  async getRoadmapById(userId: string, roadmapId: string): Promise<CareerRoadmapData> {
    const roadmap = await getRoadmapRecordById(userId, roadmapId);
    if (!roadmap) {
      throw new Error("Roadmap not found or access denied.");
    }
    return roadmap;
  }

  async getUserRoadmaps(userId: string, resumeId?: string): Promise<CareerRoadmapData[]> {
    return await getUserRoadmapsRecord(userId, resumeId);
  }

  async updateMilestone(
    userId: string,
    milestoneId: string,
    status: "not_started" | "in_progress" | "completed",
    progressPercentage: number,
    notes: string = ""
  ) {
    if (progressPercentage < 0 || progressPercentage > 100) {
      throw new Error("Invalid progress percentage. Must be between 0 and 100.");
    }

    return await updateMilestoneProgressRecord(
      userId,
      milestoneId,
      status,
      progressPercentage,
      notes
    );
  }
}

export const roadmapService = new RoadmapService();
