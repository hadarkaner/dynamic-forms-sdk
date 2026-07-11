import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { generateApiKey } from "../utils/generateApiKey";
import { CreateApiKeyInput } from "../models/apiKey.model";

export const ApiKeyService = {
  async create(input: CreateApiKeyInput) {
    return prisma.apiKey.create({
      data: {
        name: input.name,
        key: generateApiKey(),
      },
    });
  },

  async findAll() {
    return prisma.apiKey.findMany({ orderBy: { createdAt: "desc" } });
  },

  async revoke(id: string) {
    const apiKey = await prisma.apiKey.findUnique({ where: { id } });
    if (!apiKey) {
      throw new AppError("API key not found", 404);
    }

    return prisma.apiKey.update({ where: { id }, data: { isActive: false } });
  },
};
