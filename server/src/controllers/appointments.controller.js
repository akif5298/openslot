import {
  bookAppointment as persistBooking,
  cancelAppointment as persistCancellation,
  getAppointmentById,
  getSlotById,
  listAppointmentsByStudent,
  rescheduleAppointment as persistReschedule
} from "../db/repository.js";

function parsePositiveInt(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.trunc(parsed);
}

function computeAppointmentStatus(appointment, slot) {
  if (!appointment || !slot) return appointment?.status || "booked";
  if (appointment.status !== "booked") return appointment.status;
  const endTime = new Date(slot.end_time).getTime();
  return Date.now() > endTime ? "completed" : "booked";
}

function withComputedStatus(appointment, slot) {
  return {
    ...appointment,
    status: computeAppointmentStatus(appointment, slot)
  };
}

function normalizeNotes(value) {
  return String(value || "").trim();
}

function ensureStudentAccess(req, studentId) {
  return req.user.role === "student" && req.user.user_id === studentId;
}

export function bookAppointment(req, res) {
  if (req.user.role !== "student") {
    return res.status(403).json({ ok: false, message: "Only students can book appointments." });
  }

  const slotId = parsePositiveInt(req.body?.slot_id);
  const studentId = parsePositiveInt(req.body?.student_id);
  const notes = normalizeNotes(req.body?.notes);

  if (!slotId || !studentId) {
    return res.status(400).json({ ok: false, message: "Missing slot_id or student_id" });
  }

  if (!ensureStudentAccess(req, studentId)) {
    return res.status(403).json({ ok: false, message: "You can only book appointments for yourself." });
  }

  if (notes.length > 600) {
    return res.status(400).json({ ok: false, message: "Notes must be 600 characters or fewer." });
  }

  const slot = getSlotById(slotId);
  if (!slot) {
    return res.status(404).json({ ok: false, message: "Slot not found" });
  }

  if (slot.status !== "posted") {
    return res.status(409).json({ ok: false, message: "Slot is not available (not posted)" });
  }

  if (slot.visibility !== "public") {
    return res.status(409).json({ ok: false, message: "Private slots cannot be booked directly." });
  }

  if (slot.booked_by != null) {
    return res.status(409).json({ ok: false, message: "Slot already booked" });
  }

  if (Date.now() >= new Date(slot.start_time).getTime()) {
    return res.status(409).json({ ok: false, message: "Cannot book a slot that has already started." });
  }

  const appointment = persistBooking({
    slotId,
    studentId,
    notes
  });
  const nextSlot = getSlotById(slotId);

  return res.status(201).json({
    ok: true,
    appointment: withComputedStatus(appointment, nextSlot),
    slot: nextSlot,
    notifications: [
      { to: "student", message: "Booking confirmed." },
      { to: "professor", message: "A student booked one of your slots." }
    ]
  });
}

export function listMyBookings(req, res) {
  if (req.user.role !== "student") {
    return res.status(403).json({ ok: false, message: "Only students can view student bookings." });
  }

  const studentId = parsePositiveInt(req.params.studentId);
  if (!studentId) {
    return res.status(400).json({ ok: false, message: "Invalid student id" });
  }

  if (!ensureStudentAccess(req, studentId)) {
    return res.status(403).json({ ok: false, message: "You can only view your own bookings." });
  }

  const bookings = listAppointmentsByStudent(studentId).map(appointment => {
    const slot = getSlotById(appointment.slot_id);
    return {
      ...withComputedStatus(appointment, slot),
      slot
    };
  });

  return res.json({ ok: true, bookings });
}

export function getAppointmentDetails(req, res) {
  const appointmentId = parsePositiveInt(req.params.appointmentId);
  if (!appointmentId) {
    return res.status(400).json({ ok: false, message: "Invalid appointment id" });
  }

  const appointment = getAppointmentById(appointmentId);
  if (!appointment) {
    return res.status(404).json({ ok: false, message: "Appointment not found" });
  }

  const slot = getSlotById(appointment.slot_id);
  if (!slot) {
    return res.status(404).json({ ok: false, message: "Slot not found for this appointment" });
  }

  const isStudentOwner = req.user.role === "student" && req.user.user_id === appointment.student_id;
  const isProfessorOwner = req.user.role === "professor" && req.user.user_id === slot.professor_id;
  if (!isStudentOwner && !isProfessorOwner) {
    return res.status(403).json({ ok: false, message: "You do not have access to this appointment." });
  }

  return res.json({
    ok: true,
    appointment: withComputedStatus(appointment, slot),
    slot,
    student: {
      user_id: appointment.student_id,
      name: appointment.student_name,
      email: appointment.student_email
    }
  });
}

