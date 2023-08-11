import {
  action,
  makeAutoObservable,
  makeObservable,
  observable,
  reaction,
} from "mobx";
import { cosineSimilarity } from "@/app/math";
import {
  GenerateEmbeddingQueryParams,
  generateEmbedding,
} from "@/app/generated/server/serverComponents";
import { evaluate } from "mathjs";

const TEXT_EMBED_PREFIX = "t";
const MATH_EMBED_PREFIX = "m";

export type Models = GenerateEmbeddingQueryParams["embed_model_name"];

export interface TextEmbedding {
  instruction: string;
  text: string;
  isOutdated: boolean;
  isLoading: boolean;
  vector: number[] | null;
}

export interface MathEmbedding {
  expression: string;
  vector: number[] | null;
}

export class Embeddings {
  textEmbeddings: Map<string, TextEmbedding>;
  mathEmbeddings: Map<string, MathEmbedding>;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.textEmbeddings = new Map();
    this.mathEmbeddings = new Map();

    this.textEmbeddings.set(TEXT_EMBED_PREFIX + "0", {
      instruction: "",
      text: "",
      isOutdated: false,
      isLoading: false,
      vector: null,
    });
  }

  initTextEmbedding() {
    let newIndex = this.textEmbeddings.size;
    while (this.textEmbeddings.has(`${TEXT_EMBED_PREFIX}${newIndex}`)) {
      newIndex += 1;
    }
    this.textEmbeddings.set(`${TEXT_EMBED_PREFIX}${newIndex}`, {
      instruction: "",
      text: "",
      vector: null,
      isOutdated: false,
      isLoading: false,
    });
  }

  initMathEmbedding() {
    let newIndex = this.mathEmbeddings.size;
    while (this.mathEmbeddings.has(`${MATH_EMBED_PREFIX}${newIndex}`)) {
      newIndex += 1;
    }
    this.mathEmbeddings.set(`${MATH_EMBED_PREFIX}${newIndex}`, {
      expression: "",
      vector: null,
    });
  }

  deleteTextEmbedding(name: string) {
    this.textEmbeddings.delete(name);
  }

  deleteMathEmbedding(name: string) {
    this.mathEmbeddings.delete(name);
  }

  // Note: this is a generator to annotate MobX flow
  // TL;DR async is weird with MobX, so it's either this or wrapping
  // everything in runInActions
  // https://mobx.js.org/actions.html#asynchronous-actions
  *updateTextEmbedding(name: string, model: Models) {
    const embedding = this.textEmbeddings.get(name);
    if (!embedding) {
      throw new Error(`Embedding ${name} does not exist!`);
    }
    embedding.isLoading = true;
    try {
      // @ts-expect-error
      const response = yield generateEmbedding({
        queryParams: {
          embed_model_name: model,
          instruction: embedding.instruction,
          text: embedding.text,
        },
      });
      embedding.vector = response.embedding;
    } catch (e) {
      throw e;
    } finally {
      embedding.isLoading = false;
    }
  }

  updateMathEmbedding(name: string) {
    const embedding = this.mathEmbeddings.get(name);
    if (!embedding) {
      throw new Error(`Embedding ${name} does not exist!`);
    }

    const scope: Record<string, any> = {};
    for (const [key, value] of this.allEmbeddings) {
      if (value.vector) {
        scope[key] = value.vector;
      }
    }

    try {
      const result = evaluate(embedding.expression, scope);
      embedding.vector = result;
    } catch (e) {
      console.error(e);
    }
  }

  updateTextOrInstruction({
    name,
    text,
    instruction,
  }: {
    name: string;
    text?: string;
    instruction?: string;
  }) {
    const embedding = this.textEmbeddings.get(name)!;
    if (instruction !== undefined) {
      embedding.instruction = instruction;
    }
    if (text !== undefined) {
      embedding.text = text;
    }
  }

  updateExpression({ name, expression }: { name: string; expression: string }) {
    this.mathEmbeddings.get(name)!.expression = expression;
  }

  get allEmbeddings() {
    console.log("GETTING ALL EMBEDDINGS");
    const mergedEmbeddings = new Map<string, TextEmbedding | MathEmbedding>();
    for (const [key, value] of this.textEmbeddings) {
      mergedEmbeddings.set(key, value);
    }
    for (const [key, value] of this.mathEmbeddings) {
      mergedEmbeddings.set(key, value);
    }
    return mergedEmbeddings;
  }
}

// TODO: move this to context or smth lol
export const embedStore = new Embeddings();
