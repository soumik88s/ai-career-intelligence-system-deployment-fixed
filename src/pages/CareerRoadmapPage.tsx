import React, { useState, useEffect } from "react";
import {
  Milestone,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FolderGit2,
  BookOpen,
  Award,
  Edit3,
  Save,
  Check
} from "lucide-react";
import { NavigationTab, CareerRoadmapData, RoadmapMilestoneItem } from "../types";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "../components/EmptyState";
import { CAREER_ROLE_TAXONOMY } from "../../server/career_prediction/roleTaxonomy.js";

interface CareerRoadmapPageProps {
  setActiveTab: (tab: NavigationTab) => void;
}

export const CareerRoadmapPage: React.FC<CareerRoadmapPageProps> = ({ setActiveTab }) => {
  const { isAuthenticated, token, userResumes, resume } = useAuth();

  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [targetRole, setTargetRole] = useState<string>("Machine Learning Engineer");
  const [durationMonths, setDurationMonths] = useState<number>(6);

  const [roadmap, setRoadmap] = useState<CareerRoadmapData | null>(null);
  const [historicalRoadmaps, setHistoricalRoadmaps] = useState<CareerRoadmapData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [updatingMilestoneId, setUpdatingMilestoneId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [expandedStageIndex, setExpandedStageIndex] = useState<number>(0);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>("");

  useEffect(() => {
    if (userResumes.length > 0 && !selectedResumeId) {
      setSelectedResumeId(userResumes[0].id);
    } else if (resume && !selectedResumeId) {
      setSelectedResumeId(resume.id);
    }
  }, [userResumes, resume, selectedResumeId]);

  // Load existing roadmaps for user on mount or resume change
  useEffect(() => {
    if (isAuthenticated && token && selectedResumeId) {
      fetchUserRoadmaps(selectedResumeId);
    }
  }, [isAuthenticated, token, selectedResumeId]);

  const fetchUserRoadmaps = async (resumeId: string) => {
    try {
      const res = await fetch(`/api/career/roadmaps?resume_id=${resumeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setHistoricalRoadmaps(json.data);
          setRoadmap(json.data[0]); // Active or most recent
        } else {
          setRoadmap(null);
        }
      }
    } catch (err) {
      console.error("Failed to load user roadmaps:", err);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!selectedResumeId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/career/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          resume_id: selectedResumeId,
          target_role: targetRole,
          duration_months: durationMonths
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to generate career roadmap.");
      }

      setRoadmap(json.data);
      setHistoricalRoadmaps((prev) => [json.data, ...prev]);
      setExpandedStageIndex(0);
    } catch (err: any) {
      setError(err.message || "Error generating career roadmap.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMilestone = async (
    milestoneId: string,
    newStatus: "not_started" | "in_progress" | "completed",
    newProgress: number,
    notesToSave?: string
  ) => {
    if (!token) return;
    setUpdatingMilestoneId(milestoneId);

    try {
      const res = await fetch(`/api/career/roadmap/milestones/${milestoneId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          progress_percentage: newProgress,
          notes: notesToSave !== undefined ? notesToSave : tempNotes
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update milestone.");
      }

      // Update local state reactively
      if (roadmap) {
        const updatedStages = roadmap.stages.map((stg) => {
          const updatedMsList = stg.milestones.map((ms) => {
            if (ms.id === milestoneId) {
              return {
                ...ms,
                status: newStatus,
                progress_percentage: newProgress,
                notes: notesToSave !== undefined ? notesToSave : tempNotes
              };
            }
            return ms;
          });
          return { ...stg, milestones: updatedMsList };
        });

        setRoadmap({
          ...roadmap,
          overall_progress: json.data.overall_progress,
          stages: updatedStages
        });
      }
      setEditingNotesId(null);
    } catch (err: any) {
      alert("Failed to update milestone: " + err.message);
    } finally {
      setUpdatingMilestoneId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <EmptyState
        type="auth_required"
        title="Authentication Required for Career Roadmap"
        description="Please log in to generate a personalized multi-phase career progression roadmap."
      />
    );
  }

  if (userResumes.length === 0) {
    return (
      <EmptyState
        type="no_resume"
        title="No Candidate Profile Available for Roadmap Generation"
        description="To generate step-by-step career milestones and skill development paths, please upload a resume first."
        onActionClick={() => setActiveTab("upload")}
        actionText="Upload Candidate Resume"
      />
    );
  }

  return (
    <div className="space-y-6 py-2 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Milestone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Personalized AI Career Roadmap & Planner
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            Data-backed career trajectory, missing skill gap prioritization, milestone tracking, and project suggestions.
          </p>
        </div>

        {/* Historical Roadmap Selector */}
        {historicalRoadmaps.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-500">History:</span>
            <select
              value={roadmap?.id || ""}
              onChange={(e) => {
                const found = historicalRoadmaps.find((r) => r.id === e.target.value);
                if (found) setRoadmap(found);
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none"
            >
              {historicalRoadmaps.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.target_role} ({h.duration_months} mo) — {new Date(h.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Control Panel: Resume, Target Role & Duration */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Resume Selection */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Select Analyzed Resume
            </label>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {userResumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.original_filename} ({new Date(r.uploaded_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {/* Target Role Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Target Career Role
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CAREER_ROLE_TAXONOMY.map((role) => (
                <option key={role.id} value={role.role_name}>
                  {role.role_name} ({role.category})
                </option>
              ))}
            </select>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Roadmap Timeline Duration
            </label>
            <select
              value={durationMonths}
              onChange={(e) => setDurationMonths(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={3}>3 Months (Accelerated Sprint)</option>
              <option value={6}>6 Months (Standard Transition)</option>
              <option value={12}>12 Months (Comprehensive Deep Dive)</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
          <p className="text-[11px] text-stone-500 dark:text-stone-400 italic">
            Note: Roadmaps are data-driven suggested trajectories synthesized from real candidate skills and job market requirements.
          </p>

          <button
            onClick={handleGenerateRoadmap}
            disabled={loading || !selectedResumeId}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Synthesizing Career Roadmap...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                {roadmap ? "Regenerate Roadmap" : "Generate Personalized Roadmap"}
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Main Roadmap Output Display */}
      {roadmap ? (
        <div className="space-y-6">
          {/* Top Summary Dashboard Card */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Target Role Profile
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                    {roadmap.duration_months} Months Timeline
                  </span>
                </div>
                <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                  {roadmap.target_role}
                </h2>
              </div>

              {/* Overall Progress Gauge */}
              <div className="w-full md:w-64 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-stone-700 dark:text-stone-300">Overall Roadmap Completion</span>
                  <span className="text-blue-600 dark:text-blue-400">{roadmap.overall_progress}%</span>
                </div>
                <div className="w-full h-3 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden p-0.5 border border-stone-200 dark:border-stone-700">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${roadmap.overall_progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Skill Gap Summary Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Verified Candidate Skills */}
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Verified Current Skills ({roadmap.skill_summary.current_skills.length})
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {roadmap.skill_summary.current_skills.length > 0 ? (
                    roadmap.skill_summary.current_skills.map((sk, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                      >
                        {sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-stone-500 italic">No matching current skills detected.</span>
                  )}
                </div>
              </div>

              {/* Missing Skills Gap Prioritization */}
              <div className="p-4 rounded-xl bg-stone-50/80 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-2">
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-500" />
                  Prioritized Skill Gap Analysis ({roadmap.skill_summary.missing_skills.length})
                </span>

                <div className="space-y-2 pt-1 text-xs">
                  {/* High Priority */}
                  {roadmap.skill_summary.high_priority_skills.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 shrink-0">
                        HIGH
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {roadmap.skill_summary.high_priority_skills.map((s, i) => (
                          <span key={i} className="font-semibold text-stone-800 dark:text-stone-200">
                            {s}{i < roadmap.skill_summary.high_priority_skills.length - 1 ? " • " : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medium Priority */}
                  {roadmap.skill_summary.medium_priority_skills.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 shrink-0">
                        MED
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {roadmap.skill_summary.medium_priority_skills.map((s, i) => (
                          <span key={i} className="text-stone-700 dark:text-stone-300">
                            {s}{i < roadmap.skill_summary.medium_priority_skills.length - 1 ? " • " : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Low Priority */}
                  {roadmap.skill_summary.low_priority_skills.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 shrink-0">
                        LOW
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {roadmap.skill_summary.low_priority_skills.map((s, i) => (
                          <span key={i} className="text-stone-600 dark:text-stone-400">
                            {s}{i < roadmap.skill_summary.low_priority_skills.length - 1 ? " • " : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sequential 5-Stage Timeline Accordion */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              Multi-Phase Development Timeline & Milestones
            </h3>

            {roadmap.stages.map((stage, idx) => {
              const isExpanded = expandedStageIndex === idx;
              const completedMilestones = stage.milestones.filter(
                (m) => m.status === "completed" || m.progress_percentage === 100
              ).length;
              const stageProgress =
                stage.milestones.length > 0
                  ? Math.round((completedMilestones / stage.milestones.length) * 100)
                  : 0;

              return (
                <div
                  key={stage.id || idx}
                  className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm transition-all"
                >
                  {/* Stage Header Bar */}
                  <button
                    onClick={() => setExpandedStageIndex(isExpanded ? -1 : idx)}
                    className="w-full p-5 flex items-center justify-between text-left hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-extrabold text-sm shrink-0">
                        {stage.stage_number}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">
                            {stage.title}
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900">
                            {stage.estimated_duration}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                          {stage.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Milestone Count Badge */}
                      <div className="text-right hidden sm:block">
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                          {completedMilestones} / {stage.milestones.length} Milestones
                        </span>
                        <div className="w-24 h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all"
                            style={{ width: `${stageProgress}%` }}
                          />
                        </div>
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-stone-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-stone-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Stage Body */}
                  {isExpanded && (
                    <div className="p-6 border-t border-stone-100 dark:border-stone-800 bg-stone-50/30 dark:bg-stone-900/50 space-y-6">
                      {/* 1. Stage Required & Targeted Skills */}
                      {stage.skills.length > 0 && (
                        <div className="space-y-3">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-blue-500" />
                            Target Skills & Market Demand Signals
                          </h5>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {stage.skills.map((sk) => (
                              <div
                                key={sk.id}
                                className="bg-white dark:bg-stone-800/80 p-4 rounded-xl border border-stone-200 dark:border-stone-700/70 space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                                    {sk.skill_name}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 text-[10px] font-extrabold rounded ${
                                      sk.priority === "HIGH PRIORITY"
                                        ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                                        : sk.priority === "MEDIUM PRIORITY"
                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                        : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                    }`}
                                  >
                                    {sk.priority}
                                  </span>
                                </div>

                                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                                  {sk.reason}
                                </p>

                                {sk.market_frequency_pct !== undefined && (
                                  <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                                    Market Signal: Required in {sk.market_frequency_pct}% of analyzed {roadmap.target_role} job postings.
                                  </p>
                                )}

                                {sk.prerequisites.length > 0 && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-stone-500 pt-1">
                                    <span className="font-semibold">Prerequisites:</span>
                                    {sk.prerequisites.map((p, pi) => (
                                      <span key={pi} className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium">
                                        {p}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2. Recommended Portfolio Projects */}
                      {stage.projects.length > 0 && (
                        <div className="space-y-3">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                            <FolderGit2 className="w-3.5 h-3.5 text-indigo-500" />
                            Recommended Portfolio Project
                          </h5>

                          {stage.projects.map((proj) => (
                            <div
                              key={proj.id}
                              className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-stone-800/80 dark:to-stone-800/50 p-4 rounded-xl border border-blue-200/60 dark:border-stone-700 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                                  <FolderGit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  {proj.title}
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                                    proj.difficulty === "Beginner"
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                      : proj.difficulty === "Intermediate"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                      : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                                  }`}
                                >
                                  {proj.difficulty} Level
                                </span>
                              </div>

                              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                                {proj.description}
                              </p>

                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[11px] font-semibold text-stone-500">Skills Applied:</span>
                                {proj.required_skills.map((s, si) => (
                                  <span key={si} className="px-2 py-0.5 rounded-md bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-[10px] font-bold text-stone-800 dark:text-stone-200">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 3. Interactive Milestones Checklist */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Interactive Action Milestones & Progress Tracking
                        </h5>

                        <div className="space-y-3">
                          {stage.milestones.map((ms) => {
                            const isUpdating = updatingMilestoneId === ms.id;
                            const isCompleted = ms.status === "completed" || ms.progress_percentage === 100;
                            const isEditingNotes = editingNotesId === ms.id;

                            return (
                              <div
                                key={ms.id}
                                className={`p-4 rounded-xl border transition-all space-y-3 ${
                                  isCompleted
                                    ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60"
                                    : "bg-white dark:bg-stone-800/90 border-stone-200 dark:border-stone-700"
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-start gap-2.5">
                                    <button
                                      onClick={() =>
                                        handleUpdateMilestone(
                                          ms.id,
                                          isCompleted ? "not_started" : "completed",
                                          isCompleted ? 0 : 100
                                        )
                                      }
                                      disabled={isUpdating}
                                      className="mt-0.5 shrink-0"
                                    >
                                      {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                      ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-stone-300 dark:border-stone-600 hover:border-blue-500 transition-colors" />
                                      )}
                                    </button>

                                    <div>
                                      <h6 className={`font-bold text-xs ${isCompleted ? "line-through text-stone-500 dark:text-stone-400" : "text-stone-900 dark:text-stone-100"}`}>
                                        {ms.title}
                                      </h6>
                                      <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">
                                        {ms.description}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Status Selector & Progress Slider */}
                                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                                    <select
                                      value={ms.status}
                                      onChange={(e) => {
                                        const st = e.target.value as any;
                                        const prog = st === "completed" ? 100 : st === "not_started" ? 0 : 50;
                                        handleUpdateMilestone(ms.id, st, prog);
                                      }}
                                      disabled={isUpdating}
                                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 focus:outline-none"
                                    >
                                      <option value="not_started">Not Started</option>
                                      <option value="in_progress">In Progress</option>
                                      <option value="completed">Completed</option>
                                    </select>

                                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300 w-10 text-right">
                                      {ms.progress_percentage}%
                                    </span>
                                  </div>
                                </div>

                                {/* Progress Criteria & User Notes */}
                                <div className="pt-2 border-t border-stone-100 dark:border-stone-700/50 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-stone-500 gap-2">
                                  <span><strong className="text-stone-700 dark:text-stone-300">Completion Criteria:</strong> {ms.completion_criteria}</span>

                                  {/* Notes trigger */}
                                  <div className="flex items-center gap-2 shrink-0">
                                    {isEditingNotes ? (
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="text"
                                          value={tempNotes}
                                          onChange={(e) => setTempNotes(e.target.value)}
                                          placeholder="Add personal learning notes..."
                                          className="px-2 py-0.5 text-[11px] border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none"
                                        />
                                        <button
                                          onClick={() => handleUpdateMilestone(ms.id, ms.status, ms.progress_percentage, tempNotes)}
                                          className="p-1 text-emerald-600 hover:text-emerald-700"
                                        >
                                          <Save className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setEditingNotesId(ms.id);
                                          setTempNotes(ms.notes || "");
                                        }}
                                        className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-[11px] font-semibold"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                        {ms.notes ? `Note: ${ms.notes}` : "Add Notes"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-900 p-12 rounded-2xl border border-stone-200 dark:border-stone-800 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Milestone className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            Generate Your Personalized Career Roadmap
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
            Select your target career role and timeline above to synthesize an end-to-end, data-driven skill progression roadmap tailored to your actual resume profile.
          </p>
          <button
            onClick={handleGenerateRoadmap}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Generate Roadmap Now
          </button>
        </div>
      )}
    </div>
  );
};
