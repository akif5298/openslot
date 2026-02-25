import { Router } from "express";
import {
  listSlots,
  getSlotById,
  createSlot,
  updateSlotStatus
} from "../controllers/slots.controller.js";

const router = Router();

router.get("/", listSlots); // query: courseId, date, professorId, includeBooked
router.get("/:id", getSlotById);
router.post("/", createSlot);
router.patch("/:id/status", updateSlotStatus);

export default router;