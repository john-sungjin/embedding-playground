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
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { Models } from "@/components/Embeddings";

const models: { value: Models; label: string }[] = [
  { value: "hkunlp/instructor-large", label: "Instructor Large" },
  { value: "hkunlp/instructor-xl", label: "Instructor XL" },
  { value: "thenlper/gte-large", label: "GTE Large" },
  {
    value: "Salesforce/codet5p-110m-embedding",
    label: "Salesforce CodeT5+ 100m",
  },
];
export const INSTRUCTION_MODELS = new Set([
  "hkunlp/instructor-large",
  "hkunlp/instructor-xl",
]);

export const ModelSelector: React.FC<{
  modelValue: Models;
  setModelValue: (value: Models) => void;
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
                onSelect={(_value) => {
                  // Using model.value instead of _value because of cmdk lowercases things.
                  // See https://github.com/pacocoursey/cmdk/issues/150.
                  setModelValue(model.value);
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
