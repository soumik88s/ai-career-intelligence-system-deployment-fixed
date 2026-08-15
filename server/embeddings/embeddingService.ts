import { encodeText } from "./encoder.js";
import { cosineSimilarity, mapSimilarityToScore } from "./similarity.js";
import { tfidfMatcher } from "./tfidf.js";
import {
  buildCandidateRepresentations,
  buildJobRepresentations
} from "./representation.js";
import { EMBEDDING_CONFIG } from "./config.js";

export interface ComponentMatchScore {
  similarity: number;
  score: number;
}

export interface MatchingResultOutput {
  resume_id: string;
  job_id: string;
  model_name: string;
  model_version: string;
  candidate_hash: string;
  job_hash: string;
  semantic_similarity: number;
  semantic_score: number;
  tfidf_similarity: number;
  tfidf_score: number;
  component_scores: {
    skills: ComponentMatchScore;
    experience: ComponentMatchScore;
    education: ComponentMatchScore;
  };
  explanation: string;
  created_at: string;
}

/**
 * Main Service for Semantic Resume-Job Matching
 */
export class SemanticMatchingEngine {
  /**
   * Compares a Candidate Profile and Job Profile using Sentence-BERT and TF-IDF baseline.
   */
  public async computeMatch(
    resumeId: string,
    candidateAnalysis: any,
    jobRecord: any,
    jobAnalysis?: any
  ): Promise<MatchingResultOutput> {
    // 1. Build structured representations
    const candRep = buildCandidateRepresentations(candidateAnalysis);
    const jobRep = buildJobRepresentations(jobRecord, jobAnalysis);

    // 2. Generate Sentence-BERT Embeddings
    // Overall Embeddings
    const candOverallVec = await encodeText(candRep.overallText);
    const jobOverallVec = await encodeText(jobRep.overallText);

    // Component Embeddings
    const candSkillsVec = await encodeText(candRep.skillsText);
    const jobSkillsVec = await encodeText(jobRep.skillsText);

    const candExpVec = await encodeText(candRep.experienceText);
    const jobExpVec = await encodeText(jobRep.experienceText);

    const candEduVec = await encodeText(candRep.educationText);
    const jobEduVec = await encodeText(jobRep.educationText);

    // 3. Compute Sentence-BERT Cosine Similarities
    const overallSim = cosineSimilarity(candOverallVec, jobOverallVec);
    const overallScore = mapSimilarityToScore(overallSim);

    const skillsSim = cosineSimilarity(candSkillsVec, jobSkillsVec);
    const skillsScore = mapSimilarityToScore(skillsSim);

    const expSim = cosineSimilarity(candExpVec, jobExpVec);
    const expScore = mapSimilarityToScore(expSim);

    const eduSim = cosineSimilarity(candEduVec, jobEduVec);
    const eduScore = mapSimilarityToScore(eduSim);

    // 4. Compute TF-IDF Baseline Similarity for Research Comparison
    const tfidfResult = tfidfMatcher.computeSimilarity(candRep.overallText, jobRep.overallText);

    // 5. Build Explanation
    const explanation = `Semantic similarity of ${(overallSim * 100).toFixed(1)}% is computed using contextual vector embeddings (${EMBEDDING_CONFIG.MODEL_NAME}) comparing key candidate skills, experience, and education against the job post requirements. Baseline TF-IDF term overlap scored ${(tfidfResult.similarity * 100).toFixed(1)}%. Note: This is an ML contextual match score, not a hiring decision.`;

    return {
      resume_id: resumeId,
      job_id: jobRecord.id,
      model_name: EMBEDDING_CONFIG.MODEL_NAME,
      model_version: EMBEDDING_CONFIG.MODEL_VERSION,
      candidate_hash: candRep.contentHash,
      job_hash: jobRep.contentHash,
      semantic_similarity: parseFloat(overallSim.toFixed(4)),
      semantic_score: overallScore,
      tfidf_similarity: tfidfResult.similarity,
      tfidf_score: tfidfResult.score,
      component_scores: {
        skills: { similarity: parseFloat(skillsSim.toFixed(4)), score: skillsScore },
        experience: { similarity: parseFloat(expSim.toFixed(4)), score: expScore },
        education: { similarity: parseFloat(eduSim.toFixed(4)), score: eduScore }
      },
      explanation,
      created_at: new Date().toISOString()
    };
  }
}

export const matchingEngine = new SemanticMatchingEngine();
