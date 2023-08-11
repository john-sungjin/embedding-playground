// For math expressions!
// Types are annoying. Using mathjs's functions to avoid casting
import { dot, norm, multiply, divide, matrix, Matrix } from "mathjs";

type SimilarityFunction = (vecA: number[], vecB: number[]) => number;

export function cosineSimilarity(vecA: number[], vecB: number[]) {
  return divide(dot(vecA, vecB), multiply(norm(vecA), norm(vecB))) as number;
}
