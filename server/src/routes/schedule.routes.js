import { Router } from "express";
import { getProfessorSchedule } from "../controllers/schedule.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();
router.use(requireAuth);
router.get("/professor/:professorId", getProfessorSchedule);

export default router;
