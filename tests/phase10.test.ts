import { getSkillPrerequisites } from "../server/roadmap/skillDependencies.js";
import { calculateRoleMarketSignals } from "../server/roadmap/marketSignals.js";
import { generatePersonalizedRoadmap } from "../server/roadmap/generator.js";
import { evaluateRoadmapConsistency } from "../server/roadmap/evaluator.js";

async function runPhase10Tests() {
  console.log("=================================================");
  console.log("   RUNNING PHASE 10: CAREER ROADMAP TESTS");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`  [PASS] ${description}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${description}`);
      failed++;
    }
  }

  // 1. Skill Prerequisites & Dependency Mapping
  console.log("--- 1. Skill Dependency Strategy Tests ---");
  const pytorchPrereqs = getSkillPrerequisites("PyTorch");
  assert(pytorchPrereqs.includes("Python") && pytorchPrereqs.includes("Deep Learning"), "PyTorch lists Python and Deep Learning as prerequisites.");

  const kubernetesPrereqs = getSkillPrerequisites("Kubernetes");
  assert(kubernetesPrereqs.includes("Docker"), "Kubernetes lists Docker as prerequisite.");

  const reactPrereqs = getSkillPrerequisites("React");
  assert(reactPrereqs.includes("JavaScript"), "React lists JavaScript as prerequisite.");

  // 2. Job-Market Signal Calculation
  console.log("\n--- 2. Job-Market Signal Calculation Tests ---");
  const sampleJobs = [
    {
      title: "Senior ML Engineer",
      description: "Looking for Python, PyTorch, Docker, Kubernetes, and FastAPI expertise.",
      required_skills: ["Python", "PyTorch", "Docker", "Kubernetes", "FastAPI"]
    },
    {
      title: "Machine Learning Software Developer",
      description: "Must know Python, PyTorch, SQL, and Git.",
      required_skills: ["Python", "PyTorch", "SQL", "Git"]
    },
    {
      title: "AI Specialist",
      description: "Python, PyTorch, Docker, and MLflow required.",
      required_skills: ["Python", "PyTorch", "Docker", "MLflow"]
    }
  ];

  const marketSignals = calculateRoleMarketSignals("Machine Learning Engineer", sampleJobs);
  const pytorchSignal = marketSignals["pytorch"];
  assert(!!pytorchSignal && pytorchSignal.frequency_percentage === 100, "PyTorch signal calculated as 100% market demand across sample jobs.");
  assert(pytorchSignal?.skill_type === "required", "PyTorch classified as required skill_type based on market demand.");

  // 3. Roadmap Generation Algorithm
  console.log("\n--- 3. Roadmap Generator Algorithm Tests ---");
  const sampleCandidateProfile = {
    summary: "Junior Python Developer seeking transition to ML Engineering.",
    skills: [
      { skill_name: "Python", normalized_name: "python", category: "Programming Languages", confidence: 0.95 },
      { skill_name: "Git", normalized_name: "git", category: "Tools", confidence: 0.9 }
    ],
    experience: [
      { job_title: "Junior Backend Dev", company: "TechCorp", duration: "1 year" }
    ],
    education: [
      { degree: "Bachelor of Science", field: "Computer Science" }
    ]
  };

  const generatedRoadmap = generatePersonalizedRoadmap({
    userId: "test-user-123",
    resumeId: "test-resume-456",
    candidateProfile: sampleCandidateProfile,
    targetRole: "Machine Learning Engineer",
    durationMonths: 6,
    jobsList: sampleJobs
  });

  assert(generatedRoadmap.target_role === "Machine Learning Engineer", "Target role correctly assigned to Machine Learning Engineer.");
  assert(generatedRoadmap.duration_months === 6, "Roadmap duration set to 6 months.");
  assert(generatedRoadmap.stages.length === 5, "Roadmap consists of 5 sequential stages (Foundations to Portfolio).");

  // Verify missing skill gap identification
  const currentSkills = generatedRoadmap.skill_summary.current_skills;
  const missingSkills = generatedRoadmap.skill_summary.missing_skills;
  assert(currentSkills.map(s => s.toLowerCase()).includes("python"), "Python recognized as existing current candidate skill.");
  assert(!missingSkills.map(s => s.toLowerCase()).includes("python"), "Existing candidate skills strictly excluded from missing skill gap.");
  assert(missingSkills.map(s => s.toLowerCase()).includes("pytorch"), "PyTorch identified as missing required skill.");

  // Verify skill prioritization
  const highPrioritySkills = generatedRoadmap.skill_summary.high_priority_skills;
  assert(highPrioritySkills.map(s => s.toLowerCase()).includes("pytorch"), "PyTorch assigned HIGH PRIORITY based on taxonomy + market demand.");

  // 4. Milestone & Project Assignments
  console.log("\n--- 4. Milestone & Project Recommendation Tests ---");
  const stage1 = generatedRoadmap.stages[0];
  assert(stage1.milestones.length > 0, "Stage 1 contains actionable milestones.");
  assert(stage1.projects.length > 0, "Stage 1 contains recommended portfolio project.");
  assert(stage1.milestones[0].status === "not_started", "Milestone initial status default is 'not_started'.");

  // 5. Logical Consistency Evaluator
  console.log("\n--- 5. Research Logical Consistency Evaluator Tests ---");
  const evalReport = evaluateRoadmapConsistency(generatedRoadmap, sampleCandidateProfile);
  assert(evalReport.logical_consistency_score >= 0.8, `Logical consistency evaluation score is ${evalReport.logical_consistency_score} (>= 0.80).`);
  assert(evalReport.checks.missing_skills_coverage.passed, "Evaluation check passed: Missing skills coverage.");
  assert(evalReport.checks.personalization_delta.passed, "Evaluation check passed: Personalization delta (no candidate skill duplication).");

  console.log("\n=================================================");
  console.log(`   PHASE 10 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase10Tests().catch((err) => {
  console.error("Test execution crashed:", err);
  process.exit(1);
});
