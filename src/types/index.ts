export type NavigationTab = 
  | "landing"
  | "dashboard"
  | "login"
  | "register"
  | "upload"
  | "analysis"
  | "matching"
  | "jobs"
  | "recommendations"
  | "career_prediction"
  | "skillgap"
  | "roadmap"
  | "assistant"
  | "architecture"
  | "settings";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface UserProfile {
  id?: string;
  user_id?: string;
  phone: string;
  location: string;
  education: string;
  experience_years: number;
  target_role: string;
  created_at?: string;
  updated_at?: string;
}

export interface ResumeRecord {
  id: string;
  user_id: string;
  original_filename: string;
  stored_filename?: string;
  file_path: string;
  file_type: string;
  file_size_bytes: number;
  extracted_text?: string;
  processing_status: "uploaded" | "processing" | "completed" | "failed" | string;
  processing_error?: string;
  uploaded_at: string;
  processed_at?: string | null;
}

export interface ExtractedTextDetails {
  resume_id: string;
  original_filename: string;
  extracted_text: string;
  processing_status: string;
  processing_error?: string;
  char_count: number;
  word_count: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  experience_level: string;
  required_skills: string[];
  education: string;
  description: string;
}

export interface SystemInfo {
  projectTitle: string;
  subtitle: string;
  matchingWeights: {
    semanticSimilarity: number;
    skillMatch: number;
    experienceMatch: number;
    educationMatch: number;
    atsCompatibility: number;
  };
  evaluationMetrics: string[];
  architectureModules: {
    name: string;
    status: string;
    implemented: boolean;
  }[];
}

export interface CandidateSkill {
  id?: string;
  skill_name: string;
  normalized_name: string;
  category: "Programming Languages" | "Frameworks & Libraries" | "Databases" | "Cloud & DevOps" | "Tools & Technologies" | "AI & Machine Learning" | "Other" | string;
  original_text?: string;
  confidence: number;
  source?: string;
  is_user_corrected?: boolean;
}

export interface CandidateEducationItem {
  id?: string;
  degree: string;
  field: string;
  institution: string;
  start_year?: number | null;
  end_year?: number | null;
  score?: string;
  raw_text?: string;
  confidence: number;
  is_user_corrected?: boolean;
}

export interface CandidateExperienceItem {
  id?: string;
  company: string;
  job_title: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  duration?: string;
  description?: string;
  skills?: string[];
  raw_text?: string;
  confidence: number;
  is_user_corrected?: boolean;
}

export interface CandidateProjectItem {
  id?: string;
  title: string;
  description?: string;
  technologies?: string[];
  domain?: string;
  link?: string;
  raw_text?: string;
  confidence: number;
  is_user_corrected?: boolean;
}

export interface CandidateCertificationItem {
  id?: string;
  certification_name: string;
  issuing_organization?: string;
  issue_date?: string;
  credential_id?: string;
  credential_url?: string;
  raw_text?: string;
  confidence: number;
  is_user_corrected?: boolean;
}

export interface CandidateAnalysisProfile {
  id?: string;
  user_id?: string;
  resume_id?: string;
  summary: string;
  roles: string[];
  skills: CandidateSkill[];
  education: CandidateEducationItem[];
  experience: CandidateExperienceItem[];
  projects: CandidateProjectItem[];
  certifications: CandidateCertificationItem[];
  processing_status: "not_started" | "processing" | "completed" | "failed" | string;
  processing_error?: string;
  analyzer_version?: string;
  analyzed_at?: string;
}

export interface CandidateResume {
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  extractedText?: string;
  parsedSkills?: string[];
  parsedEducation?: string[];
  parsedExperienceYears?: number;
  isDevelopmentData?: boolean;
}

// ================================================================
// PHASE 5: JOB INTELLIGENCE TYPES
// ================================================================

export interface JobSkillItem {
  id?: string;
  job_id?: string;
  skill_name: string;
  normalized_name: string;
  category?: string;
  skill_type: "required" | "preferred";
  importance?: number | null;
  confidence?: number;
  original_text?: string;
}

export interface JobEducationRequirement {
  id?: string;
  job_id?: string;
  degree: string;
  field: string;
  institution_type?: string;
  required: boolean;
  original_text?: string;
}

export interface JobExperienceRequirement {
  id?: string;
  job_id?: string;
  minimum_years: number | null;
  maximum_years: number | null;
  job_role?: string;
  original_text?: string;
}

export interface JobRecord {
  id: string;
  title: string;
  normalized_title?: string;
  company: string;
  description: string;
  location: string;
  work_mode: "Remote" | "Hybrid" | "On-site" | "Unknown" | string;
  employment_type: "Full-time" | "Part-time" | "Internship" | "Contract" | "Temporary" | "Freelance" | "Unknown" | string;
  experience_min?: number | null;
  experience_max?: number | null;
  education_requirement?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string;
  application_url?: string;
  source?: string;
  external_job_id?: string;
  posted_at?: string;
  is_active?: boolean;
  processing_status?: string;
  required_skills?: string[];
  preferred_skills?: string[];
  skills?: JobSkillItem[];
  education_details?: JobEducationRequirement[];
  experience_details?: JobExperienceRequirement[];
}

