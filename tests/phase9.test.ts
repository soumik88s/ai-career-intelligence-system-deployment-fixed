import { getAllCareerRoles, getRoleByName } from "../server/career_prediction/roleTaxonomy.js";
import { buildCandidateFeatureVector, FEATURE_SKILL_VOCABULARY } from "../server/career_prediction/featureBuilder.js";
import { predictCareerRolesFromVector, loadModelArtifacts } from "../server/career_prediction/model.js";
import { generatePredictionEvidence } from "../server/career_prediction/evidenceGenerator.js";
import { getCareerPredictionEvaluation } from "../server/career_prediction/evaluator.js";

async function runPhase9Tests() {
  console.log("=================================================");
  console.log("   RUNNING PHASE 9: ML CAREER PREDICTION TESTS");
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

  // 1. Role Taxonomy
  console.log("--- 1. Role Taxonomy Tests ---");
  const roles = getAllCareerRoles();
  assert(roles.length === 15, `Taxonomy contains exactly 15 career roles (found ${roles.length}).`);
  
  const mlRole = getRoleByName("Machine Learning Engineer");
  assert(!!mlRole && mlRole.category === "Artificial Intelligence", "ML Engineer role exists in Artificial Intelligence category.");
  assert(mlRole?.required_skills.includes("PyTorch"), "ML Engineer required skills includes PyTorch.");

  // 2. Feature Vector Builder
  console.log("\n--- 2. Feature Builder Tests ---");
  const sampleProfile = {
    summary: "Senior AI Engineer with 3 years of deep learning experience.",
    skills: [
      { skill_name: "Python", normalized_name: "python", category: "Technical", confidence: 0.95 },
      { skill_name: "PyTorch", normalized_name: "pytorch", category: "Technical", confidence: 0.95 },
      { skill_name: "Docker", normalized_name: "docker", category: "Technical", confidence: 0.95 }
    ],
    experience: [
      { job_title: "AI Developer", company: "TechCorp", duration: "2 years", confidence: 0.95 },
      { job_title: "ML Intern", company: "DataLab", duration: "1 year", confidence: 0.95 }
    ],
    education: [
      { degree: "Master of Science", field: "Computer Science", institution: "Stanford University", confidence: 0.95 }
    ]
  };

  const featureData = buildCandidateFeatureVector(sampleProfile);
  assert(featureData.featureVector.length === FEATURE_SKILL_VOCABULARY.length + 2, "Feature vector length matches vocabulary + exp + edu.");
  assert(featureData.matchedSkills.includes("Python") && featureData.matchedSkills.includes("PyTorch"), "Multi-hot skill vector correctly identified Python and PyTorch.");
  assert(featureData.educationScore === 0.8, "Master degree correctly mapped to 0.8 education score.");

  // 3. Model Inference & Probability Calibration
  console.log("\n--- 3. Model Inference & Softmax Tests ---");
  const artifacts = loadModelArtifacts();
  assert(artifacts.label_encoder.length === 15, "Model artifacts label encoder contains 15 classes.");

  const predictions = predictCareerRolesFromVector(featureData.featureVector, 5);
  assert(predictions.length === 5, "Predictor returned top-5 ranked career roles.");
  assert(predictions[0].score > predictions[1].score, "Predictions are strictly sorted descending by score.");
  assert(predictions[0].role === "Machine Learning Engineer" || predictions[0].role === "AI Engineer", `Top predicted role is AI/ML Engineer (got ${predictions[0].role}).`);

  // 4. Evidence Generation
  console.log("\n--- 4. Evidence Generation Tests ---");
  const topPred = predictions[0];
  const evidence = generatePredictionEvidence(topPred, sampleProfile);
  assert(evidence.evidence_signals.length > 0, "Evidence signals generated for top prediction.");
  assert(evidence.matched_skills.length > 0, "Matched skills correctly populated in evidence object.");

  // 5. Research Evaluation Report
  console.log("\n--- 5. Research Evaluation Report Tests ---");
  const evalReport = getCareerPredictionEvaluation();
  assert(evalReport.experiments.length >= 4, "Research experiments matrix contains at least 4 compared models (A, B, C, D).");
  assert(evalReport.accuracy > 0.85, `Production model accuracy exceeds 85% (got ${(evalReport.accuracy * 100).toFixed(1)}%).`);
  assert(evalReport.error_analysis.top_confused_role_pairs.length > 0, "Error analysis contains documented confused role pairs.");

  console.log("\n=================================================");
  console.log(`   PHASE 9 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase9Tests().catch((err) => {
  console.error("Error executing Phase 9 tests:", err);
  process.exit(1);
});
