# %%
from typing import Literal

import modal
from InstructorEmbedding import INSTRUCTOR
from pydantic import BaseModel

Models = Literal["hkunlp/instructor-large"]


# %%
def cache_models():
    """
    Saves all models to the Modal image.
    """
    _ = INSTRUCTOR("hkunlp/instructor-large")
    return


image = (
    modal.Image.debian_slim(python_version="3.11")
    .poetry_install_from_file("pyproject.toml", without=["dev"])
    .run_function(cache_models)
)
stub = modal.Stub("embedding-playground")


# %%


class GenerateEmbeddingsRequest(BaseModel):
    model_name: Models
    instruction: str | None
    text: str


class GenerateEmbeddingsResponse(BaseModel):
    embeddings: list[float]


@stub.function(image=image)
@modal.web_endpoint(method="POST")
def generate_embeddings(req: GenerateEmbeddingsRequest):
    if req.model_name == "hkunlp/instructor-large":
        model = INSTRUCTOR("hkunlp/instructor-large")
        embeddings = model.encode([req.instruction or "", req.text])
        return GenerateEmbeddingsResponse(embeddings=embeddings[1].tolist())
    else:
        raise ValueError("Model not supported.")
