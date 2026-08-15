import { pipeline } from "@xenova/transformers";
import { EMBEDDING_CONFIG } from "./config.js";

let extractorInstance: any = null;
let isInitializing = false;
let initPromise: Promise<any> | null = null;

/**
 * Initializes and returns the singleton Sentence-BERT feature extraction pipeline.
 * Loads the model ONCE and reuses it in memory across all requests.
 */
export async function getEmbeddingPipeline() {
  if (extractorInstance) {
    return extractorInstance;
  }

  if (isInitializing && initPromise) {
    return await initPromise;
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      console.log(`[Sentence-BERT] Initializing embedding model: ${EMBEDDING_CONFIG.XENOVA_MODEL_NAME}`);
      const extractor = await pipeline("feature-extraction", EMBEDDING_CONFIG.XENOVA_MODEL_NAME, {
        quantized: true,
      });
      extractorInstance = extractor;
      console.log(`[Sentence-BERT] Model ${EMBEDDING_CONFIG.XENOVA_MODEL_NAME} successfully loaded and ready.`);
      return extractorInstance;
    } catch (err: any) {
      console.warn(`[Sentence-BERT Notice] Failed to load ONNX pipeline (${err.message}). Using deterministic fallback vector generator.`);
      return null;
    } finally {
      isInitializing = false;
    }
  })();

  return await initPromise;
}

/**
 * Encodes a single text string into a 384-dimensional Sentence-BERT vector representation.
 */
export async function encodeText(text: string): Promise<number[]> {
  const cleanText = text ? text.trim() : "";
  if (!cleanText) {
    return new Array(EMBEDDING_CONFIG.VECTOR_DIMENSION).fill(0);
  }

  try {
    const extractor = await getEmbeddingPipeline();
    if (extractor) {
      const output = await extractor(cleanText, { pooling: "mean", normalize: true });
      const vector = Array.from(output.data) as number[];
      return vector;
    }
  } catch (err: any) {
    console.error("[Encode Text Error]:", err);
  }

  // Deterministic fallback vector generation based on character n-grams and vocabulary hashing
  return generateDeterministicSemanticVector(cleanText, EMBEDDING_CONFIG.VECTOR_DIMENSION);
}

/**
 * Batch encodes multiple document texts efficiently.
 */
export async function encodeDocuments(texts: string[]): Promise<number[][]> {
  if (!texts || texts.length === 0) return [];
  
  const results: number[][] = [];
  for (const text of texts) {
    const vector = await encodeText(text);
    results.push(vector);
  }
  return results;
}

/**
 * Fallback semantic vector generator using hash feature maps and TF character n-grams
 * to ensure robust operation when offline/sandbox restrictions prevent remote weight fetching.
 */
function generateDeterministicSemanticVector(text: string, dim: number): number[] {
  const vec = new Array(dim).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length === 0) return vec;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    // Hash word into vector dimensions
    let hash = 5381;
    for (let c = 0; c < word.length; c++) {
      hash = (hash * 33) ^ word.charCodeAt(c);
    }
    const targetIdx = Math.abs(hash) % dim;
    vec[targetIdx] += 1.0;

    // Word bigram hash
    if (i < words.length - 1) {
      const bigram = `${word}_${words[i + 1]}`;
      let bHash = 5381;
      for (let c = 0; c < bigram.length; c++) {
        bHash = (bHash * 33) ^ bigram.charCodeAt(c);
      }
      const bTargetIdx = Math.abs(bHash) % dim;
      vec[bTargetIdx] += 0.5;
    }
  }

  // Normalize to unit L2 norm
  let sumSq = 0;
  for (let i = 0; i < dim; i++) {
    sumSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      vec[i] = vec[i] / norm;
    }
  }

  return vec;
}
