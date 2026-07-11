import { Router } from "express";
import { ApiKeyController } from "../controllers/apiKey.controller";
import { validateBody } from "../middlewares/validate.middleware";
import { createApiKeySchema } from "../models/apiKey.model";

const router = Router();

// NOTE: In production these endpoints should be locked down behind an admin-only
// authentication mechanism (e.g. a separate admin login). They are left open here
// for seminar/demo purposes so a first API key can be issued.
router.post("/", validateBody(createApiKeySchema), ApiKeyController.create);
router.get("/", ApiKeyController.findAll);
router.patch("/:id/revoke", ApiKeyController.revoke);

export default router;
