import { Request, Response } from "express";
import { SubmissionService } from "../services/submission.service";
import { asyncHandler } from "../utils/asyncHandler";

export const SubmissionController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const submission = await SubmissionService.create(
      req.apiKeyId!,
      req.params.formId,
      req.body,
      { ipAddress: req.ip, userAgent: req.header("user-agent") }
    );
    res.status(201).json({ success: true, data: submission });
  }),

  findAll: asyncHandler(async (req: Request, res: Response) => {
    const submissions = await SubmissionService.findAll(req.apiKeyId!, req.params.formId);
    res.status(200).json({ success: true, data: submissions });
  }),

  findById: asyncHandler(async (req: Request, res: Response) => {
    const submission = await SubmissionService.findById(
      req.apiKeyId!,
      req.params.formId,
      req.params.id
    );
    res.status(200).json({ success: true, data: submission });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await SubmissionService.delete(req.apiKeyId!, req.params.formId, req.params.id);
    res.status(204).send();
  }),
};
