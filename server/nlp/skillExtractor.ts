import { SKILL_KNOWLEDGE_BASE, SkillKBItem, findCanonicalSkill } from "./skillKnowledgeBase.js";
import { SectionMap } from "./sectionDetector.js";

export interface ExtractedSkill {
  skill_name: string;
  normalized_name: string;
  category: "Programming Languages" | "Frameworks & Libraries" | "Databases" | "Cloud & DevOps" | "Tools & Technologies" | "AI & Machine Learning" | "Other";
  original_text: string;
  confidence: number;
  source: string;
}

/**
 * Section-aware, hybrid skill extraction with false-positive protection.
 */
export function extractSkillsFromResume(sections: SectionMap): ExtractedSkill[] {
  const extractedMap = new Map<string, ExtractedSkill>();

  // Helper to test if a skill token exists safely in text
  const matchSkillInText = (text: string, skill: SkillKBItem): { matchedText: string; matched: boolean } => {
    if (!text) return { matchedText: "", matched: false };

    // Check canonical name and all aliases
    const candidates = [skill.skill_name, ...skill.aliases];

    for (const cand of candidates) {
      const lowerCand = cand.toLowerCase();

      // Special false-positive safeguards for short / tricky names:
      if (lowerCand === "c") {
        // C language: must be standalone C in lists like "C, C++", "C / C++", "Languages: C,", etc.
        const cRegex = /(^|[\s,:\/\(])C([\s,;\/\)]|$)/;
        if (cRegex.test(text)) {
          return { matchedText: "C", matched: true };
        }
        continue;
      }

      if (lowerCand === "go") {
        // Go language: match Golang or standalone Go in tech lists
        const goRegex = /(^|[\s,:\/\(])(golang|go)([\s,;\/\)]|$)/i;
        if (goRegex.test(text) && !/\b(go to|go live|going|ongoing)\b/i.test(text)) {
          return { matchedText: "Go", matched: true };
        }
        continue;
      }

      if (lowerCand === "java") {
        // Java language: MUST NOT match inside JavaScript
        const javaRegex = /(^|[^\w])java([^\w\.]|$)/i;
        const matches = text.match(javaRegex);
        if (matches) {
          // Verify it's not part of JavaScript / JavaFX
          const jsRegex = /\bjavascript\b/i;
          if (!jsRegex.test(text) || /\bjava\b(?!script)/i.test(text)) {
            return { matchedText: "Java", matched: true };
          }
        }
        continue;
      }

      if (lowerCand === "r") {
        // R language: standalone R in tech list
        const rRegex = /(^|[\s,:\/\(])R([\s,;\/\)]|$)/;
        if (rRegex.test(text)) {
          return { matchedText: "R", matched: true };
        }
        continue;
      }

      // Standard escape for regex special characters (e.g. C++, C#, .NET, Node.js)
      const escaped = cand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const wordRegex = new RegExp(`(^|[^a-zA-Z0-9_#\\+])${escaped}([^a-zA-Z0-9_#\\+]|$)`, "i");

      if (wordRegex.test(text)) {
        return { matchedText: cand, matched: true };
      }
    }

    return { matchedText: "", matched: false };
  };

  const processSectionText = (text: string | undefined, sourceName: string, defaultConfidence: number) => {
    if (!text) return;

    for (const skillItem of SKILL_KNOWLEDGE_BASE) {
      const matchResult = matchSkillInText(text, skillItem);

      if (matchResult.matched) {
        const key = skillItem.normalized_name;

        if (!extractedMap.has(key)) {
          extractedMap.set(key, {
            skill_name: skillItem.skill_name,
            normalized_name: skillItem.normalized_name,
            category: skillItem.category,
            original_text: matchResult.matchedText,
            confidence: defaultConfidence,
            source: sourceName,
          });
        } else {
          // If already extracted from a general section, upgrade confidence if now found in Skills section
          const existing = extractedMap.get(key)!;
          if (defaultConfidence > existing.confidence) {
            existing.confidence = defaultConfidence;
            existing.source = sourceName;
          }
        }
      }
    }
  };

  // 1. Process Skills Section (highest confidence)
  if (sections.skills) {
    processSectionText(sections.skills, "technical_skills_section", 0.98);
  }

  // 2. Process Experience Section
  if (sections.experience) {
    processSectionText(sections.experience, "experience_section", 0.90);
  }

  // 3. Process Projects Section
  if (sections.projects) {
    processSectionText(sections.projects, "projects_section", 0.90);
  }

  // 4. Process Summary / Other
  if (sections.summary) {
    processSectionText(sections.summary, "summary_section", 0.85);
  }
  if (sections.other) {
    processSectionText(sections.other, "raw_document_text", 0.80);
  }

  return Array.from(extractedMap.values());
}
