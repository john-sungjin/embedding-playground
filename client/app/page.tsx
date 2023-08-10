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
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { generateEmbeddings } from "./config";
import { evaluate } from "mathjs";
import { cosineSimilarity } from "./math";

const models = [
  { value: "hkunlp/instructor-large", label: "Instructor Large" },
];

interface EmbeddingInfo {
  instruction: string | null;
  text: string | null;
  embedding: number[];
}

export default function Home() {
  const [open, setOpen] = useState(false);
  const [modelValue, setModelValue] = useState("");
  const [embeddingInfo, setEmbeddingInfo] = useState<EmbeddingInfo[]>([]);
  const [mathExpression, setMathExpression] = useState<string>("");

  const generateEmbeddingsHandler = async () => {
    for (const info of embeddingInfo) {
      const response = await generateEmbeddings({
        embed_model_name: modelValue,
        instruction: info.instruction,
        text: info.text || "",
      });
      setEmbeddingInfo([
        ...embeddingInfo,
        {
          instruction: info.instruction,
          text: info.text,
          embedding: response.embeddings,
        },
      ]);
    }
  };

  const evaluateHandler = () => {
    const scope: Record<string, any> = {
      v1: [1, 2, 3],
      v2: [5, 3, 4],
      cosineSimilarity: cosineSimilarity,
    };
    try {
      const result = evaluate(mathExpression, scope);
      console.log(result);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <main className="border">
      <h1>Embedding Playground</h1>
      <p>A place to test embeddings!</p>
      <p>Try it out by typing in the box below.</p>
      {/* MODEL DROPDOWN START */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-72"
          >
            {modelValue
              ? models.find((model) => model.value === modelValue)?.label
              : "Select embedding model..."}
            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72">
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
      <div className="flex flex-col space-y-4">
        {/* EMBEDDING INPUT ROW START */}
        {embeddingInfo.map((info, index) => (
          <div key={index} className="flex flex-col space-y-4">
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
        <Button
          onClick={() =>
            setEmbeddingInfo([
              ...embeddingInfo,
              {
                instruction: null,
                text: null,
                embedding: [],
              },
            ])
          }
        >
          Add Embedding
        </Button>
      </div>

      <Button onClick={generateEmbeddingsHandler}>Generate Embeddings</Button>
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
