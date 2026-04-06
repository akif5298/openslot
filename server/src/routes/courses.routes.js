import { Router } from "express";
import { listCourses } from "../controllers/courses.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();
router.get("/", requireAuth, listCourses);
export default router;
