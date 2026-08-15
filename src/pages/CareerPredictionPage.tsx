import React, { useState, useEffect } from "react";
import {
  BrainCircuit,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BarChart3,
  Cpu,
  RefreshCw,
  Info,
  ChevronRight,
  TrendingUp,
  Award,
  Layers,
  ListFilter,
  HelpCircle
} from "lucide-react";
import { ResumeRecord, CareerPredictionResponse, CareerModelEvaluation } from "../types/index";
import { useAuth } from "../context/AuthContext";
import { ShapExplanationModal } from "../components/ShapExplanationModal";

interface CareerPredictionPageProps {
  onNavigateTab?: (tab: any) => void;
}

export const CareerPredictionPage: React.FC<CareerPredictionPageProps> = ({
  onNavigateTab
}) => {
  const { userResumes, token } = useAuth();
  const [selectedResumeId, setSelectedResumeId] = useState<string>(userResumes[0]?.id || "");
  const [loading, setLoading] = useState<boolean>(false);
  const [predictionData, setPredictionData] = useState<CareerPredictionResponse | null>(null);
  const [evaluationData, setEvaluationData] = useState<CareerModelEvaluation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showResearchModal, setShowResearchModal] = useState<boolean>(false);
  const [activeShapRole, setActiveShapRole] = useState<{
    roleName: string;
    predictionId: string;
  } | null>(null);

  useEffect(() => {
    if (userResumes.length > 0 && !selectedResumeId) {
      setSelectedResumeId(userResumes[0].id);
    }
  }, [userResumes, selectedResumeId]);

  // Load evaluation benchmarks on mount
  useEffect(() => {
    fetchEvaluationBenchmarks();
  }, []);

  const fetchEvaluationBenchmarks = async () => {
    try {
      const res = await fetch("/api/career/evaluation");
      if (res.ok) {
        const data = await res.json();
        setEvaluationData(data);
      }
    } catch (e) {
      console.warn("Failed to load evaluation benchmarks:", e);
    }
  };

  const handlePredict = async () => {
    if (!selectedResumeId) {
      setErrorMsg("Please select a resume to analyze for career predictions.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/career/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          resume_id: selectedResumeId,
          top_k: 5
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate career role predictions");
      }

      setPredictionData(data);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred while predicting career roles.");
    } finally {
      setLoading(false);
    }
  };

  const selectedResume = userResumes.find(r => r.id === selectedResumeId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Phase 9 — ML Career Classification Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              ML Career Role Prediction
            </h1>
            <p className="text-slate-600 text-sm max-w-2xl">
              Supervised multi-class machine learning classification engine. Evaluates candidate technical features, experience duration, and academic vectors to predict target career roles with calibrated confidence probabilities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowResearchModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Research Benchmarks</span>
            </button>
          </div>
        </div>
      </div>

      {/* Resume Selection & Trigger Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex-1 space-y-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Select Candidate Resume
            </label>
            {userResumes.length > 0 ? (
              <select
                value={selectedResumeId}
                onChange={(e) => {
                  setSelectedResumeId(e.target.value);
                }}
                className="w-full sm:max-w-md px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-slate-50/50 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {userResumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.original_filename} ({r.processing_status === "completed" ? "NLP Analyzed" : r.processing_status})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-slate-500 italic">No uploaded resumes found. Please upload a resume first.</p>
            )}
          </div>

          <div className="flex items-end">
            <button
              onClick={handlePredict}
              disabled={loading || userResumes.length === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Feature Vector...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Predict Career Roles</span>
                </>
              )}
            </button>
          </div>
        </div>

        {selectedResume && (
          <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>File: {selectedResume.original_filename}</span>
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Status: {selectedResume.processing_status}</span>
            </span>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-amber-900">Cold-Start / Analysis Requirement Notice</h4>
            <p className="text-sm text-amber-700">{errorMsg}</p>
            <div className="pt-2">
              <button
                onClick={() => onNavigateTab("analysis")}
                className="text-xs font-semibold text-amber-900 underline hover:text-amber-950 cursor-pointer"
              >
                Go to Resume Analysis →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Results Display */}
      {predictionData && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Metadata Bar */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="text-xs text-emerald-400 font-semibold tracking-wider uppercase">
                Classifier Model: {predictionData.model_name} ({predictionData.model_version})
              </div>
              <h3 className="text-lg font-bold">Predicted Target Role Spectrum</h3>
              <p className="text-xs text-slate-300">
                Processed {predictionData.extracted_skill_count} extracted technical skills over {predictionData.total_experience_years} estimated experience years.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-center">
                <div className="text-xs text-slate-400">Class Probability Sum</div>
                <div className="text-sm font-bold text-emerald-400">100.0% Calibrated</div>
              </div>
            </div>
          </div>

          {/* Disclaimer Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-slate-600">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <p>{predictionData.disclaimer}</p>
          </div>

          {/* Predictions List Cards */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              Top Predicted Career Roles
            </h2>

            <div className="grid grid-cols-1 gap-6">
              {predictionData.predictions.map((pred) => (
                <div
                  key={pred.role}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-emerald-200 transition-all space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                          #{pred.rank}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {pred.category}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">{pred.role}</h3>
                      <p className="text-xs text-slate-600 max-w-2xl">{pred.description}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 min-w-[160px] text-right">
                        <div className="text-xs font-semibold text-slate-500">Confidence Score</div>
                        <div className="text-2xl font-black text-emerald-600">{pred.score}%</div>
                        <div className="w-full bg-slate-200 h-2 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, pred.score)}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          setActiveShapRole({
                            roleName: pred.role,
                            predictionId: `${selectedResumeId}_${pred.role.toLowerCase().replace(/\s+/g, '_')}`
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Why this prediction?</span>
                      </button>
                    </div>
                  </div>

                  {/* Supporting Evidence Signals */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      Supporting Profile Evidence
                    </h4>
                    <ul className="space-y-1.5">
                      {pred.evidence_signals.map((sig, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{sig}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Matched vs Missing Skills */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100 space-y-2">
                      <span className="text-xs font-semibold text-emerald-800">Matched Skills Found</span>
                      <div className="flex flex-wrap gap-1.5">
                        {pred.matched_skills.length > 0 ? (
                          pred.matched_skills.map((s) => (
                            <span key={s} className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-800 text-xs font-medium">
                              ✓ {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No direct required skill matches extracted</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100 space-y-2">
                      <span className="text-xs font-semibold text-slate-600">Recommended Growth Skills</span>
                      <div className="flex flex-wrap gap-1.5">
                        {pred.missing_skills.length > 0 ? (
                          pred.missing_skills.map((s) => (
                            <span key={s} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-xs font-medium">
                              • {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-emerald-600 font-medium">Complete required skill set present!</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cold Start / Initial State when no prediction yet */}
      {!predictionData && !loading && !errorMsg && (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">Ready to Predict Career Alignment</h3>
            <p className="text-sm text-slate-500">
              Select your uploaded resume and click "Predict Career Roles" to run the calibrated ML classification pipeline.
            </p>
          </div>
        </div>
      )}

      {/* Research & Benchmarks Modal */}
      {showResearchModal && evaluationData && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Research & ML Architecture</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Model Evaluation & Benchmark Report</h3>
              </div>
              <button
                onClick={() => setShowResearchModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Overall Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <div className="text-xs text-slate-500 font-medium">Accuracy</div>
                <div className="text-2xl font-bold text-emerald-600">{(evaluationData.accuracy * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <div className="text-xs text-slate-500 font-medium">Macro F1</div>
                <div className="text-2xl font-bold text-slate-900">{(evaluationData.macro_f1 * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <div className="text-xs text-slate-500 font-medium">Precision</div>
                <div className="text-2xl font-bold text-slate-900">{(evaluationData.precision * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <div className="text-xs text-slate-500 font-medium">Recall</div>
                <div className="text-2xl font-bold text-slate-900">{(evaluationData.recall * 100).toFixed(1)}%</div>
              </div>
            </div>

            {/* Experiments Comparison Matrix */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                Model Architecture Experiment Matrix
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Model Architecture</th>
                      <th className="p-3">Accuracy</th>
                      <th className="p-3">Macro F1</th>
                      <th className="p-3">Precision</th>
                      <th className="p-3">Recall</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {evaluationData.experiments.map((exp) => (
                      <tr key={exp.model_key} className={exp.model_key === "model_d" ? "bg-emerald-50/50 font-semibold" : ""}>
                        <td className="p-3 font-medium text-slate-900">
                          {exp.model_name}
                          {exp.model_key === "model_d" && (
                            <span className="ml-2 px-2 py-0.5 text-[10px] bg-emerald-600 text-white rounded-full">
                              Production
                            </span>
                          )}
                        </td>
                        <td className="p-3">{(exp.accuracy * 100).toFixed(1)}%</td>
                        <td className="p-3">{(exp.macro_f1 * 100).toFixed(1)}%</td>
                        <td className="p-3">{(exp.precision * 100).toFixed(1)}%</td>
                        <td className="p-3">{(exp.recall * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Error Analysis Insights */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900">Error Analysis & Top Confused Role Pairs</h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                {evaluationData.error_analysis.top_confused_role_pairs.map((pair, idx) => (
                  <div key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="font-semibold text-slate-900">• {pair.true_role} ↔ {pair.predicted_role}:</span>
                    <span>{pair.explanation}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowResearchModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHAP Explanation Modal */}
      {activeShapRole && (
        <ShapExplanationModal
          isOpen={Boolean(activeShapRole)}
          onClose={() => setActiveShapRole(null)}
          entityType="career_prediction"
          entityId={activeShapRole.predictionId}
          targetRoleName={activeShapRole.roleName}
          resumeId={selectedResumeId}
        />
      )}
    </div>
  );
};
