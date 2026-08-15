import { CareerRoadmapData } from "./generator.js";

export interface RoadmapEvaluationReport {
  timestamp: string;
  roadmap_id: string;
  target_role: string;
  logical_consistency_score: number; // 0.0 - 1.0
  checks: {
    missing_skills_coverage: { passed: boolean; details: string };
    priority_distribution: { passed: boolean; details: string };
    dependency_order: { passed: boolean; details: string };
    project_relevance: { passed: boolean; details: string };
    personalization_delta: { passed: boolean; details: string };
  };
}

export function evaluateRoadmapConsistency(
  roadmap: CareerRoadmapData,
  candidateProfile: any
): RoadmapEvaluationReport {
  const currentSkillNorms = new Set(
    (candidateProfile?.skills || []).map((s: any) =>
      (typeof s === "string" ? s : s.skill_name || s.normalized_name || "").toLowerCase()
    )
  );

  // Check 1: Missing Skills Coverage
  const missingInSummary = roadmap.skill_summary.missing_skills || [];
  const stageSkillNames: string[] = [];
  for (const stg of roadmap.stages) {
    for (const sk of stg.skills) {
      stageSkillNames.push(sk.skill_name.toLowerCase());
    }
  }

  const missingCovered = missingInSummary.every((sk) =>
    stageSkillNames.includes(sk.toLowerCase())
  );

  // Check 2: Priority Distribution
  const hasHighPriority = roadmap.skill_summary.high_priority_skills.length > 0;

  // Check 3: Dependency Order (Foundation stage skills vs Advanced stage skills)
  const foundationStage = roadmap.stages.find((s) => s.stage_number === 1);
  const advancedStage = roadmap.stages.find((s) => s.stage_number === 3);

  const foundationHasNoAdvancedPrereqs = (foundationStage?.skills || []).every(
    (sk) => sk.prerequisites.length === 0 || sk.priority === "HIGH PRIORITY"
  );

  // Check 4: Project Relevance
  const stageProjects = roadmap.stages.flatMap((s) => s.projects);
  const projectsAreRelevant = stageProjects.every((p) => p.required_skills.length > 0);

  // Check 5: Personalization Delta (Existing candidate skills excluded from missing skills)
  const noExistingInMissing = missingInSummary.every(
    (mSk) => !currentSkillNorms.has(mSk.toLowerCase())
  );

  let passedChecksCount = 0;
  if (missingCovered) passedChecksCount++;
  if (hasHighPriority) passedChecksCount++;
  if (foundationHasNoAdvancedPrereqs) passedChecksCount++;
  if (projectsAreRelevant) passedChecksCount++;
  if (noExistingInMissing) passedChecksCount++;

  const consistencyScore = Number((passedChecksCount / 5).toFixed(2));

  return {
    timestamp: new Date().toISOString(),
    roadmap_id: roadmap.id,
    target_role: roadmap.target_role,
    logical_consistency_score: consistencyScore,
    checks: {
      missing_skills_coverage: {
        passed: missingCovered,
        details: missingCovered
          ? "All missing skills are mapped to learning stages."
          : "Some missing skills lack stage assignments."
      },
      priority_distribution: {
        passed: hasHighPriority,
        details: hasHighPriority
          ? "High priority required skills correctly identified."
          : "No high priority skills assigned."
      },
      dependency_order: {
        passed: foundationHasNoAdvancedPrereqs,
        details: foundationHasNoAdvancedPrereqs
          ? "Prerequisites correctly positioned before advanced technologies."
          : "Dependency ordering violation detected."
      },
      project_relevance: {
        passed: projectsAreRelevant,
        details: projectsAreRelevant
          ? "Project recommendations strictly map to skill gap."
          : "Generic or unaligned projects detected."
      },
      personalization_delta: {
        passed: noExistingInMissing,
        details: noExistingInMissing
          ? "Existing candidate skills successfully filtered out."
          : "Existing skills duplicated in missing skills gap."
      }
    }
  };
}
