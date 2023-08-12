import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import {
  MathEmbedding,
  TextEmbedding,
  embedStore,
} from "@/components/Embeddings";
import { cosineSimilarity } from "@/app/math";
import { useChartDimensions } from "@/components/useChartDimensions";
import * as d3 from "d3";
import { autorun, reaction } from "mobx";

function namesToKey(i: string, j: string) {
  // make i < j
  if (i > j) {
    return `${j},${i}`;
  }
  return `${i},${j}`;
}

export const SimilarityMatrix: React.FC = observer(() => {
  const [similarities, setSimilarities] = useState<Map<string, number>>(
    new Map(),
  );

  // Track embedding values and update when they change
  useEffect(
    () =>
      autorun(() => {
        console.log("RUNNING AUTORUN");
        const newSimilarities = new Map();
        embedStore.allValidEmbeddings.forEach((embedding, name) => {
          embedStore.allValidEmbeddings.forEach((otherEmbedding, otherName) => {
            const key = namesToKey(name, otherName);
            const similarity = cosineSimilarity(
              embedding.vector!,
              otherEmbedding.vector!,
            );
            newSimilarities.set(key, similarity);
          });
        });

        setSimilarities(newSimilarities);
      }),

    [],
  );

  const chartSettings = {
    width: 500,
    height: 500,
    marginTop: 20,
    marginRight: 20,
    marginBottom: 20,
    marginLeft: 20,
  };

  const { ref: chartRef, dims: chartDims } = useChartDimensions(chartSettings);

  const { rectangles, xScale, yScale } = useMemo(() => {
    const data = Array.from(similarities.entries()).map(([key, value]) => {
      const [source, target] = key.split(",");
      return { source, target, value };
    });

    const allNames = [...embedStore.allValidEmbeddings.keys()];

    const xScale = d3.scaleBand(allNames, [0, 500]);
    const yScale = d3.scaleBand(allNames, [0, 500]);
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, 1]);

    const rectangles = data.map(({ source, target, value }) => {
      const x = xScale(source);
      const y = yScale(target);
      const width = xScale.bandwidth();
      const height = yScale.bandwidth();
      const color = colorScale(value);
      return { x, y, width, height, color };
    });

    return { rectangles, xScale, yScale };
  }, [similarities]);

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
      {/* HEATMAP START */}
      <div ref={chartRef}>
        <svg width={chartDims.width} height={chartDims.height}>
          {rectangles.map(({ x, y, width, height, color }) => (
            <rect
              key={`${x}_${y}`}
              x={x}
              y={y}
              width={width}
              height={height}
              fill={color}
            />
          ))}
          <g y={500}>
            {xScale.domain().map((name) => (
              <text
                key={name}
                x={xScale(name)! + xScale.bandwidth() / 2}
                y={-5}
                textAnchor="middle"
              >
                {name}
              </text>
            ))}
          </g>
        </svg>
      </div>
      {/* HEATMAP END */}
    </div>
  );
});
