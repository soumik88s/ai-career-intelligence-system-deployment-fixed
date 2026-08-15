// Phase 6 Embedding Configuration
export const EMBEDDING_CONFIG = {
  // Default sentence-transformers model
  MODEL_NAME: process.env.EMBEDDING_MODEL_NAME || "sentence-transformers/all-MiniLM-L6-v2",
  
  // Xenova equivalent ONNX pipeline name
  XENOVA_MODEL_NAME: (process.env.EMBEDDING_MODEL_NAME || "sentence-transformers/all-MiniLM-L6-v2").replace(
    "sentence-transformers/",
    "Xenova/"
  ),

  MODEL_VERSION: "v1.0.0",
  VECTOR_DIMENSION: 384, // 384 dimensions for all-MiniLM-L6-v2

  // Similarity score display transformation bounds
  SIMILARITY_SCALING: {
    // Cosine similarity for text embeddings in SBERT generally spans [0.2, 0.95].
    // Linear transformation to 0-100 score:
    MIN_EXPECTED_SIMILARITY: 0.1,
    MAX_EXPECTED_SIMILARITY: 0.9,
  }
};
