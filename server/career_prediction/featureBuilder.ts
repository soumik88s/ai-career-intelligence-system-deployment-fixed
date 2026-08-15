import { CandidateAnalysisProfile } from "../../src/types/index.js";

export const FEATURE_SKILL_VOCABULARY: string[] = [
  "Python", "PyTorch", "TensorFlow", "Scikit-learn", "Machine Learning", "MLOps", "LangChain", "NLP",
  "Transformers", "Vector DBs", "R", "SQL", "Pandas", "Statistics", "Data Visualization", "Excel",
  "Tableau", "Power BI", "Java", "C++", "Data Structures", "Algorithms", "Git", "Object-Oriented Design",
  "Node.js", "Go", "Express", "REST APIs", "PostgreSQL", "Docker", "React", "TypeScript", "JavaScript",
  "HTML/CSS", "Tailwind CSS", "Next.js", "Vue.js", "Kubernetes", "CI/CD", "Linux", "Terraform", "AWS",
  "Bash/Shell", "GCP", "Azure", "Cloud Networking", "Cyber Security", "Networking", "Penetration Testing",
  "SIEM", "Cryptography", "MySQL", "MongoDB", "Database Tuning", "Backup & Recovery", "Selenium", "Cypress",
  "Automated Testing", "JUnit", "Jira", "React Native", "Flutter", "Swift", "Kotlin", "Requirement Gathering",
  "Agile/Scrum", "Process Mapping", "GraphQL", "Microservices", "PySpark", "Redis", "Spring Boot",
  "Spark", "OpenCV", "Deep Learning", "Elasticsearch", "CI/CD Pipelines"
];

export interface ExtractedFeatureVector {
  featureVector: number[];
  featureNames: string[];
  matchedSkills: string[];
  totalExperienceYears: number;
  educationScore: number;
}

export function buildCandidateFeatureVector(candidateProfile: Partial<CandidateAnalysisProfile>): ExtractedFeatureVector {
  // Extract user skills normalized
  const candidateSkills = (candidateProfile.skills || []).map(s => (s.normalized_name || s.skill_name || "").toLowerCase().trim());
  const matchedSkills: string[] = [];

  // Multi-hot skill vector
  const skillVector = FEATURE_SKILL_VOCABULARY.map(vocabSkill => {
    const vNorm = vocabSkill.toLowerCase().trim();
    const isPresent = candidateSkills.some(cs => cs === vNorm || cs.includes(vNorm) || vNorm.includes(cs));
    if (isPresent) {
      matchedSkills.push(vocabSkill);
      return 1.0;
    }
    return 0.0;
  });

  // Calculate experience years
  let totalExperienceYears = 0;
  if (candidateProfile.experience && candidateProfile.experience.length > 0) {
    totalExperienceYears = candidateProfile.experience.length * 1.5; // default estimate if duration unparsed
  }
  // Experience feature normalized (capped at 15 years)
  const normExperience = Math.min(1.0, totalExperienceYears / 15.0);

  // Education score encoding
  let eduScore = 0.5; // default bachelors
  if (candidateProfile.education && candidateProfile.education.length > 0) {
    const degrees = candidateProfile.education.map(e => (e.degree || "").toLowerCase()).join(" ");
    if (degrees.includes("phd") || degrees.includes("doctorate")) {
      eduScore = 1.0;
    } else if (degrees.includes("master") || degrees.includes("m.s") || degrees.includes("m.tech")) {
      eduScore = 0.8;
    } else if (degrees.includes("bachelor") || degrees.includes("b.s") || degrees.includes("b.tech")) {
      eduScore = 0.6;
    }
  }

  // Combined feature vector
  const featureVector = [...skillVector, normExperience, eduScore];
  const featureNames = [
    ...FEATURE_SKILL_VOCABULARY.map(s => `skill_${s}`),
    "normalized_experience_years",
    "education_level_score"
  ];

  return {
    featureVector,
    featureNames,
    matchedSkills,
    totalExperienceYears,
    educationScore: eduScore
  };
}
