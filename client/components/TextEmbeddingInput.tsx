import { observer } from "mobx-react-lite";
import {
  embedStore,
  ModelConfig,
  TextEmbedding,
} from "@/components/Embeddings";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  TrashIcon,
  SymbolIcon,
  ExclamationTriangleIcon,
  CheckCircledIcon,
  CheckIcon,
} from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { INSTRUCTION_MODELS } from "@/components/ModelSelector";
import { useEmbedding } from "@/components/useEmbeddings";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const TEXT_EDIT_TIMEOUT = 1000;

export const TextEmbeddingInput = observer(
  ({
    name,
    model,
    embedding,
  }: {
    name: string;
    model: ModelConfig;
    embedding: TextEmbedding;
  }) => {
    const [rawText, setRawText] = useState(embedding.text);
    const [rawInstruction, setRawInstruction] = useState(embedding.instruction);

    const [isEditing, setIsEditing] = useState(false);

    // After 1 second of no edits to raw{Text,Instruction}, update the info
    // on the actual embedding.
    useEffect(() => {
      if (
        rawText !== embedding.text ||
        rawInstruction !== embedding.instruction
      ) {
        setIsEditing(true);

        const timeoutId = window.setTimeout(async () => {
          embedStore.updateTextOrInstruction({
            name,
            text: rawText,
            instruction: rawInstruction,
          });

          setIsEditing(false);
        }, TEXT_EDIT_TIMEOUT);

        return () => {
          window.clearTimeout(timeoutId);
        };
      }
    }, [name, rawText, rawInstruction, embedding.text, embedding.instruction]);

    const isEmpty = !embedding.text;

    // When the embedding info is updated, call the backend again.
    const { data, isLoading, isFetching } = useEmbedding({ model, embedding });

    // Also keep the global embedding state updated.
    useEffect(() => {
      embedStore.updateTextEmbeddingState(name, {
        isLoading: isLoading && !isEmpty,
        isOutdated: isEditing || isFetching || isEmpty,
      });
      if (data) {
        embedStore.updateTextEmbeddingState(name, {
          vector: data.embedding,
        });
      }
    }, [name, isLoading, isFetching, isEmpty, data, isEditing]);

    return (
      <div className="group w-full flex-col rounded border bg-white p-2 shadow-sm focus-within:focus-within:bg-white hover:bg-gray-50">
        {/* HEADER START */}
        <div className="mb-1 flex w-full items-center">
          <div className="flex items-center space-x-1">
            <h5 className="flex items-center truncate px-2 font-mono text-xs font-semibold text-gray-600">
              {name}
            </h5>
            {embedding.isLoading ? (
              <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100">
                <SymbolIcon className="h-3 w-3 animate-spin text-blue-700" />
              </div>
            ) : embedding.isOutdated || embedding.vector === null ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger>
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-yellow-100">
                    <ExclamationTriangleIcon className="h-3.5 w-3.5 text-yellow-700" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {rawText === "" && rawInstruction === "" ? (
                    <p>Enter some text!</p>
                  ) : (
                    <p>Refreshing soon...</p>
                  )}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
          <Button
            onClick={() => {
              embedStore.deleteTextEmbedding(name);
            }}
            className="invisible ml-auto h-6 w-6 rounded p-0 group-hover:visible"
            variant="ghost"
          >
            <TrashIcon className="h-4 w-4 shrink-0 text-gray-500 group-hover:text-red-500" />
          </Button>
        </div>
        {/* HEADER END */}
        {/* TEXT EMBEDDING INPUT START */}
        <div className="flex flex-row space-x-2">
          {INSTRUCTION_MODELS.has(model.name) && (
            <Textarea
              placeholder="Enter instruction..."
              value={rawInstruction}
              onChange={(e) => {
                setRawInstruction(e.target.value);
              }}
              className="shadow-none"
            />
          )}
          <Textarea
            placeholder="Enter text..."
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
            }}
            className="shadow-none"
          />
        </div>
        {/* TEXT EMBEDDING INPUT END */}
      </div>
    );
  },
);
