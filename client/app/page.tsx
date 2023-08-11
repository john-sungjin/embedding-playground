"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  CaretSortIcon,
  CheckIcon,
  TrashIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { ChangeEvent, useEffect, useState } from "react";
import { generateEmbeddings } from "./config";
import math, { evaluate } from "mathjs";
import { cosineSimilarity } from "./math";
import { useToast } from "@/components/ui/use-toast";

const TEXT_EMBED_PREFIX = "t";
const MATH_EMBED_PREFIX = "m";

const models = [
  { value: "hkunlp/instructor-large", label: "Instructor Large" },
];

interface TextEmbeddingInfo {
  name: string;
  instruction: string;
  text: string;
  embedding: number[] | null;
}

interface MathEmbeddingInfo {
  name: string;
  expression: string;
  embedding: number[] | null;
}

export default function Home() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [modelValue, setModelValue] = useState<string | null>(null);

  const [textEmbeddingInfo, setTextEmbeddingInfo] = useState<
    TextEmbeddingInfo[]
  >([
    {
      name: TEXT_EMBED_PREFIX + "0",
      instruction: "",
      text: "",
      embedding: null,
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

  const [isGenerating, setIsGenerating] = useState(false);

  const textEmbeddingsHandler = async (
    textEmbeddingInfo: TextEmbeddingInfo,
  ) => {
    if (textTimeoutId) {
      clearTimeout(textTimeoutId);
    }

    // conditional logic to make sure fields are filled
    if (!modelValue) {
      toast({
        title: "Please select an embedding model.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await generateEmbeddings({
        embed_model_name: modelValue,
        inputs: textEmbeddingInfo.map((info) => ({
          instruction: info.instruction,
          text: info.text,
        })),
      });

      setTextEmbeddingInfo(
        textEmbeddingInfo.map((info, index) => ({
          ...info,
          embedding: response.embeddings[index],
        })),
      );
    } catch (e) {
      toast({
        title: "Something went wrong! Check the console for more details.",
        variant: "destructive",
      });
      console.log(e);
    }
    setIsGenerating(false);
  };

  const evaluateHandler = (expression: string) => {
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
      console.log(result);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <main className="flex h-screen">
      {/* SIDEBAR START */}
      <div className="flex h-full w-1/3 flex-col space-y-4 border p-4">
        <h1 className="font-bold">Embedding Playground</h1>
        {/* MODEL DROPDOWN START */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-72 justify-between"
            >
              {modelValue
                ? models.find((model) => model.value === modelValue)?.label
                : "Select embedding model..."}
              <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0">
            <Command>
              <CommandInput placeholder="Search models..." />
              <CommandEmpty>No model found.</CommandEmpty>
              <CommandGroup>
                {models.map((model) => (
                  <CommandItem
                    key={model.value}
                    value={model.value}
                    onSelect={(currentValue) => {
                      setModelValue(
                        currentValue === modelValue ? "" : currentValue,
                      );
                      setOpen(false);
                    }}
                  >
                    {model.label}
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4",
                        modelValue === model.value
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        {/* MODEL DROPDOWN END */}
        {/* TEXT EMBEDDINGS START */}
        <h3>Text Embeddings</h3>
        <div className="flex flex-col space-y-4">
          {textEmbeddingInfo.map((info, index) => (
            <div key={index} className="flex-col space-y-2">
              {/* HEADER START */}
              <div className="flex flex-row space-x-2">
                <h5 className="flex h-8 w-fit items-center justify-center rounded-md bg-gray-100 px-2 font-mono text-sm text-gray-600">
                  {info.name} ={" "}
                  {info.embedding
                    ? "[" +
                      info.embedding
                        .slice(0, 5)
                        .map((e) => e.toFixed(5))
                        .join(", ") +
                      ", ...]"
                    : "null"}
                </h5>
                <Button
                  onClick={() => {
                    const newEmbeddingInfo = [...textEmbeddingInfo];
                    newEmbeddingInfo.splice(index, 1);
                    setTextEmbeddingInfo(newEmbeddingInfo);
                  }}
                  className="flex h-8 w-8 items-center justify-center border-red-300 hover:bg-red-100"
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
                  onChange={(e) => {}}
                />
                <Textarea
                  placeholder="Enter text..."
                  value={info.text}
                  onChange={(e) => {
                    const newEmbeddingInfo = [...textEmbeddingInfo];
                    newEmbeddingInfo[index].text = e.target.value;
                    setTextEmbeddingInfo(newEmbeddingInfo);

                    textEmbeddingsHandler();
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
              <div className="flex flex-row space-x-2">
                <h5 className="flex h-8 w-fit items-center justify-center rounded-md bg-gray-100 px-2 font-mono text-sm text-gray-600">
                  {info.name} ={" "}
                  {info.embedding
                    ? "[" +
                      info.embedding
                        .slice(0, 5)
                        .map((e) => e.toFixed(5))
                        .join(", ") +
                      ", ...]"
                    : "null"}
                </h5>
                <Button
                  onClick={() => {
                    const newEmbeddingInfo = [...textEmbeddingInfo];
                    newEmbeddingInfo.splice(index, 1);
                    setTextEmbeddingInfo(newEmbeddingInfo);
                  }}
                  className="flex h-8 w-8 items-center justify-center border-red-300 hover:bg-red-100"
                  variant="outline"
                >
                  <TrashIcon className="h-4 w-4 shrink-0 text-red-500" />
                </Button>
              </div>
              {/* HEADER END */}
              {/* TEXT EMBEDDING INPUT START */}
              <div className="flex flex-row space-x-4">
                <Textarea
                  placeholder="Enter expression..."
                  value={info.expression}
                  onChange={(e) => {
                    const newEmbeddingInfo = [...textEmbeddingInfo];
                    newEmbeddingInfo[index].instruction = e.target.value;
                    setTextEmbeddingInfo(newEmbeddingInfo);
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
                    name: `${TEXT_EMBED_PREFIX}${newIndex}`,
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
      <div></div>
      {/* VIEW END */}
    </main>
  );
}
