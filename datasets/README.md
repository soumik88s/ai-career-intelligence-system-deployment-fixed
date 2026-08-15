# Datasets Directory

This directory stores datasets used for training, benchmarking, and evaluating the **AI Career Intelligence System**.

## Schema Specifications

1. **`sample_jobs.json`**:
   - Contains benchmark job descriptions, required skills, experience thresholds, and educational requirements.

2. **`taxonomy_skills.json`**:
   - Categorized skills database (Programming Languages, Machine Learning Frameworks, Cloud Platforms, Soft Skills).

3. **`eval_ground_truth.json`**:
   - Manually annotated resume-job relevance scores used to compute NDCG@K, MRR, and F1-score evaluation metrics.

## Data Governance & Privacy
- No real personally identifiable information (PII) is stored in raw datasets.
- Test resumes are synthetic or anonymized.
