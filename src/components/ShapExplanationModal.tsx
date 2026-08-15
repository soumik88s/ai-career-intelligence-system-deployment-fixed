import React, { useState, useEffect } from "react";
import {
  HelpCircle,
  X,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Info,
  Sparkles,
  Layers,
  ArrowRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  fetchCareerPredictionExplanationApi,
  fetchMatchingExplanationApi
} from "../services/api";

interface ShapExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: "career_prediction" | "matching_result";
  entityId: string;
  targetRoleName?: string;
  resumeId?: string;
  jobId?: string;
  title?: string;
}

export const ShapExplanationModal: React.FC<ShapExplanationModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  targetRoleName,
  resumeId,
  jobId,
  title
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [explanation, setExplanation] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && entityId) {
      loadExplanation();
    }
  }, [isOpen, entityId]);

  const loadExplanation = async () => {
    setLoading(true);
    setError(null);

    try {
      let res: any;
      if (entityType === "career_prediction") {
        res = await fetchCareerPredictionExplanationApi(
          token || "",
          entityId,
          targetRoleName,
          resumeId
        );
      } else {
        res = await fetchMatchingExplanationApi(
          token || "",
          entityId,
          resumeId,
          jobId
        );
      }

      if (res.success && res.data) {
        setExplanation(res.data);
      } else {
        throw new Error(res.error || "Failed to load SHAP explanation");
      }
    } catch (err: any) {
      console.error("[SHAP Modal Error]:", err);
      setError(err.message || "Failed to generate model explanation.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  SHAP Explainable AI
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {explanation?.explainer_type || "LinearExplainer"}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {title || (entityType === "career_prediction" ? `Why predicted as ${targetRoleName || "Target Role"}?` : "Why this Job Match score?")}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-600 font-medium text-sm">
                Calculating exact Shapley marginal values & factor attributions...
              </p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Explanation Unavailable</span>
              </div>
              <p className="text-sm">{error}</p>
            </div>
          ) : explanation ? (
            <>
              {/* Executive Summary Card */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    Model Output & Base Benchmark
                  </span>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div>
                      Base Value: <span className="text-slate-300">{(explanation.base_value * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      Prediction Score: <span className="text-emerald-400 font-bold">{(explanation.prediction_value * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed font-sans">
                  {explanation.human_narrative}
                </p>
              </div>

              {/* Waterfall SHAP Contributions Chart */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Feature Contribution Breakdown (SHAP Values)</span>
                  </h3>
                  <span className="text-xs text-slate-500 italic">
                    Pushing score up (+) vs down (-)
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  {/* Positive Factors */}
                  {explanation.positive_factors && explanation.positive_factors.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Positive Contributions (+ Impact)
                      </span>
                      <div className="space-y-2">
                        {explanation.positive_factors.map((factor: any, i: number) => {
                          const barWidth = Math.min(100, Math.max(10, Math.abs(factor.shap_value) * 300));
                          return (
                            <div key={i} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-800">{factor.human_name}</span>
                                <span className="font-mono text-emerald-600 font-bold">
                                  +{(factor.shap_value * 100).toFixed(2)}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${barWidth}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Negative Factors */}
                  {explanation.negative_factors && explanation.negative_factors.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-slate-200">
                      <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                        Negative / Missing Factors (- Impact)
                      </span>
                      <div className="space-y-2">
                        {explanation.negative_factors.map((factor: any, i: number) => {
                          const barWidth = Math.min(100, Math.max(10, Math.abs(factor.shap_value) * 300));
                          return (
                            <div key={i} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-800">{factor.human_name}</span>
                                <span className="font-mono text-rose-600 font-bold">
                                  {(factor.shap_value * 100).toFixed(2)}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${barWidth}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Skill Gaps & Recommendations */}
              {explanation.skill_gaps && explanation.skill_gaps.length > 0 && (
                <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-2">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Key Skill Gaps Impacting Score
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {explanation.skill_gaps.map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mathematical Proof Footer */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between text-xs text-slate-600 font-mono">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-600" />
                  <span>
                    Additive Verification: f(x) = E[f(x)] + Σ φ_i
                  </span>
                </div>
                <div className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  {explanation.technical_details?.is_additive_exact ? "Exact Match Proof Verified ✓" : "Approximated SHAP Value"}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
