import { Request, Response } from "express";
import { FormService } from "../services/form.service";
import { PublishVersionInput } from "../models/form.model";
import { asyncHandler } from "../utils/asyncHandler";

export const FormController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const form = await FormService.create(req.apiKeyId!, req.body);
    res.status(201).json({ success: true, data: form });
  }),

  findAll: asyncHandler(async (req: Request, res: Response) => {
    const forms = await FormService.findAll(req.apiKeyId!);
    res.status(200).json({ success: true, data: forms });
  }),

  findById: asyncHandler(async (req: Request, res: Response) => {
    const form = await FormService.findById(req.apiKeyId!, req.params.id);
    res.status(200).json({ success: true, data: form });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await FormService.delete(req.apiKeyId!, req.params.id);
    res.status(204).send();
  }),

  createVersion: asyncHandler(async (req: Request, res: Response) => {
    const form = await FormService.createVersion(req.apiKeyId!, req.params.id, req.body);
    res.status(201).json({ success: true, data: form });
  }),

  listVersions: asyncHandler(async (req: Request, res: Response) => {
    const versions = await FormService.listVersions(req.apiKeyId!, req.params.id);
    res.status(200).json({ success: true, data: versions });
  }),

  getVersion: asyncHandler(async (req: Request, res: Response) => {
    const version = await FormService.getVersion(req.apiKeyId!, req.params.id, req.params.versionId);
    res.status(200).json({ success: true, data: version });
  }),

  restoreVersion: asyncHandler(async (req: Request, res: Response) => {
    const form = await FormService.restoreVersion(
      req.apiKeyId!,
      req.params.id,
      req.params.versionId
    );
    res.status(201).json({ success: true, data: form });
  }),

  publish: asyncHandler(async (req: Request, res: Response) => {
    const { versionId } = req.body as PublishVersionInput;
    const form = await FormService.publishVersion(req.apiKeyId!, req.params.id, versionId);
    res.status(200).json({ success: true, data: form });
  }),

  unpublish: asyncHandler(async (req: Request, res: Response) => {
    const form = await FormService.unpublish(req.apiKeyId!, req.params.id);
    res.status(200).json({ success: true, data: form });
  }),
};
