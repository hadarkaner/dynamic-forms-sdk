import { analyticsService } from "../services/analyticsService";
import { AnalyticsEvent, AnalyticsSummary } from "../types/analytics";
import { useAsync } from "./useAsync";
import { useConnection } from "./useConnection";

interface AnalyticsData {
  summary: AnalyticsSummary | null;
  events: AnalyticsEvent[];
}

export const useAnalyticsSummary = (formId: string | undefined) => {
  const { apiKey } = useConnection();
  const { data, loading, error, refetch } = useAsync<AnalyticsData>(
    async () => {
      const [summary, events] = await Promise.all([
        analyticsService.getSummary(formId!),
        analyticsService.list(formId!),
      ]);
      return { summary, events };
    },
    [apiKey, formId],
    { summary: null, events: [] },
    Boolean(apiKey && formId)
  );

  return { summary: data.summary, events: data.events, loading, error, refetch };
};
