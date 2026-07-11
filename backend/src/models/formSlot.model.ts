import { z } from "zod";

// Lowercase/digits/hyphens only, matching the "main-survey" style constant an
// integrating app would hardcode — no spaces or characters that would need
// URL-encoding when the SDK requests GET /public/form-slots/:key.
const slotKeySchema = z
  .string()
  .min(1, "Key is required")
  .regex(/^[a-z0-9-]+$/, "Key may only contain lowercase letters, numbers, and hyphens");

export const createFormSlotSchema = z.object({
  key: slotKeySchema,
  formId: z.string().uuid().optional().nullable(),
});

export const updateFormSlotSchema = z.object({
  formId: z.string().uuid().nullable(),
});

export type CreateFormSlotInput = z.infer<typeof createFormSlotSchema>;
export type UpdateFormSlotInput = z.infer<typeof updateFormSlotSchema>;
