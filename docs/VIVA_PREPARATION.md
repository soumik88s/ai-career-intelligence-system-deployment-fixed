# CSE Final Year Project - Viva Voce Guide & Academic Q&A

This guide covers potential examiner questions, architectural justifications, and technical viva defenses for the **AI Career Intelligence System**.

---

### Q1: Why use Sentence-BERT instead of vanilla TF-IDF or standard BERT?
**Answer**:
- **TF-IDF limitation**: Uses exact keyword matching and ignores semantic context or synonyms (e.g., fails to match "React.js" with "Frontend Framework" or "PyTorch" with "Deep Learning").
- **Vanilla BERT limitation**: Requires passing both texts into BERT together, resulting in $O(N \cdot M)$ pair computations, which is computationally infeasible for real-time job retrieval across thousands of postings.
- **Sentence-BERT advantage**: Uses Siamese network structures to map sentences into 384-dimensional dense vector embeddings. Embeddings can be precomputed and compared in microseconds using cosine similarity or vector indexes (FAISS).

---

### Q2: How does the system handle Explainable AI (XAI)?
**Answer**:
Machine learning models are often black boxes. We utilize **SHAP (SHapley Additive exPlanations)** grounded in game theory to assign an explicit feature importance score to each keyword, skill, and experience element. This explains *why* a candidate received a particular match score by showing positive drivers (matching skills) and negative drivers (missing prerequisites).

---

### Q3: What is RAG, and why is it used in this system?
**Answer**:
**Retrieval-Augmented Generation (RAG)** combines external vector search retrieval with generative LLMs (Gemini). Instead of relying solely on parametric memory (which can hallucinate or give generic advice), RAG retrieves the user's parsed candidate profile and targeted job requirements from FAISS, injects them into the prompt context, and produces grounded, personalized career advisory responses.

---

### Q4: How is the system evaluated academically?
**Answer**:
We evaluate the system across three dimensions:
1. **Classification Metrics**: Precision, Recall, and F1-Score for entity/skill extraction accuracy.
2. **Ranking Quality**: NDCG@K (Normalized Discounted Cumulative Gain at rank K) and MRR (Mean Reciprocal Rank) to measure job recommendation order relevance against human ground-truth rankings.
3. **System Efficiency**: Latency / Inference time per match computation (target < 100ms per pair).

---

### Q5: How do you address hallucinated or fake scores?
**Answer**:
The system strictly enforces data governance:
- Logged-out users or users without an uploaded resume receive **empty states** rather than fabricated default scores like "85%".
- All similarity scores are strictly computed dynamically through real dot-product / cosine mathematical operations over extracted features or developmental benchmark datasets clearly flagged as dev data.
