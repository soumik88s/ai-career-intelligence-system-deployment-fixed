import { Job, SystemInfo, UserProfile, ResumeRecord } from "../types";

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status} (${res.statusText})`);
    }
    throw new Error("Invalid JSON response from server.");
  }
}

export async function fetchHealthStatus() {
  try {
    const res = await fetch("/api/health");
    if (!res.ok) throw new Error("Health status fetch failed");
    return await res.json();
  } catch (error) {
    console.error("API Error - Health check:", error);
    return null;
  }
}

export async function fetchSystemInfo(): Promise<SystemInfo | null> {
  try {
    const res = await fetch("/api/system/info");
    if (!res.ok) throw new Error("System info fetch failed");
    return await res.json();
  } catch (error) {
    console.error("API Error - System info:", error);
    return null;
  }
}

export async function fetchBenchmarkJobs(): Promise<{ total: number; data: Job[] }> {
  try {
    const res = await fetch("/api/jobs?page_size=50");
    if (!res.ok) throw new Error("Jobs fetch failed");
    const json = await res.json();
    const jobsList = (json.jobs || json.data || []).map((j: any) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.location,
      type: j.employment_type || "Full-time",
      experience_years: j.experience_min || 2,
      required_skills: j.required_skills || [],
      preferred_skills: j.preferred_skills || [],
      description: j.description
    }));
    return { total: json.total || jobsList.length, data: jobsList };
  } catch (error) {
    console.error("API Error - Benchmark jobs:", error);
    return { total: 0, data: [] };
  }
}

// ================================================================
// AUTHENTICATION & USER PROFILE API ENDPOINTS
// ================================================================

export async function registerUserApi(name: string, email: string, password: string) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Registration failed");
  }
  return data;
}

export async function loginUserApi(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Login failed");
  }
  return data;
}

export async function getCurrentUserApi(token: string) {
  const res = await fetch("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch user session");
  }
  return data;
}

export async function updateUserProfileApi(token: string, profileData: Partial<UserProfile>) {
  const res = await fetch("/api/users/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to update profile");
  }
  return data;
}

// ================================================================
// PHASE 3: RESUME UPLOAD & TEXT EXTRACTION API
// ================================================================

export async function uploadResumeFileApi(file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/resumes/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to upload resume file.");
  }
  return data;
}

export async function getUserResumesApi(token: string): Promise<{ resumes: ResumeRecord[] }> {
  const res = await fetch("/api/resumes", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch resumes");
  }
  return data;
}

export async function getResumeDetailsApi(token: string, resumeId: string): Promise<{ resume: ResumeRecord }> {
  const res = await fetch(`/api/resumes/${resumeId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch resume details");
  }
  return data;
}

export async function getResumeExtractedTextApi(token: string, resumeId: string): Promise<{
  resume_id: string;
  original_filename: string;
  extracted_text: string;
  processing_status: string;
  processing_error?: string;
  char_count: number;
  word_count: number;
}> {
  const res = await fetch(`/api/resumes/${resumeId}/text`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch extracted text");
  }
  return data;
}

