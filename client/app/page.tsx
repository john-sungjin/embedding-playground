"use client";

import { GenerateEmbeddingQueryParams, generateEmbedding } from "./generated/server/serverComponents";

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
import { evaluate } from "mathjs";
import { cosineSimilarity, EmbeddingInfo } from "./math";
import { useToast } from "@/components/ui/use-toast";
import { ModelSelector } from "./ModelSelector";

const TEXT_EMBED_PREFIX = "t";
const MATH_EMBED_PREFIX = "m";
const TEXT_EDIT_TIMEOUT = 3000;
const MATH_EDIT_TIMEOUT = 500;

interface TextEmbeddingInfo extends EmbeddingInfo {
  instruction: string;
  text: string;
  isOutdated: boolean;
  isLoading: boolean;
}

interface MathEmbeddingInfo extends EmbeddingInfo {
  expression: string;
}

export default function Home() {
  const { toast } = useToast();
  const [modelValue, setModelValue] = useState<GenerateEmbeddingQueryParams['embed_model_name'] | null>(null);

  const [textEmbeddingInfo, setTextEmbeddingInfo] = useState<
    TextEmbeddingInfo[]
  >([
    {
      name: TEXT_EMBED_PREFIX + "0",
      instruction: "",
      text: "",
      embedding: null,
      isOutdated: false,
      isLoading: false,
    },
  ]);
  const [mathEmbeddingInfo, setMathEmbeddingInfo] = useState<
    MathEmbeddingInfo[]
  >([
    {
      name: MATH_EMBED_PREFIX + "0",
      expression: "",
      embedding: null,
    },
  ]);

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
    const newEmbeddingInfo = [...textEmbeddingInfo];
    if (text !== undefined) {
      newEmbeddingInfo[index].text = text;
    }
    if (instruction !== undefined) {
      newEmbeddingInfo[index].instruction = instruction;
    }
    newEmbeddingInfo[index].isOutdated = true;
    setTextEmbeddingInfo(newEmbeddingInfo);

    if (textTimeoutId) {
      clearTimeout(textTimeoutId);
    }
    const newTimeoutId = window.setTimeout(async () => {
      await updateTextEmbedding(index);
    }, TEXT_EDIT_TIMEOUT);

    setTextTimeoutId(newTimeoutId);
  }

  async function updateTextEmbedding(index: number) {
    // conditional logic to make sure fields are filled
    if (!modelValue) {
      toast({
        title: "Please select an embedding model.",
        variant: "destructive",
      });
      return;
    }

    const info = textEmbeddingInfo[index];
    if (!info.instruction || !info.text) {
      return;
    }

    setTextEmbeddingInfo((textEmbeddingInfo) => {
      const newInfo = [...textEmbeddingInfo];
      newInfo[index].isLoading = true;
      return newInfo;
    });
    try {
      const response = await generateEmbedding({
        queryParams: {
            embed_model_name: modelValue,
            instruction: info.instruction,
            text: info.text,
        }
      });

      setTextEmbeddingInfo((textEmbeddingInfo) => {
        const newInfo = [...textEmbeddingInfo];
        newInfo[index].embedding = response.embedding;
        return newInfo;
      });
    } catch (e) {
      toast({
        title: "Something went wrong! Check the console for more details.",
        variant: "destructive",
      });
      console.log(e);
    }

    setTextEmbeddingInfo((textEmbeddingInfo) => {
      const newInfo = [...textEmbeddingInfo];
      newInfo[index].isLoading = false;
      newInfo[index].isOutdated = false;
      return newInfo;
    });
  }

  function mathEmbeddingsHandler(index: number, expression: string) {
    const newEmbeddingInfo = [...mathEmbeddingInfo];
    newEmbeddingInfo[index].expression = expression;
    setMathEmbeddingInfo(newEmbeddingInfo);

    if (mathTimeoutId) {
      clearTimeout(mathTimeoutId);
    }
    const newTimeoutId = window.setTimeout(async () => {
      await updateMathEmbedding(index);
    }, MATH_EDIT_TIMEOUT);

    setMathTimeoutId(newTimeoutId);
  }

  function updateMathEmbedding(index: number) {
    const expression = mathEmbeddingInfo[index].expression;
    // 1. Add all embeddings to scope
    const scope: Record<string, any> = textEmbeddingInfo.reduce(
      (
        acc: {
          [key: string]: number[];
        },
        info,
        index,
      ) => {
        if (!info.embedding) {
          // TODO: better error handling
          return acc;
        }
        acc[`${TEXT_EMBED_PREFIX}${index}`] = info.embedding; // make sure this is not null
        return acc;
      },
      {},
    );

    // 2. Add cosine similarity function to scope
    scope.cosineSimilarity = cosineSimilarity;

    console.log(scope);

    try {
      const result = evaluate(expression, scope);
      const newInfo = [...mathEmbeddingInfo];
      newInfo[index].embedding = result;
      setMathEmbeddingInfo([...newInfo]);
    } catch (e) {
      console.log(e);
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
          {textEmbeddingInfo.map((info, index) => (
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
                    const newEmbeddingInfo = [...textEmbeddingInfo];
                    newEmbeddingInfo.splice(index, 1);
                    setTextEmbeddingInfo(newEmbeddingInfo);
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
              onClick={() => {
                // check if name already exists
                // TODO: make this better
                let newIndex = textEmbeddingInfo.length;
                while (
                  textEmbeddingInfo.find(
                    (info) => info.name === `${TEXT_EMBED_PREFIX}${newIndex}`,
                  )
                ) {
                  newIndex += 1;
                }
                setTextEmbeddingInfo([
                  ...textEmbeddingInfo,
                  {
                    name: `${TEXT_EMBED_PREFIX}${newIndex}`,
                    instruction: "",
                    text: "",
                    embedding: null,
                    isOutdated: false,
                    isLoading: false,
                  },
                ]);
              }}
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
          {mathEmbeddingInfo.map((info, index) => (
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
                    const newEmbeddingInfo = [...textEmbeddingInfo];
                    newEmbeddingInfo.splice(index, 1);
                    setTextEmbeddingInfo(newEmbeddingInfo);
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
              onClick={() => {
                // check if name already exists
                // TODO: make this better
                let newIndex = mathEmbeddingInfo.length;
                while (
                  mathEmbeddingInfo.find(
                    (info) => info.name === `${MATH_EMBED_PREFIX}${newIndex}`,
                  )
                ) {
                  newIndex += 1;
                }
                setMathEmbeddingInfo([
                  ...mathEmbeddingInfo,
                  {
                    name: `${MATH_EMBED_PREFIX}${newIndex}`,
                    expression: "",
                    embedding: null,
                  },
                ]);
              }}
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
}
