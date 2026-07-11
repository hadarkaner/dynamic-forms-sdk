export interface FormSubmission {
  id: string;
  formId: string;
  data: Record<string, unknown>;
  submittedAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}