export interface JobAnalysisProfile {
  job_id: string;
  original_title: string;
  normalized_title: string;
  company: string;
  work_mode: string;
  employment_type: string;
  skills: JobSkillItem[];
  required_skills: string[];
  preferred_skills: string[];
  experience: JobExperienceRequirement[];
  experience_min: number | null;
  experience_max: number | null;
  education: JobEducationRequirement[];
  education_requirement: string;
  summary: string;
  processing_status: string;
  analyzed_at?: string;
}

// Backward compatibility job alias
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  experience_years?: number;
  required_skills: string[];
  preferred_skills?: string[];
  education_level?: string;
  description: string;
  posted_date?: string;
  matchScore?: number;
}

// ================================================================
// PHASE 6: SEMANTIC MATCHING TYPES
// ================================================================

export interface ComponentScoreItem {
  similarity: number;
  score: number;
}

export interface HybridMatchResult {
  id?: string;
  resume_id: string;
  job_id: string;
  overall_score: number;
  semantic_score: number;
  skill_score: number;
  experience_score: number;
  education_score: number;
  ats_score: number;
  semantic_similarity: number;
  tfidf_score?: number;
  model_name: string;
  matched_required_skills: string[];
  missing_required_skills: string[];
  matched_preferred_skills: string[];
  missing_preferred_skills: string[];
  related_skills: any[];
  strengths: string[];
  weaknesses: string[];
  explanation: string;
  algorithm_version?: string;
  weight_configuration?: Record<string, number>;
  breakdown?: any;
  created_at: string;
}

export interface SemanticMatchResult extends Partial<HybridMatchResult> {
  id?: string;
  resume_id: string;
  job_id: string;
  model_name: string;
  model_version?: string;
  semantic_similarity: number;
  semantic_score: number;
  tfidf_similarity: number;
  tfidf_score: number;
  overall_score?: number;
  skill_score?: number;
  experience_score?: number;
  education_score?: number;
  ats_score?: number;
  matched_required_skills?: string[];
  missing_required_skills?: string[];
  matched_preferred_skills?: string[];
  missing_preferred_skills?: string[];
  related_skills?: any[];
  strengths?: string[];
  weaknesses?: string[];
  algorithm_version?: string;
  weight_configuration?: Record<string, number>;
  component_scores?: {
    skills: ComponentScoreItem;
    experience: ComponentScoreItem;
    education: ComponentScoreItem;
  };
  explanation: string;
  created_at: string;
}

export interface MatchingHistoryRecord {
  id: string;
  user_id: string;
  resume_id: string;
  job_id: string;
  resume_name?: string;
  job_title?: string;
  job_company?: string;
  model_name: string;
  semantic_similarity: number;
  semantic_score: number;
  tfidf_similarity: number;
  tfidf_score: number;
  overall_score?: number;
  skill_score?: number;
  experience_score?: number;
  education_score?: number;
  ats_score?: number;
  explanation: string;
  created_at: string;
}

// ================================================================
// PHASE 9: CAREER ROLE PREDICTION TYPES
// ================================================================

export interface CareerPredictionItem {
  role: string;
  score: number;
  rank: number;
  category: string;
  description: string;
  matched_skills: string[];
  missing_skills: string[];
  evidence_signals: string[];
}

export interface CareerPredictionResponse {
  model_name: string;
  model_version: string;
  resume_id: string;
  candidate_summary?: string;
  extracted_skill_count: number;
  total_experience_years: number;
  predictions: CareerPredictionItem[];
  disclaimer: string;
  generated_at: string;
}

export interface CareerModelEvaluation {
  model_name: string;
  model_version: string;
  trained_at: string;
  dataset_sample_count: number;
  accuracy: number;
  macro_f1: number;
  weighted_f1: number;
  precision: number;
  recall: number;
  experiments: {
    model_key: string;
    model_name: string;
    accuracy: number;
    macro_f1: number;
    precision: number;
    recall: number;
    notes: string;
  }[];
  error_analysis: {
    top_confused_role_pairs: {
      true_role: string;
      predicted_role: string;
      confusion_count: number;
      explanation: string;
    }[];
    lowest_recall_roles: string[];
    highest_precision_roles: string[];
  };
}

// Phase 10: Career Roadmap Types
export interface RoadmapSkillItem {
  id: string;
  skill_name: string;
  priority: "HIGH PRIORITY" | "MEDIUM PRIORITY" | "LOW PRIORITY";
  reason: string;
  suggested_duration: string;
  prerequisites: string[];
  market_frequency_pct?: number;
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


