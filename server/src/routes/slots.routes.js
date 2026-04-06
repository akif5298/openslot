import { Router } from "express";
import {
  listSlots,
  getSlotById,
  createSlot,
  updateSlotStatus
} from "../controllers/slots.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", listSlots);
router.get("/:id", getSlotById);
router.post("/", createSlot);
router.patch("/:id/status", updateSlotStatus);

export default router;
