import React from "react";
import {
  Brain,
  Layers,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Database,
  Cpu,
  FileText,
  BarChart2,
  CheckCircle2,
  Lock,
  GitPullRequest
} from "lucide-react";
import { NavigationTab } from "../types";
import { useAuth } from "../context/AuthContext";
import { ThreeDCardWrapper } from "../components/ThreeDCardWrapper";

interface LandingPageProps {
  setActiveTab: (tab: NavigationTab) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setActiveTab }) => {
  const { isAuthenticated, resume } = useAuth();

  return (
    <div className="space-y-10 py-2">
      {/* Hero Section */}
      <ThreeDCardWrapper depth={8} className="w-full">
        <div className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-slate-900 to-stone-950 text-white rounded-2xl p-8 md:p-12 border border-stone-800 shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
            
              
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-stone-100 leading-tight">
              AI Career Intelligence System: Explainable Career Matching & RAG
            </h1>
            <p className="text-stone-300 text-sm md:text-base leading-relaxed">
              An advanced Machine Learning and Natural Language Processing architecture combining Sentence-BERT embeddings, multi-factor hybrid scoring, SHAP explainability, and Retrieval-Augmented Generation (RAG) for objective job recommendation.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => setActiveTab("upload")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer shadow-md hover:shadow-lg"
              >
                Upload Candidate Resume
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTab("architecture")}
                className="inline-flex items-center gap-2 px-5 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-sm rounded-lg transition-colors cursor-pointer border border-stone-700"
              >
                Explore Architecture & Viva Guide
              </button>
            </div>
          </div>

          {/* System Phase Status Floating Card */}
          <div className="mt-8 pt-6 border-t border-stone-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-stone-900/80 p-3 rounded-lg border border-stone-800">
              <span className="text-stone-400 block text-[11px]">Phase Status</span>
              <span className="font-semibold text-emerald-400">Phase 1 (Active)</span>
            </div>
            <div className="bg-stone-900/80 p-3 rounded-lg border border-stone-800">
              <span className="text-stone-400 block text-[11px]">Primary Model</span>
              <span className="font-semibold text-stone-200">Sentence-BERT</span>
            </div>
            <div className="bg-stone-900/80 p-3 rounded-lg border border-stone-800">
              <span className="text-stone-400 block text-[11px]">Explainability</span>
              <span className="font-semibold text-stone-200">SHAP Values</span>
            </div>
            <div className="bg-stone-900/80 p-3 rounded-lg border border-stone-800">
              <span className="text-stone-400 block text-[11px]">Advisory Engine</span>
              <span className="font-semibold text-stone-200">FAISS + Gemini RAG</span>
            </div>
          </div>
        </div>
      </ThreeDCardWrapper>

      {/* Strict Data Governance Notice */}
      <div className="p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-900 dark:text-amber-200 flex items-start gap-4 text-xs shadow-xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-sm">Strict Data Transparency Rules</p>
          <p className="leading-relaxed text-amber-800 dark:text-amber-300">
            This system enforces rigorous scientific data standards. No fabricated match scores (like default "85%") are ever shown. Logged-out users or candidates without an uploaded resume will see explicit empty states.
          </p>
        </div>
      </div>

      {/* System Features Overview */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Core Capabilities Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ThreeDCardWrapper depth={12}>
            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3 h-full shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-stone-900 dark:text-stone-100">
                1. NLP Resume Extraction
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Extracts text from PDF/DOCX files, applying tokenization, SpaCy entity recognition, skill categorization, and structural experience parsing.
              </p>
            </div>
          </ThreeDCardWrapper>

          <ThreeDCardWrapper depth={12}>
            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3 h-full shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-stone-900 dark:text-stone-100">
                2. Sentence-BERT Matching
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Generates 384-dimensional dense vector representations comparing candidate semantic profile against job requirements via cosine similarity.
              </p>
            </div>
          </ThreeDCardWrapper>

          <ThreeDCardWrapper depth={12}>
            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3 h-full shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-stone-900 dark:text-stone-100">
                3. SHAP Explainable AI
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Game-theoretic SHAP feature attribution highlights exact skills and keyword presence/absence explaining every match percentage score.
              </p>
            </div>
          </ThreeDCardWrapper>
        </div>
      </div>

      {/* Multi-Factor Formula Specs */}
      <div className="bg-stone-50 dark:bg-stone-900/60 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-4">
        <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
          Target Hybrid Matching Formula
        </h3>
        <p className="text-xs text-stone-600 dark:text-stone-400">
          The proposed system evaluates candidates across five distinct feature dimensions:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="bg-white dark:bg-stone-800 p-3 rounded-lg border border-stone-200 dark:border-stone-700">
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">35%</span>
            <span className="block text-[11px] font-medium text-stone-700 dark:text-stone-300 mt-1">
              Semantic Vector Similarity
            </span>
          </div>
          <div className="bg-white dark:bg-stone-800 p-3 rounded-lg border border-stone-200 dark:border-stone-700">
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">30%</span>
            <span className="block text-[11px] font-medium text-stone-700 dark:text-stone-300 mt-1">
              Skill Intersection
            </span>
          </div>
          <div className="bg-white dark:bg-stone-800 p-3 rounded-lg border border-stone-200 dark:border-stone-700">
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">15%</span>
            <span className="block text-[11px] font-medium text-stone-700 dark:text-stone-300 mt-1">
              Experience Alignment
            </span>
          </div>
          <div className="bg-white dark:bg-stone-800 p-3 rounded-lg border border-stone-200 dark:border-stone-700">
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">10%</span>
            <span className="block text-[11px] font-medium text-stone-700 dark:text-stone-300 mt-1">
              Education Level
            </span>
          </div>
          <div className="bg-white dark:bg-stone-800 p-3 rounded-lg border border-stone-200 dark:border-stone-700">
            <span className="text-lg font-bold text-rose-600 dark:text-rose-400">10%</span>
            <span className="block text-[11px] font-medium text-stone-700 dark:text-stone-300 mt-1">
              ATS Compatibility
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
