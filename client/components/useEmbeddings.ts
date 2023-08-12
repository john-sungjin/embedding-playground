import { useGenerateEmbedding } from "@/app/generated/server/serverQueryComponents";
import { ModelConfig, TextEmbedding } from "@/components/Embeddings";
import { useToast } from "@/components/ui/use-toast";
import { useCallback } from "react";
import { Configuration, OpenAIApi } from "openai";
import { OPENAI_MODELS } from "./ModelSelector";
import { useQuery } from "@tanstack/react-query";

export const useEmbedding = ({
  model,
  embedding,
}: {
  model: ModelConfig;
  embedding: TextEmbedding;
}) => {
  const { toast } = useToast();

  const isEmpty = !embedding.text;
  const isOpenAi = OPENAI_MODELS.has(model.name);

  const onError = useCallback(
    (err: any) => {
      toast({
        title: "Something went wrong! Check the console for more details.",
        variant: "destructive",
      });
      console.error(err);
    },
    [toast],
  );

  // Fetch from the backend.
  const backendRes = useGenerateEmbedding(
    {
      queryParams: {
        embed_model_name: model.name,
        text: embedding.text,
        instruction: embedding.instruction,
      },
    },
    {
      enabled: !isEmpty && !isOpenAi,
      onError,
    },
  );

  // Fetch from OpenAI.
  const openaiRes = useQuery(
    ["openai", model, embedding.text],
    async () => {
      if (!model.api_key) {
        throw new Error("Missing OpenAI API key");
      }
      const configuration = new Configuration({
        apiKey: model.api_key,
      });

      const openai = new OpenAIApi(configuration);
      const res = await openai.createEmbedding({
        model: model.name,
        input: embedding.text,
      });

      return {
        embedding: res.data.data[0].embedding,
      };
    },
    {
      enabled: !isEmpty && isOpenAi,
      onError,
    },
  );

  // TODO: handle the isLoading stuff here instead?
  if (isOpenAi) {
    return openaiRes;
  } else {
    return backendRes;
  }
};
