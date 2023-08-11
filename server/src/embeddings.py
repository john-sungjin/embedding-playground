# %%
from typing import Literal

import modal
import torch
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


class Input(BaseModel):
    instruction: str
    text: str


class GenerateEmbeddingsRequest(BaseModel):
    embed_model_name: Models
    inputs: list[Input]  # (instruction, text) pairs


class GenerateEmbeddingsResponse(BaseModel):
    embeddings: list[list[float]]


@stub.function(image=image)
@modal.web_endpoint(method="POST")
def generate_embeddings(req: GenerateEmbeddingsRequest):
    if req.embed_model_name == "hkunlp/instructor-large":
        model = INSTRUCTOR("hkunlp/instructor-large")
        sentences = [[i.instruction, i.text] for i in req.inputs]
        embeddings: list[torch.Tensor] = model.encode(sentences, convert_to_numpy=False)
        return GenerateEmbeddingsResponse(embeddings=[e.tolist() for e in embeddings])
    else:
        raise ValueError("Model not supported.")
