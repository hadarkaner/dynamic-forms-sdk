import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { CreateFormInput, CreateVersionInput } from "../models/form.model";
import { assertFormOwnership } from "./formAccess";

const fieldsInclude = { fields: { orderBy: { order: "asc" as const } } };
const versionsDesc = { orderBy: { versionNumber: "desc" as const }, include: fieldsInclude };

const shapeForm = (form: {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  versions: Array<{ isPublished: boolean } & Record<string, unknown>>;
}) => {
  const current = form.versions[0] ?? null;
  const published = form.versions.find((v) => v.isPublished) ?? null;

  return {
    id: form.id,
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
    isPublished: published !== null,
    currentVersion: current,
    publishedVersion: published,
  };
};

const createFieldsData = (fields: CreateFormInput["fields"]) =>
  (fields ?? []).map((field) => ({
    label: field.label,
    type: field.type,
    isRequired: field.isRequired ?? false,
    order: field.order ?? 0,
    options: field.options,
    correctOptions: field.correctOptions,
    placeholder: field.placeholder,
  }));

export const FormService = {
  async create(apiKeyId: string, input: CreateFormInput) {
    const form = await prisma.form.create({ data: { apiKeyId } });

    await prisma.formVersion.create({
      data: {
        formId: form.id,
        versionNumber: 1,
        title: input.title,
        description: input.description,
        theme: input.theme,
        isPublished: input.isPublished ?? false,
        publishedAt: input.isPublished ? new Date() : null,
        fields: { create: createFieldsData(input.fields) },
      },
    });

    return this.findById(apiKeyId, form.id);
  },

  async findAll(apiKeyId: string) {
    const forms = await prisma.form.findMany({
      where: { apiKeyId },
      include: { versions: versionsDesc },
      orderBy: { createdAt: "desc" },
    });

    return forms.map(shapeForm);
  },

  async findById(apiKeyId: string, id: string) {
    const form = await prisma.form.findFirst({
      where: { id, apiKeyId },
      include: { versions: versionsDesc },
    });

    if (!form) {
      throw new AppError("Form not found", 404);
    }

    return shapeForm(form);
  },

  // Public lookup used by the client SDK: no API key, only the published version
  // is exposed, and the shape stays flat (no version internals) for SDK stability.
  // `correctOptions` is intentionally excluded — it's authoring metadata, never
  // shown to whoever is filling out the form.
  async findPublishedById(id: string) {
    const form = await prisma.form.findFirst({
      where: { id, versions: { some: { isPublished: true } } },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        versions: {
          where: { isPublished: true },
          select: {
            title: true,
            description: true,
            theme: true,
            fields: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                label: true,
                type: true,
                isRequired: true,
                order: true,
                options: true,
                placeholder: true,
                createdAt: true,
                updatedAt: true,
                formVersionId: true,
              },
            },
          },
        },
      },
    });

    if (!form || form.versions.length === 0) {
      throw new AppError("Form not found", 404);
    }

    const published = form.versions[0];
    return {
      id: form.id,
      title: published.title,
      description: published.description,
      theme: published.theme,
      isPublished: true,
      fields: published.fields,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
    };
  },

  async createVersion(apiKeyId: string, formId: string, input: CreateVersionInput) {
    await assertFormOwnership(apiKeyId, formId);

    const latest = await prisma.formVersion.findFirst({
      where: { formId },
      orderBy: { versionNumber: "desc" },
    });

    await prisma.formVersion.create({
      data: {
        formId,
        versionNumber: (latest?.versionNumber ?? 0) + 1,
        title: input.title,
        description: input.description,
        theme: input.theme,
        fields: { create: createFieldsData(input.fields) },
      },
    });

    return this.findById(apiKeyId, formId);
  },

  async listVersions(apiKeyId: string, formId: string) {
    await assertFormOwnership(apiKeyId, formId);

    return prisma.formVersion.findMany({
      where: { formId },
      orderBy: { versionNumber: "desc" },
      include: fieldsInclude,
    });
  },

  async getVersion(apiKeyId: string, formId: string, versionId: string) {
    await assertFormOwnership(apiKeyId, formId);

    const version = await prisma.formVersion.findFirst({
      where: { id: versionId, formId },
      include: fieldsInclude,
    });

    if (!version) {
      throw new AppError("Version not found", 404);
    }

    return version;
  },

  async publishVersion(apiKeyId: string, formId: string, versionId?: string) {
    await assertFormOwnership(apiKeyId, formId);

    const target = versionId
      ? await prisma.formVersion.findFirst({ where: { id: versionId, formId } })
      : await prisma.formVersion.findFirst({ where: { formId }, orderBy: { versionNumber: "desc" } });

    if (!target) {
      throw new AppError("Version not found", 404);
    }

    await prisma.$transaction([
      prisma.formVersion.updateMany({
        where: { formId },
        data: { isPublished: false, publishedAt: null },
      }),
      prisma.formVersion.update({
        where: { id: target.id },
        data: { isPublished: true, publishedAt: new Date() },
      }),
    ]);

    return this.findById(apiKeyId, formId);
  },

  async unpublish(apiKeyId: string, formId: string) {
    await assertFormOwnership(apiKeyId, formId);

    await prisma.formVersion.updateMany({
      where: { formId, isPublished: true },
      data: { isPublished: false, publishedAt: null },
    });

    return this.findById(apiKeyId, formId);
  },

  async restoreVersion(apiKeyId: string, formId: string, versionId: string) {
    const source = await this.getVersion(apiKeyId, formId, versionId);

    return this.createVersion(apiKeyId, formId, {
      title: source.title,
      description: source.description ?? undefined,
      theme: (source.theme as CreateVersionInput["theme"]) ?? undefined,
      fields: source.fields.map((field) => ({
        label: field.label,
        type: field.type,
        isRequired: field.isRequired,
        order: field.order,
        options: (field.options as string[] | null) ?? undefined,
        correctOptions: (field.correctOptions as string[] | null) ?? undefined,
        placeholder: field.placeholder ?? undefined,
      })),
    });
  },

  async delete(apiKeyId: string, id: string) {
    await assertFormOwnership(apiKeyId, id);
    await prisma.form.delete({ where: { id } });
  },
};