export async function deleteUserResumeApi(token: string, resumeId: string) {
  const res = await fetch(`/api/resumes/${resumeId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to delete resume");
  }
  return data;
}

// ================================================================
// PHASE 4: NLP RESUME INTELLIGENCE API
// ================================================================

export async function triggerResumeAnalysisApi(token: string, resumeId: string) {
  const res = await fetch(`/api/resumes/${resumeId}/analyze`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to trigger resume NLP analysis.");
  }
  return data;
}

export async function getCandidateAnalysisApi(token: string, resumeId: string) {
  const res = await fetch(`/api/resumes/${resumeId}/analysis`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    if (res.status === 404) {
      return { analysis: null, notFound: true, message: data.error };
    }
    throw new Error(data.error || "Failed to fetch candidate profile analysis.");
  }
  return data;
}

export async function updateCandidateAnalysisApi(token: string, resumeId: string, updatedFields: any) {
  const res = await fetch(`/api/resumes/${resumeId}/analysis`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedFields),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to update candidate profile analysis.");
  }
  return data;
}

// Backward compatibility alias
export async function uploadResumeFile(file: File, token?: string | null) {
  if (!token) {
    throw new Error("Authentication required to upload resume.");
  }
  return uploadResumeFileApi(file, token);
}

// ================================================================
// PHASE 5: JOB INTELLIGENCE API CALLERS
// ================================================================

export async function fetchJobsApi(params?: {
  search?: string;
  work_mode?: string;
  employment_type?: string;
  location?: string;
  page?: number;
  page_size?: number;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.work_mode && params.work_mode !== "All") query.set("work_mode", params.work_mode);
  if (params?.employment_type && params.employment_type !== "All") query.set("employment_type", params.employment_type);
  if (params?.location && params.location !== "All") query.set("location", params.location);
  if (params?.page) query.set("page", params.page.toString());
  if (params?.page_size) query.set("page_size", params.page_size.toString());

  const url = `/api/jobs${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch jobs.");
  }
  return data;
}

export async function fetchJobDetailsApi(jobId: string) {
  const res = await fetch(`/api/jobs/${jobId}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch job details.");
  }
  return data;
}

export async function createJobPostingApi(token: string, jobData: {
  title: string;
  company: string;
  description: string;
  location?: string;
  work_mode?: string;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  application_url?: string;
}) {
  const res = await fetch("/api/jobs", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jobData),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to create job posting.");
  }
  return data;
}

export async function triggerJobAnalysisApi(token: string, jobId: string) {
  const res = await fetch(`/api/jobs/${jobId}/analyze`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to run job NLP analysis.");
  }
  return data;
}

export async function fetchJobAnalysisApi(jobId: string) {
  const res = await fetch(`/api/jobs/${jobId}/analysis`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch job analysis.");
  }
  return data;
}

export async function importJobsBulkApi(token: string, jobsList: any[]) {
  const res = await fetch("/api/jobs/import", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ jobs: jobsList }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to import jobs.");
  }
  return data;
}

export async function deleteJobPostingApi(token: string, jobId: string) {
  const res = await fetch(`/api/jobs/${jobId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to delete job posting.");
  }
  return data;
}

// ================================================================
// PHASE 6: SEMANTIC MATCHING API FUNCTIONS
// ================================================================

export async function calculateSemanticMatchApi(token: string, resumeId: string, jobId: string) {
  const res = await fetch(`/api/matching/resume/${resumeId}/job/${jobId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to calculate semantic match.");
  }
  return data;
}

export async function fetchMatchingHistoryApi(token: string) {
  const res = await fetch("/api/matching/history", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch matching history.");
  }
  return data;
}

export async function fetchModelComparisonApi(token: string, resumeId: string, jobId: string) {
  const res = await fetch("/api/matching/compare", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resume_id: resumeId, job_id: jobId }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to run model comparison.");
  }
  return data;
}

// ================================================================
// PHASE 8: RECOMMENDATIONS API FUNCTIONS
// ================================================================

export async function fetchRecommendationsApi(
  token: string,
  params: {
    resume_id?: string;
    page?: number;
    page_size?: number;
    location?: string;
    work_mode?: string;
    employment_type?: string;
    minimum_score?: number;
    target_role?: string;
    sort_by?: string;
    force_refresh?: boolean;
  }
) {
  const query = new URLSearchParams();
  if (params.resume_id) query.append("resume_id", params.resume_id);
  if (params.page) query.append("page", params.page.toString());
  if (params.page_size) query.append("page_size", params.page_size.toString());
  if (params.location && params.location !== "All") query.append("location", params.location);
  if (params.work_mode && params.work_mode !== "All") query.append("work_mode", params.work_mode);
  if (params.employment_type && params.employment_type !== "All") query.append("employment_type", params.employment_type);
  if (params.minimum_score) query.append("minimum_score", params.minimum_score.toString());
  if (params.target_role) query.append("target_role", params.target_role);
  if (params.sort_by) query.append("sort_by", params.sort_by);
  if (params.force_refresh) query.append("force_refresh", "true");

  const res = await fetch(`/api/recommendations?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch job recommendations.");
  }
  return data;
}

export async function refreshRecommendationsApi(
  token: string,
  params: {
    resume_id?: string;
    location?: string;
    work_mode?: string;
    employment_type?: string;
    minimum_score?: number;
    target_role?: string;
    sort_by?: string;
  }
) {
  const res = await fetch("/api/recommendations/refresh", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(data.error || "Failed to refresh recommendations.");
  }
  return data;
}

// ================================================================
// PHASE 11: EXPLAINABLE AI WITH SHAP API CLIENT FUNCTIONS
// ================================================================

export async function fetchCareerPredictionExplanationApi(
  token: string,
  predictionId: string,
  roleName?: string,
  resumeId?: string
) {
  const query = new URLSearchParams();
  if (roleName) query.append("role", roleName);
  if (resumeId) query.append("resume_id", resumeId);

  const res = await fetch(`/api/career/prediction/${predictionId}/explanation?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch career prediction explanation.");
  }
  return data;
}

export async function fetchMatchingExplanationApi(
  token: string,
  matchingResultId: string,
  resumeId?: string,
  jobId?: string
) {
  const query = new URLSearchParams();
  if (resumeId) query.append("resume_id", resumeId);
  if (jobId) query.append("job_id", jobId);

  const res = await fetch(`/api/matching/${matchingResultId}/explanation?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch job matching explanation.");
  }
  return data;
}

export async function fetchGlobalFeatureImportanceApi(token: string) {
  const res = await fetch("/api/career/explainability/global", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch global feature importance.");
  }
  return data;
}



