export type AnalyticsEventType =
  | "VIEW"
  | "START"
  | "FIELD_FOCUS"
  | "FIELD_CHANGE"
  | "SUBMIT"
  | "ABANDON"
  | "ERROR";

export interface AnalyticsEvent {
  id: string;
  formId: string;
  type: AnalyticsEventType;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export type DeviceType = "Web" | "Android" | "iOS" | "Unknown";

export interface AnalyticsSummary {
  byType: { type: AnalyticsEventType; count: number }[];
  conversionRate: number;
  completionRate: number;
  abandonRate: number;
  offlineSubmissions: number;
  byDevice: { device: DeviceType; count: number }[];
}
