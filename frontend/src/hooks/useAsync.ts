import { useCallback, useEffect, useState } from "react";

// Shared loading/error/refetch pattern for the resource hooks (useForms, useForm,
// useSubmissions, useFormVersions, useApiKeys, useAnalyticsSummary) — each only
// differs in which service call it makes and what it's keyed/enabled on.
export const useAsync = <T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  initialValue: T,
  enabled = true
) => {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const refetch = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
};
