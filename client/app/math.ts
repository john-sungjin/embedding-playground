// For math expressions!
// Types are annoying. Using mathjs's functions to avoid casting
import { dot, norm, multiply, divide } from "mathjs";

export function cosineSimilarity(a: number[], b: number[]) {
  return divide(dot(a, b), multiply(norm(a), norm(b)));
}
