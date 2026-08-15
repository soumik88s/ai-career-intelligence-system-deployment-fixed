export function normalizeWorkMode(text: string): "Remote" | "Hybrid" | "On-site" | "Unknown" {
  if (!text) return "Unknown";
  const lower = text.toLowerCase();

  if (lower.includes("remote") || lower.includes("work from home") || lower.includes("wfh") || lower.includes("telecommute") || lower.includes("anywhere")) {
    return "Remote";
  }
  if (lower.includes("hybrid") || lower.includes("flexible office") || lower.includes("partially remote") || lower.includes("days in office")) {
    return "Hybrid";
  }
  if (lower.includes("on-site") || lower.includes("onsite") || lower.includes("in-office") || lower.includes("office-based") || lower.includes("in office")) {
    return "On-site";
  }

  return "Unknown";
}

export function normalizeEmploymentType(text: string): "Full-time" | "Part-time" | "Internship" | "Contract" | "Temporary" | "Freelance" | "Unknown" {
  if (!text) return "Unknown";
  const lower = text.toLowerCase();

  if (lower.includes("full-time") || lower.includes("full time") || lower.includes("permanent")) {
    return "Full-time";
  }
  if (lower.includes("part-time") || lower.includes("part time")) {
    return "Part-time";
  }
  if (lower.includes("internship") || lower.includes("intern") || lower.includes("co-op")) {
    return "Internship";
  }
  if (lower.includes("contract") || lower.includes("contractor") || lower.includes("c2c") || lower.includes("w2 contract")) {
    return "Contract";
  }
  if (lower.includes("temporary") || lower.includes("temp")) {
    return "Temporary";
  }
  if (lower.includes("freelance") || lower.includes("freelancer")) {
    return "Freelance";
  }

  return "Unknown";
}

export function normalizeJobRole(rawTitle: string): { originalTitle: string; normalizedTitle: string } {
  if (!rawTitle || !rawTitle.trim()) {
    return { originalTitle: "", normalizedTitle: "Software Engineer" };
  }

  const cleaned = rawTitle.trim();
  const lower = cleaned.toLowerCase();

  if (lower.includes("machine learning") || lower.includes("ml engineer") || lower.includes("ai engineer") || lower.includes("deep learning")) {
    return { originalTitle: cleaned, normalizedTitle: "Machine Learning Engineer" };
  }
  if (lower.includes("data scientist") || lower.includes("data science")) {
    return { originalTitle: cleaned, normalizedTitle: "Data Scientist" };
  }
  if (lower.includes("data engineer") || lower.includes("big data")) {
    return { originalTitle: cleaned, normalizedTitle: "Data Engineer" };
  }
  if (lower.includes("frontend") || lower.includes("front-end") || lower.includes("react developer") || lower.includes("ui engineer")) {
    return { originalTitle: cleaned, normalizedTitle: "Frontend Engineer" };
  }
  if (lower.includes("backend") || lower.includes("back-end") || lower.includes("node engineer") || lower.includes("python developer")) {
    return { originalTitle: cleaned, normalizedTitle: "Backend Engineer" };
  }
  if (lower.includes("fullstack") || lower.includes("full-stack") || lower.includes("full stack")) {
    return { originalTitle: cleaned, normalizedTitle: "Full Stack Engineer" };
  }
  if (lower.includes("devops") || lower.includes("sre") || lower.includes("site reliability") || lower.includes("cloud engineer")) {
    return { originalTitle: cleaned, normalizedTitle: "DevOps / Cloud Engineer" };
  }
  if (lower.includes("android") || lower.includes("ios") || lower.includes("mobile engineer") || lower.includes("flutter")) {
    return { originalTitle: cleaned, normalizedTitle: "Mobile Application Engineer" };
  }
  if (lower.includes("cybersecurity") || lower.includes("security engineer") || lower.includes("infosec")) {
    return { originalTitle: cleaned, normalizedTitle: "Cybersecurity Engineer" };
  }

  return { originalTitle: cleaned, normalizedTitle: cleaned };
}
