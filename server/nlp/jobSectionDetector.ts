export interface JobSections {
  overview: string;
  responsibilities: string;
  required_qualifications: string;
  preferred_qualifications: string;
  education: string;
  experience: string;
  benefits: string;
  other: string;
}

export function detectJobSections(text: string): JobSections {
  const sections: JobSections = {
    overview: "",
    responsibilities: "",
    required_qualifications: "",
    preferred_qualifications: "",
    education: "",
    experience: "",
    benefits: "",
    other: "",
  };

  if (!text || !text.trim()) {
    return sections;
  }

  const lines = text.split("\n");
  let currentSection: keyof JobSections = "overview";

  const headersMap: { key: keyof JobSections; patterns: RegExp[] }[] = [
    {
      key: "preferred_qualifications",
      patterns: [
        /^(preferred|nice to have|bonus|plus|desired|desirable|good to have) (qualifications|skills|requirements|experience)?:?/i,
        /^(preferred|desired|plus|bonus):?/i
      ]
    },
    {
      key: "required_qualifications",
      patterns: [
        /^(required|must have|essential|minimum|basic) (qualifications|skills|requirements|prerequisites|experience)?:?/i,
        /^(requirements|qualifications|what you need|what we look for):?/i
      ]
    },
    {
      key: "responsibilities",
      patterns: [
        /^(responsibilities|what you will do|key responsibilities|role description|duties|job duties):?/i
      ]
    },
    {
      key: "education",
      patterns: [
        /^(education|academic background|degree requirements|educational qualification):?/i
      ]
    },
    {
      key: "experience",
      patterns: [
        /^(experience|work experience|years of experience|background required):?/i
      ]
    },
    {
      key: "benefits",
      patterns: [
        /^(benefits|what we offer|perks|compensation|package):?/i
      ]
    },
    {
      key: "overview",
      patterns: [
        /^(about the role|about us|job overview|summary|position summary|company overview):?/i
      ]
    }
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let matchedHeader = false;
    for (const h of headersMap) {
      if (h.patterns.some((pattern) => pattern.test(trimmed))) {
        currentSection = h.key;
        matchedHeader = true;
        break;
      }
    }

    if (!matchedHeader) {
      sections[currentSection] += (sections[currentSection] ? "\n" : "") + trimmed;
    }
  }

  return sections;
}
