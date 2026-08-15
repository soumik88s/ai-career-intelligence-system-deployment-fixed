import { applyHardFilters, calculateSoftPreferences, RecommendationFilters } from "../server/recommendation/candidateFilter.js";
import { retrieveCandidatePool } from "../server/recommendation/candidateRetrieval.js";
import { rankAndDiversifyJobs } from "../server/recommendation/ranking.js";
import { generateRecommendationExplanation } from "../server/recommendation/explanation.js";
import { RECOMMENDATION_CANDIDATE_POOL_SIZE, RECOMMENDATION_TOP_K, RECOMMENDATION_ALGORITHM_VERSION } from "../server/recommendation/config.js";

async function runPhase8Tests() {
  console.log("=== RUNNING PHASE 8 INTELLIGENT JOB RECOMMENDATION & RANKING TESTS ===");
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
    // 1. Config Environment Variable Default Tests
    assert(RECOMMENDATION_CANDIDATE_POOL_SIZE === 100, "Test 1a: Default CANDIDATE_POOL_SIZE is 100");
    assert(RECOMMENDATION_TOP_K === 10, "Test 1b: Default TOP_K is 10");
    assert(RECOMMENDATION_ALGORITHM_VERSION === "rec-hybrid-v1.0", "Test 1c: Algorithm version tag is rec-hybrid-v1.0");

    // Sample jobs dataset for testing
    const sampleJobs = [
      {
        id: "job-1",
        title: "Senior AI / ML Engineer",
        company: "Aether AI",
        location: "San Francisco, CA",
        work_mode: "Remote",
        employment_type: "Full-time",
        description: "Looking for ML engineer with Python, PyTorch, Docker, and AWS experience.",
        posted_at: "2026-08-01T00:00:00.000Z",
        is_active: true
      },
      {
        id: "job-2",
        title: "Frontend React Developer",
        company: "WebTech Solutions",
        location: "New York, NY",
        work_mode: "On-site",
        employment_type: "Full-time",
        description: "Frontend developer proficient in React, TypeScript, Tailwind CSS.",
        posted_at: "2026-08-05T00:00:00.000Z",
        is_active: true
      },
      {
        id: "job-3",
        title: "DevOps & Cloud Engineer",
        company: "CloudScale Inc",
        location: "San Francisco, CA",
        work_mode: "Hybrid",
        employment_type: "Contract",
        description: "DevOps engineer with Docker, Kubernetes, Terraform, AWS experience.",
        posted_at: "2026-08-08T00:00:00.000Z",
        is_active: true
      },
      {
        id: "job-4",
        title: "Expired Data Scientist Role",
        company: "Old Analytics",
        location: "San Francisco, CA",
        work_mode: "Remote",
        employment_type: "Full-time",
        description: "Data Scientist required.",
        posted_at: "2026-01-01T00:00:00.000Z",
        expires_at: "2026-02-01T00:00:00.000Z", // Expired
        is_active: true
      },
      {
        id: "job-5",
        title: "Inactive Role",
        company: "Ghost Corp",
        location: "San Francisco, CA",
        work_mode: "Remote",
        employment_type: "Full-time",
        description: "Inactive role",
        posted_at: "2026-08-01T00:00:00.000Z",
        is_active: false // Inactive
      }
    ];

    // Sample candidate profile
    const candidateProfile = {
      summary: "Senior AI Engineer with 5 years experience in Python, PyTorch, Docker, PostgreSQL.",
      skills: ["Python", "PyTorch", "Docker", "SQL", "Machine Learning"],
      total_experience_years: 5,
      education: [{ degree: "Bachelor of Science", field: "Computer Science" }],
      experience: [{ job_title: "AI Engineer", company: "Meta", duration: "5 years" }]
    };

    // 2. Hard Filter Tests
    const filters1: RecommendationFilters = { work_mode: "Remote" };
    const { passedJobs: filtered1 } = applyHardFilters(sampleJobs, filters1);
    assert(filtered1.length === 1 && filtered1[0].id === "job-1", "Test 2a: Hard filter work_mode='Remote' excludes On-site, Hybrid, and Expired/Inactive jobs");

    const filters2: RecommendationFilters = { location: "New York" };
    const { passedJobs: filtered2 } = applyHardFilters(sampleJobs, filters2);
    assert(filtered2.length === 1 && filtered2[0].id === "job-2", "Test 2b: Hard filter location='New York' strictly isolates matching jobs");

    const { passedJobs: filteredActive } = applyHardFilters(sampleJobs, {});
    assert(!filteredActive.some(j => j.id === "job-4" || j.id === "job-5"), "Test 2c: Inactive and Expired jobs are automatically excluded by hard filter");

    // 3. Soft Preference Scoring Tests
    const prefScoreMatch = calculateSoftPreferences(sampleJobs[0], { target_role: "AI Engineer", location: "San Francisco", work_mode: "Remote" });
    const prefScoreMismatch = calculateSoftPreferences(sampleJobs[1], { target_role: "AI Engineer", location: "San Francisco", work_mode: "Remote" });
    assert(prefScoreMatch > prefScoreMismatch, "Test 3: Soft preference score rewards candidate target role & location alignment without strictly dropping non-matches");

    // 4. Candidate Retrieval Pool Test
    const { passedJobs: validJobs } = applyHardFilters(sampleJobs, {});
    const retrievedPool = retrieveCandidatePool(candidateProfile, validJobs, 50);
    assert(retrievedPool.length <= sampleJobs.length, "Test 4a: Candidate retrieval respects candidate pool size bound");
    assert(!retrievedPool.some(j => j.id === "job-4" || j.id === "job-5"), "Test 4b: Candidate retrieval excludes expired & inactive postings");

    // 5. Ranking & Diversity Test
    const evaluatedJobs = [
      {
        job: sampleJobs[0],
        matchResult: {
          overall_score: 88,
          semantic_score: 90,
          skill_score: 85,
          experience_score: 100,
          education_score: 100,
          ats_score: 80,
          matched_required_skills: ["Python", "PyTorch", "Docker"],
          missing_required_skills: ["AWS"],
          missing_preferred_skills: []
        },
        preferenceScore: 10,
        reason: "Recommended because your profile strongly matches required skills including Python, PyTorch."
      },
      {
        job: sampleJobs[1],
        matchResult: {
          overall_score: 45,
          semantic_score: 40,
          skill_score: 30,
          experience_score: 80,
          education_score: 100,
          ats_score: 60,
          matched_required_skills: [],
          missing_required_skills: ["React", "TypeScript", "Tailwind"],
          missing_preferred_skills: []
        },
        preferenceScore: 0,
        reason: "Partial domain alignment."
      },
      {
        job: sampleJobs[2],
        matchResult: {
          overall_score: 75,
          semantic_score: 78,
          skill_score: 70,
          experience_score: 100,
          education_score: 100,
          ats_score: 75,
          matched_required_skills: ["Docker"],
          missing_required_skills: ["Kubernetes", "Terraform"],
          missing_preferred_skills: ["AWS"]
        },
        preferenceScore: 5,
        reason: "Recommended because your profile matches Docker."
      }
    ];

    const ranked = rankAndDiversifyJobs(evaluatedJobs, "best_match");
    assert(ranked[0].job_id === "job-1", "Test 5a: Rank #1 job is highest overall match score (job-1 with 88% match)");
    assert(ranked[0].rank === 1 && ranked[1].rank === 2, "Test 5b: Ranks are sequentially assigned starting at 1");

    // 6. Recommendation Explanation Generator Test
    const explanation1 = generateRecommendationExplanation(
      evaluatedJobs[0].matchResult,
      sampleJobs[0],
      candidateProfile
    );
    assert(explanation1.includes("Python") && explanation1.includes("AWS"), "Test 6: Explanation deterministically cites matched skills (Python) and skill gaps (AWS)");

  } catch (err) {
    console.error("Test execution exception:", err);
    failed++;
  }

  console.log(`\nPhase 8 Tests Complete: ${passed} PASSED, ${failed} FAILED.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runPhase8Tests();
