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

export const FIELD_TYPES: FieldType[] = [
  "TEXT",
  "TEXTAREA",
  "EMAIL",
  "PHONE",
  "NUMBER",
  "DATE",
  "RATING",
  "SELECT",
  "RADIO",
  "CHECKBOX",
];

// Field types where the form builder lets the editor mark which option(s) are correct.
export const CORRECT_ANSWER_FIELD_TYPES: FieldType[] = ["RADIO", "CHECKBOX"];

export interface FormFieldInput {
  label: string;
  type: FieldType;
  isRequired: boolean;
  order: number;
  options?: string[];
  // Subset of `options` marked correct, only meaningful for RADIO/CHECKBOX fields.
  correctOptions?: string[];
  placeholder?: string;
}

export interface FormField extends FormFieldInput {
  id: string;
}

// Per-form visual styling, set by the form editor and applied by the client SDK
// when it renders the published version.
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

// A Form is a stable container with no editable content of its own.
// `currentVersion` is the latest draft being worked on; `publishedVersion`
// is whichever version is currently live (or null if nothing is published).
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
