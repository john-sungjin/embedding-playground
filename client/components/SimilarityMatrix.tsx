import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { embedStore } from "@/components/Embeddings";
import { cosineSimilarity } from "@/app/math";
import { useChartDimensions } from "@/components/useChartDimensions";
import * as d3 from "d3";
import { autorun, reaction } from "mobx";
import { HoverCard, HoverCardTrigger } from "@/components/ui/hover-card";
import { HoverCardContent } from "@radix-ui/react-hover-card";

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
        const newSimilarities = new Map();
        embedStore.allValidEmbeddings.forEach((embedding, name) => {
          embedStore.allValidEmbeddings.forEach((otherEmbedding, otherName) => {
            if (name === otherName) {
              return;
            }
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
    marginTop: 50,
    marginRight: 50,
    marginBottom: 50,
    marginLeft: 50,
  };

  const { ref: chartRef, dims: chartDims } = useChartDimensions(chartSettings);

  const { rectangles, xScale, yScale } = useMemo(() => {
    const data = Array.from(similarities.entries()).map(([key, value]) => {
      const [source, target] = key.split(",");
      return { source, target, value };
    });

    const allLabels = [...embedStore.allValidEmbeddings.keys()];

    const minValue = d3.min(data, (d) => d.value) || 0;
    const maxValue = d3.max(data, (d) => d.value) || 1;
    const range = maxValue - minValue;
    const minScale = Math.max(minValue - range * 0.1, 0);
    const maxScale = Math.min(maxValue + range * 0.1, 1);

    console.log(minScale, maxScale);

    const xScale = d3
      .scaleBand(allLabels, [0, chartDims.boundedWidth])
      .paddingInner(0.05);
    const yScale = d3
      .scaleBand(allLabels, [0, chartDims.boundedHeight])
      .paddingInner(0.05);
    const colorScale = d3
      .scaleSequential(d3.interpolateBlues)
      .domain([minScale, maxScale]);

    const rectangles = data.map(({ source, target, value }) => {
      const x = xScale(source);
      const y = yScale(target);
      const width = xScale.bandwidth();
      const height = yScale.bandwidth();
      const color = colorScale(value);
      return { x, y, width, height, color, source, target, value };
    });

    return { rectangles, xScale, yScale };
  }, [similarities, chartDims]);

  return (
    <div>
      <h3>Similarity Matrix</h3>
      {/* HEATMAP START */}
      <div ref={chartRef}>
        <svg
          width={chartDims.width}
          height={chartDims.height}
          className="border"
        >
          <g
            transform={`translate(${chartDims.marginLeft}, ${chartDims.marginTop})`}
          >
            {rectangles.map(
              ({ x, y, width, height, color, source, target, value }) => (
                <g key={`${x}_${y}`}>
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={color}
                    pointerEvents={"all"}
                  />

                  {/* Embedding HTML content inside SVG */}
                  <foreignObject
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    pointerEvents={"all"}
                    // className="relative"
                  >
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="w-full h-full border"></div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80 flex flex-col bg-gray-200">
                        <div>{source}</div>
                        <div>{target}</div>
                        <div className="flex flex-row justify-between">
                          <div>Value</div>
                          <div>{value}</div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </foreignObject>
                </g>
              ),
            )}
            <g transform={`translate(0, ${chartDims.boundedHeight})`}>
              {xScale.domain().map((name) => (
                <text
                  key={name}
                  x={xScale(name)! + xScale.bandwidth() / 2}
                  y={15}
                  textAnchor="middle"
                  fontSize={12}
                >
                  {name}
                </text>
              ))}
            </g>
            <g transform={`translate(-3, 0)`}>
              {yScale.domain().map((name) => (
                <text
                  key={name}
                  x={-3}
                  y={yScale(name)! + yScale.bandwidth() / 2}
                  textAnchor="end"
                  fontSize={12}
                >
                  {name}
                </text>
              ))}
            </g>
          </g>
        </svg>
      </div>
      {/* HEATMAP END */}
    </div>
  );
});
