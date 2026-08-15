import { cosineSimilarity, mapSimilarityToScore } from "./similarity.js";

/**
 * Traditional Baseline TF-IDF (Term Frequency - Inverse Document Frequency) Matcher
 * Used for research baseline comparison against Sentence-BERT.
 */
export class TfidfMatcher {
  private stopWords: Set<string>;

  constructor() {
    this.stopWords = new Set([
      "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
      "has", "he", "in", "is", "it", "its", "of", "on", "that", "the",
      "to", "was", "were", "will", "with", "or", "an", "this", "be",
      "our", "your", "we", "you", "i", "my", "me", "have", "been", "had"
    ]);
  }

  /**
   * Tokenizes text into lowercase unigrams and bigrams
   */
  private tokenize(text: string): string[] {
    const clean = text.toLowerCase().replace(/[^a-z0-9+#\s]/g, " ");
    const words = clean.split(/\s+/).filter(w => w.length > 1 && !this.stopWords.has(w));
    
    const tokens: string[] = [...words];
    // Add bigrams for context
    for (let i = 0; i < words.length - 1; i++) {
      tokens.push(`${words[i]}_${words[i + 1]}`);
    }
    return tokens;
  }

  /**
   * Calculates TF-IDF Cosine Similarity between two text documents (e.g. Candidate Profile vs Job Profile)
   */
  public computeSimilarity(textA: string, textB: string): { similarity: number; score: number } {
    const tokensA = this.tokenize(textA);
    const tokensB = this.tokenize(textB);

    if (tokensA.length === 0 || tokensB.length === 0) {
      return { similarity: 0, score: 0 };
    }

    // Build Vocabulary
    const vocabSet = new Set<string>([...tokensA, ...tokensB]);
    const vocabulary = Array.from(vocabSet);

    // Compute Term Frequencies (TF)
    const tfA = new Map<string, number>();
    const tfB = new Map<string, number>();

    tokensA.forEach(t => tfA.set(t, (tfA.get(t) || 0) + 1));
    tokensB.forEach(t => tfB.set(t, (tfB.get(t) || 0) + 1));

    // Total documents = 2
    const N = 2;
    const vectorA: number[] = [];
    const vectorB: number[] = [];

    vocabulary.forEach(term => {
      let docCount = 0;
      if (tfA.has(term)) docCount++;
      if (tfB.has(term)) docCount++;

      // Smoothed IDF
      const idf = Math.log((N + 1) / (docCount + 1)) + 1.0;

      const normTfA = (tfA.get(term) || 0) / tokensA.length;
      const normTfB = (tfB.get(term) || 0) / tokensB.length;

      vectorA.push(normTfA * idf);
      vectorB.push(normTfB * idf);
    });

    const rawSimilarity = cosineSimilarity(vectorA, vectorB);
    const score = mapSimilarityToScore(rawSimilarity);

    return {
      similarity: parseFloat(rawSimilarity.toFixed(4)),
      score
    };
  }
}

export const tfidfMatcher = new TfidfMatcher();
