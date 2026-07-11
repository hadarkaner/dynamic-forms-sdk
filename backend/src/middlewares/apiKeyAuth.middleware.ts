import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

declare global {
  namespace Express {
    interface Request {
      apiKeyId?: string;
    }
  }
}

export const apiKeyAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const key = req.header("x-api-key");

    if (!key) {
      throw new AppError("Missing API key. Provide it via the 'x-api-key' header.", 401);
    }

    const apiKey = await prisma.apiKey.findUnique({ where: { key } });

    if (!apiKey || !apiKey.isActive) {
      throw new AppError("Invalid or inactive API key.", 401);
    }

    req.apiKeyId = apiKey.id;
    next();
  }
);
