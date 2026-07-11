import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { CreateSubmissionInput } from "../models/submission.model";
import { assertFormOwnership, assertFormPublished } from "./formAccess";

export const SubmissionService = {
  async create(
    apiKeyId: string,
    formId: string,
    input: CreateSubmissionInput,
    meta: { ipAddress?: string; userAgent?: string }
  ) {
    await assertFormOwnership(apiKeyId, formId);

    return prisma.formSubmission.create({
      data: {
        formId,
        data: input.data as Prisma.InputJsonValue,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });
  },

  // Public submission used by the client SDK: no API key, but only published forms accept submissions.
  async createPublic(
    formId: string,
    input: CreateSubmissionInput,
    meta: { ipAddress?: string; userAgent?: string }
  ) {
    await assertFormPublished(formId);

    return prisma.formSubmission.create({
      data: {
        formId,
        data: input.data as Prisma.InputJsonValue,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });
  },

  async findAll(apiKeyId: string, formId: string) {
    await assertFormOwnership(apiKeyId, formId);

    return prisma.formSubmission.findMany({
      where: { formId },
      orderBy: { submittedAt: "desc" },
    });
  },

  async findById(apiKeyId: string, formId: string, id: string) {
    await assertFormOwnership(apiKeyId, formId);

    const submission = await prisma.formSubmission.findFirst({
      where: { id, formId },
    });

    if (!submission) {
      throw new AppError("Submission not found", 404);
    }

    return submission;
  },

  async delete(apiKeyId: string, formId: string, id: string) {
    await this.findById(apiKeyId, formId, id);
    await prisma.formSubmission.delete({ where: { id } });
  },
};
