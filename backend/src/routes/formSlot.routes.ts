import { Router } from "express";
import { FormSlotController } from "../controllers/formSlot.controller";
import { apiKeyAuth } from "../middlewares/apiKeyAuth.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import { createFormSlotSchema, updateFormSlotSchema } from "../models/formSlot.model";

const router = Router();

router.use(apiKeyAuth);

router.post("/", validateBody(createFormSlotSchema), FormSlotController.create);
router.get("/", FormSlotController.findAll);
router.patch("/:id", validateBody(updateFormSlotSchema), FormSlotController.assign);
router.delete("/:id", FormSlotController.delete);

export default router;
