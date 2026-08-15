import React, { useState, useEffect } from "react";
import { Target, Briefcase, Cpu, CheckCircle2, AlertCircle, Sparkles, ChevronRight, BarChart2, RefreshCw, History, Layers, HelpCircle } from "lucide-react";
import { NavigationTab, Job, SemanticMatchResult, MatchingHistoryRecord, ResumeRecord } from "../types";
import { useAuth } from "../context/AuthContext";
import { fetchBenchmarkJobs, calculateSemanticMatchApi, fetchMatchingHistoryApi, getUserResumesApi } from "../services/api";
import { EmptyState } from "../components/EmptyState";
import { ShapExplanationModal } from "../components/ShapExplanationModal";

interface JobMatchingPageProps {
  setActiveTab: (tab: NavigationTab) => void;
}

export const JobMatchingPage: React.FC<JobMatchingPageProps> = ({ setActiveTab }) => {
  const { isAuthenticated, token, resume } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [userResumes, setUserResumes] = useState<ResumeRecord[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchResult, setMatchResult] = useState<SemanticMatchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showShapModal, setShowShapModal] = useState(false);

  const [activeSubTab, setActiveSubTab] = useState<"match" | "history">("match");
  const [history, setHistory] = useState<MatchingHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Initial load
  useEffect(() => {
    fetchBenchmarkJobs().then((res) => {
      setJobs(res.data);
      if (res.data.length > 0) setSelectedJob(res.data[0]);
    });

    if (isAuthenticated && token) {
      getUserResumesApi(token)
        .then((res) => {
          if (res.resumes && res.resumes.length > 0) {
            setUserResumes(res.resumes);
            setSelectedResumeId(res.resumes[0].id);
          } else if (resume?.id) {
            setSelectedResumeId(resume.id);
          }
        })
        .catch((e) => console.error("Error loading user resumes:", e));
    }
  }, [isAuthenticated, token, resume]);

  // Load history when tab is clicked
  useEffect(() => {
    if (activeSubTab === "history" && isAuthenticated && token) {
      setHistoryLoading(true);
      fetchMatchingHistoryApi(token)
        .then((res) => {
          setHistory(res.history || []);
          setHistoryLoading(false);
        })
        .catch((e) => {
          console.error("History fetch error:", e);
          setHistoryLoading(false);
        });
    }
  }, [activeSubTab, isAuthenticated, token]);

  const handleRunMatch = async () => {
    if (!token || !selectedResumeId || !selectedJob) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    setMatchResult(null);

    try {
      const res = await calculateSemanticMatchApi(token, selectedResumeId, selectedJob.id);
      if (res.success && res.match) {
        setMatchResult(res.match);
      } else {
        setErrorMsg("Could not calculate semantic match score.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to execute ML semantic match engine.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <EmptyState
        type="auth_required"
        title="Authentication Required for Job Matching"
        description="Logging in ensures secure, isolated candidate job matching against vector job embeddings."
      />
    );
  }

  if (!resume && userResumes.length === 0) {
    return (
      <EmptyState
        type="no_resume"
        title="No Resume Uploaded for Job Matching"
        description="In order to calculate Sentence-BERT semantic similarity and component match scores, please upload a resume first."
        onActionClick={() => setActiveTab("upload")}
        actionText="Upload Candidate Resume"
      />
    );
  }

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Semantic Job Matching (Sentence-BERT ML Engine)
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            Compare candidate NLP profiles against benchmark job postings using transformer-based contextual embeddings.
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center gap-1 bg-stone-200/60 dark:bg-stone-800/60 p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab("match")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "match"
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Match Calculator
          </button>
          <button
            onClick={() => setActiveSubTab("history")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "history"
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            My Matches History
          </button>
        </div>
      </div>

      {activeSubTab === "history" ? (
        /* History View */
        <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-4">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            Recent ML Matching Results
          </h3>

          {historyLoading ? (
            <div className="py-8 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              Loading stored matching records...
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              No matching records stored yet. Run a match using the Match Calculator tab!
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        {record.job_title || "Target Position"}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-medium">
                        {record.model_name}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400">
                      Company: {record.job_company || "N/A"} • Resume: {record.resume_name || "Resume Document"}
                    </div>
                    <div className="text-[10px] text-stone-400">
                      Calculated on: {new Date(record.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-stone-200 dark:border-stone-700 pt-2 sm:pt-0 sm:pl-4">
                    <div className="text-center">
                      <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                        {record.semantic_score}%
                      </span>
                      <span className="block text-[9px] text-stone-500 uppercase font-semibold">
                        Sentence-BERT
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-lg font-extrabold text-stone-600 dark:text-stone-400">
                        {record.tfidf_score}%
                      </span>
                      <span className="block text-[9px] text-stone-500 uppercase font-semibold">
                        TF-IDF Baseline
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Match Calculator View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls & Sidebar */}
          <div className="space-y-4">
            {/* Resume Selector */}
            {userResumes.length > 0 && (
              <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                  Select Candidate Resume:
                </label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {userResumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.original_filename} ({new Date(r.uploaded_at).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Job Selection Sidebar */}
            <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
              <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Select Benchmark Position ({jobs.length})
              </h3>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {jobs.map((job) => {
                  const isSelected = selectedJob?.id === job.id;
                  return (
                    <button
                      key={job.id}
                      onClick={() => {
                        setSelectedJob(job);
                        setMatchResult(null);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-950 dark:text-blue-100"
                          : "bg-stone-50/50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate">{job.title}</span>
                        <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
                      </div>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 block mt-0.5">
                        {job.company} • {job.type}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Job Match & Action Area */}
          <div className="lg:col-span-2 space-y-6">
            {selectedJob ? (
              <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
                  <div>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Selected Target Position
                    </span>
                    <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                      {selectedJob.title}
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {selectedJob.company} • {selectedJob.location}
                    </p>
                  </div>

                  <button
                    onClick={handleRunMatch}
                    disabled={isAnalyzing || !selectedResumeId}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Analyzing Embeddings...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Analyze Match
                      </>
                    )}
                  </button>
                </div>

                {errorMsg && (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {!matchResult && !isAnalyzing && !errorMsg && (
                  <div className="py-12 text-center space-y-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-dashed border-stone-200 dark:border-stone-700">
                    <Cpu className="w-10 h-10 text-stone-400 mx-auto" />
                    <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                      Ready for Sentence-BERT Semantic Analysis
                    </h4>
                    <p className="text-xs text-stone-500 max-w-md mx-auto">
                      Click <strong className="text-stone-800 dark:text-stone-200">"Analyze Match"</strong> above to compute 384-dimensional vector embeddings using <code className="bg-stone-200 dark:bg-stone-700 px-1 py-0.5 rounded text-[10px]">sentence-transformers/all-MiniLM-L6-v2</code> and calculate exact cosine similarity.
                    </p>
                  </div>
                )}

                {matchResult && (
                  <div className="space-y-6">
                    {/* Overall Hybrid Match Banner */}
                    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-xs font-mono">
                              {matchResult.algorithm_version || "hybrid-v1.0"}
                            </span>
                            <span className="text-xs text-blue-100">
                              Multi-Factor Candidate Match
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold mt-1">
                            Overall Job Match
                          </h3>
                          <p className="text-xs text-blue-100/90 mt-0.5 max-w-md">
                            Weighted evaluation of semantic similarity, skill requirements, work experience, education level, and ATS compliance.
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-right">
                            <div className="text-4xl font-extrabold tracking-tight">
                              {matchResult.overall_score !== undefined ? matchResult.overall_score : matchResult.semantic_score}%
                            </div>
                            <div className="text-[10px] text-blue-200 uppercase font-semibold">
                              Overall Fit Score
                            </div>
                          </div>

                          <button
                            onClick={() => setShowShapModal(true)}
                            className="px-4 py-3 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                          >
                            <HelpCircle className="w-4 h-4 text-blue-600" />
                            <span>Why this match?</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 5 Core Match Factors Grid */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-blue-600" />
                        5-Factor Match Breakdown
                      </h4>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {/* 1. Semantic */}
                        <div className="p-3 bg-stone-50 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700 text-center space-y-1">
                          <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 block uppercase">Semantic</span>
                          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {matchResult.semantic_score}%
                          </span>
                          <span className="text-[9px] text-stone-400 block">
                            Weight: 35%
                          </span>
                        </div>

                        {/* 2. Skill */}
                        <div className="p-3 bg-stone-50 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700 text-center space-y-1">
                          <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 block uppercase">Skills</span>
                          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                            {matchResult.skill_score !== undefined ? matchResult.skill_score : (matchResult.component_scores?.skills?.score || 0)}%
                          </span>
                          <span className="text-[9px] text-stone-400 block">
                            Weight: 30%
                          </span>
                        </div>

                        {/* 3. Experience */}
                        <div className="p-3 bg-stone-50 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700 text-center space-y-1">
                          <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 block uppercase">Experience</span>
                          <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                            {matchResult.experience_score !== undefined ? matchResult.experience_score : (matchResult.component_scores?.experience?.score || 0)}%
                          </span>
                          <span className="text-[9px] text-stone-400 block">
                            Weight: 15%
                          </span>
                        </div>

                        {/* 4. Education */}
                        <div className="p-3 bg-stone-50 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700 text-center space-y-1">
                          <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 block uppercase">Education</span>
                          <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                            {matchResult.education_score !== undefined ? matchResult.education_score : (matchResult.component_scores?.education?.score || 0)}%
                          </span>
                          <span className="text-[9px] text-stone-400 block">
                            Weight: 10%
                          </span>
                        </div>

                        {/* 5. ATS */}
                        <div className="p-3 bg-stone-50 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700 text-center space-y-1 col-span-2 sm:col-span-1">
                          <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 block uppercase">ATS Format</span>
                          <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                            {matchResult.ats_score !== undefined ? matchResult.ats_score : 80}%
                          </span>
                          <span className="text-[9px] text-stone-400 block">
                            Weight: 10%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Skill Gap Analysis Section */}
                    <div className="p-5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-4">
                      <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Skill Gap & Alignment Map
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {/* Matched Required Skills */}
                        <div className="space-y-1.5">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400 block">
                            Matched Required Skills ({(matchResult.matched_required_skills || []).length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {(matchResult.matched_required_skills || []).length > 0 ? (
                              matchResult.matched_required_skills?.map((sk, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 font-medium">
                                  ✓ {sk}
                                </span>
                              ))
                            ) : (
                              <span className="text-stone-400 italic">None matched</span>
                            )}
                          </div>
                        </div>

                        {/* Missing Required Skills (Gaps) */}
                        <div className="space-y-1.5">
                          <span className="font-semibold text-rose-700 dark:text-rose-400 block">
                            Missing Required Skills / Gaps ({(matchResult.missing_required_skills || []).length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {(matchResult.missing_required_skills || []).length > 0 ? (
                              matchResult.missing_required_skills?.map((sk, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 font-medium">
                                  ✗ {sk}
                                </span>
                              ))
                            ) : (
                              <span className="text-emerald-600 font-medium">No missing required skills!</span>
                            )}
                          </div>
                        </div>

                        {/* Matched Preferred Skills */}
                        <div className="space-y-1.5">
                          <span className="font-semibold text-blue-700 dark:text-blue-400 block">
                            Matched Preferred Skills ({(matchResult.matched_preferred_skills || []).length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {(matchResult.matched_preferred_skills || []).length > 0 ? (
                              matchResult.matched_preferred_skills?.map((sk, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 font-medium">
                                  + {sk}
                                </span>
                              ))
                            ) : (
                              <span className="text-stone-400 italic">None matched</span>
                            )}
                          </div>
                        </div>

                        {/* Related / Transferable Skills */}
                        {(matchResult.related_skills || []).length > 0 && (
                          <div className="space-y-1.5 col-span-1 sm:col-span-2 border-t border-stone-200 dark:border-stone-700 pt-3">
                            <span className="font-semibold text-purple-700 dark:text-purple-400 block">
                              Related / Transferable Partial Matches ({(matchResult.related_skills || []).length})
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {matchResult.related_skills?.map((rel: any, i: number) => (
                                <span key={i} className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 font-medium flex items-center gap-1">
                                  <span>{rel.candidateSkill}</span>
                                  <span className="opacity-70 text-[10px]">~ {rel.requiredSkill} ({Math.round(rel.creditScore * 100)}%)</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Strengths */}
                      <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Candidate Key Strengths
                        </span>
                        <ul className="space-y-1 text-xs text-emerald-950 dark:text-emerald-200">
                          {(matchResult.strengths || []).map((str, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-600 mt-0.5">•</span>
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Weaknesses / Deficiencies */}
                      <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2">
                        <span className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                          Profile Deficiencies / Gaps
                        </span>
                        <ul className="space-y-1 text-xs text-rose-950 dark:text-rose-200">
                          {(matchResult.weaknesses || []).map((wk, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-rose-600 mt-0.5">•</span>
                              <span>{wk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* System Explanation Note */}
                    <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-stone-700 dark:text-stone-300 space-y-1">
                      <p className="font-semibold text-blue-900 dark:text-blue-300">
                        Hybrid Match Engine Explanation:
                      </p>
                      <p className="text-[11px] leading-relaxed">
                        {matchResult.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-stone-400">
                Please select a job position from the sidebar to begin matching.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SHAP Explanation Modal */}
      {showShapModal && matchResult && selectedJob && (
        <ShapExplanationModal
          isOpen={showShapModal}
          onClose={() => setShowShapModal(false)}
          entityType="matching_result"
          entityId={matchResult.id || `match_${selectedResumeId}_${selectedJob.id}`}
          resumeId={selectedResumeId}
          jobId={selectedJob.id}
          title={`Why this Job Match Score (${matchResult.overall_score || matchResult.semantic_score}%)?`}
        />
      )}
    </div>
  );
};
