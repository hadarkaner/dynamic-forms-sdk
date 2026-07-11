import { Request, Response } from "express";
import { FormService } from "../services/form.service";
import { SubmissionService } from "../services/submission.service";
import { AnalyticsEventService } from "../services/analyticsEvent.service";
import { asyncHandler } from "../utils/asyncHandler";

export const PublicController = {
  getForm: asyncHandler(async (req: Request, res: Response) => {
    const form = await FormService.findPublishedById(req.params.formId);
    res.status(200).json({ success: true, data: form });
  }),

  createSubmission: asyncHandler(async (req: Request, res: Response) => {
    const submission = await SubmissionService.createPublic(req.params.formId, req.body, {
      ipAddress: req.ip,
      userAgent: req.header("user-agent"),
    });
    res.status(201).json({ success: true, data: submission });
  }),

  trackEvent: asyncHandler(async (req: Request, res: Response) => {
    const event = await AnalyticsEventService.createPublic(req.params.formId, req.body);
    res.status(201).json({ success: true, data: event });
  }),
};
