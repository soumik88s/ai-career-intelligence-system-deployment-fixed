import React from "react";
import { Layers, Cpu, BarChart2, CheckCircle2, FileCode, BookOpen, Sparkles, Terminal } from "lucide-react";

export const ArchitecturePage: React.FC = () => {
  return (
    <div className="space-y-8 py-2">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          System Architecture & Viva Defense Manual
        </h1>
        <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
          Technical specifications, mathematical equations, evaluation metrics, and CSE viva questions.
        </p>
      </div>

      {/* System Flow & Equations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-4">
          <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Core User Flow Architecture
          </h3>
          <div className="space-y-2 text-xs font-mono text-stone-700 dark:text-stone-300">
            <div className="p-2.5 bg-stone-50 dark:bg-stone-800/60 rounded-lg">User Registration / Authentication</div>
            <div className="text-center text-stone-400">↓</div>
            <div className="p-2.5 bg-stone-50 dark:bg-stone-800/60 rounded-lg">Resume PDF/DOCX Upload & Parsing</div>
            <div className="text-center text-stone-400">↓</div>
            <div className="p-2.5 bg-stone-50 dark:bg-stone-800/60 rounded-lg">Sentence-BERT Dense Vector Indexing</div>
            <div className="text-center text-stone-400">↓</div>
            <div className="p-2.5 bg-stone-50 dark:bg-stone-800/60 rounded-lg">Hybrid Score Calculation & SHAP XAI</div>
            <div className="text-center text-stone-400">↓</div>
            <div className="p-2.5 bg-stone-50 dark:bg-stone-800/60 rounded-lg">FAISS Vector Search & RAG Advisory</div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-4">
          <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Research Evaluation Metrics
          </h3>
          <div className="space-y-3 text-xs text-stone-600 dark:text-stone-400">
            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-lg space-y-1">
              <span className="font-bold text-stone-800 dark:text-stone-200 block">NDCG@K (Normalized Discounted Cumulative Gain)</span>
              <p>Measures top-K job recommendation ranking quality compared to human ground-truth relevance annotations.</p>
            </div>
            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-lg space-y-1">
              <span className="font-bold text-stone-800 dark:text-stone-200 block">MRR (Mean Reciprocal Rank)</span>
              <p>Evaluates the average position of the first highly relevant job match returned by the system.</p>
            </div>
            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-lg space-y-1">
              <span className="font-bold text-stone-800 dark:text-stone-200 block">F1-Score & Skill Extraction Accuracy</span>
              <p>Harmonic mean of precision and recall for named entity skill detection from unformatted resumes.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Common Viva Questions & Defenses */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-4">
        <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-500" />
          Viva Voce Defense Cheat Sheet
        </h3>

        <div className="space-y-4 text-xs">
          <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg space-y-1.5">
            <span className="font-bold text-stone-900 dark:text-stone-100 block">
              Q1: Why choose Sentence-BERT over TF-IDF or standard BERT?
            </span>
            <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
              TF-IDF relies on exact term overlap and fails to capture semantic equivalence (e.g. "PyTorch" vs "Deep Learning"). Standard BERT requires $O(N \cdot M)$ pairwise cross-encodings. Sentence-BERT uses Siamese networks to output fixed-size 384d vector embeddings that can be compared in microseconds via cosine similarity or FAISS indexes.
            </p>
          </div>

          <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg space-y-1.5">
            <span className="font-bold text-stone-900 dark:text-stone-100 block">
              Q2: How does SHAP ensure explainability?
            </span>
            <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
              SHAP computes Shapley values from cooperative game theory to quantify how much each extracted skill or keyword positively or negatively drives the match score, eliminating black-box opacity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
