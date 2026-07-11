import { apiRequest } from "./apiClient";
import { CreateFormInput, CreateVersionInput, Form, FormVersion } from "../types/form";

export const formService = {
  list: (): Promise<Form[]> => apiRequest<Form[]>("/forms"),

  get: (formId: string): Promise<Form> => apiRequest<Form>(`/forms/${formId}`),

  create: (input: CreateFormInput): Promise<Form> =>
    apiRequest<Form>("/forms", { method: "POST", body: JSON.stringify(input) }),

  remove: (formId: string): Promise<void> =>
    apiRequest<void>(`/forms/${formId}`, { method: "DELETE" }),

  // Versioning — saving an edit never mutates a version in place; it creates a new one.
  createVersion: (formId: string, input: CreateVersionInput): Promise<Form> =>
    apiRequest<Form>(`/forms/${formId}/versions`, { method: "POST", body: JSON.stringify(input) }),

  listVersions: (formId: string): Promise<FormVersion[]> =>
    apiRequest<FormVersion[]>(`/forms/${formId}/versions`),

  getVersion: (formId: string, versionId: string): Promise<FormVersion> =>
    apiRequest<FormVersion>(`/forms/${formId}/versions/${versionId}`),

  restoreVersion: (formId: string, versionId: string): Promise<Form> =>
    apiRequest<Form>(`/forms/${formId}/versions/${versionId}/restore`, { method: "POST" }),

  publish: (formId: string, versionId?: string): Promise<Form> =>
    apiRequest<Form>(`/forms/${formId}/publish`, {
      method: "PATCH",
      body: JSON.stringify({ versionId }),
    }),

  unpublish: (formId: string): Promise<Form> =>
    apiRequest<Form>(`/forms/${formId}/unpublish`, { method: "PATCH" }),
};
