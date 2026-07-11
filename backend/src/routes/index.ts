import { Router } from "express";
import formRoutes from "./form.routes";
import formSlotRoutes from "./formSlot.routes";
import apiKeyRoutes from "./apiKey.routes";
import publicRoutes from "./public.routes";

const router = Router();

router.use("/forms", formRoutes);
router.use("/form-slots", formSlotRoutes);
router.use("/api-keys", apiKeyRoutes);
router.use("/public", publicRoutes);

export default router;
