import { SKILL_KNOWLEDGE_BASE, SkillKBItem } from "./skillKnowledgeBase.js";
import { JobSections } from "./jobSectionDetector.js";

export interface ExtractedJobSkill {
  skill_name: string;
  normalized_name: string;
  category: string;
  skill_type: "required" | "preferred";
  importance?: number;
  confidence: number;
  original_text: string;
}

export function extractJobSkills(sections: JobSections, fullText: string): ExtractedJobSkill[] {
  const extractedMap = new Map<string, ExtractedJobSkill>();

  const lowerFullText = fullText.toLowerCase();

  const requiredText = (sections.required_qualifications + "\n" + sections.responsibilities + "\n" + sections.education + "\n" + sections.overview).toLowerCase();
  const preferredText = (sections.preferred_qualifications + "\n" + sections.other).toLowerCase();

  for (const kbItem of SKILL_KNOWLEDGE_BASE) {
    const termsToMatch = [kbItem.skill_name.toLowerCase(), kbItem.normalized_name, ...kbItem.aliases.map(a => a.toLowerCase())];

    let found = false;
    let matchedTerm = kbItem.skill_name;

    for (const term of termsToMatch) {
      if (term.length <= 2) {
        // Word boundary match for short terms like C, Go, R, TS
        const regex = new RegExp(`\\b${term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lowerFullText)) {
          found = true;
          matchedTerm = term;
          break;
        }
      } else {
        if (lowerFullText.includes(term)) {
          found = true;
          matchedTerm = term;
          break;
        }
      }
    }

    if (found) {
      // Determine skill_type (required vs preferred)
      let skillType: "required" | "preferred" = "required";

      // Check if found in preferred section or near preferred signals
      const preferredSignalRegex = new RegExp(`(${matchedTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})[^.!\n]*(is a plus|preferred|nice to have|bonus|optional)`, 'i');
      const isNearPreferredSignal = preferredSignalRegex.test(lowerFullText);

      if (preferredText.includes(matchedTerm) || isNearPreferredSignal) {
        // If it's explicitly in preferred text and not heavily emphasized in required text
        if (!requiredText.includes(matchedTerm) || isNearPreferredSignal) {
          skillType = "preferred";
        }
      }

      const key = kbItem.normalized_name;
      if (!extractedMap.has(key) || (extractedMap.get(key)?.skill_type === "preferred" && skillType === "required")) {
        extractedMap.set(key, {
          skill_name: kbItem.skill_name,
          normalized_name: kbItem.normalized_name,
          category: kbItem.category,
          skill_type: skillType,
          confidence: 0.95,
          original_text: matchedTerm
        });
      }
    }
  }

  return Array.from(extractedMap.values());
}
