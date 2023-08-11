import { makeAutoObservable } from "mobx";
import { EmbeddingInfo } from "@/app/math";
import {
  GenerateEmbeddingQueryParams,
  generateEmbedding,
} from "@/app/generated/server/serverComponents";
import { evaluate } from "mathjs";

const TEXT_EMBED_PREFIX = "t";
const MATH_EMBED_PREFIX = "m";

export type Models = GenerateEmbeddingQueryParams["embed_model_name"];

interface TextEmbeddingInfo extends EmbeddingInfo {
  instruction: string;
  text: string;
  isOutdated: boolean;
  isLoading: boolean;
}

interface MathEmbeddingInfo extends EmbeddingInfo {
  expression: string;
}

export class Embeddings {
  textEmbeddings: TextEmbeddingInfo[] = [
    {
      name: TEXT_EMBED_PREFIX + "0",
      instruction: "",
      text: "",
      embedding: null,
      isOutdated: false,
      isLoading: false,
    },
  ];
  mathEmbeddings: MathEmbeddingInfo[] = [];

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  createTextEmbedding() {
    let newIndex = this.textEmbeddings.length;
    while (
      this.textEmbeddings.find(
        (info) => info.name === `${TEXT_EMBED_PREFIX}${newIndex}`,
      )
    ) {
      newIndex += 1;
    }
    const embedding = {
      name: `${TEXT_EMBED_PREFIX}${newIndex}`,
      instruction: "",
      text: "",
      embedding: null,
      isOutdated: false,
      isLoading: false,
    };
    this.textEmbeddings.push(embedding);
    return embedding;
  }

  createMathEmbedding() {
    let newIndex = this.mathEmbeddings.length;
    while (
      this.mathEmbeddings.find(
        (info) => info.name === `${MATH_EMBED_PREFIX}${newIndex}`,
      )
    ) {
      newIndex += 1;
    }
    const embedding = {
      name: `${MATH_EMBED_PREFIX}${newIndex}`,
      expression: "",
      embedding: null,
    };
    this.mathEmbeddings.push(embedding);
    return embedding;
  }

  deleteTextEmbedding(index: number) {
    this.textEmbeddings.splice(index, 1);
  }

  deleteMathEmbedding(index: number) {
    this.mathEmbeddings.splice(index, 1);
  }

  async updateTextEmbedding(index: number, model: Models) {
    const embedding = this.textEmbeddings[index];
    embedding.isLoading = true;
    try {
      const response = await generateEmbedding({
        queryParams: {
          embed_model_name: model,
          instruction: embedding.instruction,
          text: embedding.text,
        },
      });
      embedding.embedding = response.embedding;
    } catch (e) {
      throw e;
    } finally {
      embedding.isLoading = false;
    }
  }

  async updateMathEmbedding(index: number) {
    const embedding = this.mathEmbeddings[index];
    const scope: Record<string, any> = this.textEmbeddings.reduce(
      (
        acc: {
          [key: string]: number[];
        },
        info,
      ) => {
        if (!info.embedding) {
          return acc;
        }
        acc[info.name] = info.embedding; // make sure this is not null
        return acc;
      },
      {},
    );

    try {
      const result = evaluate(embedding.expression, scope);
      embedding.embedding = result;
    } catch (e) {
      console.error(e);
    }
  }
}

// TODO: move this to context or smth lol
export const embeddings = new Embeddings();
