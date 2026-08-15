import React from "react";
import { Lock, FileText, AlertCircle, Upload, LogIn, Database } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface EmptyStateProps {
  type: "auth_required" | "no_resume" | "no_results" | "phase_pending";
  title?: string;
  description?: string;
  onActionClick?: () => void;
  actionText?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  onActionClick,
  actionText,
}) => {
  const { loadSampleDevResume } = useAuth();

  if (type === "auth_required") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xs my-6">
        <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-400 mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
          {title || "Authentication Required"}
        </h3>
        <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md mb-6 leading-relaxed">
          {description || "You must be logged in to access personalized resume parsing, candidate skill analysis, and vector job matching."}
        </p>
        {onActionClick && (
          <button
            onClick={onActionClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900 font-medium text-sm rounded-lg transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            {actionText || "Log In or Register"}
          </button>
        )}
      </div>
    );
  }

  if (type === "no_resume") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xs my-6">
        <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-700 dark:text-blue-400 mb-4">
          <FileText className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
          {title || "No Resume Uploaded Yet"}
        </h3>
        <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md mb-6 leading-relaxed">
          {description || "In accordance with system data governance rules, no fake or default scores are generated. Upload a PDF/DOCX resume to trigger NLP processing."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onActionClick && (
            <button
              onClick={onActionClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              {actionText || "Upload Resume PDF/DOCX"}
            </button>
          )}
          <button
            onClick={loadSampleDevResume}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-medium text-xs rounded-lg transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-amber-500" />
            Load Dev Sample Resume (For Testing)
          </button>
        </div>
      </div>
    );
  }

  if (type === "phase_pending") {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center bg-stone-50 dark:bg-stone-900/40 border border-dashed border-stone-300 dark:border-stone-700 rounded-xl my-4">
        <div className="w-12 h-12 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-400 mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-stone-800 dark:text-stone-200 mb-1">
          {title || "Module Scheduled for Future Phase"}
        </h4>
        <p className="text-xs text-stone-600 dark:text-stone-400 max-w-lg leading-relaxed">
          {description || "This module is part of the incremental development roadmap and will be activated in an upcoming phase per project instructions."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-xl">
      <h4 className="text-base font-semibold text-stone-800 dark:text-stone-200 mb-1">
        {title || "No Data Available"}
      </h4>
      <p className="text-xs text-stone-600 dark:text-stone-400 max-w-md">
        {description || "There is currently no data to display for this view."}
      </p>
    </div>
  );
};
