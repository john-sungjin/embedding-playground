// For math expressions!
// Types are annoying. Using mathjs's functions to avoid casting
import { dot, norm, multiply, divide, matrix, Matrix } from "mathjs";

export interface EmbeddingInfo {
  name: string;
  embedding: number[] | null;
}

type SimilarityFunction = (vecA: number[], vecB: number[]) => number;

export function cosineSimilarity(vecA: number[], vecB: number[]) {
  return divide(dot(vecA, vecB), multiply(norm(vecA), norm(vecB))) as number;
}

export function calculateSimilarityMatrix(
  vectors: number[][],
  similarityFunc: SimilarityFunction,
): number[][] {
  return vectors.map((vecA, i) =>
    vectors.map((vecB, j) => (i === j ? 1 : similarityFunc(vecA, vecB))),
  );
}

function indicesToKey(i: number, j: number) {
  // make i < j
  if (i > j) {
    return `${j},${i}`;
  }
  return `${i},${j}`;
}

// Class for the similarity matrix.
// We will only update cells where row > column, since the matrix is symmetric
class EmbeddingMatrix {
  similarities: Map<string, number>;
  embeddings: EmbeddingInfo[];
  similarityFunc: SimilarityFunction;

  constructor(similarityFunc: SimilarityFunction) {
    this.similarities = new Map();
    this.embeddings = [];
    this.similarityFunc = cosineSimilarity;
  }

  public addEmbedding(embedding: EmbeddingInfo) {
    this.embeddings.push(embedding);

    const index = this.embeddings.length - 1;

    this.embeddings.forEach((embedding, i) => {
      const similarity = cosineSimilarity(
        embedding.embedding!,
        this.embeddings[index].embedding!,
      );
      this.similarities.set(indicesToKey(i, index), similarity);
    });
  }

  public updateEmbedding(embedding: EmbeddingInfo) {
    const index = this.embeddings.findIndex((e) => e.name === embedding.name);
    this.embeddings[index] = embedding;

    this.embeddings.forEach((embedding, i) => {
      const similarity = cosineSimilarity(
        embedding.embedding!,
        this.embeddings[index].embedding!,
      );
      this.similarities.set(indicesToKey(i, index), similarity);
    });
  }
}
