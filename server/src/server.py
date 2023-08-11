from typing import Literal

import fastapi
from sentence_transformers import SentenceTransformer
import torch
from InstructorEmbedding import INSTRUCTOR
from pydantic import BaseModel

app = fastapi.FastAPI()


@app.get("/")
def redirect_to_docs():
    return fastapi.responses.RedirectResponse("/docs")


@app.get("/api/ping", response_model=Literal["pong"])
def ping():
    return "pong"


Models = Literal["hkunlp/instructor-large", "thenlper/gte-large"]
INSTRUCTOR_LARGE = "hkunlp/instructor-large"
GTE_LARGE = "thenlper/gte-large"


class EmbeddingRequest(BaseModel):
    # Instruction is only required for the instructor model.
    instruction: str | None = None

    text: str


class GenerateEmbeddingRequest(BaseModel):
    embed_model_name: Models

    input: EmbeddingRequest


class GenerateEmbeddingResponse(BaseModel):
    length: int
    embedding: list[float]


@app.post("/api/generate_embedding", response_model=GenerateEmbeddingResponse)
def generate_embedding(req: GenerateEmbeddingRequest) -> GenerateEmbeddingResponse:
    if req.embed_model_name == INSTRUCTOR_LARGE:
        model = INSTRUCTOR(INSTRUCTOR_LARGE)

        assert req.input.instruction is not None
        sentence = [req.input.instruction, req.input.text]
        embedding: torch.Tensor = model.encode(
            [sentence],  # type: ignore
            convert_to_numpy=False,
        )[0]

    elif req.embed_model_name == GTE_LARGE:
        model = SentenceTransformer(GTE_LARGE)

        embedding = model.encode([req.input.text], convert_to_numpy=False)[0]
    else:
        raise ValueError(f"Model {req.embed_model_name} not supported.")

    return GenerateEmbeddingResponse(
        length=len(embedding),
        embedding=embedding.tolist(),
    )
