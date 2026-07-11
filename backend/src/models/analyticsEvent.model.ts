import { z } from "zod";

const eventTypeEnum = z.enum([
  "VIEW",
  "START",
  "FIELD_FOCUS",
  "FIELD_CHANGE",
  "SUBMIT",
  "ABANDON",
  "ERROR",
]);

export const createAnalyticsEventSchema = z.object({
  type: eventTypeEnum,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateAnalyticsEventInput = z.infer<typeof createAnalyticsEventSchema>;
