import { apiRequest } from "./apiClient";
import { ApiKey } from "../types/apiKey";

export const apiKeyService = {
  list: (): Promise<ApiKey[]> => apiRequest<ApiKey[]>("/api-keys"),

  create: (name: string): Promise<ApiKey> =>
    apiRequest<ApiKey>("/api-keys", { method: "POST", body: JSON.stringify({ name }) }),

  revoke: (apiKeyId: string): Promise<ApiKey> =>
    apiRequest<ApiKey>(`/api-keys/${apiKeyId}/revoke`, { method: "PATCH" }),
};
