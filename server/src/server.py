from typing import Literal

import fastapi
import torch
from diskcache import Cache
from InstructorEmbedding import INSTRUCTOR
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from transformers import AutoModel, AutoModelForSeq2SeqLM, AutoTokenizer

app = fastapi.FastAPI()


@app.get("/", include_in_schema=False)
def redirect_to_docs():
    return fastapi.responses.RedirectResponse("/docs")


@app.get("/api/ping", response_model=Literal["pong"])
def ping():
    return "pong"


Models = Literal[
    "hkunlp/instructor-xl",
    "hkunlp/instructor-large",
    "thenlper/gte-large",
    "BAAI/bge-large-en",
    "Salesforce/codet5p-110m-embedding",
    "Salesforce/codet5p-2b",
    "text-embedding-ada-002",
    "text-embedding-3-small",
    "text-embedding-3-large",
    "sentence-transformers/all-mpnet-base-v2",
]
INSTRUCTOR_MODELS = {
    "hkunlp/instructor-xl",
    "hkunlp/instructor-large",
}
SENTENCE_TRANSFORMERS_MODELS = {
    "thenlper/gte-large",
    "sentence-transformers/all-mpnet-base-v2",
}
SENTENCE_TRANFORMER_INSTRUCTION_MODELS = {
    "BAAI/bge-large-en",
}

cache_directory = "./cache/embeddings"
cache = Cache(eviction_policy="least-recently-used")


class GenerateEmbeddingResponse(BaseModel):
    length: int
    embedding: list[float]


def _generate_embedding_codet5_embedding(text: str) -> torch.Tensor:
    checkpoint = "Salesforce/codet5p-110m-embedding"
    device = "cpu"  # "cuda" for GPU usage or "cpu" for CPU usage

    tokenizer = AutoTokenizer.from_pretrained(checkpoint, trust_remote_code=True)
    model = AutoModel.from_pretrained(checkpoint, trust_remote_code=True).to(device)

    inputs = tokenizer.encode(text, return_tensors="pt").to(device)  # type: ignore
    embedding = model(inputs)[0]
    print(
        f"Dimension of the embedding: {embedding.size()[0]}, with norm={embedding.norm().item()}"
    )

    return embedding


def _generate_embedding_codet5_generic(text: str) -> torch.Tensor:
    checkpoint = "Salesforce/codet5p-2b"
    device = "cpu"  # "cuda" for GPU usage or "cpu" for CPU usage

    tokenizer = AutoTokenizer.from_pretrained(checkpoint)
    model: AutoModelForSeq2SeqLM = AutoModelForSeq2SeqLM.from_pretrained(
        checkpoint, torch_dtype=torch.float16, trust_remote_code=True
    ).to(device)

    text_input = tokenizer(
        text, padding="max_length", max_length=360, truncation=True, return_tensors="pt"
    ).to(device)
    breakpoint()
    text_output = model.encoder(
        text_input.input_ids, attention_mask=text_input.attention_mask, return_dict=True
    )
    text_embed = torch.nn.functional.normalize(
        model.proj(text_output.last_hidden_state[:, 0, :]), dim=-1
    )

    return text_embed


def _generate_embedding_uncached(
    embed_model_name: Models,
    text: str,
    instruction: str | None = None,
) -> GenerateEmbeddingResponse:
    if embed_model_name in INSTRUCTOR_MODELS:
        model = INSTRUCTOR(embed_model_name)

        assert instruction is not None
        sentence = [instruction, text]
        embedding: torch.Tensor = model.encode(
            [sentence],  # type: ignore
            convert_to_numpy=False,
        )[0]

    elif embed_model_name in SENTENCE_TRANSFORMERS_MODELS:
        model = SentenceTransformer(embed_model_name)

        if SENTENCE_TRANFORMER_INSTRUCTION_MODELS:
            # See https://huggingface.co/BAAI/bge-large-en#using-sentence-transformers.
            assert instruction is not None
            input = instruction + text
        else:
            input = text

        embedding = model.encode([text], convert_to_numpy=False)[0]
    elif embed_model_name == "Salesforce/codet5p-110m-embedding":
        embedding = _generate_embedding_codet5_embedding(text)
    elif embed_model_name == "Salesforce/codet5p-2b":
        embedding = _generate_embedding_codet5_generic(text)
    elif embed_model_name == "text-embedding-ada-002":
        raise ValueError("Called to OpenAI should be made client-side")
    else:
        raise ValueError(f"Model {embed_model_name} not supported.")

    return GenerateEmbeddingResponse(
        length=len(embedding),
        embedding=embedding.tolist(),
    )


@app.get("/api/generate_embedding", response_model=GenerateEmbeddingResponse)
def generate_embedding(
    response: fastapi.Response,
    embed_model_name: Models,
    text: str,
    # Instruction is only used by certain models.
    instruction: str | None = None,
) -> GenerateEmbeddingResponse:
    key = (embed_model_name, text, instruction)

    unset = object()
    res = cache.get(key, default=unset)
    if res is not unset:
        response.headers["X-Cache"] = "HIT"
        return res  # type: ignore

    res = _generate_embedding_uncached(embed_model_name, text, instruction)
    cache[key] = res
    return res


def use_route_names_as_operation_ids(app: fastapi.FastAPI) -> None:
    # See https://fastapi.tiangolo.com/advanced/path-operation-advanced-configuration/#using-the-path-operation-function-name-as-the-operationid
    for route in app.routes:
        if isinstance(route, fastapi.routing.APIRoute):
            route.operation_id = route.name


use_route_names_as_operation_ids(app)
