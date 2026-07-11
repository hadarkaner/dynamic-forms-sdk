import { Router } from "express";
import { AnalyticsEventController } from "../controllers/analyticsEvent.controller";
import { validateBody } from "../middlewares/validate.middleware";
import { createAnalyticsEventSchema } from "../models/analyticsEvent.model";

const router = Router({ mergeParams: true });

router.post("/", validateBody(createAnalyticsEventSchema), AnalyticsEventController.create);
router.get("/", AnalyticsEventController.findAll);
router.get("/summary", AnalyticsEventController.summary);

export default router;
