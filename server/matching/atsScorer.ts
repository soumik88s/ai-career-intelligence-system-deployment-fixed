import { HYBRID_MATCH_CONFIG } from "./config.js";

export interface AtsMatchResult {
  atsScore: number; // 0 - 100
  keywordCoveragePct: number;
  terminologyCoveragePct: number;
  sectionCompletenessPct: number;
  foundKeywords: string[];
  missingKeywords: string[];
  detectedSections: string[];
  missingSections: string[];
  explanation: string;
}

const COMMON_STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he",
  "in", "is", "it", "its", "of", "on", "that", "the", "to", "was", "were",
  "will", "with", "we", "our", "you", "your", "this", "or", "an", "such", "than"
]);

/**
 * Extracts key domain terminology from job title & description, ignoring generic stop words
 */
export function extractKeyDomainTerms(jobTitle: string, jobDescription: string): string[] {
  const combined = `${jobTitle} ${jobDescription}`.toLowerCase();
  const words = combined.replace(/[^a-z0-9+#.\s]/gi, " ").split(/\s+/);

  const termFreq: Record<string, number> = {};
  words.forEach((w) => {
    const trimmed = w.trim();
    if (trimmed.length > 2 && !COMMON_STOPWORDS.has(trimmed) && !/^\d+$/.test(trimmed)) {
      termFreq[trimmed] = (termFreq[trimmed] || 0) + 1;
    }
  });

  // Sort by frequency and return top unique terms
  return Object.entries(termFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([term]) => term);
}

/**
 * Evaluates ATS format suitability, keyword coverage, and section completeness
 */
export function calculateAtsCompatibility(
  resumeText: string = "",
  candidateSkills: string[] = [],
  candidateAnalysis: any = {},
  jobTitle: string = "",
  jobDescription: string = "",
  jobSkills: string[] = []
): AtsMatchResult {
  const fullResumeText = `${resumeText} ${(candidateSkills || []).join(" ")}`.toLowerCase();

  // 1. Skill Keyword Coverage
  const cleanJobSkills = (jobSkills || []).map((s) => s.trim().toLowerCase()).filter(Boolean);
  let foundKeywords: string[] = [];
  let missingKeywords: string[] = [];

  if (cleanJobSkills.length > 0) {
    cleanJobSkills.forEach((skill) => {
      if (fullResumeText.includes(skill)) {
        foundKeywords.push(skill);
      } else {
        missingKeywords.push(skill);
      }
    });
  } else {
    foundKeywords = candidateSkills;
  }

  const keywordCoverageRatio = cleanJobSkills.length > 0
    ? foundKeywords.length / cleanJobSkills.length
    : 1.0;

  // 2. Role Terminology & Domain Keyword Coverage
  const domainTerms = extractKeyDomainTerms(jobTitle, jobDescription);
  const foundDomainTerms = domainTerms.filter((term) => fullResumeText.includes(term));
  const terminologyCoverageRatio = domainTerms.length > 0
    ? foundDomainTerms.length / domainTerms.length
    : 1.0;

  // 3. Section Completeness Check
  const expectedSections = [
    { name: "Contact Information", test: () => Boolean(candidateAnalysis.contact_email || candidateAnalysis.contact_phone || fullResumeText.includes("@")) },
    { name: "Executive Summary", test: () => Boolean(candidateAnalysis.summary || fullResumeText.includes("summary") || fullResumeText.includes("profile")) },
    { name: "Technical Skills", test: () => (candidateSkills || []).length > 0 },
    { name: "Work Experience", test: () => (candidateAnalysis.experience || []).length > 0 || fullResumeText.includes("experience") },
    { name: "Education", test: () => (candidateAnalysis.education || []).length > 0 || fullResumeText.includes("education") },
    { name: "Projects / Key Achievements", test: () => fullResumeText.includes("project") || fullResumeText.includes("achievement") }
  ];

  const detectedSections: string[] = [];
  const missingSections: string[] = [];

  expectedSections.forEach((sec) => {
    if (sec.test()) {
      detectedSections.push(sec.name);
    } else {
      missingSections.push(sec.name);
    }
  });

  const sectionCompletenessRatio = detectedSections.length / expectedSections.length;

  // Weighted Combination
  const w = HYBRID_MATCH_CONFIG.ATS_WEIGHTS;
  const rawScore = (
    w.SKILL_COVERAGE * keywordCoverageRatio +
    w.TERMINOLOGY_COVERAGE * terminologyCoverageRatio +
    w.SECTION_COMPLETENESS * sectionCompletenessRatio
  ) * 100;

  const atsScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  const explanation = `ATS Compatibility is ${atsScore}%. Detected ${detectedSections.length}/${expectedSections.length} essential resume sections and matched ${foundKeywords.length}/${cleanJobSkills.length || 1} required job keyword terms.`;

  return {
    atsScore,
    keywordCoveragePct: Math.round(keywordCoverageRatio * 100),
    terminologyCoveragePct: Math.round(terminologyCoverageRatio * 100),
    sectionCompletenessPct: Math.round(sectionCompletenessRatio * 100),
    foundKeywords,
    missingKeywords,
    detectedSections,
    missingSections,
    explanation,
  };
}
