import { z } from "zod";

export const createSubmissionSchema = z.object({
  data: z.record(z.string(), z.unknown()),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
