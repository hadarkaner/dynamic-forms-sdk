import { Router } from "express";
import { FormController } from "../controllers/form.controller";
import { apiKeyAuth } from "../middlewares/apiKeyAuth.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import { createFormSchema, createVersionSchema, publishVersionSchema } from "../models/form.model";
import submissionRoutes from "./submission.routes";
import analyticsEventRoutes from "./analyticsEvent.routes";

const router = Router();

router.use(apiKeyAuth);

router.post("/", validateBody(createFormSchema), FormController.create);
router.get("/", FormController.findAll);
router.get("/:id", FormController.findById);
router.delete("/:id", FormController.delete);

// Versioning: every content change creates a new immutable FormVersion.
// Publishing/unpublishing flips which version (if any) is served publicly.
router.post("/:id/versions", validateBody(createVersionSchema), FormController.createVersion);
router.get("/:id/versions", FormController.listVersions);
router.get("/:id/versions/:versionId", FormController.getVersion);
router.post("/:id/versions/:versionId/restore", FormController.restoreVersion);
router.patch("/:id/publish", validateBody(publishVersionSchema), FormController.publish);
router.patch("/:id/unpublish", FormController.unpublish);

router.use("/:formId/submissions", submissionRoutes);
router.use("/:formId/events", analyticsEventRoutes);

export default router;
