import { v4 as uuidv4 } from "uuid";
import { getRoleByName, getAllCareerRoles } from "../career_prediction/roleTaxonomy.js";
import { getSkillPrerequisites } from "./skillDependencies.js";
import { calculateRoleMarketSignals, MarketSkillSignal } from "./marketSignals.js";

export interface GenerateRoadmapInput {
  userId: string;
  resumeId: string;
  candidateProfile: any;
  targetRole: string;
  durationMonths?: number;
  jobsList?: any[];
}

export interface RoadmapSkillItem {
  id: string;
  skill_name: string;
  priority: "HIGH PRIORITY" | "MEDIUM PRIORITY" | "LOW PRIORITY";
  reason: string;
  suggested_duration: string;
  prerequisites: string[];
  market_frequency_pct?: number; // Only included if calculated from real job records!
  completion_criteria: string;
}

export interface RoadmapProjectItem {
  id: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  required_skills: string[];
}

export interface RoadmapMilestoneItem {
  id: string;
  stage_id: string;
  title: string;
  description: string;
  completion_criteria: string;
  status: "not_started" | "in_progress" | "completed";
  progress_percentage: number;
  notes: string;
}

export interface RoadmapStage {
  id: string;
  stage_number: number;
  title: string;
  description: string;
  estimated_duration: string;
  skills: RoadmapSkillItem[];
  projects: RoadmapProjectItem[];
  milestones: RoadmapMilestoneItem[];
}

export interface CareerRoadmapData {
  id: string;
  user_id: string;
  resume_id: string;
  target_role: string;
  model_version: string;
  roadmap_version: number;
  duration_months: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  skill_summary: {
    current_skills: string[];
    missing_skills: string[];
    high_priority_skills: string[];
    medium_priority_skills: string[];
    low_priority_skills: string[];
  };
  stages: RoadmapStage[];
  overall_progress: number;
}

