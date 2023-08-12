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
import { ModelName } from "@/components/Embeddings";

const models: { value: ModelName; label: string }[] = [
  { value: "hkunlp/instructor-large", label: "Instructor Large" },
  { value: "hkunlp/instructor-xl", label: "Instructor XL" },
  { value: "thenlper/gte-large", label: "GTE Large" },
  {
    value: "Salesforce/codet5p-110m-embedding",
    label: "Salesforce CodeT5+ 100m",
  },
  // TODO: Add openai ada
];
export const INSTRUCTION_MODELS = new Set([
  "hkunlp/instructor-large",
  "hkunlp/instructor-xl",
]);

export interface ModelConfig {
  name: ModelName;

  // For models that require an API key, this is the API key.
  api_key?: string;
}

export const ModelSelector: React.FC<{
  model: ModelConfig;
  setModel: (value: ModelConfig) => void;
}> = ({ model, setModel }) => {
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
          {models.find((m) => m.value === model.name)?.label}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandEmpty>No model found.</CommandEmpty>
          <CommandGroup>
            {models.map((modelOption) => (
              <CommandItem
                key={modelOption.value}
                value={modelOption.value}
                onSelect={(_value) => {
                  // Using model.value instead of _value because of cmdk lowercases things.
                  // See https://github.com/pacocoursey/cmdk/issues/150.
                  setModel({ name: modelOption.value });
                  setOpen(false);
                }}
              >
                {modelOption.label}
                <CheckIcon
                  className={cn(
                    "ml-auto h-4 w-4",
                    model.name === modelOption.value
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
  );
};
