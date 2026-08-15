import { SKILL_KNOWLEDGE_BASE, SkillKBItem } from "../nlp/skillKnowledgeBase.js";
import { HYBRID_MATCH_CONFIG } from "./config.js";

export interface RelatedSkillMatch {
  requiredSkill: string;
  candidateSkill: string;
  relationNote: string;
}

export interface SkillMatchResult {
  skillScore: number; // 0 - 100
  matchedRequiredSkills: string[];
  missingRequiredSkills: string[];
  matchedPreferredSkills: string[];
  missingPreferredSkills: string[];
  relatedSkills: RelatedSkillMatch[];
  requiredCoveragePct: number;
  preferredCoveragePct: number;
}

/**
 * Normalizes a raw skill string for consistent comparison using aliases and canonical names
 */
export function normalizeSkillName(rawName: string): string {
  if (!rawName) return "";
  const cleaned = rawName.trim().toLowerCase();

  for (const item of SKILL_KNOWLEDGE_BASE) {
    if (item.normalized_name === cleaned || item.skill_name.toLowerCase() === cleaned) {
      return item.skill_name;
    }
    if (item.aliases.some((alias) => alias.toLowerCase() === cleaned)) {
      return item.skill_name;
    }
  }

  return rawName.trim();
}

/**
 * Checks if two normalized skill names are related according to KB or domain categories
 */
export function findRelatedSkillMatch(
  missingReqSkill: string,
  candidateSkillList: string[]
): { candidateSkill: string; note: string } | null {
  const normReq = missingReqSkill.toLowerCase();
  
  // Find KB item for missing required skill
  const kbReq = SKILL_KNOWLEDGE_BASE.find(
    (k) => k.skill_name.toLowerCase() === normReq || k.normalized_name === normReq
  );

  for (const candSkill of candidateSkillList) {
    const normCand = candSkill.toLowerCase();
    const kbCand = SKILL_KNOWLEDGE_BASE.find(
      (k) => k.skill_name.toLowerCase() === normCand || k.normalized_name === normCand
    );

    // 1. Direct explicit related skill match in KB
    if (kbReq?.related_skills?.some((r) => r.toLowerCase() === normCand)) {
      return {
        candidateSkill: candSkill,
        note: `${candSkill} is directly related to ${missingReqSkill} (${kbReq.category})`,
      };
    }
    if (kbCand?.related_skills?.some((r) => r.toLowerCase() === normReq)) {
      return {
        candidateSkill: candSkill,
        note: `${candSkill} is a complementary technology to ${missingReqSkill}`,
      };
    }

    // 2. Category match for specialized AI / Framework / Database tools
    if (
      kbReq &&
      kbCand &&
      kbReq.category === kbCand.category &&
      (kbReq.category === "AI & Machine Learning" ||
        kbReq.category === "Frameworks & Libraries" ||
        kbReq.category === "Databases" ||
        kbReq.category === "Cloud & DevOps")
    ) {
      return {
        candidateSkill: candSkill,
        note: `Shares same technical category (${kbReq.category}) as ${missingReqSkill}`,
      };
    }
  }

  return null;
}

/**
 * Calculates comprehensive skill match score and gap analysis
 */
export function calculateSkillMatch(
  rawCandidateSkills: (string | any)[],
  rawRequiredSkills: string[],
  rawPreferredSkills: string[] = []
): SkillMatchResult {
  // Extract clean strings
  const candList = (rawCandidateSkills || [])
    .map((s) => (typeof s === "string" ? s : s.skill_name || s.name || ""))
    .filter(Boolean)
    .map(normalizeSkillName);

  const reqList = (rawRequiredSkills || []).filter(Boolean).map(normalizeSkillName);
  const prefList = (rawPreferredSkills || []).filter(Boolean).map(normalizeSkillName);

  // Deduplicate
  const candSet = new Set(candList.map((s) => s.toLowerCase()));
  const candArray = Array.from(new Set(candList));

  // Required Skill Matching
  const matchedReqSet = new Set<string>();
  const missingReqList: string[] = [];
  const relatedSkills: RelatedSkillMatch[] = [];

  reqList.forEach((reqSkill) => {
    if (candSet.has(reqSkill.toLowerCase())) {
      matchedReqSet.add(reqSkill);
    } else {
      missingReqList.push(reqSkill);
    }
  });

  const matchedRequiredSkills = Array.from(matchedReqSet);
  const matchedReqLowerSet = new Set(matchedRequiredSkills.map((s) => s.toLowerCase()));
  
  // Unmatched candidate skills available for partial/related matching
  const unmatchedCandSkills = candArray.filter((s) => !matchedReqLowerSet.has(s.toLowerCase()));

  // Secondary pass for missing required skills to find related skill credit
  const missingReqArray: string[] = [];
  missingReqList.forEach((reqSkill) => {
    const related = findRelatedSkillMatch(reqSkill, unmatchedCandSkills);
    if (related) {
      relatedSkills.push({
        requiredSkill: reqSkill,
        candidateSkill: related.candidateSkill,
        relationNote: related.note,
      });
    }
    missingReqArray.push(reqSkill);
  });

  // Preferred Skill Matching
  const matchedPrefSet = new Set<string>();
  const missingPrefArray: string[] = [];

  prefList.forEach((prefSkill) => {
    if (candSet.has(prefSkill.toLowerCase())) {
      matchedPrefSet.add(prefSkill);
    } else {
      missingPrefArray.push(prefSkill);
    }
  });

  const matchedPreferredSkills = Array.from(matchedPrefSet);

  // Calculate Coverage Ratios
  // Required skills receive full point for exact match + partial credit (0.5) for related match
  const totalReqCount = reqList.length;
  const exactReqScore = matchedRequiredSkills.length;
  const relatedReqScore = relatedSkills.length * HYBRID_MATCH_CONFIG.SKILL_WEIGHTS.RELATED_MATCH_CREDIT;
  
  const reqCoverageRatio = totalReqCount > 0
    ? Math.min(1.0, (exactReqScore + relatedReqScore) / totalReqCount)
    : 1.0; // Default to 1.0 if no required skills specified

  const totalPrefCount = prefList.length;
  const prefCoverageRatio = totalPrefCount > 0
    ? Math.min(1.0, matchedPreferredSkills.length / totalPrefCount)
    : 1.0;

  // Weighted Combination
  let finalSkillScore = 100;
  if (totalReqCount > 0 && totalPrefCount > 0) {
    const wReq = HYBRID_MATCH_CONFIG.SKILL_WEIGHTS.REQUIRED;
    const wPref = HYBRID_MATCH_CONFIG.SKILL_WEIGHTS.PREFERRED;
    finalSkillScore = Math.round((wReq * reqCoverageRatio + wPref * prefCoverageRatio) * 100);
  } else if (totalReqCount > 0) {
    finalSkillScore = Math.round(reqCoverageRatio * 100);
  } else if (totalPrefCount > 0) {
    finalSkillScore = Math.round(prefCoverageRatio * 100);
  }

  // Ensure bounded strictly in [0, 100]
  finalSkillScore = Math.max(0, Math.min(100, finalSkillScore));

  return {
    skillScore: finalSkillScore,
    matchedRequiredSkills,
    missingRequiredSkills: missingReqArray,
    matchedPreferredSkills,
    missingPreferredSkills: missingPrefArray,
    relatedSkills,
    requiredCoveragePct: Math.round(reqCoverageRatio * 100),
    preferredCoveragePct: Math.round(prefCoverageRatio * 100),
  };
}
