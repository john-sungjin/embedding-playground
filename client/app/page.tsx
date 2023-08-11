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
import { ModelSelector } from "../components/ModelSelector";
import { observer } from "mobx-react-lite";
import { embeddings, Models } from "@/components/Embeddings";

const TEXT_EDIT_TIMEOUT = 3000;
const MATH_EDIT_TIMEOUT = 500;

const Home = observer(() => {
  const { toast } = useToast();
  const [modelValue, setModelValue] = useState<Models | null>(null);

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
    index,
    text,
    instruction,
  }: {
    index: number;
    text?: string;
    instruction?: string;
  }) {
    if (instruction !== undefined) {
      embeddings.textEmbeddings[index].instruction = instruction;
    }
    if (text !== undefined) {
      embeddings.textEmbeddings[index].text = text;
    }
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
        await embeddings.updateTextEmbedding(index, modelValue);
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

  function mathEmbeddingsHandler(index: number, expression: string) {
    embeddings.mathEmbeddings[index].expression = expression;

    if (mathTimeoutId) {
      clearTimeout(mathTimeoutId);
    }
    const newTimeoutId = window.setTimeout(async () => {
      embeddings.updateMathEmbedding(index);
    }, MATH_EDIT_TIMEOUT);

    setMathTimeoutId(newTimeoutId);
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
          {embeddings.textEmbeddings.map((info, index) => (
            <div key={index} className="flex-col space-y-2">
              {/* HEADER START */}
              <div className="flex w-full">
                <div className="flex items-center space-x-2">
                  <h5 className="flex h-8 w-36 items-center truncate rounded-md bg-gray-100 px-2 font-mono text-sm text-gray-600">
                    {info.name} ={" "}
                    {info.embedding
                      ? info.embedding.map((e) => e.toFixed(5)).join(", ")
                      : "null"}
                  </h5>
                  {info.isLoading ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100">
                      <SymbolIcon className="h-4 w-4 animate-spin text-blue-700" />
                    </div>
                  ) : info.isOutdated || info.embedding === null ? (
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
                    embeddings.deleteTextEmbedding(index);
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
                <Textarea
                  placeholder="Enter instruction..."
                  value={info.instruction}
                  onChange={(e) => {
                    textEmbeddingsHandler({
                      index,
                      instruction: e.target.value,
                    });
                  }}
                />
                <Textarea
                  placeholder="Enter text..."
                  value={info.text}
                  onChange={(e) => {
                    textEmbeddingsHandler({
                      index,
                      text: e.target.value,
                    });
                  }}
                />
              </div>
              {/* TEXT EMBEDDING INPUT END */}
            </div>
          ))}
          <div className="flex items-center justify-center">
            <Button
              onClick={embeddings.createTextEmbedding}
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
          {embeddings.mathEmbeddings.map((info, index) => (
            <div key={index} className="flex-col space-y-2">
              {/* HEADER START */}
              <div className="flex flex-row">
                <h5 className="flex h-8 w-36 items-center truncate rounded-md bg-gray-100 px-2 font-mono text-sm text-gray-600">
                  {info.name} ={" "}
                  {info.embedding
                    ? info.embedding.map((e) => e.toFixed(5)).join(", ")
                    : "null"}
                </h5>
                <Button
                  onClick={() => {
                    embeddings.deleteMathEmbedding(index);
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
                  value={info.expression}
                  onChange={(e) => {
                    mathEmbeddingsHandler(index, e.target.value);
                  }}
                />
              </div>
              {/* MATH EMBEDDING INPUT END */}
            </div>
          ))}
          <div className="flex items-center justify-center">
            <Button
              onClick={embeddings.createMathEmbedding}
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
      <div className="h-full w-full"></div>
      {/* VIEW END */}
    </main>
  );
});

export default Home;
