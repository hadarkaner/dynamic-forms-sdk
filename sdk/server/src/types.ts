export type FieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "EMAIL"
  | "PHONE"
  | "DATE"
  | "RATING"
  | "CHECKBOX"
  | "RADIO"
  | "SELECT";

export interface FormFieldInput {
  label: string;
  type: FieldType;
  isRequired?: boolean;
  order?: number;
  options?: string[];
  // Subset of `options` marked correct by the form editor; only meaningful for
  // RADIO/CHECKBOX fields. Authoring-time metadata only — never used to grade
  // submissions automatically, and never exposed through the public endpoints.
  correctOptions?: string[];
  placeholder?: string;
}

export interface FormField extends FormFieldInput {
  id: string;
}

// Per-form visual styling, applied by the client SDK when rendering the published version.
export interface FormTheme {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
}

export interface FormVersion {
  id: string;
  formId: string;
  versionNumber: number;
  title: string;
  description?: string | null;
  theme?: FormTheme | null;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  fields: FormField[];
}

// A Form is a stable container — it has no editable content of its own.
// `currentVersion` is the latest (highest versionNumber) draft being worked on;
// `publishedVersion` is whichever version is currently live (or null if none is).
export interface Form {
  id: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  currentVersion: FormVersion;
  publishedVersion: FormVersion | null;
}

export interface CreateFormInput {
  title: string;
  description?: string;
  isPublished?: boolean;
  theme?: FormTheme;
  fields?: FormFieldInput[];
}

export interface CreateVersionInput {
  title: string;
  description?: string;
  theme?: FormTheme;
  fields?: FormFieldInput[];
}

export interface FormSubmission {
  id: string;
  formId: string;
  data: Record<string, unknown>;
  submittedAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

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

export interface AnalyticsSummary {
  byType: { type: AnalyticsEventType; count: number }[];
  conversionRate: number;
}

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// A stable pointer to a Form — an embedding app holds the `key` (e.g. "main-survey")
// while which form it resolves to (`formId`) can be reassigned from the portal or
// this client, with no change on the embedding side.
export interface FormSlot {
  id: string;
  key: string;
  formId: string | null;
  formTitle: string | null;
  createdAt: string;
  updatedAt: string;
}
