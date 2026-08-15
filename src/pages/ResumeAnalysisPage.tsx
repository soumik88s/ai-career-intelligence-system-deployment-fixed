import React, { useState, useEffect } from "react";
import {
  FileText,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Database,
  Sparkles,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Award,
  ChevronDown,
  ChevronUp,
  Tag,
  Clock,
  ShieldCheck,
  UserCheck,
  ExternalLink,
  Code
} from "lucide-react";
import {
  NavigationTab,
  CandidateAnalysisProfile,
  CandidateSkill,
  CandidateEducationItem,
  CandidateExperienceItem,
  CandidateProjectItem,
  CandidateCertificationItem,
  ResumeRecord
} from "../types";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "../components/EmptyState";
import {
  triggerResumeAnalysisApi,
  getCandidateAnalysisApi,
  updateCandidateAnalysisApi
} from "../services/api";

interface ResumeAnalysisPageProps {
  setActiveTab: (tab: NavigationTab) => void;
}

export const ResumeAnalysisPage: React.FC<ResumeAnalysisPageProps> = ({ setActiveTab }) => {
  const { isAuthenticated, token, userResumes, refreshUserData, resume } = useAuth();

  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CandidateAnalysisProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active Tab View for Analysis Page
  const [activeSubTab, setActiveSubTab] = useState<"skills" | "education" | "experience" | "projects" | "certifications" | "raw_text">("skills");

  // New Skill Modal / Inline State
  const [isAddingSkill, setIsAddingSkill] = useState<boolean>(false);
  const [newSkillName, setNewSkillName] = useState<string>("");
  const [newSkillCategory, setNewSkillCategory] = useState<string>("Programming Languages");

  // Edit Summary State
  const [isEditingSummary, setIsEditingSummary] = useState<boolean>(false);
  const [summaryText, setSummaryText] = useState<string>("");

  useEffect(() => {
    if (userResumes && userResumes.length > 0) {
      if (!selectedResumeId) {
        setSelectedResumeId(userResumes[0].id);
      }
    }
  }, [userResumes]);

  const loadAnalysisForResume = async (resumeId: string) => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getCandidateAnalysisApi(token, resumeId);
      if (res && res.analysis) {
        setAnalysis(res.analysis);
        setSummaryText(res.analysis.summary || "");
      } else {
        setAnalysis(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load candidate profile analysis.");
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedResumeId && token) {
      loadAnalysisForResume(selectedResumeId);
    }
  }, [selectedResumeId, token]);

  const handleRunAnalysis = async () => {
    if (!token || !selectedResumeId) return;
    setIsAnalyzing(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await triggerResumeAnalysisApi(token, selectedResumeId);
      if (res && res.analysis) {
        setAnalysis(res.analysis);
        setSummaryText(res.analysis.summary || "");
        setSuccessMsg("Resume NLP analysis completed successfully!");
      }
    } catch (err: any) {
      setError(err.message || "NLP analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveProfileUpdates = async (updatedFields: Partial<CandidateAnalysisProfile>) => {
    if (!token || !selectedResumeId || !analysis) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await updateCandidateAnalysisApi(token, selectedResumeId, updatedFields);
      if (res && res.analysis) {
        setAnalysis(res.analysis);
        setSuccessMsg("Candidate profile updated and saved!");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update candidate profile.");
    } finally {
      setIsSaving(false);
    }
  };

  // Skill Handlers
  const handleAddSkillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim() || !analysis) return;

    const newSkillItem: CandidateSkill = {
      skill_name: newSkillName.trim(),
      normalized_name: newSkillName.trim().toLowerCase(),
      category: newSkillCategory,
      confidence: 1.0,
      source: "user_added",
      is_user_corrected: true
    };

    const updatedSkills = [...(analysis.skills || []), newSkillItem];
    handleSaveProfileUpdates({ skills: updatedSkills });

    setNewSkillName("");
    setIsAddingSkill(false);
  };

  const handleDeleteSkill = (skillToDelete: CandidateSkill) => {
    if (!analysis) return;
    const updatedSkills = (analysis.skills || []).filter(
      (s) => s.normalized_name !== skillToDelete.normalized_name
    );
    handleSaveProfileUpdates({ skills: updatedSkills });
  };

  const handleSaveSummary = () => {
    handleSaveProfileUpdates({ summary: summaryText });
    setIsEditingSummary(false);
  };

  if (!isAuthenticated) {
    return (
      <EmptyState
        type="auth_required"
        title="Authentication Required for Resume Analysis"
        description="Please log in or create an account to view candidate profile analysis and extracted NLP features."
      />
    );
  }

  if (!userResumes || userResumes.length === 0) {
    return (
      <EmptyState
        type="no_resume"
        title="No Resume Uploaded for Analysis"
        description="To inspect candidate skills, education, and extracted entities, please upload a resume first."
        onActionClick={() => setActiveTab("upload")}
        actionText="Upload Candidate Resume"
      />
    );
  }

  const activeResumeRecord = userResumes.find((r) => r.id === selectedResumeId) || userResumes[0];

  // Group skills by category
  const categories = [
    "Programming Languages",
    "Frameworks & Libraries",
    "Databases",
    "Cloud & DevOps",
    "Tools & Technologies",
    "AI & Machine Learning",
    "Other"
  ];

  const groupedSkills: Record<string, CandidateSkill[]> = {};
  categories.forEach((cat) => {
    groupedSkills[cat] = (analysis?.skills || []).filter((s) => s.category === cat);
  });

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Candidate Resume NLP Intelligence Profile
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            Structured entity extraction, section parsing, and taxonomy mapping.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Resume Selector */}
          <select
            value={selectedResumeId || ""}
            onChange={(e) => setSelectedResumeId(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {userResumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.original_filename} ({new Date(r.uploaded_at).toLocaleDateString()})
              </option>
            ))}
          </select>

          {/* Analyze / Re-analyze Button */}
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
          >
            <Sparkles className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`} />
            {isAnalyzing ? "Analyzing NLP Features..." : analysis ? "Re-Analyze Resume" : "Analyze Resume"}
          </button>
        </div>
      </div>

      {/* Error & Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {!analysis && !isLoading && !isAnalyzing && (
        <div className="bg-white dark:bg-stone-900 p-8 rounded-2xl border border-stone-200 dark:border-stone-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              No NLP Analysis Generated Yet
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 max-w-md mx-auto mt-1">
              Click the <strong className="text-stone-800 dark:text-stone-200">"Analyze Resume"</strong> button above to run the hybrid section & entity extraction pipeline on <span className="font-semibold text-blue-600">{activeResumeRecord.original_filename}</span>.
            </p>
          </div>
          <button
            onClick={handleRunAnalysis}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Analyze Selected Resume Now
          </button>
        </div>
      )}

      {(isLoading || isAnalyzing) && (
        <div className="bg-white dark:bg-stone-900 p-12 rounded-2xl border border-stone-200 dark:border-stone-800 text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Running NLP Intelligence Pipeline
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Parsing document structure, detecting sections, mapping technical skills taxonomy, and extracting background entities...
            </p>
          </div>
        </div>
      )}

      {analysis && !isLoading && !isAnalyzing && (
        <div className="space-y-6">
          {/* Analysis Status Banner */}
          <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                NLP Analysis Active
              </span>
              <span className="text-stone-500 dark:text-stone-400">
                Engine Version: <span className="font-mono text-stone-800 dark:text-stone-200 font-semibold">{analysis.analyzer_version || "nlp-v1"}</span>
              </span>
              {analysis.analyzed_at && (
                <span className="text-stone-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(analysis.analyzed_at).toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span>Editable profile — all candidate entries can be manually verified.</span>
            </div>
          </div>

          {/* Overview Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Extracted Skills</span>
              <p className="text-xl font-bold text-stone-900 dark:text-stone-100">{analysis.skills?.length || 0}</p>
              <span className="text-[10px] text-stone-400">Taxonomy mapped</span>
            </div>

            <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Education Entries</span>
              <p className="text-xl font-bold text-stone-900 dark:text-stone-100">{analysis.education?.length || 0}</p>
              <span className="text-[10px] text-stone-400">Degrees & institutions</span>
            </div>

            <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Work Experiences</span>
              <p className="text-xl font-bold text-stone-900 dark:text-stone-100">{analysis.experience?.length || 0}</p>
              <span className="text-[10px] text-stone-400">Role history</span>
            </div>

            <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Projects & Certs</span>
              <p className="text-xl font-bold text-stone-900 dark:text-stone-100">{(analysis.projects?.length || 0) + (analysis.certifications?.length || 0)}</p>
              <span className="text-[10px] text-stone-400">Key achievements</span>
            </div>
          </div>

          {/* Candidate Summary / Objective */}
          <div className="bg-white dark:bg-stone-900 p-5 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Candidate Executive Summary & Roles Identified
              </h3>
              {!isEditingSummary && (
                <button
                  onClick={() => setIsEditingSummary(true)}
                  className="px-2.5 py-1 text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Summary
                </button>
              )}
            </div>

            {isEditingSummary ? (
              <div className="space-y-3">
                <textarea
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                  rows={4}
                  className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => setIsEditingSummary(false)}
                    className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSummary}
                    disabled={isSaving}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                  >
                    {isSaving ? "Saving..." : "Save Summary"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-stone-800/50 p-3.5 rounded-lg border border-stone-200 dark:border-stone-800">
                {analysis.summary || "No specific executive summary section was detected in the document."}
              </p>
            )}

            {/* Identified Job Titles / Target Roles */}
            {analysis.roles && analysis.roles.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">Detected Job Titles:</span>
                {analysis.roles.map((r, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700"
                  >
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-stone-200 dark:border-stone-800 gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveSubTab("skills")}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeSubTab === "skills"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              <Cpu className="w-4 h-4" />
              Skills Taxonomy ({analysis.skills?.length || 0})
            </button>

            <button
              onClick={() => setActiveSubTab("education")}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeSubTab === "education"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Education ({analysis.education?.length || 0})
            </button>

            <button
              onClick={() => setActiveSubTab("experience")}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeSubTab === "experience"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Work Experience ({analysis.experience?.length || 0})
            </button>

            <button
              onClick={() => setActiveSubTab("projects")}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeSubTab === "projects"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              <FolderGit2 className="w-4 h-4" />
              Projects ({analysis.projects?.length || 0})
            </button>

            <button
              onClick={() => setActiveSubTab("certifications")}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeSubTab === "certifications"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              <Award className="w-4 h-4" />
              Certifications ({analysis.certifications?.length || 0})
            </button>

            <button
              onClick={() => setActiveSubTab("raw_text")}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeSubTab === "raw_text"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              <FileText className="w-4 h-4" />
              Raw Text Stream
            </button>
          </div>

          {/* TAB CONTENT: SKILLS TAXONOMY */}
          {activeSubTab === "skills" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Extracted Technical Skills Taxonomy
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Extracted with section awareness, alias normalization, and false-positive checks.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingSkill(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Skill
                </button>
              </div>

              {/* Add Skill Form */}
              {isAddingSkill && (
                <form
                  onSubmit={handleAddSkillSubmit}
                  className="p-4 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl flex flex-wrap items-center gap-3"
                >
                  <input
                    type="text"
                    placeholder="Skill Name (e.g. PyTorch, React, SQL)"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[200px]"
                    required
                  />

                  <select
                    value={newSkillCategory}
                    onChange={(e) => setNewSkillCategory(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                    >
                      {isSaving ? "Adding..." : "Add to Profile"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingSkill(false)}
                      className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Skills Category Grid */}
              <div className="space-y-4">
                {categories.map((category) => {
                  const skillsInCat = groupedSkills[category] || [];
                  return (
                    <div
                      key={category}
                      className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-blue-500" />
                          {category}
                        </span>
                        <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                          {skillsInCat.length} {skillsInCat.length === 1 ? "skill" : "skills"}
                        </span>
                      </div>

                      {skillsInCat.length === 0 ? (
                        <p className="text-xs text-stone-400 italic">No skills identified under {category}.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {skillsInCat.map((s, idx) => (
                            <div
                              key={idx}
                              className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 transition-all hover:border-blue-300"
                            >
                              <span className="font-semibold">{s.skill_name}</span>

                              {/* Confidence Badge */}
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-stone-200/80 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                                {Math.round(s.confidence * 100)}%
                              </span>

                              {/* Source / Correction Badge */}
                              {s.is_user_corrected ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                  User Corrected
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-100/60 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                                  AI Extracted
                                </span>
                              )}

                              {/* Delete Action */}
                              <button
                                onClick={() => handleDeleteSkill(s)}
                                title="Remove skill"
                                className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-opacity ml-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB CONTENT: EDUCATION */}
          {activeSubTab === "education" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Education & Academic History
              </h3>

              {!analysis.education || analysis.education.length === 0 ? (
                <div className="p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500">
                  No education records detected in resume text.
                </div>
              ) : (
                <div className="space-y-3">
                  {analysis.education.map((edu, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-stone-900 p-5 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                            {edu.degree || "Degree"} {edu.field ? `in ${edu.field}` : ""}
                          </h4>
                          <p className="text-xs font-medium text-stone-600 dark:text-stone-400 mt-0.5">
                            {edu.institution || "Institution"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                            Confidence: {Math.round(edu.confidence * 100)}%
                          </span>
                          {edu.is_user_corrected && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                              User Corrected
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 dark:text-stone-400 pt-1">
                        {(edu.start_year || edu.end_year) && (
                          <span>
                            Graduation Years: {edu.start_year ? `${edu.start_year} - ` : ""}{edu.end_year || "Present"}
                          </span>
                        )}
                        {edu.score && (
                          <span className="font-semibold text-stone-800 dark:text-stone-200">
                            Score / CGPA: {edu.score}
                          </span>
                        )}
                      </div>

                      {edu.raw_text && (
                        <div className="p-2.5 bg-stone-50 dark:bg-stone-800/50 rounded-lg text-[11px] text-stone-600 dark:text-stone-400 font-mono mt-2">
                          "{edu.raw_text}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: WORK EXPERIENCE */}
          {activeSubTab === "experience" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Work Experience & Employment History
              </h3>

              {!analysis.experience || analysis.experience.length === 0 ? (
                <div className="p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500">
                  No work experience blocks detected in resume text.
                </div>
              ) : (
                <div className="space-y-3">
                  {analysis.experience.map((exp, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-stone-900 p-5 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                            {exp.job_title}
                          </h4>
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                            {exp.company} {exp.location ? `• ${exp.location}` : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                            Confidence: {Math.round(exp.confidence * 100)}%
                          </span>
                        </div>
                      </div>

                      {(exp.start_date || exp.end_date) && (
                        <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                          {exp.start_date} {exp.end_date ? `- ${exp.end_date}` : ""}
                        </p>
                      )}

                      {exp.description && (
                        <p className="text-xs text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed bg-stone-50 dark:bg-stone-800/40 p-3 rounded-lg border border-stone-100 dark:border-stone-800">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: PROJECTS */}
          {activeSubTab === "projects" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Key Academic & Personal Projects
              </h3>

              {!analysis.projects || analysis.projects.length === 0 ? (
                <div className="p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500">
                  No separate projects section detected.
                </div>
              ) : (
                <div className="space-y-3">
                  {analysis.projects.map((proj, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-stone-900 p-5 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                          {proj.title}
                        </h4>
                        {proj.link && (
                          <a
                            href={proj.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Project Link
                          </a>
                        )}
                      </div>

                      {proj.description && (
                        <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                          {proj.description}
                        </p>
                      )}

                      {proj.technologies && proj.technologies.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-2">
                          <span className="text-[11px] font-semibold text-stone-500">Technologies:</span>
                          {proj.technologies.map((t, tidx) => (
                            <span
                              key={tidx}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: CERTIFICATIONS */}
          {activeSubTab === "certifications" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Certifications & Coursework
              </h3>

              {!analysis.certifications || analysis.certifications.length === 0 ? (
                <div className="p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500">
                  No certifications section detected in resume.
                </div>
              ) : (
                <div className="space-y-3">
                  {analysis.certifications.map((cert, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                          {cert.certification_name}
                        </h4>
                        {cert.issuing_organization && (
                          <span className="text-[11px] text-blue-600 font-medium">
                            Issued by {cert.issuing_organization}
                          </span>
                        )}
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                        {Math.round(cert.confidence * 100)}% Match
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: RAW TEXT STREAM */}
          {activeSubTab === "raw_text" && (
            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Raw Extracted Resume Document Text
              </h3>
              <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-800 font-mono text-xs text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                {activeResumeRecord.extracted_text || "Raw text not available."}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
