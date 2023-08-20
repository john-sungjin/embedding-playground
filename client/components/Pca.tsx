import { observer } from "mobx-react-lite";
import { PCA } from "ml-pca";
import { embedStore } from "./Embeddings";
import * as Plot from "@observablehq/plot";
import { useEffect, useMemo, useRef } from "react";

export const Pca: React.FC = observer(() => {
  const pcaChartRef = useRef<HTMLDivElement>(null);

  const vectors = embedStore.pcaVectors;
  // TODO: we need labels for the vectors -> probably want a map

  const pca = useMemo(() => {
    return new PCA(vectors);
  }, [vectors]);

  const pred = useMemo(() => {
    try {
      return pca.predict(vectors, { nComponents: 2 });
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

    const data = pred.to2DArray().map((v) => ({
      x: v[0],
      y: v[1],
    }));

    const plot = Plot.plot({
      grid: true,
      nice: true,
      x: { ticks: 10 },
      marks: [
        Plot.dot(data, { x: "x", y: "y", stroke: "steelblue" }),
        Plot.text(data, {
          x: "x",
          y: "y",
          text: "name",
          textAnchor: "start",
          dx: 6,
        }),
      ],
    });

    pcaChartRef.current!.append(plot);
    return () => plot.remove();
  }, [pred]);

  if (vectors.length === 0 || !pca || !pred) {
    return <div>PCA not available</div>;
  }

  return (
    <>
      <div>
        Pca explained variance:
        <pre>{JSON.stringify(pca.getExplainedVariance(), null, 2)}</pre>
        <br />
        New vectors:
        <pre>{JSON.stringify(pred, null, 2)}</pre>
      </div>
      <div ref={pcaChartRef} />
    </>
  );
});
