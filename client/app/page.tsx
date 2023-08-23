"use client";

import { ModelConfig, embedStore } from "@/components/Embeddings";
import { MathEmbeddingInput } from "@/components/MathEmbeddingInput";
import { SimilarityMatrix } from "@/components/SimilarityMatrix";
import { TextEmbeddingInput } from "@/components/TextEmbeddingInput";
import { Button } from "@/components/ui/button";
import { GitHubLogoIcon, PlusIcon } from "@radix-ui/react-icons";
import { observer } from "mobx-react-lite";
import { ModelSelector } from "@/components/ModelSelector";
import { useLocalStorage } from "usehooks-ts";
import { Pca } from "@/components/Pca";

const Home = observer(() => {
  // The model config is stored in local storage so that it persists across
  // page refreshes.
  const [model, setModel] = useLocalStorage<ModelConfig>("model", {
    name: "thenlper/gte-large",
  });

  return (
    <main className="flex h-screen">
      {/* SIDEBAR START */}
      <div className="flex h-full w-96 shrink-0 flex-col space-y-12 overflow-y-auto border-r bg-gray-50 p-4">
        <div className="flex flex-grow flex-col space-y-8">
          <h1 className="font-semibold">Embedding Playground</h1>
          {/* TEXT EMBEDDINGS START */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-sm">Text</h3>
            <ModelSelector model={model} setModel={setModel} />
            <div className="flex flex-col space-y-4">
              {Array.from(embedStore.textEmbeddings).map(
                ([name, embedding]) => (
                  <TextEmbeddingInput
                    key={name}
                    name={name}
                    model={model}
                    embedding={embedding}
                  />
                ),
              )}
              <div className="flex items-center justify-center">
                <Button
                  onClick={embedStore.initTextEmbedding}
                  variant="outline"
                  className="h-8 w-8 bg-white p-2"
                >
                  <PlusIcon className="h-4 w-4 text-gray-600" />
                </Button>
              </div>
            </div>
          </div>
          {/* TEXT EMBEDDINGS END */}
          {/* MATH EMBEDDINGS START */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-sm">Formulas</h3>
            <div className="flex flex-col space-y-4">
              {embedStore.mathEmbeddings.size === 0 && (
                <div className="space-y-1">
                  <p className="text-xs leading-5 text-gray-500">
                    Transform text embeddings with arithmetic! Use their names
                    (e.g. <span className="font-mono">a0</span>) in mathematical
                    expressions.
                  </p>
                </div>
              )}
              {Array.from(embedStore.mathEmbeddings).map(
                ([name, embedding]) => (
                  <MathEmbeddingInput
                    key={name}
                    name={name}
                    embedding={embedding}
                  />
                ),
              )}
              <div className="flex items-center justify-center">
                <Button
                  onClick={embedStore.initMathEmbedding}
                  variant="outline"
                  className="h-8 w-8 bg-white p-2"
                >
                  <PlusIcon className="h-4 w-4 text-gray-600" />
                </Button>
              </div>
            </div>
            {/* MATH EMBEDDINGS END */}
          </div>
        </div>
        <footer className="mt-auto text-center text-xs text-gray-500">
          <a href="https://github.com/john-sungjin/embedding-playground">
            <GitHubLogoIcon
              className="-mt-0.5 mr-2 inline-block"
              width={18}
              height={18}
            />
          </a>
          by{" "}
          <a
            href="https://twitter.com/john_sungjin"
            target="_blank"
            rel="noopener noreferrer"
          >
            John Kim
          </a>{" "}
          and{" "}
          <a
            href="https://harshal.sheth.io/about"
            target="_blank"
            rel="noopener noreferrer"
          >
            Harshal Sheth
          </a>
        </footer>
      </div>
      {/* SIDEBAR END */}
      {/* VIEW START */}
      <div className="flex h-full w-full flex-col space-y-12 overflow-y-auto bg-gray-100 p-4">
        <>
          <SimilarityMatrix />
          <Pca />
        </>
      </div>
      {/* VIEW END */}
    </main>
  );
});

export default Home;
