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
import { useState } from "react";
import { generateEmbeddings } from "./config";
import { evaluate } from "mathjs";
import { cosineSimilarity } from "./math";
import { useToast } from "@/components/ui/use-toast";

const VECTOR_PREFIX = "v";

const models = [
  { value: "hkunlp/instructor-large", label: "Instructor Large" },
];

interface EmbeddingInfo {
  name: string;
  instruction: string;
  text: string;
  embedding: number[] | null;
}

export default function Home() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [modelValue, setModelValue] = useState<string | null>(null);
  const [embeddingInfo, setEmbeddingInfo] = useState<EmbeddingInfo[]>([
    {
      name: "v0",
      instruction: "",
      text: "",
      embedding: null,
    },
  ]);
  const [mathExpression, setMathExpression] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateEmbeddingsHandler = async () => {
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
        inputs: embeddingInfo.map((info) => ({
          instruction: info.instruction,
          text: info.text,
        })),
      });

      setEmbeddingInfo(
        embeddingInfo.map((info, index) => ({
          ...info,
          embedding: response.embeddings[index],
        }))
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

  const evaluateHandler = () => {
    // 1. Add all embeddings to scope
    const scope: Record<string, any> = embeddingInfo.reduce(
      (
        acc: {
          [key: string]: number[];
        },
        info,
        index
      ) => {
        if (!info.embedding) {
          // TODO: better error handling
          return acc;
        }
        acc[`${VECTOR_PREFIX}${index}`] = info.embedding; // make sure this is not null
        return acc;
      },
      {}
    );

    // 2. Add cosine similarity function to scope
    scope.cosineSimilarity = cosineSimilarity;

    console.log(scope);

    try {
      const result = evaluate(mathExpression, scope);
      console.log(result);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <main className="border p-4 flex-col space-y-4">
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
                      currentValue === modelValue ? "" : currentValue
                    );
                    setOpen(false);
                  }}
                >
                  {model.label}
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      modelValue === model.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {/* MODEL DROPDOWN END */}
      {/* EMBEDDING INPUT START */}
      <h3>Active Embeddings</h3>
      <div className="flex flex-col space-y-4">
        {embeddingInfo.map((info, index) => (
          <div key={index} className="flex-col space-y-2">
            {/* HEADER START */}
            <div className="flex flex-row space-x-2">
              <h5 className="flex items-center justify-center px-2 h-8 bg-gray-100 w-fit rounded-md font-mono text-gray-600 text-sm">
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
                  const newEmbeddingInfo = [...embeddingInfo];
                  newEmbeddingInfo.splice(index, 1);
                  setEmbeddingInfo(newEmbeddingInfo);
                }}
                className="flex justify-center items-center w-8 h-8 hover:bg-red-100 border-red-300"
                variant="outline"
              >
                <TrashIcon className="h-4 w-4 shrink-0 text-red-500" />
              </Button>
            </div>
            {/* INPUT ROW START */}
            <div className="flex flex-row space-x-4">
              <Textarea
                placeholder="Enter instruction..."
                value={info.instruction || ""}
                onChange={(e) => {
                  const newEmbeddingInfo = [...embeddingInfo];
                  newEmbeddingInfo[index].instruction = e.target.value;
                  setEmbeddingInfo(newEmbeddingInfo);
                }}
              />
              <Textarea
                placeholder="Enter text..."
                value={info.text || ""}
                onChange={(e) => {
                  const newEmbeddingInfo = [...embeddingInfo];
                  newEmbeddingInfo[index].text = e.target.value;
                  setEmbeddingInfo(newEmbeddingInfo);
                }}
              />
            </div>
            {/* EMBEDDING INPUT ROW END */}
          </div>
        ))}
        <div className="flex items-center justify-center">
          <Button
            onClick={() => {
              // check if name already exists
              let newIndex = embeddingInfo.length;
              while (
                embeddingInfo.find(
                  (info) => info.name === `${VECTOR_PREFIX}${newIndex}`
                )
              ) {
                newIndex += 1;
              }
              setEmbeddingInfo([
                ...embeddingInfo,
                {
                  name: `${VECTOR_PREFIX}${newIndex}`,
                  instruction: "",
                  text: "",
                  embedding: null,
                },
              ]);
            }}
            variant="secondary"
            className="p-2 h-8 w-8"
          >
            <PlusIcon className="h-4 w-4 text-gray-700" />
          </Button>
        </div>
      </div>

      <Button onClick={generateEmbeddingsHandler}>
        {isGenerating ? "Loading..." : "Generate Embeddings"}
      </Button>
      <h3>Vector Math</h3>
      <Textarea
        placeholder="Enter math..."
        value={mathExpression}
        onChange={(e) => {
          setMathExpression(e.target.value);
        }}
      />
      <Button onClick={evaluateHandler}>Calculate</Button>
    </main>
  );
}
