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

function getKeyOrder<K, V>(map: Map<K, V>, targetKey: K): number | null {
  let order = 0;
  for (let key of map.keys()) {
    if (key === targetKey) {
      return order;
    }
    order++;
  }
  return null; // Key not found in the map
}

const MAX_LABEL_LENGTH = 12;

export const SimilarityMatrix: React.FC = observer(() => {
  const [similarities, setSimilarities] = useState<Map<string, number>>(
    new Map(),
  );

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
        },
      ),
    [],
  );

  const chartSettings = {
    width: 600,
    height: 600,
    marginTop: 5,
    marginRight: 5,
    marginBottom: 100,
    marginLeft: 100,
  };

  // investigate why this is changing...
  const { ref: chartRef, dims: chartDims } = useChartDimensions(chartSettings);

  const { rectangles, xScale, yScale } = useMemo(() => {
    const data = Array.from(similarities.entries()).map(([key, value]) => {
      const [source, target] = key.split(",");
      // if source comes after target in allValidEmbeddings, then we need to swap them
      if (
        getKeyOrder(embedStore.allValidEmbeddings, source)! >
        getKeyOrder(embedStore.allValidEmbeddings, target)!
      ) {
        return { source: target, target: source, value };
      }
      return { source, target, value };
    });

    const minValue = d3.min(data, (d) => d.value) || 0;
    const maxValue = d3.max(data, (d) => d.value) || 1;
    const range = maxValue - minValue;
    const minScale = Math.max(minValue - range * 0.1, 0);
    const maxScale = Math.min(maxValue + range * 0.1, 1);

    // labels: maps name to label
    const labels = new Map<string, string>();
    embedStore.allValidEmbeddings.forEach((embedding, key) =>
      labels.set(
        key,
        embedding instanceof TextEmbedding
          ? `${embedding.instruction}${embedding.text}`
          : `${embedding.expression}`,
      ),
    );

    const xScale = d3
      .scaleBand(labels.values(), [0, chartDims.boundedWidth])
      .paddingInner(0.05);
    const yScale = d3
      .scaleBand(labels.values(), [0, chartDims.boundedHeight])
      .paddingInner(0.05);
    const colorScale = d3
      .scaleSequential(
        d3.interpolateHsl(
          d3.rgb("rgba(255, 192, 203, 0.75)"),
          d3.rgb("rgba(65, 105, 225, 0.75)"),
        ),
      )
      .domain([minScale, maxScale]);

    const rectangles = data.map(({ source, target, value }) => {
      const x = xScale(labels.get(source)!);
      const y = yScale(labels.get(target)!);
      const width = xScale.bandwidth();
      const height = yScale.bandwidth();
      const color = colorScale(value);
      return { x, y, width, height, color, source, target, value };
    });

    return { rectangles, xScale, yScale };
  }, [similarities, chartDims]);

  return (
    <div ref={chartRef}>
      <svg
        width={chartDims.width}
        height={chartDims.height}
        className="rounded border bg-white"
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
                    rx={2}
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
                        <div className="h-full w-full" />
                      </HoverCardTrigger>
                      <HoverCardPortal>
                        <HoverCardContent
                          className="pointer-events-none flex w-48 flex-col space-y-1"
                          side={"top"}
                        >
                          <div className="rounded-md bg-gray-100 px-2 py-1 font-mono text-sm">
                            {embedding1Text}
                          </div>
                          <div className="rounded-md bg-gray-100 px-2 py-1 font-mono text-sm">
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
            {xScale.domain().map((label) => {
              let displayLabel = label;
              if (label.length > MAX_LABEL_LENGTH) {
                displayLabel = label.slice(0, MAX_LABEL_LENGTH) + "...";
              }

              return (
                <text
                  key={label}
                  x={xScale(label)! + xScale.bandwidth() / 2}
                  y={15}
                  textAnchor="end"
                  fontSize={12}
                  transform={`rotate(-45, ${
                    xScale(label)! + xScale.bandwidth() / 2
                  }, 15)`}
                  className="font-sans"
                >
                  {displayLabel}
                </text>
              );
            })}
          </g>
          <g transform={`translate(-3, 0)`}>
            {yScale.domain().map((label) => {
              let displayLabel = label;
              if (label.length > MAX_LABEL_LENGTH) {
                displayLabel = label.slice(0, MAX_LABEL_LENGTH) + "...";
              }
              return (
                <text
                  key={label}
                  x={-3}
                  y={yScale(label)! + yScale.bandwidth() / 2}
                  textAnchor="end"
                  fontSize={12}
                  className="font-sans"
                >
                  {displayLabel}
                </text>
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
});
