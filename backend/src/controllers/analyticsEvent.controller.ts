import { Request, Response } from "express";
import { AnalyticsEventService } from "../services/analyticsEvent.service";
import { asyncHandler } from "../utils/asyncHandler";

export const AnalyticsEventController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const event = await AnalyticsEventService.create(
      req.apiKeyId!,
      req.params.formId,
      req.body
    );
    res.status(201).json({ success: true, data: event });
  }),

  findAll: asyncHandler(async (req: Request, res: Response) => {
    const events = await AnalyticsEventService.findAll(req.apiKeyId!, req.params.formId);
    res.status(200).json({ success: true, data: events });
  }),

  summary: asyncHandler(async (req: Request, res: Response) => {
    const summary = await AnalyticsEventService.getSummary(req.apiKeyId!, req.params.formId);
    res.status(200).json({ success: true, data: summary });
  }),
};
