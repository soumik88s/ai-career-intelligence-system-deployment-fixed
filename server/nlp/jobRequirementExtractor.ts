import { JobSections } from "./jobSectionDetector.js";

export interface ExtractedJobExperience {
  minimum_years: number | null;
  maximum_years: number | null;
  job_role: string;
  original_text: string;
}

export interface ExtractedJobEducation {
  degree: string;
  field: string;
  institution_type: string;
  required: boolean;
  original_text: string;
}

export function extractJobExperienceRequirements(sections: JobSections, fullText: string): ExtractedJobExperience[] {
  const experiences: ExtractedJobExperience[] = [];
  const textToScan = (sections.required_qualifications + "\n" + sections.experience + "\n" + fullText);

  // Range pattern e.g., "2-4 years", "3 to 5 yrs", "2 - 5 years of experience"
  const rangeRegex = /(\b\d+)\s*(?:-|to|–)\s*(\d+)\+?\s*(?:years|yrs|year)\b/gi;
  let match;

  while ((match = rangeRegex.exec(textToScan)) !== null) {
    const min = parseInt(match[1], 10);
    const max = parseInt(match[2], 10);
    experiences.push({
      minimum_years: min,
      maximum_years: max,
      job_role: "Software Engineering",
      original_text: match[0]
    });
  }

  // Min plus pattern e.g., "3+ years", "at least 5 years", "5+ yrs"
  if (experiences.length === 0) {
    const minPlusRegex = /(?:at least\s+)?(\d+)\+?\s*(?:years|yrs|year)\s*(?:of\s+)?(?:relevant\s+)?(?:experience)?/gi;
    while ((match = minPlusRegex.exec(textToScan)) !== null) {
      const min = parseInt(match[1], 10);
      experiences.push({
        minimum_years: min,
        maximum_years: null,
        job_role: "Software Engineering",
        original_text: match[0]
      });
      break; // take first valid match
    }
  }

  // Entry level / Freshers pattern e.g. "freshers welcome", "0-1 years", "entry level"
  if (experiences.length === 0) {
    if (/fresher|entry level|0[- ]1\s*year/i.test(textToScan)) {
      experiences.push({
        minimum_years: 0,
        maximum_years: 1,
        job_role: "Entry Level / Graduate",
        original_text: "Freshers welcome / Entry Level"
      });
    }
  }

  return experiences;
}

export function extractJobEducationRequirements(sections: JobSections, fullText: string): ExtractedJobEducation[] {
  const educationList: ExtractedJobEducation[] = [];
  const textToScan = (sections.education + "\n" + sections.required_qualifications + "\n" + sections.preferred_qualifications + "\n" + fullText);

  const lowerText = textToScan.toLowerCase();

  const isPreferred = sections.preferred_qualifications.toLowerCase().includes("bachelor") ||
                      sections.preferred_qualifications.toLowerCase().includes("degree") ||
                      lowerText.includes("degree preferred");

  const isRequired = !isPreferred;

  // Degrees
  let degree = "";
  if (/\b(b\.?s\.?|b\.?tech\.?|b\.?e\.?|bachelor|bachelors|bachelor's)\b/i.test(textToScan)) {
    degree = "Bachelor's";
  } else if (/\b(m\.?s\.?|m\.?tech\.?|master|masters|master's)\b/i.test(textToScan)) {
    degree = "Master's";
  } else if (/\b(ph\.?d\.?|doctorate|doctoral)\b/i.test(textToScan)) {
    degree = "Ph.D.";
  }

  // Fields
  let field = "";
  if (/computer science/i.test(textToScan)) {
    field = "Computer Science";
  } else if (/information technology/i.test(textToScan)) {
    field = "Information Technology";
  } else if (/software engineering/i.test(textToScan)) {
    field = "Software Engineering";
  } else if (/data science|statistics|mathematics/i.test(textToScan)) {
    field = "Data Science / Mathematics";
  } else if (/electrical|electronics/i.test(textToScan)) {
    field = "Electrical & Computer Engineering";
  }

  if (degree || field) {
    educationList.push({
      degree: degree || "Bachelor's Degree",
      field: field || "Computer Science or related technical field",
      institution_type: "Accredited University",
      required: isRequired,
      original_text: degree ? `${degree} in ${field || "Computer Science or equivalent"}` : field
    });
  }

  return educationList;
}
