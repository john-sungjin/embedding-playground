"use client";

import { ModelConfig, embedStore } from "@/components/Embeddings";
import { MathEmbeddingInput } from "@/components/MathEmbeddingInput";
import { SimilarityMatrix } from "@/components/SimilarityMatrix";
import { TextEmbeddingInput } from "@/components/TextEmbeddingInput";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@radix-ui/react-icons";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { ModelSelector } from "@/components/ModelSelector";
import { useLocalStorage } from "usehooks-ts";

const Home = observer(() => {
  // The model config is stored in local storage so that it persists across
  // page refreshes.
  const [model, setModel] = useLocalStorage<ModelConfig>("model", {
    name: "thenlper/gte-large",
  });

  return (
    <main className="flex h-screen">
      {/* SIDEBAR START */}
      <div className="flex h-full w-1/3 flex-col space-y-4 border-r p-4">
        <h1 className="font-bold">Embedding Playground</h1>
        <ModelSelector model={model} setModel={setModel} />
        {/* TEXT EMBEDDINGS START */}
        <h3>Text Embeddings</h3>
        <div className="flex flex-col space-y-4">
          {Array.from(embedStore.textEmbeddings).map(([name, embedding]) => (
            <TextEmbeddingInput
              key={name}
              name={name}
              model={model}
              embedding={embedding}
            />
          ))}
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
          {Array.from(embedStore.mathEmbeddings).map(([name, embedding]) => (
            <MathEmbeddingInput key={name} name={name} embedding={embedding} />
          ))}
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
