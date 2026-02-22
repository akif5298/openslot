import { Router } from "express";
import authRoutes from "./auth.routes.js";
import coursesRoutes from "./courses.routes.js";
import slotsRoutes from "./slots.routes.js";
import appointmentsRoutes from "./appointments.routes.js";
import scheduleRoutes from "./schedule.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/courses", coursesRoutes);
router.use("/slots", slotsRoutes);
router.use("/appointments", appointmentsRoutes);
router.use("/schedule", scheduleRoutes);

export default router;