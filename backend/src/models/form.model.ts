import { z } from "zod";

const fieldTypeEnum = z.enum([
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "EMAIL",
  "PHONE",
  "DATE",
  "RATING",
  "CHECKBOX",
  "RADIO",
  "SELECT",
]);

export const formFieldSchema = z.object({
  label: z.string().min(1),
  type: fieldTypeEnum,
  isRequired: z.boolean().optional().default(false),
  order: z.number().int().optional().default(0),
  options: z.array(z.string()).optional(),
  // Subset of `options` marked correct by the form editor; only meaningful for
  // RADIO/CHECKBOX fields. Authoring-time metadata only — never used to grade
  // submissions automatically.
  correctOptions: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
});

const themeSchema = z.object({
  primaryColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  fontFamily: z.string().optional(),
});

export const createFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  isPublished: z.boolean().optional().default(false),
  theme: themeSchema.optional(),
  fields: z.array(formFieldSchema).optional().default([]),
});

// Creating a new version never changes publish state directly — publishing is its
// own explicit action (PATCH /forms/:id/publish) so it's always a deliberate step.
export const createVersionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  theme: themeSchema.optional(),
  fields: z.array(formFieldSchema).optional().default([]),
});

export const publishVersionSchema = z.object({
  versionId: z.string().uuid().optional(),
});

export type CreateFormInput = z.infer<typeof createFormSchema>;
export type CreateVersionInput = z.infer<typeof createVersionSchema>;
export type PublishVersionInput = z.infer<typeof publishVersionSchema>;
