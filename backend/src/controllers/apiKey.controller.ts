import { Request, Response } from "express";
import { ApiKeyService } from "../services/apiKey.service";
import { asyncHandler } from "../utils/asyncHandler";

export const ApiKeyController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const apiKey = await ApiKeyService.create(req.body);
    res.status(201).json({ success: true, data: apiKey });
  }),

  findAll: asyncHandler(async (_req: Request, res: Response) => {
    const apiKeys = await ApiKeyService.findAll();
    res.status(200).json({ success: true, data: apiKeys });
  }),

  revoke: asyncHandler(async (req: Request, res: Response) => {
    const apiKey = await ApiKeyService.revoke(req.params.id);
    res.status(200).json({ success: true, data: apiKey });
  }),
};
