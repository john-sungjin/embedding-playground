import { observer } from "mobx-react-lite";
import { embedStore, Models, TextEmbedding } from "@/components/Embeddings";
import { useGenerateEmbedding } from "@/app/generated/server/serverQueryComponents";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  TrashIcon,
  SymbolIcon,
  ExclamationTriangleIcon,
  CheckCircledIcon,
} from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { INSTRUCTION_MODELS } from "./ModelSelector";

const TEXT_EDIT_TIMEOUT = 1000;

export const TextEmbeddingInput = observer(
  ({
    name,
    model,
    embedding,
  }: {
    name: string;
    model: Models;
    embedding: TextEmbedding;
  }) => {
    const { toast } = useToast();

    const [rawText, setRawText] = useState(embedding.text);
    const [rawInstruction, setRawInstruction] = useState(embedding.instruction);

    const [editTimeoutId, setEditTimeoutId] = useState<number | null>(null);

    // After 1 second of no edits to raw{Text,Instruction}, update the info
    // on the actual embedding.
    useEffect(() => {
      if (
        rawText !== embedding.text ||
        rawInstruction !== embedding.instruction
      ) {
        if (editTimeoutId) {
          clearTimeout(editTimeoutId);
        }
        const newTimeoutId = window.setTimeout(async () => {
          embedStore.updateTextOrInstruction({
            name,
            text: rawText,
            instruction: rawInstruction,
          });
          setEditTimeoutId(null);
        }, TEXT_EDIT_TIMEOUT);

        setEditTimeoutId(newTimeoutId);
      }
    }, [name, rawText, rawInstruction]);

    // When the embedding info is updated, call the backend again.
    const { data, isLoading, isFetching } = useGenerateEmbedding(
      {
        queryParams: {
          embed_model_name: model,
          text: embedding.text,
          instruction: embedding.instruction,
        },
      },
      {
        onError: (err) => {
          toast({
            title: "Something went wrong! Check the console for more details.",
            variant: "destructive",
          });
          console.error(err);
        },
      },
    );

    // Also keep the global embedding state updated.
    useEffect(() => {
      console.log("updating global text embedding state");
      embedStore.updateTextEmbeddingState(name, {
        isLoading,
        isOutdated: !!editTimeoutId || isFetching,
        vector: data?.embedding,
      });
    }, [name, isLoading, isFetching, data, editTimeoutId]);

    return (
      <div className="flex-col space-y-2">
        {/* HEADER START */}
        <div className="flex w-full">
          <div className="flex items-center space-x-2">
            <h5 className="flex h-8 w-36 items-center truncate rounded-md bg-gray-100 px-2 font-mono text-sm text-gray-600">
              {name} ={" "}
              {embedding.vector
                ? embedding.vector.map((e) => e.toFixed(5)).join(", ")
                : "null"}
            </h5>
            {embedding.isLoading ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100">
                <SymbolIcon className="h-4 w-4 animate-spin text-blue-700" />
              </div>
            ) : embedding.isOutdated || embedding.vector === null ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-yellow-100">
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-700" />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-100">
                <CheckCircledIcon className="h-4 w-4 text-green-700" />
              </div>
            )}
          </div>
          <Button
            onClick={() => {
              embedStore.deleteTextEmbedding(name);
            }}
            className="ml-auto flex h-8 w-8 items-center justify-center border-red-300 hover:bg-red-100"
            variant="outline"
          >
            <TrashIcon className="h-4 w-4 shrink-0 text-red-500" />
          </Button>
        </div>
        {/* HEADER END */}
        {/* TEXT EMBEDDING INPUT START */}
        <div className="flex flex-row space-x-4">
          {INSTRUCTION_MODELS.has(model) && (
            <Textarea
              placeholder="Enter instruction..."
              value={rawInstruction}
              onChange={(e) => {
                setRawInstruction(e.target.value);
              }}
            />
          )}
          <Textarea
            placeholder="Enter text..."
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
            }}
          />
        </div>
        {/* TEXT EMBEDDING INPUT END */}
      </div>
    );
  },
);