import { Router } from "express";
import { getProfessorSchedule } from "../controllers/schedule.controller.js";

const router = Router();

router.get("/professor/:professorId", getProfessorSchedule);

export default router;
