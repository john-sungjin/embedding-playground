import { observer } from "mobx-react-lite";
import { embeddings } from "./Embeddings";
import { useEffect } from "react";

export const SimilarityMatrix: React.FC = observer(() => {
  useEffect(() => {
    console.log("ADDED EMBEDDING");
  }, [embeddings.textEmbeddings.length]);
  return (
    <div>
      <div>SIMILARITY</div>
    </div>
  );
});
