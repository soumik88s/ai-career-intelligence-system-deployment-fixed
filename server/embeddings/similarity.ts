import { EMBEDDING_CONFIG } from "./config.js";

/**
 * Calculates Cosine Similarity between two numeric vectors.
 * Formula: dot_product(A, B) / (norm(A) * norm(B))
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }
  if (vecA.length !== vecB.length) {
    console.warn(`Vector dimension mismatch: ${vecA.length} vs ${vecB.length}`);
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const valA = vecA[i];
    const valB = vecB[i];
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  const similarity = dotProduct / denominator;
  // Bound strictly between -1.0 and 1.0
  return Math.max(-1.0, Math.min(1.0, similarity));
}

/**
 * Mathematical Transformation from raw Cosine Similarity [-1.0 to 1.0] to a 0-100 Display Score.
 * 
 * Reason & Mathematical Justification:
 * Sentence-BERT embeddings (all-MiniLM-L6-v2) map natural language semantics into a unit hypersphere.
 * For natural English career documents (resumes and job postings), un-related text pairs score ~0.1 to 0.25,
 * moderately related pairs score ~0.5 to 0.7, and highly aligned pairs score > 0.8.
 * 
 * Display Score Formula:
 * score = Math.round(Math.min(100, Math.max(0, similarity * 100)))
 * 
 * Both raw cosine similarity (e.g. 0.832) and scaled display score (e.g. 83) are stored and returned.
 */
export function mapSimilarityToScore(similarity: number): number {
  if (isNaN(similarity) || similarity <= 0) return 0;
  
  // Percentage representation: similarity * 100 clamped to [0, 100]
  const rawScore = Math.round(similarity * 100);
  return Math.max(0, Math.min(100, rawScore));
}
