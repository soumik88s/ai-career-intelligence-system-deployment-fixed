import React, { useState, useEffect } from "react";
import { GitCompare, AlertTriangle, CheckCircle, ArrowRight, RefreshCw, Sparkles, Layers } from "lucide-react";
import { NavigationTab, Job, SemanticMatchResult, ResumeRecord } from "../types";
import { useAuth } from "../context/AuthContext";
import { fetchBenchmarkJobs, calculateSemanticMatchApi, getUserResumesApi } from "../services/api";
import { EmptyState } from "../components/EmptyState";

interface SkillGapPageProps {
  setActiveTab: (tab: NavigationTab) => void;
}

export const SkillGapPage: React.FC<SkillGapPageProps> = ({ setActiveTab }) => {
  const { isAuthenticated, token, resume } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [userResumes, setUserResumes] = useState<ResumeRecord[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<SemanticMatchResult | null>(null);

  useEffect(() => {
    fetchBenchmarkJobs().then((res) => {
      setJobs(res.data);
      if (res.data.length > 0) setSelectedJob(res.data[0]);
    });

    if (isAuthenticated && token) {
      getUserResumesApi(token).then((res) => {
        if (res.resumes && res.resumes.length > 0) {
          setUserResumes(res.resumes);
          setSelectedResumeId(res.resumes[0].id);
        } else if (resume?.id) {
          setSelectedResumeId(resume.id);
        }
      });
    }
  }, [isAuthenticated, token, resume]);

  const handleAnalyzeGap = async () => {
    if (!token || !selectedResumeId || !selectedJob) return;
    setIsLoading(true);
    try {
      const res = await calculateSemanticMatchApi(token, selectedResumeId, selectedJob.id);
      if (res.success && res.match) {
        setMatchResult(res.match);
      }
    } catch (err) {
      console.error("Failed to analyze skill gap:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <EmptyState
        type="auth_required"
        title="Authentication Required for Skill Gap Analysis"
        description="Logging in provides candidate skill profile context to perform skill deficit mapping."
      />
    );
  }

  if (!resume && userResumes.length === 0) {
    return (
      <EmptyState
        type="no_resume"
        title="No Resume Available for Skill Gap Analysis"
        description="Please upload a resume to calculate skill gaps against target job requirements."
        onActionClick={() => setActiveTab("upload")}
        actionText="Upload Candidate Resume"
      />
    );
  }

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Candidate Skill Gap Analysis
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            Deficit analysis comparing candidate technical skills against target role requirements.
          </p>
        </div>

        <button
          onClick={() => setActiveTab("matching")}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>Full Hybrid Match Engine</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Controls */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
              Select Target Role:
            </label>
            <select
              value={selectedJob?.id || ""}
              onChange={(e) => {
                const j = jobs.find((item) => item.id === e.target.value);
                if (j) setSelectedJob(j);
              }}
              className="w-full text-xs p-2 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.company})
                </option>
              ))}
            </select>

            <button
              onClick={handleAnalyzeGap}
              disabled={isLoading || !selectedJob || !selectedResumeId}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Calculating Gaps...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze Skill Gaps
                </>
              )}
            </button>
          </div>

          <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
              Candidate Resume Skills ({resume?.parsedSkills?.length || 0})
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
              {resume?.parsedSkills?.map((s, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-[11px] bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Skill Gap Results View */}
        <div className="lg:col-span-2 space-y-4">
          {matchResult ? (
            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <span className="text-[10px] font-semibold text-blue-600 uppercase">Target Role Deficit Mapping</span>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">{selectedJob?.title}</h3>
                  <p className="text-xs text-stone-500">{selectedJob?.company}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {matchResult.skill_score}%
                  </span>
                  <span className="block text-[10px] text-stone-500 uppercase font-semibold">Skill Score</span>
                </div>
              </div>

              {/* Required Skill Gaps */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Required Skill Deficits (High Priority)
                </h4>
                {(matchResult.missing_required_skills || []).length > 0 ? (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2">
                    <p className="text-xs text-rose-900 dark:text-rose-200">
                      Acquiring these essential skills will directly increase candidate qualification for this position:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {matchResult.missing_required_skills?.map((sk, i) => (
                        <span key={i} className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-100 text-rose-900 dark:bg-rose-900 dark:text-rose-100 border border-rose-200 dark:border-rose-800">
                          ✗ {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-200 font-medium">
                    ✓ All required skills for this position are satisfied by candidate profile!
                  </div>
                )}
              </div>

              {/* Matched Required Skills */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Matched Required Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(matchResult.matched_required_skills || []).map((sk, i) => (
                    <span key={i} className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                      ✓ {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Related Skills */}
              {(matchResult.related_skills || []).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-600" />
                    Related / Transferable Skills (Partial Credit)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {matchResult.related_skills?.map((rel: any, i: number) => (
                      <span key={i} className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                        <span>{rel.candidateSkill}</span>
                        <span className="text-[10px] opacity-70">~ {rel.requiredSkill} ({Math.round(rel.creditScore * 100)}%)</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 p-8 rounded-xl border border-stone-200 dark:border-stone-800 text-center space-y-3">
              <GitCompare className="w-10 h-10 text-stone-400 mx-auto" />
              <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200">
                Ready for Skill Deficit Analysis
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Select a target role from the left menu and click <strong>"Analyze Skill Gaps"</strong> to view exact missing technical prerequisites.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
