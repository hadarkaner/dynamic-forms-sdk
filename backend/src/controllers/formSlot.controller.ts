import { Request, Response } from "express";
import { FormSlotService } from "../services/formSlot.service";
import { UpdateFormSlotInput } from "../models/formSlot.model";
import { asyncHandler } from "../utils/asyncHandler";

export const FormSlotController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const slot = await FormSlotService.create(req.apiKeyId!, req.body);
    res.status(201).json({ success: true, data: slot });
  }),

  findAll: asyncHandler(async (req: Request, res: Response) => {
    const slots = await FormSlotService.findAll(req.apiKeyId!);
    res.status(200).json({ success: true, data: slots });
  }),

  assign: asyncHandler(async (req: Request, res: Response) => {
    const { formId } = req.body as UpdateFormSlotInput;
    const slot = await FormSlotService.assign(req.apiKeyId!, req.params.id, formId);
    res.status(200).json({ success: true, data: slot });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await FormSlotService.delete(req.apiKeyId!, req.params.id);
    res.status(204).send();
  }),
};
