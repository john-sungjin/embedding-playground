import { observer } from "mobx-react-lite";
import { embedStore, MathEmbedding } from "@/components/Embeddings";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TrashIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { reaction } from "mobx";

const MATH_EDIT_TIMEOUT = 500;

export const MathEmbeddingInput = observer(
  ({ name, embedding }: { name: string; embedding: MathEmbedding }) => {
    const [rawExpression, setRawExpression] = useState(embedding.expression);

    // After 500ms of no edits, write the expression to the global db.
    useEffect(() => {
      if (rawExpression !== embedding.expression) {
        const newTimeoutId = window.setTimeout(async () => {
          embedStore.updateExpression({
            name,
            expression: rawExpression,
          });

          // Also recompute the embedding's value.
          embedStore.updateMathEmbedding(name);
        }, MATH_EDIT_TIMEOUT);

        return () => {
          window.clearTimeout(newTimeoutId);
        };
      }
    }, [name, rawExpression, embedding.expression]);

    // recompute if any dependencies change
    useEffect(
      () =>
        reaction(
          () =>
            Array.from(embedding.dependencies.values()).map(
              (name) => embedStore.textEmbeddings.get(name)?.vector!,
            ),
          () => {
            embedStore.updateMathEmbedding(name);
          },
        ),
      [],
    );

    return (
      <div className="group w-full flex-col space-y-2 rounded border bg-white p-2 shadow-sm">
        {/* HEADER START */}
        <div className="mb-1 flex w-full items-center">
          <h5 className="flex items-center truncate px-2 font-mono text-xs font-semibold text-gray-600">
            {name}
          </h5>
          <Button
            onClick={() => {
              embedStore.deleteMathEmbedding(name);
            }}
            className="invisible ml-auto h-6 w-6 rounded p-0 group-hover:visible"
            variant="ghost"
          >
            <TrashIcon className="h-4 w-4 shrink-0 text-gray-500 group-hover:text-red-500" />
          </Button>
        </div>
        {/* HEADER END */}

        {/* MATH EMBEDDING INPUT START */}
        <div className="flex flex-row space-x-4">
          <Textarea
            placeholder="Enter expression (e.g. a0 + a1)"
            value={rawExpression}
            onChange={(e) => {
              setRawExpression(e.target.value);
            }}
            className="font-mono shadow-none"
          />
        </div>
        {/* MATH EMBEDDING INPUT END */}
      </div>
    );
  },
);
