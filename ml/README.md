# Machine Learning & NLP Subsystem

This directory contains the machine learning algorithms, NLP feature extractors, Sentence-BERT embedding generators, SHAP explainability engines, and evaluation pipelines for the **AI Career Intelligence System**.

## Architectural Components

1. **`preprocessing.py`**:
   - Text normalization, tokenization, stop-word removal, lemmatization.
   - Skill extraction using regex pattern matching + SpaCy Named Entity Recognition (NER).

2. **`tfidf_baseline.py`**:
   - Baseline TF-IDF (Term Frequency - Inverse Document Frequency) model.
   - Cosine similarity computation between resume vector and job description vector.

3. **`sbert_matcher.py`**:
   - Advanced Sentence-BERT (`all-MiniLM-L6-v2` or `paraphrase-MiniLM-L6-v2`) embedding model.
   - Computes dense vector representations and cosine similarity.

4. **`hybrid_scorer.py`**:
   - Configurable weighted matching score formula:
     $$\text{Final Score} = w_1 \cdot S_{\text{semantic}} + w_2 \cdot S_{\text{skills}} + w_3 \cdot S_{\text{experience}} + w_4 \cdot S_{\text{education}} + w_5 \cdot S_{\text{ATS}}$$
   - Default Weights: $w_1=0.35, w_2=0.30, w_3=0.15, w_4=0.10, w_5=0.10$.

5. **`shap_explainer.py`**:
   - Explainable AI (XAI) engine generating SHAP (SHapley Additive exPlanations) values to highlight feature contributions (skills present/missing, domain keywords) behind every match score.

6. **`evaluation.py`**:
   - Research evaluation pipeline computing:
     - Classification Metrics: Accuracy, Precision, Recall, F1-Score
     - Ranking Metrics: NDCG@K (Normalized Discounted Cumulative Gain at Rank K), MRR (Mean Reciprocal Rank)
     - System Performance: Inference Time (ms per pair)

## Directory Structure
```
ml/
├── preprocessing.py      # Text cleaning & entity extraction templates
├── tfidf_baseline.py     # Baseline TF-IDF model
├── sbert_matcher.py      # Sentence-BERT embedding pipeline
├── hybrid_scorer.py      # Multi-factor hybrid scoring algorithm
├── shap_explainer.py     # SHAP feature attribution explainer
├── evaluation.py         # Research evaluation metrics (NDCG@K, MRR, F1)
└── vector_store/         # FAISS / Chroma index cache (populated in Phase 6)
```
