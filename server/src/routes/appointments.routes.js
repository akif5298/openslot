import { Router } from "express";
import {
  bookAppointment,
  listMyBookings,
  cancelAppointment,
  getAppointmentDetails,
  rescheduleAppointment
} from "../controllers/appointments.controller.js";

const router = Router();

router.post("/", bookAppointment);
router.get("/mine/:studentId", listMyBookings);

router.get("/:appointmentId", getAppointmentDetails);
router.patch("/:appointmentId/cancel", cancelAppointment);
router.patch("/:appointmentId/reschedule", rescheduleAppointment);

export default router;