import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import {
  MathEmbedding,
  TextEmbedding,
  embedStore,
} from "@/components/Embeddings";
import { cosineSimilarity } from "@/app/math";

function namesToKey(i: string, j: string) {
  // make i < j
  if (i > j) {
    return `${j},${i}`;
  }
  return `${i},${j}`;
}

const SimilarityRow: React.FC<{
  name: string;
  embedding: TextEmbedding | MathEmbedding;
  updateSimilarities: (name: string) => void;
}> = observer(({ name, embedding, updateSimilarities }) => {
  useEffect(() => {
    console.log("UPDATING SIMILARITIES:", name);
    updateSimilarities(name);
  }, [embedding.vector]);

  return <div></div>;
});

export const SimilarityMatrix: React.FC<{
  embeddings: Map<string, TextEmbedding | MathEmbedding>;
}> = observer(({ embeddings }) => {
  console.log("TRACKING EMBEDDINGS:", embeddings);
  const [similarities, setSimilarities] = useState<Map<string, number>>(
    new Map(),
  );

  function updateSimilarities(name: string) {
    const newSimilarities = new Map(similarities);
    const embedding = embeddings.get(name)!;
    if (!embedding.vector) {
      return;
    }
    embeddings.forEach((otherEmbedding, otherName) => {
      if (!otherEmbedding.vector) {
        return;
      }
      const key = namesToKey(name, otherName);
      const similarity = cosineSimilarity(
        embedding.vector!,
        otherEmbedding.vector,
      );
      newSimilarities.set(key, similarity);
    });
    setSimilarities(newSimilarities);
  }

  return (
    <div>
      <h3>Similarity Matrix</h3>
      {Array.from(similarities).map(([key, similarity]) => {
        const [i, j] = key.split(",");
        return (
          <div key={key}>
            {i} {j} {similarity}
          </div>
        );
      })}
      {Array.from(embeddings).map(([name, embedding]) => (
        <SimilarityRow
          key={name}
          name={name}
          embedding={embedding}
          updateSimilarities={updateSimilarities}
        />
      ))}
    </div>
  );
});
