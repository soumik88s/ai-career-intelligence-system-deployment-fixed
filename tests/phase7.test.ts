import { getNormalizedWeights, HYBRID_MATCH_CONFIG } from "../server/matching/config.js";
import { calculateSkillMatch } from "../server/matching/skillScorer.js";
import { calculateExperienceMatch } from "../server/matching/experienceScorer.js";
import { calculateEducationMatch } from "../server/matching/educationScorer.js";
import { calculateAtsCompatibility } from "../server/matching/atsScorer.js";
import { hybridMatchingEngine } from "../server/matching/hybridEngine.js";

async function runPhase7Tests() {
  console.log("=== RUNNING PHASE 7 HYBRID MATCHING & SKILL GAP TESTS ===");
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
    // 1. Config Weight Normalization Test
    const weights = getNormalizedWeights();
    const sum = Object.values(weights).reduce((acc, val) => acc + val, 0);
    assert(Math.abs(sum - 1.0) < 0.0001, "Test 1: Config weights sum to exactly 1.0");

    // 2. Skill Scorer Tests
    const skillRes1 = calculateSkillMatch(
      ["Python", "PyTorch", "Docker"],
      ["Python", "PyTorch", "Docker"],
      []
    );
    assert(skillRes1.skillScore === 100, "Test 2a: Perfect required & preferred skill match gives 100%");
    assert(skillRes1.missingRequiredSkills.length === 0, "Test 2b: Zero missing required skills when fully satisfied");

    // Partial skill match with related skill credit
    const skillRes2 = calculateSkillMatch(
      ["Python", "TensorFlow"], // TensorFlow related to PyTorch
      ["Python", "PyTorch", "Kubernetes"],
      ["AWS"]
    );
    assert(skillRes2.skillScore < 100 && skillRes2.skillScore > 30, "Test 2c: Partial match with related skills produces proportional score");
    assert(skillRes2.relatedSkills.some(r => r.candidateSkill === "TensorFlow" && r.requiredSkill === "PyTorch"), "Test 2d: Correctly detects related skill mapping (TensorFlow ~ PyTorch)");

    // 3. Experience Scorer Tests
    const expRes1 = calculateExperienceMatch(5, 3, 7);
    assert(expRes1.experienceScore === 100, "Test 3a: Satisfying minimum experience requirements yields 100%");
    assert(expRes1.status === "MEETS_REQUIREMENT", "Test 3b: Status is MEETS_REQUIREMENT when within bounds");

    const expRes2 = calculateExperienceMatch(1.5, 3, 5);
    assert(expRes2.experienceScore === 50, "Test 3c: Half required experience yields 50%");
    assert(expRes2.status === "BELOW_REQUIREMENT", "Test 3d: Status is BELOW_REQUIREMENT when under minimum");

    const expRes3 = calculateExperienceMatch(8, null, null);
    assert(expRes3.experienceScore === 100, "Test 3e: Unspecified experience requirement yields 100%");

    // 4. Education Scorer Tests
    const eduRes1 = calculateEducationMatch(
      [{ degree: "Bachelor of Science", field: "Computer Science" }],
      "Bachelor's degree in Computer Science or Software Engineering"
    );
    assert(eduRes1.educationScore === 100, "Test 4a: Exact degree and field match yields 100%");
    assert(eduRes1.status === "EXACT_MATCH", "Test 4b: Status is EXACT_MATCH");

    const eduRes2 = calculateEducationMatch(
      [{ degree: "Bachelor of Science", field: "Electrical Engineering" }],
      "Bachelor in Computer Science"
    );
    assert(eduRes2.educationScore === 85, "Test 4c: Related engineering field match yields 85%");

    const eduRes3 = calculateEducationMatch(
      [],
      "Master's Degree Required"
    );
    assert(eduRes3.educationScore === 50, "Test 4d: Missing degree when required yields 50%");

    // 5. ATS Compatibility Scorer Tests
    const atsRes = calculateAtsCompatibility(
      "John Doe. Email: john@example.com. Phone: 555-1234. Executive Summary: Senior Machine Learning Engineer with 5 years experience in python, pytorch, docker, postgresql. Experience at Tech Corp. Education: BS CS in Computer Science. Project achievements building AI platforms.",
      ["python", "pytorch", "docker"],
      { contact_email: "john@example.com", summary: "ML Engineer", experience: [{ title: "ML Eng" }], education: [{ degree: "BS CS" }] },
      "Senior Machine Learning Engineer",
      "Looking for a Senior Machine Learning Engineer proficient in python, pytorch, docker, postgresql.",
      ["python", "pytorch", "docker"]
    );
    assert(atsRes.atsScore >= 75, "Test 5a: Well-structured resume with full section coverage achieves high ATS score");
    assert(atsRes.detectedSections.length >= 4, "Test 5b: Correctly detects present resume sections");

    // 6. Full Hybrid Matching Engine Test
    const candidateAnalysis = {
      summary: "Senior AI Engineer with PyTorch and Python experience",
      skills: ["Python", "PyTorch", "Docker", "SQL"],
      total_experience_years: 4,
      education: [{ degree: "Bachelor of Science", field: "Computer Science" }],
      experience: [{ job_title: "AI Engineer", company: "Aether AI", duration: "4 years" }]
    };

    const jobRecord = {
      id: "job_benchmark_1",
      title: "Senior Machine Learning Engineer",
      company: "Aether AI Labs",
      description: "We are seeking a Senior ML Engineer proficient in Python, PyTorch, Docker, Kubernetes.",
      required_skills: ["Python", "PyTorch", "Docker"],
      preferred_skills: ["Kubernetes", "AWS"],
      minimum_years: 3,
      maximum_years: 6,
      education_requirement: "Bachelor in Computer Science"
    };

    const hybridRes = await hybridMatchingEngine.computeHybridMatch(
      "resume_test_p7",
      candidateAnalysis,
      "Senior AI Engineer resume text with contact_email: test@ai.com, skills, experience, education",
      jobRecord
    );

    assert(hybridRes.overall_score >= 0 && hybridRes.overall_score <= 100, "Test 6a: Hybrid overall score is bounded in [0, 100]");
    assert(hybridRes.semantic_score >= 0 && hybridRes.semantic_score <= 100, "Test 6b: Hybrid semantic score is included");
    assert(hybridRes.skill_score >= 0 && hybridRes.skill_score <= 100, "Test 6c: Hybrid skill score is included");
    assert(hybridRes.matched_required_skills.includes("Python"), "Test 6d: Matched required skills list includes Python");
    assert(hybridRes.missing_preferred_skills.includes("Kubernetes") || hybridRes.missing_preferred_skills.includes("AWS"), "Test 6e: Identifies missing preferred skills");
    assert(hybridRes.strengths.length > 0, "Test 6f: Generates candidate strengths");
    assert(typeof hybridRes.explanation === "string" && hybridRes.explanation.length > 10, "Test 6g: Generates clear explanation paragraph");

    console.log("\n==========================================");
    console.log(`Phase 7 Tests Complete: ${passed} PASSED, ${failed} FAILED.`);
    console.log("==========================================\n");

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("Test execution exception:", err);
    process.exit(1);
  }
}

runPhase7Tests();
