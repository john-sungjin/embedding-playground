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
import { reaction } from "mobx";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { HoverCardPortal } from "@radix-ui/react-hover-card";

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
  const [allLabels, setAllLabels] = useState<Array<string>>([]);

  // Track embedding values and update when they change
  useEffect(
    () =>
      reaction(
        () =>
          Array.from(embedStore.allValidEmbeddings).map(
            ([name, embedding]) => ({
              name,
              vector: embedding.vector!,
            }),
          ),
        (embeddings) => {
          const newSimilarities = new Map();
          embeddings.forEach(({ name, vector }) => {
            embeddings.forEach(({ name: otherName, vector: otherVector }) => {
              if (name === otherName) {
                return;
              }
              const key = namesToKey(name, otherName);
              const similarity = cosineSimilarity(vector, otherVector);
              newSimilarities.set(key, similarity);
            });
          });

          setSimilarities(newSimilarities);
          setAllLabels([...embedStore.allValidEmbeddings.keys()]);
        },
      ),
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

  // investigate why this is changing...
  const { ref: chartRef, dims: chartDims } = useChartDimensions(chartSettings);

  const { rectangles, xScale, yScale } = useMemo(() => {
    const data = Array.from(similarities.entries()).map(([key, value]) => {
      const [source, target] = key.split(",");
      return { source, target, value };
    });

    const minValue = d3.min(data, (d) => d.value) || 0;
    const maxValue = d3.max(data, (d) => d.value) || 1;
    const range = maxValue - minValue;
    const minScale = Math.max(minValue - range * 0.1, 0);
    const maxScale = Math.min(maxValue + range * 0.1, 1);

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
          overflow="visible"
        >
          <g
            transform={`translate(${chartDims.marginLeft}, ${chartDims.marginTop})`}
          >
            {rectangles.map(
              ({ x, y, width, height, color, source, target, value }) => {
                const embedding1 = embedStore.allValidEmbeddings.get(source)!;
                const embedding2 = embedStore.allValidEmbeddings.get(target)!;

                const embedding1Text =
                  "expression" in embedding1
                    ? `${source}: ${embedding1.expression}`
                    : `${source}: ${embedding1.instruction + embedding1.text}`;
                const embedding2Text =
                  "expression" in embedding2
                    ? `${target}: ${embedding2.expression}`
                    : `${target}: ${embedding2.instruction + embedding2.text}`;

                return (
                  <g key={`${x}_${y}`}>
                    {/* Embedding HTML content inside SVG */}
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={color}
                    />
                    <foreignObject
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      overflow="visible"
                    >
                      <HoverCard openDelay={0} closeDelay={0}>
                        <HoverCardTrigger asChild>
                          <div className="w-full h-full" />
                        </HoverCardTrigger>
                        <HoverCardPortal>
                          <HoverCardContent
                            className="w-48 flex flex-col space-y-1"
                            side={"top"}
                          >
                            <div className="px-2 py-1 font-mono text-sm bg-gray-100 rounded-md">
                              {embedding1Text}
                            </div>
                            <div className="px-2 py-1 font-mono text-sm bg-gray-100 rounded-md">
                              {embedding2Text}
                            </div>
                            <div className="truncate font-mono">
                              {value.toFixed(4)}
                            </div>
                          </HoverCardContent>
                        </HoverCardPortal>
                      </HoverCard>
                    </foreignObject>
                  </g>
                );
              },
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
