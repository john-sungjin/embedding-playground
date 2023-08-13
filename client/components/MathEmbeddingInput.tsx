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
      <div className="flex-col space-y-2">
        {/* HEADER START */}
        <div className="flex flex-row">
          <h5 className="flex h-8 w-36 items-center truncate rounded-md bg-gray-100 px-2 font-mono text-sm text-gray-600">
            {name} ={" "}
            {embedding.vector
              ? embedding.vector.map((e) => e.toFixed(5)).join(", ")
              : "null"}
          </h5>
          <Button
            onClick={() => {
              embedStore.deleteMathEmbedding(name);
            }}
            className="ml-auto flex h-8 w-8 items-center justify-center border-red-300 hover:bg-red-100"
            variant="outline"
          >
            <TrashIcon className="h-4 w-4 shrink-0 text-red-500" />
          </Button>
        </div>
        {/* HEADER END */}

        {/* MATH EMBEDDING INPUT START */}
        <div className="flex flex-row space-x-4">
          <Textarea
            placeholder="Enter expression..."
            value={rawExpression}
            onChange={(e) => {
              setRawExpression(e.target.value);
            }}
          />
        </div>
        {/* MATH EMBEDDING INPUT END */}
      </div>
    );
  },
);
