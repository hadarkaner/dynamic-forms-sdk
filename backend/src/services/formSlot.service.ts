import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { CreateFormSlotInput } from "../models/formSlot.model";
import { assertFormOwnership } from "./formAccess";

const withForm = {
  form: {
    select: {
      id: true,
      versions: {
        where: { isPublished: true },
        select: { title: true },
        take: 1,
      },
    },
  },
};

const shapeSlot = (slot: {
  id: string;
  key: string;
  formId: string | null;
  createdAt: Date;
  updatedAt: Date;
  form: { id: string; versions: { title: string }[] } | null;
}) => ({
  id: slot.id,
  key: slot.key,
  formId: slot.formId,
  formTitle: slot.form?.versions[0]?.title ?? null,
  createdAt: slot.createdAt,
  updatedAt: slot.updatedAt,
});

export const FormSlotService = {
  async create(apiKeyId: string, input: CreateFormSlotInput) {
    if (input.formId) {
      await assertFormOwnership(apiKeyId, input.formId);
    }

    try {
      const slot = await prisma.formSlot.create({
        data: { key: input.key, apiKeyId, formId: input.formId ?? null },
        include: withForm,
      });
      return shapeSlot(slot);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError(`Slot key "${input.key}" is already taken`, 409);
      }
      throw error;
    }
  },

  async findAll(apiKeyId: string) {
    const slots = await prisma.formSlot.findMany({
      where: { apiKeyId },
      include: withForm,
      orderBy: { createdAt: "desc" },
    });
    return slots.map(shapeSlot);
  },

  async assign(apiKeyId: string, id: string, formId: string | null) {
    const slot = await prisma.formSlot.findFirst({ where: { id, apiKeyId } });
    if (!slot) {
      throw new AppError("Slot not found", 404);
    }

    if (formId) {
      await assertFormOwnership(apiKeyId, formId);
    }

    const updated = await prisma.formSlot.update({
      where: { id },
      data: { formId },
      include: withForm,
    });
    return shapeSlot(updated);
  },

  async delete(apiKeyId: string, id: string) {
    const slot = await prisma.formSlot.findFirst({ where: { id, apiKeyId } });
    if (!slot) {
      throw new AppError("Slot not found", 404);
    }
    await prisma.formSlot.delete({ where: { id } });
  },

  // Public resolution used by the client SDK: no API key, keyed by the slot's
  // globally-unique `key` alone. Resolves to whichever form is currently assigned,
  // then to that form's currently published version — both can change between
  // calls without the embedding app changing a single line of code.
  async resolvePublic(key: string) {
    const slot = await prisma.formSlot.findUnique({
      where: { key },
      select: {
        key: true,
        formId: true,
        form: {
          select: {
            versions: {
              where: { isPublished: true },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!slot) {
      throw new AppError("Slot not found", 404);
    }

    if (!slot.formId || !slot.form) {
      throw new AppError(`No form is assigned to slot "${key}"`, 404);
    }

    const published = slot.form.versions[0];
    if (!published) {
      throw new AppError(`The form assigned to slot "${key}" has no published version`, 404);
    }

    return { slot: slot.key, formId: slot.formId, versionId: published.id };
  },
};
