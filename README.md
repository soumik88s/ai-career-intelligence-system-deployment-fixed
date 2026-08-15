# AI Career Intelligence System

> **Explainable AI-Based Career Recommendation and Job Matching Using NLP, Deep Learning, and RAG**  
> *Final-Year B.Tech / M.Tech Computer Science & Engineering Project*

---

## 📌 Executive Summary

The **AI Career Intelligence System** is a production-grade, explainable AI platform designed to bridge the gap between job seekers and relevant career opportunities. It replaces naive keyword-matching ATS tools with a multi-factor hybrid intelligence engine combining **Sentence-BERT dense vector embeddings**, **TF-IDF baselines**, **SHAP (SHapley Additive exPlanations) feature attribution**, and **RAG (Retrieval-Augmented Generation) career advisory**.

---

## 🏗️ System Architecture

```
AI Career Intelligence System
├── frontend/               # React 19 + Vite + Tailwind CSS + Motion
├── backend/                # Python FastAPI Microservice & Node.js/Express API
│   ├── main.py             # FastAPI entry point
│   └── requirements.txt    # Python dependencies
├── ml/                     # Machine Learning & NLP Subsystem
│   ├── preprocessing.py    # NLP entity & skill extraction
│   ├── tfidf_baseline.py   # Baseline TF-IDF model
│   ├── sbert_matcher.py    # Sentence-BERT dense embedding engine
│   ├── hybrid_scorer.py    # Multi-factor score calculator
│   ├── shap_explainer.py   # SHAP explainable AI engine
│   └── evaluation.py       # NDCG@K, MRR, F1-Score evaluation framework
├── datasets/               # Job benchmarks, taxonomy & evaluation datasets
├── models/                 # Model checkpoints, FAISS vector index store
├── notebooks/              # Research Jupyter notebooks for EDA & evaluation
└── docs/                   # Architecture specs & CSE Viva preparation guide
```

---

## 🚀 Key Features & Core Capabilities

- **🔐 Authentication & Role Management**: Secure token session handling with logged-out state isolation.
- **📄 Resume Upload & Extraction**: Support for PDF, DOCX, and TXT files with strict validation.
- **🔍 Explainable Hybrid Matching**:
  $$\text{Final Score} = 0.35 \times \text{Semantic} + 0.30 \times \text{Skills} + 0.15 \times \text{Experience} + 0.10 \times \text{Education} + 0.10 \times \text{ATS}$$
- **💡 SHAP Explainable AI**: Feature-level attribution breakdown explaining positive and negative score factors.
- **📊 Research Evaluation Pipeline**: Benchmark model performance using **Accuracy, Precision, Recall, F1-Score, NDCG@K, MRR, and Inference Latency**.
- **🤖 RAG Career Assistant**: Context-aware LLM career advisory backed by vector embeddings and Gemini API.
- **🎨 Modern SaaS Interface**: Desktop, tablet, and mobile responsive layout supporting both Light & Dark themes with zero default fake scores.

---

## 💻 How to Run Locally

### 1. Environment Setup & Installation

Clone the repository and inspect environment configuration:
```bash
# Copy environment variables template
cp .env.example .env
```

### 2. Node.js & React Frontend / Express Server
```bash
# Install frontend & Node dependencies
npm install

# Start development server (Port 3000)
npm run dev
```

### 3. Python ML Microservice (Optional Local Setup)
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python requirements
pip install -r backend/requirements.txt

# Launch FastAPI microservice
python backend/main.py
```

### Deploy the Node web application

Use a Node.js host that supports a long-running Express process (for example
Render, Railway, Fly.io, or a VM). Configure the host with:

```text
Build command: npm ci && npm run build
Start command: npm start
```

Set `NODE_ENV=production`, a strong `JWT_SECRET`, and a production
`DATABASE_URL` in the host's environment-variable settings. Do **not** set a
fixed `PORT`: the server uses the port assigned by the hosting platform. If
resume uploads must persist across redeploys, set `UPLOAD_DIR` to mounted
persistent storage or move uploads to object storage. The FastAPI service is a
separate process and must be deployed separately when its endpoints are used.

---

## 🛡️ Data Governance & Transparency Rules

1. **No Fabricated ML Scores**: Logged-out or unanalyzed states display clear **Empty States** rather than hardcoded scores like "85%".
2. **Session Isolation**: Personalized candidate insights require active authentication.
3. **Configurable Model Weights**: Hybrid formula weights can be modified programmatically or learned from ground-truth datasets.

---

## 🗺️ Project Phases

- [x] **Phase 1**: Initial Architecture, Environment Configuration, Full-Stack Foundation, Clean Empty States, Documentation.
- [ ] **Phase 2**: User Authentication & PostgreSQL Database Schema.
- [ ] **Phase 3**: Resume Extraction Pipeline & NLP Skill Parser.
- [ ] **Phase 4**: Sentence-BERT Semantic Matching & Hybrid Scorer.
- [ ] **Phase 5**: Explainable AI (SHAP) & Feature Attribution.
- [ ] **Phase 6**: RAG Career Assistant & Academic Evaluation Suite.

---

## 🎓 Academic Viva Resources
- See `docs/VIVA_PREPARATION.md` for answers to common external examiner questions.
- See `docs/ARCHITECTURE.md` for mathematical formulations and diagrammatic breakdowns.
