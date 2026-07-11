import { Router } from "express";
import { SubmissionController } from "../controllers/submission.controller";
import { validateBody } from "../middlewares/validate.middleware";
import { createSubmissionSchema } from "../models/submission.model";

const router = Router({ mergeParams: true });

router.post("/", validateBody(createSubmissionSchema), SubmissionController.create);
router.get("/", SubmissionController.findAll);
router.get("/:id", SubmissionController.findById);
router.delete("/:id", SubmissionController.delete);

export default router;
