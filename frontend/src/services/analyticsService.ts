import { apiRequest } from "./apiClient";
import { AnalyticsEvent, AnalyticsSummary } from "../types/analytics";

export const analyticsService = {
  list: (formId: string): Promise<AnalyticsEvent[]> =>
    apiRequest<AnalyticsEvent[]>(`/forms/${formId}/events`),

  getSummary: (formId: string): Promise<AnalyticsSummary> =>
    apiRequest<AnalyticsSummary>(`/forms/${formId}/events/summary`),
};