export function generatePersonalizedRoadmap(input: GenerateRoadmapInput): CareerRoadmapData {
  const {
    userId,
    resumeId,
    candidateProfile,
    targetRole,
    durationMonths = 6,
    jobsList = [],
  } = input;

  // 1. Target Role Validation
  let taxonomyRole = getRoleByName(targetRole);
  if (!taxonomyRole) {
    const allRoles = getAllCareerRoles();
    const fallback = allRoles.find((r) =>
      r.role_name.toLowerCase().includes(targetRole.toLowerCase())
    );
    taxonomyRole = fallback || allRoles[0]; // Fallback to Machine Learning Engineer if not matched
  }

  const roleName = taxonomyRole.role_name;

  // 2. Candidate Skill Normalization
  const rawCandidateSkills = candidateProfile?.skills || [];
  const candidateSkillNames: string[] = [];
  const candidateSkillNorms = new Set<string>();

  for (const sk of rawCandidateSkills) {
    const name = typeof sk === "string" ? sk : sk.skill_name || sk.normalized_name;
    if (name) {
      candidateSkillNames.push(name);
      candidateSkillNorms.add(name.trim().toLowerCase());
    }
  }

  // 3. Target Role Skill Requirements & Market Signals
  const roleRequiredSkills = taxonomyRole.required_skills || [];
  const marketSignals: Record<string, MarketSkillSignal> = calculateRoleMarketSignals(
    roleName,
    jobsList
  );

  // Combine role skills from taxonomy and market signals
  const allTargetSkillNorms = new Set<string>();
  const skillOriginalMap = new Map<string, string>();

  for (const sk of roleRequiredSkills) {
    const norm = sk.trim().toLowerCase();
    allTargetSkillNorms.add(norm);
    skillOriginalMap.set(norm, sk);
  }

  for (const [norm, signal] of Object.entries(marketSignals)) {
    if (signal.frequency_percentage >= 20.0) { // Keep skills that appear in >= 20% of role jobs
      allTargetSkillNorms.add(norm);
      if (!skillOriginalMap.has(norm)) {
        skillOriginalMap.set(norm, signal.skill_name);
      }
    }
  }

  // 4. Missing Skills & Prioritization
  const missingSkillNorms: string[] = [];
  const currentSkillsList: string[] = [];

  for (const norm of allTargetSkillNorms) {
    const origName = skillOriginalMap.get(norm) || norm;
    if (candidateSkillNorms.has(norm)) {
      currentSkillsList.push(origName);
    } else {
      missingSkillNorms.push(norm);
    }
  }

  // If candidate already has all target skills, add role specialization/advanced skills as gaps
  if (missingSkillNorms.length === 0) {
    const defaultAdvanced = ["MLOps", "System Design", "Cloud Architecture", "A/B Testing"];
    for (const adv of defaultAdvanced) {
      const norm = adv.toLowerCase();
      if (!candidateSkillNorms.has(norm)) {
        missingSkillNorms.push(norm);
        skillOriginalMap.set(norm, adv);
      }
    }
  }

  const highPriority: string[] = [];
  const medPriority: string[] = [];
  const lowPriority: string[] = [];

  const categorizedSkills: {
    norm: string;
    origName: string;
    priority: "HIGH PRIORITY" | "MEDIUM PRIORITY" | "LOW PRIORITY";
    reason: string;
    prerequisites: string[];
    marketPct?: number;
    completionCriteria: string;
  }[] = [];

  for (const norm of missingSkillNorms) {
    const origName = skillOriginalMap.get(norm) || norm;
    const signal = marketSignals[norm];
    const prereqs = getSkillPrerequisites(norm);
    const isCoreRoleReq = roleRequiredSkills.some((s) => s.toLowerCase() === norm);

    let priority: "HIGH PRIORITY" | "MEDIUM PRIORITY" | "LOW PRIORITY" = "MEDIUM PRIORITY";
    let reason = `Essential skill aligned with ${roleName} industry requirements.`;

    if (signal) {
      if (isCoreRoleReq || signal.frequency_percentage >= 50.0) {
        priority = "HIGH PRIORITY";
        reason = `Required by ${signal.frequency_percentage}% of analyzed ${roleName} job postings in current market data.`;
      } else if (signal.frequency_percentage >= 30.0) {
        priority = "MEDIUM PRIORITY";
        reason = `Requested in ${signal.frequency_percentage}% of ${roleName} job descriptions.`;
      } else {
        priority = "LOW PRIORITY";
        reason = `Preferred supporting skill found in ${signal.frequency_percentage}% of ${roleName} listings.`;
      }
    } else if (isCoreRoleReq) {
      priority = "HIGH PRIORITY";
      reason = `Core foundational competency defined in ${roleName} role taxonomy.`;
    } else {
      priority = "LOW PRIORITY";
      reason = `Supporting skill recommended for comprehensive ${roleName} candidate profile.`;
    }

    if (priority === "HIGH PRIORITY") highPriority.push(origName);
    else if (priority === "MEDIUM PRIORITY") medPriority.push(origName);
    else lowPriority.push(origName);

    categorizedSkills.push({
      norm,
      origName,
      priority,
      reason,
      prerequisites: prereqs,
      marketPct: signal ? signal.frequency_percentage : undefined,
      completionCriteria: `Demonstrate mastery of ${origName} through coursework or mini-project implementation.`
    });
  }

  // 5. Dependency-Aware Skill Ordering for Stages
  // Separate into Foundational (has prereqs or is basic), Core ML/Software, Advanced/Specialized
  const foundationSkillItems: RoadmapSkillItem[] = [];
  const coreSkillItems: RoadmapSkillItem[] = [];
  const advancedSkillItems: RoadmapSkillItem[] = [];

  for (const item of categorizedSkills) {
    const skillObj: RoadmapSkillItem = {
      id: uuidv4(),
      skill_name: item.origName,
      priority: item.priority,
      reason: item.reason,
      suggested_duration: `${Math.max(2, Math.round(durationMonths * 0.3))} Weeks`,
      prerequisites: item.prerequisites,
      market_frequency_pct: item.marketPct,
      completion_criteria: item.completionCriteria
    };

    if (item.prerequisites.length === 0 && item.priority === "HIGH PRIORITY") {
      foundationSkillItems.push(skillObj);
    } else if (item.priority === "HIGH PRIORITY" || item.priority === "MEDIUM PRIORITY") {
      coreSkillItems.push(skillObj);
    } else {
      advancedSkillItems.push(skillObj);
    }
  }

  // Fallbacks if lists are empty
  if (foundationSkillItems.length === 0 && coreSkillItems.length > 0) {
    foundationSkillItems.push(coreSkillItems.shift()!);
  }

  // 6. Project Suggestions Aligned with Missing Skills
  const missingNames = categorizedSkills.map((s) => s.origName);
  const projects: RoadmapProjectItem[] = [
    {
      id: uuidv4(),
      title: `${roleName} Foundation Prototype`,
      description: `Build an initial end-to-end prototype applying fundamental ${roleName} principles and core missing skills (${missingNames.slice(0, 2).join(", ") || "Python"}).`,
      difficulty: "Beginner",
      required_skills: missingNames.slice(0, 2)
    },
    {
      id: uuidv4(),
      title: `Production ${roleName} System`,
      description: `Architect a robust, modular system combining ${missingNames.slice(1, 4).join(", ") || "ML and APIs"} with vector evaluation and clean REST integration.`,
      difficulty: "Intermediate",
      required_skills: missingNames.slice(1, 4)
    },
    {
      id: uuidv4(),
      title: `Enterprise Capstone & Microservices Deployment`,
      description: `Deploy a scalable production application with automated containerization, monitoring, and live integration tests.`,
      difficulty: "Advanced",
      required_skills: missingNames.slice(2, 6)
    }
  ];

  // 7. Calculate Duration Calculations Per Stage
  const monthUnit = durationMonths <= 3 ? "Month" : "Months";
  const m1 = durationMonths <= 3 ? "Month 1" : `Months 1-${Math.ceil(durationMonths * 0.25)}`;
  const m2 = durationMonths <= 3 ? "Month 2" : `Months ${Math.ceil(durationMonths * 0.25) + 1}-${Math.ceil(durationMonths * 0.5)}`;
  const m3 = durationMonths <= 3 ? "Month 2-3" : `Months ${Math.ceil(durationMonths * 0.5) + 1}-${Math.ceil(durationMonths * 0.75)}`;
  const m4 = durationMonths <= 3 ? "Month 3" : `Months ${Math.ceil(durationMonths * 0.75) + 1}-${durationMonths}`;
  const m5 = `Final Month (${durationMonths})`;

  // 8. Build Stages
  const roadmapId = uuidv4();

  const stage1Id = uuidv4();
  const stage2Id = uuidv4();
  const stage3Id = uuidv4();
  const stage4Id = uuidv4();
  const stage5Id = uuidv4();

  const stages: RoadmapStage[] = [
    {
      id: stage1Id,
      stage_number: 1,
      title: "Phase A — Foundation",
      description: "Establish baseline core prerequisites and foundational concepts required for the target role.",
      estimated_duration: m1,
      skills: foundationSkillItems,
      projects: [projects[0]],
      milestones: [
        {
          id: uuidv4(),
          stage_id: stage1Id,
          title: "Complete Baseline Foundations",
          description: "Finish foundational tutorials, core theory, and environment setup.",
          completion_criteria: "Verify development environment setup and pass foundational exercises.",
          status: "not_started",
          progress_percentage: 0,
          notes: ""
        },
        {
          id: uuidv4(),
          stage_id: stage1Id,
          title: "Build Initial Starter Mini-Project",
          description: "Complete initial beginner prototype applying foundation skills.",
          completion_criteria: "Repository created with clean documentation and passing unit tests.",
          status: "not_started",
          progress_percentage: 0,
          notes: ""
        }
      ]
    },
    {
      id: stage2Id,
      stage_number: 2,
      title: "Phase B — Core Skills",
      description: "Master essential high-priority technologies and domain competencies expected by target hiring managers.",
      estimated_duration: m2,
      skills: coreSkillItems,
      projects: [projects[1]],
      milestones: [
        {
          id: uuidv4(),
          stage_id: stage2Id,
          title: "Core Technology Mastery",
          description: "Develop hands-on fluency in core required skills.",
          completion_criteria: "Build 2 modular components utilizing core required tools.",
          status: "not_started",
          progress_percentage: 0,
          notes: ""
        },
        {
          id: uuidv4(),
          stage_id: stage2Id,
          title: "Intermediate Integration Project",
          description: "Implement robust API and database integrations.",
          completion_criteria: "Working application with live endpoints and structured data processing.",
          status: "not_started",
          progress_percentage: 0,
          notes: ""
        }
      ]
    },
    {
      id: stage3Id,
      stage_number: 3,
      title: "Phase C — Advanced Skills & Systems",
      description: "Gain competitive edge by learning advanced frameworks, MLOps/DevOps tooling, and cloud infrastructure.",
      estimated_duration: m3,
      skills: advancedSkillItems,
      projects: [],
      milestones: [
        {
          id: uuidv4(),
          stage_id: stage3Id,
          title: "Advanced Framework Proficiency",
          description: "Master specialized libraries, optimization, and cloud services.",
          completion_criteria: "Implement performance benchmarks and automated pipeline scripts.",
          status: "not_started",
          progress_percentage: 0,
          notes: ""
        }
      ]
    },
    {
      id: stage4Id,
      stage_number: 4,
      title: "Phase D — Capstone Portfolio",
      description: "Construct and showcase end-to-end production-grade portfolio projects for employer review.",
      estimated_duration: m4,
      skills: [],
      projects: [projects[2]],
      milestones: [
        {
          id: uuidv4(),
          stage_id: stage4Id,
          title: "Deploy Production Capstone",
          description: "Deploy capstone application with CI/CD, documentation, and live preview URL.",
          completion_criteria: "Public GitHub repository with comprehensive README, architectural diagrams, and deployed URL.",
          status: "not_started",
          progress_percentage: 0,
          notes: ""
        }
      ]
    },
    {
      id: stage5Id,
      stage_number: 5,
      title: "Phase E — Job Readiness & Career Launch",
      description: "Optimize resume alignment, prepare technical interview topics, and launch targeted job applications.",
      estimated_duration: m5,
      skills: [],
      projects: [],
      milestones: [
        {
          id: uuidv4(),
          stage_id: stage5Id,
          title: "Resume & Portfolio Optimization",
          description: "Incorporate newly acquired project achievements and targeted skills into candidate profile.",
          completion_criteria: "Re-analyze candidate profile and verify >85% alignment score for target role.",
          status: "not_started",
          progress_percentage: 0,
          notes: ""
        },
        {
          id: uuidv4(),
          stage_id: stage5Id,
          title: "Technical Interview Readiness",
          description: "Complete practice mock coding interviews and system design reviews.",
          completion_criteria: "Review top technical questions for target role and practice live coding scenarios.",
          status: "not_started",
          progress_percentage: 0,
          notes: ""
        }
      ]
    }
  ];

  // Fix stage_id on inner milestones
  for (const stg of stages) {
    for (const ms of stg.milestones) {
      ms.stage_id = stg.id;
    }
  }

  const now = new Date().toISOString();

  return {
    id: roadmapId,
    user_id: userId,
    resume_id: resumeId,
    target_role: roleName,
    model_version: "roadmap-v1.0",
    roadmap_version: 1,
    duration_months: durationMonths,
    created_at: now,
    updated_at: now,
    is_active: true,
    skill_summary: {
      current_skills: currentSkillsList,
      missing_skills: categorizedSkills.map((s) => s.origName),
      high_priority_skills: highPriority,
      medium_priority_skills: medPriority,
      low_priority_skills: lowPriority,
    },
    stages,
    overall_progress: 0,
  };
}