export function cancelAppointment(req, res) {
  if (req.user.role !== "student") {
    return res.status(403).json({ ok: false, message: "Only students can cancel appointments." });
  }

  const appointmentId = parsePositiveInt(req.params.appointmentId);
  if (!appointmentId) {
    return res.status(400).json({ ok: false, message: "Invalid appointment id" });
  }

  const appointment = getAppointmentById(appointmentId);
  if (!appointment) {
    return res.status(404).json({ ok: false, message: "Appointment not found" });
  }

  if (!ensureStudentAccess(req, appointment.student_id)) {
    return res.status(403).json({ ok: false, message: "You can only cancel your own appointments." });
  }

  const slot = getSlotById(appointment.slot_id);
  if (!slot) {
    return res.status(404).json({ ok: false, message: "Slot not found for this appointment" });
  }

  if (Date.now() >= new Date(slot.start_time).getTime()) {
    return res.status(409).json({ ok: false, message: "Cannot cancel after the session has started." });
  }

  if (appointment.status !== "booked") {
    return res.status(409).json({ ok: false, message: "Appointment is not in booked state" });
  }

  const updatedAppointment = persistCancellation({
    appointmentId,
    slotId: slot.slot_id
  });
  const updatedSlot = getSlotById(slot.slot_id);

  return res.json({
    ok: true,
    appointment: withComputedStatus(updatedAppointment, updatedSlot),
    slot: updatedSlot,
    notifications: [
      { to: "student", message: "Your appointment was cancelled." },
      { to: "professor", message: "An appointment was cancelled." }
    ]
  });
}

export function rescheduleAppointment(req, res) {
  if (req.user.role !== "student") {
    return res.status(403).json({ ok: false, message: "Only students can reschedule appointments." });
  }

  const appointmentId = parsePositiveInt(req.params.appointmentId);
  const newSlotId = parsePositiveInt(req.body?.new_slot_id);

  if (!appointmentId || !newSlotId) {
    return res.status(400).json({ ok: false, message: "Missing appointment id or new_slot_id" });
  }

  const appointment = getAppointmentById(appointmentId);
  if (!appointment) {
    return res.status(404).json({ ok: false, message: "Appointment not found" });
  }

  if (!ensureStudentAccess(req, appointment.student_id)) {
    return res.status(403).json({ ok: false, message: "You can only reschedule your own appointments." });
  }

  if (appointment.status !== "booked") {
    return res.status(409).json({ ok: false, message: "Only booked appointments can be rescheduled." });
  }

  const oldSlot = getSlotById(appointment.slot_id);
  if (!oldSlot) {
    return res.status(404).json({ ok: false, message: "Current slot not found" });
  }

  if (Date.now() >= new Date(oldSlot.start_time).getTime()) {
    return res.status(409).json({ ok: false, message: "Cannot reschedule after the session has started." });
  }

  const newSlot = getSlotById(newSlotId);
  if (!newSlot) {
    return res.status(404).json({ ok: false, message: "New slot not found" });
  }

  if (newSlot.slot_id === oldSlot.slot_id) {
    return res.status(400).json({ ok: false, message: "Choose a different slot for rescheduling" });
  }

  if (newSlot.status !== "posted") {
    return res.status(409).json({ ok: false, message: "New slot is not posted." });
  }

  if (newSlot.visibility !== "public") {
    return res.status(409).json({ ok: false, message: "New slot is private and cannot be booked." });
  }

  if (newSlot.booked_by != null) {
    return res.status(409).json({ ok: false, message: "New slot is already booked." });
  }

  if (Date.now() >= new Date(newSlot.start_time).getTime()) {
    return res.status(409).json({ ok: false, message: "New slot has already started." });
  }

  const updatedAppointment = persistReschedule({
    appointmentId,
    oldSlotId: oldSlot.slot_id,
    newSlotId: newSlot.slot_id,
    studentId: appointment.student_id
  });

  return res.json({
    ok: true,
    appointment: withComputedStatus(updatedAppointment, getSlotById(newSlot.slot_id)),
    old_slot: getSlotById(oldSlot.slot_id),
    new_slot: getSlotById(newSlot.slot_id),
    notifications: [
      { to: "student", message: "Reschedule confirmed." },
      { to: "professor", message: "An appointment was rescheduled." }
    ]
  });
}
