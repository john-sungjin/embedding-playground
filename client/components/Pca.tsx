import { observer } from "mobx-react-lite";
import { PCA } from "ml-pca";
import * as Plot from "@observablehq/plot";
import { useEffect, useMemo, useRef } from "react";
import { TextEmbedding, embedStore } from "@/components/Embeddings";

export const Pca: React.FC = observer(() => {
  const pcaChartRef = useRef<HTMLDivElement>(null);

  const vectors = embedStore.allValidEmbeddings;

  const pca = useMemo(() => {
    if (!vectors.size) {
      return null;
    }
    try {
      const vectorsSimple = [...vectors.values()].map((v) => v.vector!);
      return new PCA(vectorsSimple);
    } catch (err) {
      console.log(err);
      return null;
    }
  }, [vectors]);

  const pred = useMemo(() => {
    if (!pca) return new Map();

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
      return new Map();
    }
  }, [pca, vectors]);

  useEffect(() => {
    const data = Array.from(pred).map(([k, v]) => {
      const embedding = vectors.get(k)!;
      const label =
        embedding instanceof TextEmbedding
          ? `${embedding.instruction}${embedding.text}`
          : `${embedding.expression}`;
      return {
        key: k,
        label: label.length > 20 ? label.slice(0, 20) + "..." : label,
        "Component 1": v[0],
        "Component 2": v[1],
      };
    });

    const plot = Plot.plot({
      grid: true,
      nice: true,
      inset: 20,
      margin: 40,
      width: 600 - 64, // 32px padding
      height: 600 - 64,
      marks: [
        Plot.dot(data, {
          x: "Component 1",
          y: "Component 2",
          fill: "rgba(65, 80, 225, 0.90)",
          tip: true,
          channels: {
            name: "key",
          },
        }),
        Plot.text(data, {
          x: "Component 1",
          y: "Component 2",
          text: "label",
          textAnchor: "start",
          fontSize: 12,
          dx: 8,
        }),
        // Plot.axisX({
        //   labelAnchor: "center",
        //   labelArrow: false,
        // }),
        // Plot.axisY({
        //   labelAnchor: "center",
        //   labelArrow: false,
        // }),
      ],
    });

    if (pcaChartRef.current) {
      pcaChartRef.current!.append(plot);
      return () => plot.remove();
    }
  }, [pred, pcaChartRef.current]);

  const totalExplainedVariance = useMemo(() => {
    if (!pca) return 0;

    const explainedVariance = pca.getExplainedVariance();
    return explainedVariance[0] + explainedVariance[1];
  }, [pca]);

  return (
    <div className="flex flex-col">
      <div className="mb-2 flex items-center space-x-3 px-1">
        <h2 className="font-medium">PCA</h2>
      </div>
      {vectors.size > 2 ? (
        <div
          ref={pcaChartRef}
          className="relative w-fit rounded border bg-white p-8"
        >
          <div className="absolute right-0 top-0 m-2 flex items-center space-x-2 rounded border bg-white px-2 py-1 text-sm">
            <span className="font-mono text-gray-600">explained variance</span>
            <span className="font-mono text-gray-700">
              {totalExplainedVariance.toFixed(4)}
            </span>
            {/*
        New vectors:
        <pre>{JSON.stringify(Array.from(pred), null, 2)}</pre> */}
          </div>
        </div>
      ) : (
        <div className="flex h-[600px] w-[600px] flex-col items-center justify-center space-y-4 rounded border bg-white p-8">
          <svg className="-mt-8 mb-4 h-[182px] w-[180px]">
            <line
              x1="2"
              y1="0"
              x2="2"
              y2="180"
              strokeWidth="2"
              className="stroke-gray-200"
            />
            <line
              x1="1"
              y1="180"
              x2="180"
              y2="180"
              strokeWidth="2"
              className="stroke-gray-200"
            />
            <circle fill="rgba(65, 80, 225, 0.40)" cx="130" cy="150" r="5" />
            <circle fill="rgba(65, 80, 225, 0.40)" cx="40" cy="120" r="5" />
            <circle fill="rgba(65, 80, 225, 0.40)" cx="65" cy="50" r="5" />
          </svg>
          <h3 className="text-center text-xl font-medium">No PCA plot</h3>
          <p className="text-center text-sm text-gray-500">
            Add at least three embeddings to see your plot!
          </p>
        </div>
      )}
    </div>
  );
});
