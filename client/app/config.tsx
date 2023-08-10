import axios from "axios";

const API_URL =
  "https://village-dev--embedding-playground-generate-embedding-1d0363-dev.modal.run";

export const apiClient = axios.create({
  baseURL: API_URL,
});

// Match schemas with embeddings.py
export interface GenerateEmbeddingsRequest {
  embed_model_name: string;
  instruction: string | null;
  text: string;
}

export interface GenerateEmbeddingsResponse {
  embeddings: number[];
}

export const generateEmbeddings = async (
  request: GenerateEmbeddingsRequest
): Promise<GenerateEmbeddingsResponse> => {
  const { data } = await apiClient.post<GenerateEmbeddingsResponse>(
    "/",
    request
  );
  return data;
};
