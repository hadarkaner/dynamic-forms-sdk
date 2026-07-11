import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

// Shared ownership/visibility checks for the Form entity, reused by FormService,
// SubmissionService, and AnalyticsEventService so each doesn't reimplement them.

export const assertFormOwnership = async (apiKeyId: string, formId: string): Promise<void> => {
  const form = await prisma.form.findFirst({ where: { id: formId, apiKeyId } });
  if (!form) {
    throw new AppError("Form not found", 404);
  }
};

export const assertFormPublished = async (formId: string): Promise<void> => {
  const form = await prisma.form.findFirst({
    where: { id: formId, versions: { some: { isPublished: true } } },
  });
  if (!form) {
    throw new AppError("Form not found", 404);
  }
};
