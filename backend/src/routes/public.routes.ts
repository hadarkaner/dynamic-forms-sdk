import { Router } from "express";
import { PublicController } from "../controllers/public.controller";
import { validateBody } from "../middlewares/validate.middleware";
import { createSubmissionSchema } from "../models/submission.model";
import { createAnalyticsEventSchema } from "../models/analyticsEvent.model";

// No apiKeyAuth here on purpose: these endpoints back the embeddable client SDK.
// They only ever read/write against forms with isPublished = true, scoped by formId,
// the same way a Typeform/Google Forms link works. The form id is a public identifier,
// not a secret — it never grants access to other forms, listings, or analytics summaries.
const router = Router();

router.get("/forms/:formId", PublicController.getForm);
router.post(
  "/forms/:formId/submissions",
  validateBody(createSubmissionSchema),
  PublicController.createSubmission
);
router.post(
  "/forms/:formId/events",
  validateBody(createAnalyticsEventSchema),
  PublicController.trackEvent
);

export default router;
