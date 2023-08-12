"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  TrashIcon,
  PlusIcon,
  SymbolIcon,
  ExclamationTriangleIcon,
  CheckCircledIcon,
} from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { INSTRUCTION_MODELS, ModelSelector } from "../components/ModelSelector";
import { observer } from "mobx-react-lite";
import {
  embedStore,
  MathEmbedding,
  Models,
  TextEmbedding,
} from "@/components/Embeddings";
import { SimilarityMatrix } from "@/components/SimilarityMatrix";

const TEXT_EDIT_TIMEOUT = 1000;
const MATH_EDIT_TIMEOUT = 500;

const Home = observer(() => {
  const { toast } = useToast();
  const [modelValue, setModelValue] = useState<Models>(
    "hkunlp/instructor-large",
  );

  // Edit on change
  const [textTimeoutId, setTextTimeoutId] = useState<number | null>(null);
  const [mathTimeoutId, setMathTimeoutId] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (textTimeoutId) {
        clearTimeout(textTimeoutId);
      }
      if (mathTimeoutId) {
        clearTimeout(mathTimeoutId);
      }
    };
  }, [textTimeoutId, mathTimeoutId]);

  function textEmbeddingsHandler({
    name,
    text,
    instruction,
  }: {
    name: string;
    text?: string;
    instruction?: string;
  }) {
    embedStore.updateTextOrInstruction({ name, text, instruction });
    if (textTimeoutId) {
      clearTimeout(textTimeoutId);
    }
    const newTimeoutId = window.setTimeout(async () => {
      if (!modelValue) {
        toast({
          title: "Please select an embedding model.",
          variant: "destructive",
        });
        return;
      }
      try {
        await embedStore.updateTextEmbedding(name, modelValue);
      } catch (e) {
        toast({
          title: "Something went wrong! Check the console for more details.",
          variant: "destructive",
        });
        console.error(e);
      }
    }, TEXT_EDIT_TIMEOUT);

    setTextTimeoutId(newTimeoutId);
  }

  function mathEmbeddingsHandler(name: string, expression: string) {
    embedStore.updateExpression({ name, expression });

    if (mathTimeoutId) {
      clearTimeout(mathTimeoutId);
    }
    const newTimeoutId = window.setTimeout(() => {
      embedStore.updateMathEmbedding(name);
    }, MATH_EDIT_TIMEOUT);

    setMathTimeoutId(newTimeoutId);
  }

  // which similarity matrix embeddings to show
  // make this array of names?
  const similarityMatrixEmbeddings = new Map<
    string,
    TextEmbedding | MathEmbedding
  >();
  for (const [name, embedding] of embedStore.textEmbeddings) {
    if (embedding.vector) {
      similarityMatrixEmbeddings.set(name, embedding);
    }
  }
  for (const [name, embedding] of embedStore.mathEmbeddings) {
    if (embedding.vector) {
      similarityMatrixEmbeddings.set(name, embedding);
    }
  }

  return (
    <main className="flex h-screen">
      {/* SIDEBAR START */}
      <div className="flex h-full w-1/3 flex-col space-y-4 border-r p-4">
        <h1 className="font-bold">Embedding Playground</h1>
        {/* TEXT EMBEDDINGS START */}
        <h3>Text Embeddings</h3>
        <ModelSelector modelValue={modelValue} setModelValue={setModelValue} />
        <div className="flex flex-col space-y-4">
          {Array.from(embedStore.textEmbeddings).map(
            ([name, embedding], index) => (
              <div key={index} className="flex-col space-y-2">
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
                  {INSTRUCTION_MODELS.has(modelValue ?? "") && (
                    <Textarea
                      placeholder="Enter instruction..."
                      value={embedding.instruction}
                      onChange={(e) => {
                        textEmbeddingsHandler({
                          name,
                          instruction: e.target.value,
                        });
                      }}
                    />
                  )}
                  <Textarea
                    placeholder="Enter text..."
                    value={embedding.text}
                    onChange={(e) => {
                      textEmbeddingsHandler({
                        name,
                        text: e.target.value,
                      });
                    }}
                  />
                </div>
                {/* TEXT EMBEDDING INPUT END */}
              </div>
            ),
          )}
          <div className="flex items-center justify-center">
            <Button
              onClick={embedStore.initTextEmbedding}
              variant="secondary"
              className="h-8 w-8 p-2"
            >
              <PlusIcon className="h-4 w-4 text-gray-700" />
            </Button>
          </div>
        </div>
        {/* TEXT EMBEDDINGS END */}
        {/* MATH EMBEDDINGS START */}
        <h3>Math Embeddings</h3>
        <div className="flex flex-col space-y-4">
          {Array.from(embedStore.mathEmbeddings).map(
            ([name, embedding], index) => (
              <div key={index} className="flex-col space-y-2">
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
                    value={embedding.expression}
                    onChange={(e) => {
                      mathEmbeddingsHandler(name, e.target.value);
                    }}
                  />
                </div>
                {/* MATH EMBEDDING INPUT END */}
              </div>
            ),
          )}
          <div className="flex items-center justify-center">
            <Button
              onClick={embedStore.initMathEmbedding}
              variant="secondary"
              className="h-8 w-8 p-2"
            >
              <PlusIcon className="h-4 w-4 text-gray-700" />
            </Button>
          </div>
        </div>
        {/* MATH EMBEDDINGS END */}
      </div>
      {/* SIDEBAR END */}
      {/* VIEW START */}
      <div className="h-full w-full">
        <SimilarityMatrix embeddings={similarityMatrixEmbeddings} />
      </div>
      {/* VIEW END */}
    </main>
  );
});

export default Home;
