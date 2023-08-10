"use client";

import Image from "next/image";
import {
  apiClient,
  GenerateEmbeddingsRequest,
  GenerateEmbeddingsResponse,
  generateEmbeddings,
} from "./config";
import { useState } from "react";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
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
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

const models = [
  { value: "hkunlp/instructor-large", label: "Instructor Large" },
];

export default function Home() {
  const [open, setOpen] = useState(false);
  const [modelValue, setModelValue] = useState("");
  const [instruction, setInstruction] = useState("");
  const [text, setText] = useState("");
  const [embedding, setEmbedding] = useState<number[]>([]);

  const submitHandler = async () => {
    console.log(instruction);
    console.log(text);
    const response = await generateEmbeddings({
      embed_model_name: modelValue,
      instruction: instruction,
      text: text,
    });
    console.log(response);
    setEmbedding(response.embeddings);
  };

  console.log(modelValue);

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
      <h3>Instruction</h3>
      <Textarea
        placeholder="Instruction..."
        value={instruction}
        onChange={(e) => {
          setInstruction(e.target.value);
        }}
      />
      <h3>Text</h3>
      <Textarea
        placeholder="Text..."
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
      />
      <Button onClick={submitHandler}>Generate Embeddings</Button>
      <h3>Your embedding:</h3>
      <p>{embedding}</p>
    </main>
  );
}
