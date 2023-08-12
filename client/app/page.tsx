"use client";

import { Button } from "@/components/ui/button";
import {
  TrashIcon,
  PlusIcon,
  SymbolIcon,
  ExclamationTriangleIcon,
  CheckCircledIcon,
} from "@radix-ui/react-icons";
import { useState } from "react";
import { ModelSelector } from "../components/ModelSelector";
import { observer } from "mobx-react-lite";
import { embedStore, Models } from "@/components/Embeddings";
import { SimilarityMatrix } from "@/components/SimilarityMatrix";
import { TextEmbeddingInput } from "@/components/TextEmbeddingInput";
import { MathEmbeddingInput } from "@/components/MathEmbeddingInput";

const Home = observer(() => {
  const [modelValue, setModelValue] = useState<Models>("thenlper/gte-large");

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
              <TextEmbeddingInput
                key={index}
                name={name}
                model={modelValue}
                embedding={embedding}
              />
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
              <MathEmbeddingInput
                key={index}
                name={name}
                embedding={embedding}
              />
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
        <SimilarityMatrix />
      </div>
      {/* VIEW END */}
    </main>
  );
});

export default Home;
