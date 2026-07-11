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

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  isRequired: boolean;
  order: number;
  options?: string[] | null;
  placeholder?: string | null;
}

// Per-form visual styling set by the form editor; applied inline when rendering.
export interface FormTheme {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
}

export interface FormSchema {
  id: string;
  title: string;
  description?: string | null;
  theme?: FormTheme | null;
  isPublished: boolean;
  fields: FormField[];
}

export type AnalyticsEventType =
  | "VIEW"
  | "START"
  | "FIELD_FOCUS"
  | "FIELD_CHANGE"
  | "SUBMIT"
  | "ABANDON"
  | "ERROR";

export interface DynamicFormOptions {
  /** Base URL of the Dynamic Forms SDK backend, e.g. "https://api.example.com/api/v1" */
  baseUrl: string;
  /** Public id of the form to render (only published forms are served). */
  formId: string;
  /** CSS selector or element to render the form into. */
  container: string | HTMLElement;
  /** Called after a successful submission. */
  onSubmit?: (data: Record<string, unknown>) => void;
  /** Called when loading or submitting the form fails. */
  onError?: (error: Error) => void;
  /** Submit button label. Defaults to "Submit". */
  submitLabel?: string;
  /** Message shown in the built-in success panel after submitting. */
  successMessage?: string;
  /** Message shown when a submission can't reach the server and is queued for retry. */
  offlineMessage?: string;
}
