import { Router } from "express";
import {
  createSlot,
  getSlotById,
  listSlots,
  updateSlot,
  updateSlotStatus
} from "../controllers/slots.controller.js";

const router = Router();

router.get("/", listSlots);
router.get("/:id", getSlotById);
router.post("/", createSlot);
router.patch("/:id", updateSlot);
router.patch("/:id/status", updateSlotStatus);

export default router;
