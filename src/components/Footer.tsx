import React from "react";
import { Cpu, ShieldCheck, Github, FileCode } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 text-stone-600 dark:text-stone-400 py-6 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-stone-800 dark:text-stone-200">
            AI Career Intelligence System 
          </p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
            Explainable AI-Based Career Recommendation using NLP, Sentence-BERT, SHAP & RAG
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-200/70 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300">
            <Cpu className="w-3.5 h-3.5 text-blue-500" />
            
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-200/70 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            
          </span>
        </div>
      </div>
    </footer>
  );
};
