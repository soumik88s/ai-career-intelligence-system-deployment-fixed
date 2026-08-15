import { cosineSimilarity, mapSimilarityToScore } from "../server/embeddings/similarity.js";
import { encodeText, encodeDocuments } from "../server/embeddings/encoder.js";
import { tfidfMatcher } from "../server/embeddings/tfidf.js";
import { EMBEDDING_CONFIG } from "../server/embeddings/config.js";
import {
  buildCandidateRepresentations,
  buildJobRepresentations
} from "../server/embeddings/representation.js";
import { matchingEngine } from "../server/embeddings/embeddingService.js";
import { saveMatchingResult, getCachedMatchingResult } from "../server/db.js";

async function runTests() {
  console.log("=== RUNNING PHASE 6 UNIT TESTS ===");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // Test 1: Cosine Similarity with Identical Vector
    const vecA = [0.5, 0.5, 0.5, 0.5];
    const simIdentical = cosineSimilarity(vecA, vecA);
    assert(Math.abs(simIdentical - 1.0) < 0.0001, "Test 1: Identical vector cosine similarity is 1.0");

    // Test 2: Cosine Similarity with Orthogonal Vector
    const vecB = [1, 0, 0, 0];
    const vecC = [0, 1, 0, 0];
    const simOrthogonal = cosineSimilarity(vecB, vecC);
    assert(Math.abs(simOrthogonal - 0.0) < 0.0001, "Test 2: Orthogonal vectors cosine similarity is 0.0");

    // Test 3: Empty Text Handling
    const emptyVec = await encodeText("");
    assert(emptyVec.length === EMBEDDING_CONFIG.VECTOR_DIMENSION, `Test 3: Empty text returns ${EMBEDDING_CONFIG.VECTOR_DIMENSION}-dim zero vector`);
    assert(emptyVec.every(v => v === 0), "Test 3b: Empty vector elements are all zero");

    // Test 4: Embedding Generation for Valid Text
    const sampleVec = await encodeText("Senior Python Developer with PyTorch and NLP experience");
    assert(sampleVec.length === EMBEDDING_CONFIG.VECTOR_DIMENSION, `Test 4: Encodes valid text to ${EMBEDDING_CONFIG.VECTOR_DIMENSION}-dim vector`);

    // Test 5: Identical vs Different Text Similarity
    const text1 = "Senior Python AI Engineer with PyTorch experience";
    const text2 = "Senior Python AI Engineer with PyTorch experience";
    const text3 = "Art history major and classical piano teacher";

    const vec1 = await encodeText(text1);
    const vec2 = await encodeText(text2);
    const vec3 = await encodeText(text3);

    const simHigh = cosineSimilarity(vec1, vec2);
    const simLow = cosineSimilarity(vec1, vec3);

    assert(simHigh > simLow, "Test 5: Identical/Highly relevant text has higher similarity than unrelated text");

    // Test 6: TF-IDF Baseline Matching
    const tfidfRes = tfidfMatcher.computeSimilarity(text1, text2);
    assert(tfidfRes.score === 100, "Test 6: TF-IDF score for identical text is 100");

    // Test 7: Representation Builder and Hash Calculation
    const candidateAnalysis = {
      summary: "Experienced ML Developer",
      skills: ["Python", "PyTorch", "NLP"],
      experience: [{ title: "ML Developer", company: "AI Co", description: "Built LLMs" }],
      education: [{ degree: "BS CS", field: "Computer Science", institution: "Tech Univ" }]
    };
    const candRep = buildCandidateRepresentations(candidateAnalysis);
    assert(candRep.contentHash.length === 64, "Test 7: SHA-256 hash length is 64 hex chars");

    const jobRecord = {
      id: "test_job_1",
      title: "AI Engineer",
      company: "AI Corp",
      description: "Build neural models",
      required_skills: ["Python", "PyTorch"]
    };
    const jobRep = buildJobRepresentations(jobRecord);
    assert(jobRep.contentHash.length === 64, "Test 7b: Job content hash generated correctly");

    // Test 8: End-to-End Semantic Engine Computation
    const matchOutput = await matchingEngine.computeMatch(
      "test_resume_123",
      candidateAnalysis,
      jobRecord
    );
    assert(matchOutput.semantic_score >= 0 && matchOutput.semantic_score <= 100, "Test 8: Semantic match score is bounded in [0, 100]");
    assert(matchOutput.model_name === EMBEDDING_CONFIG.MODEL_NAME, "Test 8b: Model name matches configuration");

    // Test 9: Database Storage and Caching
    const testMatchData = {
      user_id: "user_test_123",
      resume_id: "res_test_123",
      job_id: "job_test_123",
      model_name: EMBEDDING_CONFIG.MODEL_NAME,
      candidate_hash: candRep.contentHash,
      job_hash: jobRep.contentHash,
      semantic_similarity: 0.85,
      semantic_score: 85,
      tfidf_similarity: 0.70,
      tfidf_score: 70,
      component_scores: matchOutput.component_scores,
      explanation: "Unit test stored result"
    };

    await saveMatchingResult(testMatchData);

    const cached = await getCachedMatchingResult(
      "user_test_123",
      "res_test_123",
      "job_test_123",
      EMBEDDING_CONFIG.MODEL_NAME,
      candRep.contentHash,
      jobRep.contentHash
    );

    assert(cached !== null, "Test 9: Saved matching result retrieved successfully from cache");
    assert(cached.semantic_score === 85, "Test 9b: Cached result preserves match score");

    console.log(`\nTEST SUMMARY: ${passed} Passed, ${failed} Failed.`);
    if (failed > 0) process.exit(1);
  } catch (e: any) {
    console.error("Test execution failed with error:", e);
    process.exit(1);
  }
}

runTests();
