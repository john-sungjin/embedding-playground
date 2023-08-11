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

const models = [
  { value: "hkunlp/instructor-large", label: "Instructor Large" },
];

export const ModelSelector: React.FC<{
  modelValue: string | null;
  setModelValue: (value: string) => void;
}> = ({ modelValue, setModelValue }) => {
  const [open, setOpen] = useState(false);
  return (
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
                    modelValue === model.value ? "opacity-100" : "opacity-0",
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
