import { AnalyticsEventType, FormSchema } from "./types";

const request = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(body?.message || `Request failed with status ${res.status}`);
  }

  return body.data as T;
};

export const fetchForm = (baseUrl: string, formId: string): Promise<FormSchema> => {
  return request<FormSchema>(`${baseUrl}/public/forms/${formId}`);
};

export const submitForm = (
  baseUrl: string,
  formId: string,
  data: Record<string, unknown>
) => {
  return request(`${baseUrl}/public/forms/${formId}/submissions`, {
    method: "POST",
    body: JSON.stringify({ data }),
  });
};

export const trackEvent = (
  baseUrl: string,
  formId: string,
  type: AnalyticsEventType,
  metadata?: Record<string, unknown>
) => {
  // Analytics must never block or break the form — swallow failures.
  return request(`${baseUrl}/public/forms/${formId}/events`, {
    method: "POST",
    body: JSON.stringify({ type, metadata }),
  }).catch(() => undefined);
};
