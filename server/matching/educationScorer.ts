export interface EducationMatchResult {
  educationScore: number; // 0 - 100
  candidateDegree: string;
  jobRequirement: string;
  status: "EXACT_MATCH" | "RELATED_FIELD_MATCH" | "DEGREE_ONLY_MATCH" | "NOT_SPECIFIED" | "MISSING_DEGREE";
  explanation: string;
}

// Related fields map
const RELATED_FIELDS_MAP: Record<string, string[]> = {
  "computer science": ["software engineering", "computer engineering", "information technology", "data science", "mathematics", "electrical engineering"],
  "information technology": ["computer science", "software engineering", "cybersecurity", "information systems"],
  "data science": ["computer science", "statistics", "mathematics", "artificial intelligence", "physics"],
  "business administration": ["finance", "marketing", "management", "economics"],
  "electrical engineering": ["computer engineering", "electronics", "robotics", "mechatronics"]
};

/**
 * Transparent education degree & field matching function
 */
export function calculateEducationMatch(
  candidateEducationList: any[] = [],
  jobEducationRequirement: string | undefined | null
): EducationMatchResult {
  const reqText = (jobEducationRequirement || "").trim().toLowerCase();

  // Case 1: Job specifies no education requirement
  if (!reqText || reqText === "none" || reqText === "not specified" || reqText === "any") {
    return {
      educationScore: 100,
      candidateDegree: candidateEducationList[0]?.degree || "Not Listed",
      jobRequirement: "None Specified",
      status: "NOT_SPECIFIED",
      explanation: "Job position does not specify strict educational degree requirements.",
    };
  }

  if (!candidateEducationList || candidateEducationList.length === 0) {
    return {
      educationScore: 50,
      candidateDegree: "None Extracted",
      jobRequirement: jobEducationRequirement || "Degree Required",
      status: "MISSING_DEGREE",
      explanation: "Job requires educational qualifications, but no formal degree was found in candidate profile.",
    };
  }

  // Detect candidate degrees and fields
  let bestScore = 50;
  let bestStatus: EducationMatchResult["status"] = "MISSING_DEGREE";
  let bestExplanation = "Education level partially aligns with requirements.";
  let primaryDegree = candidateEducationList[0]?.degree || "Degree";

  for (const edu of candidateEducationList) {
    const degName = (edu.degree || "").toLowerCase();
    const fieldName = (edu.field || edu.major || "").toLowerCase();

    // Check degree level match (Bachelor's, Master's, PhD, etc.)
    const isBachelorReq = reqText.includes("bachelor") || reqText.includes("b.s") || reqText.includes("b.a") || reqText.includes("bs") || reqText.includes("degree");
    const isMasterReq = reqText.includes("master") || reqText.includes("m.s") || reqText.includes("ms");
    const isDoctorateReq = reqText.includes("phd") || reqText.includes("doctorate") || reqText.includes("ph.d");

    const candBachelor = degName.includes("bachelor") || degName.includes("b.s") || degName.includes("b.a") || degName.includes("bs") || degName.includes("b.tech") || degName.includes("be");
    const candMaster = degName.includes("master") || degName.includes("m.s") || degName.includes("ms") || degName.includes("m.tech");
    const candDoctorate = degName.includes("phd") || degName.includes("doctor") || degName.includes("ph.d");

    const degreeMatches = (isBachelorReq && candBachelor) || (isMasterReq && candMaster) || (isDoctorateReq && candDoctorate) || (candMaster || candDoctorate);

    // Check field match
    let fieldMatches = false;
    let relatedFieldMatches = false;

    if (fieldName) {
      if (reqText.includes(fieldName) || fieldName.split(" ").some(word => word.length > 3 && reqText.includes(word))) {
        fieldMatches = true;
      } else {
        // Check related fields
        for (const [key, relatedList] of Object.entries(RELATED_FIELDS_MAP)) {
          if (reqText.includes(key) && relatedList.some(r => fieldName.includes(r))) {
            relatedFieldMatches = true;
            break;
          }
        }
      }
    }

    if (degreeMatches && fieldMatches) {
      return {
        educationScore: 100,
        candidateDegree: `${edu.degree || "Bachelor"} in ${edu.field || "Computer Science"}`,
        jobRequirement: jobEducationRequirement || "Bachelor in CS",
        status: "EXACT_MATCH",
        explanation: `Candidate's ${edu.degree || "Degree"} in ${edu.field || "field"} directly satisfies job educational requirement.`,
      };
    } else if (degreeMatches && relatedFieldMatches) {
      if (85 > bestScore) {
        bestScore = 85;
        bestStatus = "RELATED_FIELD_MATCH";
        primaryDegree = `${edu.degree || "Degree"} in ${edu.field || "Related Field"}`;
        bestExplanation = `Candidate holds ${edu.degree} in ${edu.field}, which is a closely related technical field.`;
      }
    } else if (degreeMatches) {
      if (70 > bestScore) {
        bestScore = 70;
        bestStatus = "DEGREE_ONLY_MATCH";
        primaryDegree = `${edu.degree || "Degree"}`;
        bestExplanation = `Candidate holds required degree level (${edu.degree}), though in a different discipline (${edu.field || "general"}).`;
      }
    } else if (fieldMatches) {
      if (65 > bestScore) {
        bestScore = 65;
        bestStatus = "RELATED_FIELD_MATCH";
        primaryDegree = `${edu.field || "Field"} Education`;
        bestExplanation = `Candidate possesses relevant discipline focus (${edu.field}) but degree level differs.`;
      }
    }
  }

  return {
    educationScore: bestScore,
    candidateDegree: primaryDegree,
    jobRequirement: jobEducationRequirement || "Degree Required",
    status: bestStatus,
    explanation: bestExplanation,
  };
}
