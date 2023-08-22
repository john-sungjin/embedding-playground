import { observer } from "mobx-react-lite";
import { PCA } from "ml-pca";
import { embedStore } from "./Embeddings";
import * as Plot from "@observablehq/plot";
import { useEffect, useMemo, useRef } from "react";

export const Pca: React.FC = observer(() => {
  const pcaChartRef = useRef<HTMLDivElement>(null);

  const vectors = embedStore.allValidEmbeddings;

  const pca = useMemo(() => {
    if (!vectors.size) {
      return null;
    }
    const vectorsSimple = [...vectors.values()].map((v) => v.vector!);
    return new PCA(vectorsSimple);
  }, [vectors]);

  const pred = useMemo(() => {
    if (!pca) return null;

    try {
      const vectorsSimple = [...vectors.values()].map((v) => v.vector!);
      const pcaRawPreds = pca
        .predict(vectorsSimple, { nComponents: 2 })
        .to2DArray();

      return new Map(
        [...vectors.keys()].map((k, index) => [k, pcaRawPreds[index]]),
      );
    } catch (err) {
      console.log(err);
      return null;
    }
  }, [pca, vectors]);

  useEffect(() => {
    if (!pred) {
      return;
    }
    console.log(pred);

    const data = Array.from(pred).map(([k, v]) => ({
      label: k,
      "Component 1": v[0],
      "Component 2": v[1],
    }));

    const plot = Plot.plot({
      grid: true,
      nice: true,
      inset: 20,
      marks: [
        Plot.dot(data, {
          x: "Component 1",
          y: "Component 2",
          stroke: "steelblue",
        }),
        Plot.text(data, {
          x: "Component 1",
          y: "Component 2",
          text: "label",
          textAnchor: "start",
          dx: 6,
        }),
      ],
    });

    pcaChartRef.current!.append(plot);
    return () => plot.remove();
  }, [pred]);

  if (vectors.size === 0 || !pca || !pred) {
    return <div>PCA not available</div>;
  }

  const explainedVariance = pca.getExplainedVariance();
  const totalExplainedVariance = explainedVariance[0] + explainedVariance[1];

  return (
    <>
      <h2 className="pt-4 text-xl">PCA</h2>
      <div className="pb-2">
        Explained variance: {totalExplainedVariance}
        {/*
        New vectors:
        <pre>{JSON.stringify(Array.from(pred), null, 2)}</pre> */}
      </div>
      <div ref={pcaChartRef} />
    </>
  );
});
