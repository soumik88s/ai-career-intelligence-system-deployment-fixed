# System Architecture Specification

## 1. Executive Overview
The **AI Career Intelligence System** is a production-quality, explainable AI web platform engineered for automated resume parsing, candidate-job semantic alignment, skill-gap identification, and RAG-powered career advisory.

## 2. High-Level System Architecture Diagram

```
[ User / Browser (React + Vite + Tailwind) ]
                     │
                     ▼ (HTTP / REST APIs - Port 3000)
┌────────────────────────────────────────────────────────┐
│             Node.js / Express Server                    │
│  - Middleware Routing & Static SPA Delivery             │
│  - JWT Session & Input Validation                      │
│  - Express / Multer File Upload Gateway               │
└───────────────────┬────────────────────────────────────┘
                    │
                    ▼ (JSON RPC / Microservice Proxy)
┌────────────────────────────────────────────────────────┐
│             Python FastAPI ML Microservice             │
│  - Resume Text Extractor (PyPDF / Python-Docx)          │
│  - NLP Pipeline (SpaCy / NLTK / Regex Skill Parser)    │
│  - Sentence-BERT Embedding Engine (all-MiniLM-L6-v2)   │
│  - Hybrid Weighted Scoring Engine                      │
│  - SHAP Explainable AI (XAI) Feature Attributor        │
│  - FAISS Vector Store + RAG Pipeline (Gemini API)      │
└────────────────────────────────────────────────────────┘
```

## 3. Mathematical & ML Formulation

### 3.1 Hybrid Match Score Equation
$$S_{\text{final}} = w_1 S_{\text{semantic}} + w_2 S_{\text{skill}} + w_3 S_{\text{exp}} + w_4 S_{\text{edu}} + w_5 S_{\text{ATS}}$$

Where default configurable parameters are:
- $w_1 = 0.35$ (Sentence-BERT / Cosine Similarity)
- $w_2 = 0.30$ (Skill Intersection & Jaccard Index)
- $w_3 = 0.15$ (Years of Experience Match)
- $w_4 = 0.10$ (Education Level Match)
- $w_5 = 0.10$ (ATS Formatting & Keyword Density Score)

### 3.2 Evaluation Metrics
- **NDCG@K**:
  $$\text{NDCG}@K = \frac{\text{DCG}@K}{\text{IDCG}@K}, \quad \text{DCG}@K = \sum_{i=1}^K \frac{2^{rel_i} - 1}{\log_2(i+1)}$$
- **MRR (Mean Reciprocal Rank)**:
  $$\text{MRR} = \frac{1}{|Q|} \sum_{i=1}^{|Q|} \frac{1}{\text{rank}_i}$$
- **F1-Score**: Harmonic mean of Precision and Recall.

## 4. Phase-by-Phase Roadmap
- **Phase 1 (Completed)**: System Architecture, Environment Configuration, Base REST API, Full-Stack Foundation, Clean Empty States, Research Documentation.
- **Phase 2**: Authentication, Session Management & PostgreSQL Schema.
- **Phase 3**: Resume Text Extraction & NLP Parsing Engine.
- **Phase 4**: Sentence-BERT Semantic Matching & Hybrid Scoring Engine.
- **Phase 5**: Explainable AI (SHAP) & Feature Attribution Visualization.
- **Phase 6**: RAG Career Advisory Assistant & Research Evaluation Benchmarking.
