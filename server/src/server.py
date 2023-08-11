from typing import Literal

import fastapi
from sentence_transformers import SentenceTransformer
import torch
from InstructorEmbedding import INSTRUCTOR
from pydantic import BaseModel

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
]
INSTRUCTOR_MODELS = {
    "hkunlp/instructor-xl",
    "hkunlp/instructor-large",
}
GTE_LARGE = "thenlper/gte-large"


class GenerateEmbeddingResponse(BaseModel):
    length: int
    embedding: list[float]


@app.get("/api/generate_embedding", response_model=GenerateEmbeddingResponse)
def generate_embedding(
    embed_model_name: Models,
    text: str,
    # Instruction is only required for the instructor model.
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

    elif embed_model_name == GTE_LARGE:
        model = SentenceTransformer(GTE_LARGE)

        embedding = model.encode([text], convert_to_numpy=False)[0]
    else:
        raise ValueError(f"Model {embed_model_name} not supported.")

    return GenerateEmbeddingResponse(
        length=len(embedding),
        embedding=embedding.tolist(),
    )


def use_route_names_as_operation_ids(app: fastapi.FastAPI) -> None:
    # See https://fastapi.tiangolo.com/advanced/path-operation-advanced-configuration/#using-the-path-operation-function-name-as-the-operationid
    for route in app.routes:
        if isinstance(route, fastapi.routing.APIRoute):
            route.operation_id = route.name


use_route_names_as_operation_ids(app)
