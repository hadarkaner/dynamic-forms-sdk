import { apiKeyService } from "../services/apiKeyService";
import { ApiKey } from "../types/apiKey";
import { useAsync } from "./useAsync";
import { useConnection } from "./useConnection";

export const useApiKeys = () => {
  // The API key list endpoint is open, but it's keyed on the active apiKey so a
  // freshly issued/switched key is reflected immediately.
  const { apiKey } = useConnection();
  const { data: apiKeys, loading, error, refetch } = useAsync<ApiKey[]>(
    () => apiKeyService.list(),
    [apiKey],
    []
  );

  return { apiKeys, loading, error, refetch };
};
