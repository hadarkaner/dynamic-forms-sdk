import {
  AnalyticsEvent,
  AnalyticsSummary,
  ApiKey,
  CreateFormInput,
  CreateVersionInput,
  Form,
  FormSlot,
  FormSubmission,
  FormVersion,
} from "./types";

export interface DynamicFormsClientOptions {
  /** Secret API key. Server-side only — never ship this to a browser. */
  apiKey: string;
  /** Base URL of the Dynamic Forms SDK backend, e.g. "https://api.example.com/api/v1" */
  baseUrl: string;
}

export class DynamicFormsClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: DynamicFormsClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        ...init?.headers,
      },
    });

    if (res.status === 204) {
      return undefined as T;
    }

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(body?.message || `Request failed with status ${res.status}`);
    }

    return body.data as T;
  }

  // Forms

  createForm(input: CreateFormInput): Promise<Form> {
    return this.request<Form>("/forms", { method: "POST", body: JSON.stringify(input) });
  }

  listForms(): Promise<Form[]> {
    return this.request<Form[]>("/forms");
  }

  getForm(formId: string): Promise<Form> {
    return this.request<Form>(`/forms/${formId}`);
  }

  deleteForm(formId: string): Promise<void> {
    return this.request<void>(`/forms/${formId}`, { method: "DELETE" });
  }

  // Versioning — every content change creates a new immutable FormVersion.
  // Publishing/unpublishing flips which version (if any) is served publicly.

  createVersion(formId: string, input: CreateVersionInput): Promise<Form> {
    return this.request<Form>(`/forms/${formId}/versions`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  listVersions(formId: string): Promise<FormVersion[]> {
    return this.request<FormVersion[]>(`/forms/${formId}/versions`);
  }

  getVersion(formId: string, versionId: string): Promise<FormVersion> {
    return this.request<FormVersion>(`/forms/${formId}/versions/${versionId}`);
  }

  restoreVersion(formId: string, versionId: string): Promise<Form> {
    return this.request<Form>(`/forms/${formId}/versions/${versionId}/restore`, {
      method: "POST",
    });
  }

  publishVersion(formId: string, versionId?: string): Promise<Form> {
    return this.request<Form>(`/forms/${formId}/publish`, {
      method: "PATCH",
      body: JSON.stringify({ versionId }),
    });
  }

  unpublish(formId: string): Promise<Form> {
    return this.request<Form>(`/forms/${formId}/unpublish`, { method: "PATCH" });
  }

  // Submissions

  listSubmissions(formId: string): Promise<FormSubmission[]> {
    return this.request<FormSubmission[]>(`/forms/${formId}/submissions`);
  }

  getSubmission(formId: string, submissionId: string): Promise<FormSubmission> {
    return this.request<FormSubmission>(`/forms/${formId}/submissions/${submissionId}`);
  }

  deleteSubmission(formId: string, submissionId: string): Promise<void> {
    return this.request<void>(`/forms/${formId}/submissions/${submissionId}`, {
      method: "DELETE",
    });
  }

  // Analytics events

  listEvents(formId: string): Promise<AnalyticsEvent[]> {
    return this.request<AnalyticsEvent[]>(`/forms/${formId}/events`);
  }

  getAnalyticsSummary(formId: string): Promise<AnalyticsSummary> {
    return this.request<AnalyticsSummary>(`/forms/${formId}/events/summary`);
  }

  // Form slots — a stable key an embedding app holds; reassign which form it
  // resolves to (or unassign, with `null`) without any change on that side.

  createFormSlot(input: { key: string; formId?: string | null }): Promise<FormSlot> {
    return this.request<FormSlot>("/form-slots", { method: "POST", body: JSON.stringify(input) });
  }

  listFormSlots(): Promise<FormSlot[]> {
    return this.request<FormSlot[]>("/form-slots");
  }

  assignFormSlot(slotId: string, formId: string | null): Promise<FormSlot> {
    return this.request<FormSlot>(`/form-slots/${slotId}`, {
      method: "PATCH",
      body: JSON.stringify({ formId }),
    });
  }

  deleteFormSlot(slotId: string): Promise<void> {
    return this.request<void>(`/form-slots/${slotId}`, { method: "DELETE" });
  }

  // API keys

  createApiKey(name: string): Promise<ApiKey> {
    return this.request<ApiKey>("/api-keys", { method: "POST", body: JSON.stringify({ name }) });
  }

  listApiKeys(): Promise<ApiKey[]> {
    return this.request<ApiKey[]>("/api-keys");
  }

  revokeApiKey(apiKeyId: string): Promise<ApiKey> {
    return this.request<ApiKey>(`/api-keys/${apiKeyId}/revoke`, { method: "PATCH" });
  }
}
