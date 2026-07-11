import { apiRequest } from "./apiClient";
import { FormSubmission } from "../types/submission";

export const submissionService = {
  list: (formId: string): Promise<FormSubmission[]> =>
    apiRequest<FormSubmission[]>(`/forms/${formId}/submissions`),

  get: (formId: string, submissionId: string): Promise<FormSubmission> =>
    apiRequest<FormSubmission>(`/forms/${formId}/submissions/${submissionId}`),

  remove: (formId: string, submissionId: string): Promise<void> =>
    apiRequest<void>(`/forms/${formId}/submissions/${submissionId}`, { method: "DELETE" }),
};
