import React, { useEffect, useState } from "react";
import {
  Briefcase,
  Search,
  Filter,
  MapPin,
  Building,
  Plus,
  Upload,
  RefreshCw,
  Trash2,
  ExternalLink,
  CheckCircle,
  X,
  FileText,
  Clock,
  GraduationCap,
  Sparkles,
  AlertCircle,
  Award,
  Layers,
  ChevronRight,
  Zap,
  Sliders,
  Check,
  XCircle,
  HelpCircle
} from "lucide-react";
import { JobRecord, JobAnalysisProfile, ResumeRecord } from "../types";
import {
  fetchJobsApi,
  fetchJobDetailsApi,
  createJobPostingApi,
  triggerJobAnalysisApi,
  fetchJobAnalysisApi,
  importJobsBulkApi,
  deleteJobPostingApi,
  getUserResumesApi,
  fetchRecommendationsApi,
  refreshRecommendationsApi,
  fetchModelComparisonApi
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { NavigationTab } from "../types";

interface JobRecommendationsPageProps {
  setActiveTab?: (tab: NavigationTab) => void;
}

export const JobRecommendationsPage: React.FC<JobRecommendationsPageProps> = ({ setActiveTab }) => {
  const { token, user } = useAuth();

  // Active View Tab
  const [activeSubTab, setActiveSubTab] = useState<"recommendations" | "dataset">("recommendations");

  // ====================================================================
  // PHASE 8: RECOMMENDATION ENGINE STATE
  // ====================================================================
  const [userResumes, setUserResumes] = useState<ResumeRecord[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [recLoading, setRecLoading] = useState<boolean>(false);
  const [recRefreshing, setRecRefreshing] = useState<boolean>(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [recResponse, setRecResponse] = useState<any | null>(null);

  // Recommendation Filters
  const [recLocation, setRecLocation] = useState<string>("All");
  const [recWorkMode, setRecWorkMode] = useState<string>("All");
  const [recEmploymentType, setRecEmploymentType] = useState<string>("All");
  const [recMinScore, setRecMinScore] = useState<number>(0);
  const [recTargetRole, setRecTargetRole] = useState<string>("");
  const [recSortBy, setRecSortBy] = useState<"best_match" | "most_recent" | "highest_skill" | "highest_semantic">("best_match");
  const [recPage, setRecPage] = useState<number>(1);

  // ====================================================================
  // JOB DATASET STATE (Phase 4 / Phase 7)
  // ====================================================================
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dataset Filters
  const [search, setSearch] = useState("");
  const [workModeFilter, setWorkModeFilter] = useState("All");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("All");

  // Selected Job for Analysis Modal
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobRecord | null>(null);
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysisProfile | null>(null);
  const [analyzingJob, setAnalyzingJob] = useState(false);
  const [modelComparison, setModelComparison] = useState<any | null>(null);
  const [comparingModels, setComparingModels] = useState<boolean>(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Add Job Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newWorkMode, setNewWorkMode] = useState("Hybrid");
  const [newEmploymentType, setNewEmploymentType] = useState("Full-time");
  const [newDescription, setNewDescription] = useState("");
  const [newAppUrl, setNewAppUrl] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Import State
  const [importText, setImportText] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  // ====================================================================
  // INITIALIZATION & RESUME FETCHING
  // ====================================================================
  useEffect(() => {
    if (token) {
      loadUserResumes();
    }
  }, [token]);

  const loadUserResumes = async () => {
    if (!token) return;
    try {
      const res = await getUserResumesApi(token);
      const list = res.resumes || [];
      setUserResumes(list);

      const completed = list.find((r) => r.processing_status === "completed") || list[0];
      if (completed) {
        setSelectedResumeId(completed.id);
      }
    } catch (err) {
      console.error("Failed to load user resumes:", err);
    }
  };

  // ====================================================================
  // LOAD RECOMMENDATIONS
  // ====================================================================
  const loadRecommendations = async (forceRefresh: boolean = false) => {
    if (!token) return;
    if (forceRefresh) setRecRefreshing(true);
    else setRecLoading(true);
    setRecError(null);

    try {
      const result = await fetchRecommendationsApi(token, {
        resume_id: selectedResumeId || undefined,
        page: recPage,
        page_size: 10,
        location: recLocation !== "All" ? recLocation : undefined,
        work_mode: recWorkMode !== "All" ? recWorkMode : undefined,
        employment_type: recEmploymentType !== "All" ? recEmploymentType : undefined,
        minimum_score: recMinScore > 0 ? recMinScore : undefined,
        target_role: recTargetRole.trim() || undefined,
        sort_by: recSortBy,
        force_refresh: forceRefresh,
      });

      setRecResponse(result);
    } catch (err: any) {
      setRecError(err.message || "Failed to generate job recommendations.");
    } finally {
      setRecLoading(false);
      setRecRefreshing(false);
    }
  };

  useEffect(() => {
    if (token && activeSubTab === "recommendations") {
      loadRecommendations(false);
    }
  }, [
    token,
    activeSubTab,
    selectedResumeId,
    recLocation,
    recWorkMode,
    recEmploymentType,
    recMinScore,
    recTargetRole,
    recSortBy,
    recPage,
  ]);

  // ====================================================================
  // LOAD JOBS DATASET
  // ====================================================================
  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchJobsApi({
        search,
        work_mode: workModeFilter,
        employment_type: employmentTypeFilter,
        page,
        page_size: 8,
      });
      setJobs(res.jobs || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err: any) {
      setError(err.message || "Failed to load jobs dataset.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === "dataset") {
      loadJobs();
    }
  }, [activeSubTab, search, workModeFilter, employmentTypeFilter, page]);

  // Handle Open Job Details
  const handleOpenJobDetails = async (jobId: string) => {
    setSelectedJobId(jobId);
    setSelectedJob(null);
    setJobAnalysis(null);
    setModelComparison(null);
    try {
      const jobRes = await fetchJobDetailsApi(jobId);
      setSelectedJob(jobRes.job);

      try {
        const analysisRes = await fetchJobAnalysisApi(jobId);
        setJobAnalysis(analysisRes.analysis);
      } catch (e) {
        // Analysis not created yet
      }

      // If user has a selected resume, attempt model comparison
      if (token && selectedResumeId) {
        try {
          setComparingModels(true);
          const compRes = await fetchModelComparisonApi(token, selectedResumeId, jobId);
          setModelComparison(compRes.models);
        } catch (e) {
          // Model comparison optional
        } finally {
          setComparingModels(false);
        }
      }
    } catch (err: any) {
      alert("Error loading job details: " + err.message);
    }
  };

  // Run Job NLP Analysis
  const handleRunNlp = async (jobId: string) => {
    if (!token) {
      alert("Please log in to trigger job NLP analysis.");
      return;
    }
    setAnalyzingJob(true);
    try {
      const res = await triggerJobAnalysisApi(token, jobId);
      setJobAnalysis(res.analysis);
      await loadJobs();
    } catch (err: any) {
      alert("NLP Analysis failed: " + err.message);
    } finally {
      setAnalyzingJob(false);
    }
  };

  // Create Job Handler
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert("You must be logged in to post a job.");
      return;
    }
    setAddError(null);
    setAddLoading(true);
    try {
      await createJobPostingApi(token, {
        title: newTitle,
        company: newCompany,
        location: newLocation,
        work_mode: newWorkMode,
        employment_type: newEmploymentType,
        description: newDescription,
        application_url: newAppUrl,
      });

      setShowAddModal(false);
      setNewTitle("");
      setNewCompany("");
      setNewLocation("");
      setNewDescription("");
      setNewAppUrl("");
      if (activeSubTab === "dataset") await loadJobs();
      else loadRecommendations(true);
    } catch (err: any) {
      setAddError(err.message || "Failed to create job.");
    } finally {
      setAddLoading(false);
    }
  };

  // Bulk Import Handler
  const handleBulkImport = async () => {
    if (!token) {
      alert("You must be logged in to import jobs.");
      return;
    }
    setImportResult(null);
    setImportLoading(true);

    try {
      let parsedJobs: any[] = [];
      const trimmed = importText.trim();

      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        const parsed = JSON.parse(trimmed);
        parsedJobs = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        const lines = trimmed.split("\n").filter((l) => l.trim().length > 0);
        if (lines.length > 1) {
          const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
            const obj: any = {};
            headers.forEach((h, idx) => {
              if (cols[idx]) obj[h] = cols[idx];
            });
            parsedJobs.push(obj);
          }
        }
      }

      if (parsedJobs.length === 0) {
        alert("Could not parse valid jobs from input. Provide a valid JSON array or CSV string.");
        setImportLoading(false);
        return;
      }

      const res = await importJobsBulkApi(token, parsedJobs);
      setImportResult({
        imported: res.imported,
        skipped: res.skipped,
        errors: res.errors || [],
      });
      if (activeSubTab === "dataset") await loadJobs();
      else loadRecommendations(true);
    } catch (err: any) {
      alert("Import error: " + err.message);
    } finally {
      setImportLoading(false);
    }
  };

  // Delete Job Handler
  const handleDeleteJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) {
      alert("Authentication required.");
      return;
    }
    if (!confirm("Are you sure you want to delete this job posting?")) return;

    try {
      await deleteJobPostingApi(token, jobId);
      if (selectedJobId === jobId) setSelectedJobId(null);
      if (activeSubTab === "dataset") await loadJobs();
      else loadRecommendations(true);
    } catch (err: any) {
      alert("Failed to delete job: " + err.message);
    }
  };

  return (
    <div className="space-y-6 py-2">
      {/* Header & Tab Toggle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            AI Intelligent Job Recommendation & Ranking
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            Hybrid candidate-job matching engine combining Sentence-BERT semantic similarity, NLP skill gap evaluation, and soft preference scoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Tabs */}
          <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
            <button
              onClick={() => setActiveSubTab("recommendations")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeSubTab === "recommendations"
                  ? "bg-white dark:bg-stone-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              AI Recommendations
            </button>
            <button
              onClick={() => setActiveSubTab("dataset")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeSubTab === "dataset"
                  ? "bg-white dark:bg-stone-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              All Jobs & Ingestion
            </button>
          </div>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Post Job
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: AI RECOMMENDATIONS ENGINE VIEW                                */}
      {/* ==================================================================== */}
      {activeSubTab === "recommendations" && (
        <div className="space-y-6">
          {/* Controls & Candidate Profile Selector */}
          <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Resume Selector */}
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 shrink-0">Candidate Resume Profile:</span>
                {userResumes.length > 0 ? (
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-3 py-1.5 font-medium text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-500"
                  >
                    {userResumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.original_filename} ({r.processing_status})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs text-stone-500 dark:text-stone-400 italic">No resumes uploaded</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadRecommendations(true)}
                  disabled={recRefreshing || !selectedResumeId}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${recRefreshing ? "animate-spin" : ""}`} />
                  Re-Calculate Recommendations
                </button>
              </div>
            </div>

            {/* Recommendation Filters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
              {/* Target Role Keyword Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Target Role Keyword</label>
                <input
                  type="text"
                  placeholder="e.g. Engineer, Data..."
                  value={recTargetRole}
                  onChange={(e) => setRecTargetRole(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Work Mode Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Work Mode</label>
                <select
                  value={recWorkMode}
                  onChange={(e) => setRecWorkMode(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                >
                  <option value="All">All Modes</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>

              {/* Employment Type */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Employment Type</label>
                <select
                  value={recEmploymentType}
                  onChange={(e) => setRecEmploymentType(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                >
                  <option value="All">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Location</label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco..."
                  value={recLocation === "All" ? "" : recLocation}
                  onChange={(e) => setRecLocation(e.target.value || "All")}
                  className="w-full px-2.5 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Minimum Score */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Min Overall Score ({recMinScore}%)</label>
                <select
                  value={recMinScore}
                  onChange={(e) => setRecMinScore(parseInt(e.target.value, 10))}
                  className="w-full px-2.5 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                >
                  <option value={0}>Any Score (&ge; 0%)</option>
                  <option value={50}>Moderate (&ge; 50%)</option>
                  <option value={60}>Good (&ge; 60%)</option>
                  <option value={70}>Strong (&ge; 70%)</option>
                  <option value={80}>High Quality (&ge; 80%)</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Sort By</label>
                <select
                  value={recSortBy}
                  onChange={(e) => setRecSortBy(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                >
                  <option value="best_match">Best Match Score</option>
                  <option value="highest_skill">Highest Skill Score</option>
                  <option value="highest_semantic">Highest Semantic Score</option>
                  <option value="most_recent">Most Recent Posted</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cold-Start Banner / Warning */}
          {recResponse?.cold_start && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    Candidate Resume Profile Analysis Required
                  </h3>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    {recResponse.message || "Please upload and process a resume in the Resumes section to trigger hybrid match calculations."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab && setActiveTab("upload")}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors shrink-0"
              >
                Go to Resume Upload &rarr;
              </button>
            </div>
          )}

          {/* Error Message */}
          {recError && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl p-4 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{recError}</span>
            </div>
          )}

          {/* Loading Indicator */}
          {recLoading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
              <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
                Analyzing candidate profile against available job dataset using Sentence-BERT & hybrid match algorithms...
              </p>
            </div>
          ) : (
            recResponse &&
            !recResponse.cold_start && (
              <div className="space-y-4">
                {/* Result Metadata Bar */}
                <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                  <span>
                    Showing <strong className="text-stone-900 dark:text-stone-100">{recResponse.recommendations?.length || 0}</strong> of{" "}
                    <strong className="text-stone-900 dark:text-stone-100">{recResponse.total || 0}</strong> ranked jobs
                  </span>
                  {recResponse.algorithm_version && (
                    <span className="font-mono text-[10px] bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md border border-stone-200 dark:border-stone-700">
                      Engine: {recResponse.algorithm_version}
                    </span>
                  )}
                </div>

                {/* Recommendations List */}
                {recResponse.recommendations && recResponse.recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {recResponse.recommendations.map((item: any) => {
                      const scoreColor =
                        item.overall_score >= 80
                          ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                          : item.overall_score >= 60
                          ? "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                          : "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800";

                      return (
                        <div
                          key={item.id || item.job_id}
                          className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 transition-all space-y-4"
                        >
                          {/* Top Row: Rank Badge, Title, Company, Score */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                #{item.rank}
                              </span>
                              <div>
                                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                                  {item.job_title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600 dark:text-stone-400 mt-1">
                                  <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                                    <Building className="w-3.5 h-3.5 text-stone-400" />
                                    {item.job_company}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                                    {item.job_location}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[11px] font-medium border border-stone-200 dark:border-stone-700">
                                    {item.job_work_mode} &bull; {item.job_employment_type}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Match Score Badge */}
                            <div className="flex items-center gap-3 shrink-0">
                              <div className={`px-3 py-2 rounded-xl border font-extrabold text-sm text-center ${scoreColor}`}>
                                <div>{item.overall_score}%</div>
                                <div className="text-[9px] font-normal uppercase tracking-wider opacity-80">Match Score</div>
                              </div>
                            </div>
                          </div>

                          {/* Deterministic Recommendation Explanation Box */}
                          <div className="bg-stone-50 dark:bg-stone-800/60 rounded-lg p-3 text-xs text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700/60 space-y-1">
                            <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-[11px]">
                              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              Why this position was recommended:
                            </div>
                            <p className="leading-relaxed">{item.recommendation_reason}</p>
                          </div>

                          {/* Sub-Score Factor Breakdown */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-center text-xs">
                            <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/40">
                              <div className="text-[10px] text-stone-500 uppercase font-medium">Semantic</div>
                              <div className="font-bold text-stone-900 dark:text-stone-100 mt-0.5">{item.semantic_score}%</div>
                            </div>
                            <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/40">
                              <div className="text-[10px] text-stone-500 uppercase font-medium">Skill Match</div>
                              <div className="font-bold text-stone-900 dark:text-stone-100 mt-0.5">{item.skill_score}%</div>
                            </div>
                            <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/40">
                              <div className="text-[10px] text-stone-500 uppercase font-medium">Experience</div>
                              <div className="font-bold text-stone-900 dark:text-stone-100 mt-0.5">{item.experience_score}%</div>
                            </div>
                            <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/40">
                              <div className="text-[10px] text-stone-500 uppercase font-medium">Education</div>
                              <div className="font-bold text-stone-900 dark:text-stone-100 mt-0.5">{item.education_score}%</div>
                            </div>
                            <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/40 col-span-2 sm:col-span-1">
                              <div className="text-[10px] text-stone-500 uppercase font-medium">ATS Format</div>
                              <div className="font-bold text-stone-900 dark:text-stone-100 mt-0.5">{item.ats_score}%</div>
                            </div>
                          </div>

                          {/* Skill Chips (Matched vs Missing) */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-stone-500 text-[11px]">Matched:</span>
                              {item.matched_skills && item.matched_skills.length > 0 ? (
                                item.matched_skills.slice(0, 5).map((sk: string) => (
                                  <span key={sk} className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium text-[11px] border border-emerald-200 dark:border-emerald-800">
                                    &check; {sk}
                                  </span>
                                ))
                              ) : (
                                <span className="text-stone-400 italic text-[11px]">None detected</span>
                              )}

                              {item.missing_skills && item.missing_skills.length > 0 && (
                                <>
                                  <span className="font-semibold text-stone-500 text-[11px] ml-2">Missing Gaps:</span>
                                  {item.missing_skills.slice(0, 3).map((sk: string) => (
                                    <span key={sk} className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium text-[11px] border border-amber-200 dark:border-amber-800">
                                      &times; {sk}
                                    </span>
                                  ))}
                                </>
                              )}
                            </div>

                            {/* View Breakdown Trigger */}
                            <button
                              onClick={() => handleOpenJobDetails(item.job_id)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 flex items-center gap-1 shrink-0 self-end sm:self-auto transition-colors"
                            >
                              <span>View Full Breakdown</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
                    <Briefcase className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                    <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">No Job Recommendations Found</h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                      Try relaxing your filters or click "Re-Calculate Recommendations" above.
                    </p>
                  </div>
                )}

                {/* Pagination Controls */}
                {recResponse.total_pages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-stone-800">
                    <button
                      onClick={() => setRecPage((p) => Math.max(1, p - 1))}
                      disabled={recPage <= 1}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-50"
                    >
                      &larr; Previous Page
                    </button>
                    <span className="text-xs text-stone-600 dark:text-stone-400">
                      Page {recPage} of {recResponse.total_pages}
                    </span>
                    <button
                      onClick={() => setRecPage((p) => Math.min(recResponse.total_pages, p + 1))}
                      disabled={recPage >= recResponse.total_pages}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-50"
                    >
                      Next Page &rarr;
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: JOB DATASET & INGESTION VIEW                                  */}
      {/* ==================================================================== */}
      {activeSubTab === "dataset" && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                placeholder="Search jobs by title, company, or description keywords..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                <Filter className="w-3.5 h-3.5" />
                <span>Work Mode:</span>
                <select
                  value={workModeFilter}
                  onChange={(e) => {
                    setWorkModeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100"
                >
                  <option value="All">All Modes</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                <span>Type:</span>
                <select
                  value={employmentTypeFilter}
                  onChange={(e) => {
                    setEmploymentTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100"
                >
                  <option value="All">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dataset Table / Grid */}
          {loading ? (
            <div className="py-12 text-center text-stone-500 dark:text-stone-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading jobs dataset...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl text-xs border border-red-200 dark:border-red-800">
              {error}
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
              <Briefcase className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">No Job Postings Found</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Click "Post New Job" or "Import (CSV/JSON)" above to populate the job intelligence database.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => handleOpenJobDetails(job.id)}
                  className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        {job.title}
                      </h3>
                      <button
                        onClick={(e) => handleDeleteJob(job.id, e)}
                        className="text-stone-400 hover:text-red-600 transition-colors p-1 rounded-md"
                        title="Delete Job Posting"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600 dark:text-stone-400">
                      <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-stone-400" />
                        {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        {job.location}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-medium border border-stone-200 dark:border-stone-700">
                        {job.work_mode || "Hybrid"}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-medium border border-stone-200 dark:border-stone-700">
                        {job.employment_type || "Full-time"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
                    <span className="text-[11px] text-stone-400">
                      {job.posted_at ? new Date(job.posted_at).toLocaleDateString() : "Recently Added"}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 text-xs">
                      View Details &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-stone-800">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-50"
              >
                &larr; Previous Page
              </button>
              <span className="text-xs text-stone-600 dark:text-stone-400">
                Page {page} of {totalPages} ({total} total jobs)
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-50"
              >
                Next Page &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: JOB DETAILS & DEEP ANALYSIS MODAL                           */}
      {/* ==================================================================== */}
      {selectedJobId && selectedJob && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-3xl w-full p-6 shadow-xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
              <div>
                <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">{selectedJob.title}</h2>
                <div className="flex flex-wrap items-center gap-x-3 text-xs text-stone-600 dark:text-stone-400 mt-1">
                  <span className="font-semibold text-stone-800 dark:text-stone-200">{selectedJob.company}</span>
                  <span>&bull;</span>
                  <span>{selectedJob.location}</span>
                  <span>&bull;</span>
                  <span>{selectedJob.work_mode} ({selectedJob.employment_type})</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedJobId(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Model Comparison Breakdown if available */}
            {modelComparison && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-4 rounded-xl border border-blue-200 dark:border-blue-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Multi-Model Algorithm Score Comparison
                  </h4>
                  <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-md">
                    Phase 7 Match Engine
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white dark:bg-stone-900 p-3 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
                    <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Hybrid Match Engine</div>
                    <div className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-1">
                      {modelComparison.hybrid?.score}%
                    </div>
                    <div className="text-[10px] text-stone-500 mt-0.5">Multi-Factor Score</div>
                  </div>

                  <div className="bg-white dark:bg-stone-900 p-3 rounded-lg border border-stone-200 dark:border-stone-800 text-center">
                    <div className="text-[10px] uppercase font-bold text-stone-500">Sentence-BERT</div>
                    <div className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-1">
                      {modelComparison.sbert?.score}%
                    </div>
                    <div className="text-[10px] text-stone-500 mt-0.5">Contextual Embedding</div>
                  </div>

                  <div className="bg-white dark:bg-stone-900 p-3 rounded-lg border border-stone-200 dark:border-stone-800 text-center">
                    <div className="text-[10px] uppercase font-bold text-stone-500">TF-IDF Baseline</div>
                    <div className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-1">
                      {modelComparison.tfidf?.score}%
                    </div>
                    <div className="text-[10px] text-stone-500 mt-0.5">Keyword Cosine</div>
                  </div>
                </div>
              </div>
            )}

            {/* Job Description Text */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-stone-500 tracking-wider">Job Description</h4>
              <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl text-xs text-stone-800 dark:text-stone-200 space-y-2 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                {selectedJob.description}
              </div>
            </div>

            {/* Extracted NLP Analysis Details */}
            {jobAnalysis ? (
              <div className="space-y-4 pt-2 border-t border-stone-200 dark:border-stone-800">
                <h4 className="text-xs font-bold uppercase text-stone-500 tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Extracted Job NLP Analysis Profile
                </h4>

                {/* Skills Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">Required Skills ({jobAnalysis.required_skills?.length || 0}):</span>
                    <div className="flex flex-wrap gap-1">
                      {jobAnalysis.required_skills && jobAnalysis.required_skills.length > 0 ? (
                        jobAnalysis.required_skills.map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[11px] font-medium border border-blue-200 dark:border-blue-800">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-stone-400 italic">None extracted</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">Preferred Skills ({jobAnalysis.preferred_skills?.length || 0}):</span>
                    <div className="flex flex-wrap gap-1">
                      {jobAnalysis.preferred_skills && jobAnalysis.preferred_skills.length > 0 ? (
                        jobAnalysis.preferred_skills.map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-medium border border-stone-200 dark:border-stone-700">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-stone-400 italic">None extracted</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <span className="text-xs text-stone-500">NLP section extraction not triggered for this job yet.</span>
                <button
                  onClick={() => handleRunNlp(selectedJob.id)}
                  disabled={analyzingJob}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${analyzingJob ? "animate-spin" : ""}`} />
                  {analyzingJob ? "Analyzing..." : "Trigger NLP Section Analysis"}
                </button>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
              {selectedJob.application_url ? (
                <a
                  href={selectedJob.application_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors"
                >
                  <span>Apply Now</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-xs text-stone-400">No application link provided</span>
              )}
              <button
                onClick={() => setSelectedJobId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: POST NEW JOB MODAL                                          */}
      {/* ==================================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Post New Job Description
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3">
              {addError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-lg text-xs border border-red-200">
                  {addError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">Job Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ML Engineer"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">Company *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OpenAI"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">Location</label>
                  <input
                    type="text"
                    placeholder="San Francisco, CA"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">Work Mode</label>
                  <select
                    value={newWorkMode}
                    onChange={(e) => setNewWorkMode(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">Employment</label>
                  <select
                    value={newEmploymentType}
                    onChange={(e) => setNewEmploymentType(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">Job Description *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Paste complete job description, requirements, and qualifications..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                ></textarea>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">Application URL</label>
                <input
                  type="url"
                  placeholder="https://company.com/careers/123"
                  value={newAppUrl}
                  onChange={(e) => setNewAppUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold border border-stone-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {addLoading ? "Saving..." : "Save Job Posting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: BULK IMPORT MODAL                                           */}
      {/* ==================================================================== */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                Bulk Import Jobs (JSON / CSV)
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400">
              Paste a JSON array of job objects (with fields <code>title</code>, <code>company</code>, <code>description</code>, <code>location</code>) or CSV string.
            </p>

            <textarea
              rows={6}
              placeholder={`[\n  {\n    "title": "Data Engineer",\n    "company": "TechCorp",\n    "location": "Remote",\n    "description": "Must know Python, SQL, Spark..."\n  }\n]`}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full font-mono px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
            ></textarea>

            {importResult && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-200 rounded-lg space-y-1">
                <div className="font-bold">Import Completed:</div>
                <div>&bull; Imported: {importResult.imported} jobs</div>
                <div>&bull; Skipped duplicates: {importResult.skipped}</div>
              </div>
            )}

            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-xs font-semibold border border-stone-300 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={handleBulkImport}
                disabled={importLoading || !importText.trim()}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {importLoading ? "Processing Import..." : "Run Import"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
