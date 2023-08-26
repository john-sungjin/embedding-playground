import { makeAutoObservable, observable } from "mobx";
import { GenerateEmbeddingQueryParams } from "@/app/generated/server/serverComponents";
import { SymbolNode, evaluate, parse } from "mathjs";
import { makePersistable } from "mobx-persist-store";

const TEXT_EMBED_PREFIX = "a";
const MATH_EMBED_PREFIX = "b";

export type ModelName = GenerateEmbeddingQueryParams["embed_model_name"];

export interface ModelConfig {
  name: ModelName;

  // For models that require an API key, this is the API key.
  api_key?: string;
}

// These are classes because we want vector to be not wrapped by a MobX Proxy.
// Proxy was making it so that every array reassignment caused a reaction.
// We make it observable.ref to indicate that the array will not change unless
// reassigned (which is true for embeddings).
export class TextEmbedding {
  constructor(
    public instruction: string, // only used by instructor models
    public text: string,
    public isOutdated: boolean,
    public isLoading: boolean,
    public vector: number[] | null,
  ) {
    makeAutoObservable(this, { vector: observable.ref }, { autoBind: true });
  }
}

export class MathEmbedding {
  constructor(
    public expression: string,
    public vector: number[] | null,
  ) {
    makeAutoObservable(this, { vector: observable.ref }, { autoBind: true });
  }

  get dependencies(): Set<string> {
    const node = parse(this.expression);
    const dependencies: Set<string> = new Set();
    node.traverse((node) => {
      // @ts-expect-error
      if (node.isSymbolNode) {
        dependencies.add((node as SymbolNode).name);
      }
    });
    return dependencies;
  }
}

export class Embeddings {
  textEmbeddings: Map<string, TextEmbedding>;
  mathEmbeddings: Map<string, MathEmbedding>;

  constructor() {
    this.textEmbeddings = new Map();
    this.mathEmbeddings = new Map();

    // clearPersistedStore(this);
    makeAutoObservable(this, {}, { autoBind: true });
    makePersistable(this, {
      name: "Embeddings",
      properties: [
        {
          key: "textEmbeddings",
          serialize: (map: Map<string, TextEmbedding>) => {
            // serialize instruction and text, but not isOutdated, isLoading, or vector
            const serialized = JSON.stringify(
              [...map.entries()].map(([key, value]) => {
                return [
                  key,
                  { instruction: value.instruction, text: value.text },
                ];
              }),
            );
            return serialized;
          },
          deserialize: (str: string) => {
            const entries = JSON.parse(str).map(
              ([key, value]: [string, TextEmbedding]) => {
                return [
                  key,
                  new TextEmbedding(
                    value.instruction,
                    value.text,
                    false,
                    false,
                    null,
                  ),
                ];
              },
            );

            if (entries.length === 0) {
              entries.push([
                `${TEXT_EMBED_PREFIX}0`,
                new TextEmbedding("", "", false, false, null),
              ]);
            }
            return new Map<string, TextEmbedding>(entries);
          },
        },
        {
          key: "mathEmbeddings",
          serialize: (map: Map<string, MathEmbedding>) => {
            const serialized = JSON.stringify(
              [...map.entries()].map(([key, value]) => {
                return [
                  key,
                  { expression: value.expression, vector: value.vector },
                ];
              }),
            );
            return serialized;
          },
          deserialize: (str: string) => {
            const entries = JSON.parse(str).map(
              ([key, value]: [string, MathEmbedding]) => {
                return [key, new MathEmbedding(value.expression, value.vector)];
              },
            );
            return new Map<string, MathEmbedding>(entries);
          },
        },
      ],

      storage: window.localStorage,
    });
  }

  initTextEmbedding() {
    let newIndex = this.textEmbeddings.size;
    while (this.textEmbeddings.has(`${TEXT_EMBED_PREFIX}${newIndex}`)) {
      newIndex += 1;
    }
    this.textEmbeddings.set(
      `${TEXT_EMBED_PREFIX}${newIndex}`,
      new TextEmbedding("", "", false, false, null),
    );
  }

  initMathEmbedding() {
    let newIndex = this.mathEmbeddings.size;
    while (this.mathEmbeddings.has(`${MATH_EMBED_PREFIX}${newIndex}`)) {
      newIndex += 1;
    }
    this.mathEmbeddings.set(
      `${MATH_EMBED_PREFIX}${newIndex}`,
      new MathEmbedding("", null),
    );
  }

  deleteTextEmbedding(name: string) {
    this.textEmbeddings.delete(name);
  }

  deleteMathEmbedding(name: string) {
    this.mathEmbeddings.delete(name);
  }

  /*
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
      embedding.isOutdated = false;
    } catch (e) {
      throw e;
    } finally {
      embedding.isLoading = false;
    }
  }
  */

  updateTextEmbeddingState(name: string, state: Partial<TextEmbedding>) {
    const embedding = this.textEmbeddings.get(name);
    if (!embedding) {
      throw new Error(`Embedding ${name} does not exist!`);
    }
    Object.assign(embedding, state);
  }

  updateMathEmbedding(name: string) {
    const embedding = this.mathEmbeddings.get(name);
    if (!embedding) {
      throw new Error(`Embedding ${name} does not exist!`);
    }

    const scope: Record<string, any> = {};
    for (const [key, value] of this.textEmbeddings) {
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
      embedding.isOutdated = true;
    }
    if (text !== undefined) {
      embedding.text = text;
      embedding.isOutdated = true;
    }
  }

  updateExpression({ name, expression }: { name: string; expression: string }) {
    this.mathEmbeddings.get(name)!.expression = expression;
  }

  get allValidEmbeddings() {
    const mergedEmbeddings = new Map<string, TextEmbedding | MathEmbedding>();
    for (const [key, value] of this.textEmbeddings) {
      if (value.vector) {
        mergedEmbeddings.set(key, value);
      }
    }
    for (const [key, value] of this.mathEmbeddings) {
      if (value.vector) {
        mergedEmbeddings.set(key, value);
      }
    }
    return mergedEmbeddings;
  }
}

// TODO: move this to context or smth lol
export const embedStore = new Embeddings();
