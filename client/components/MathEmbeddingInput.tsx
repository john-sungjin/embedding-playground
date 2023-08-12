import { observer } from "mobx-react-lite";
import { embedStore, MathEmbedding } from "@/components/Embeddings";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  TrashIcon,
  SymbolIcon,
  ExclamationTriangleIcon,
  CheckCircledIcon,
} from "@radix-ui/react-icons";
import { useEffect, useState } from "react";

const MATH_EDIT_TIMEOUT = 500;

export const MathEmbeddingInput = observer(
  ({ name, embedding }: { name: string; embedding: MathEmbedding }) => {
    const [rawExpression, setRawExpression] = useState(embedding.expression);

    const [editTimeoutId, setEditTimeoutId] = useState<number | null>(null);

    // After 1 second of no edits to raw{Text,Instruction}, update the info
    // on the actual embedding.
    useEffect(() => {
      if (rawExpression !== embedding.expression) {
        if (editTimeoutId) {
          clearTimeout(editTimeoutId);
        }
        const newTimeoutId = window.setTimeout(async () => {
          embedStore.updateExpression({
            name,
            expression: rawExpression,
          });

          // Also recompute the embedding's value.
          embedStore.updateMathEmbedding(name);

          setEditTimeoutId(null);
        }, MATH_EDIT_TIMEOUT);

        setEditTimeoutId(newTimeoutId);
      }
    }, [name, rawExpression, setEditTimeoutId]);

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