import {
  DEMO_APPOINTMENTS,
  DEMO_COURSES,
  DEMO_SLOTS,
  DEMO_USERS,
  nextAppointmentId
} from "../data/demo.data.js";

function parsePositiveInt(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.trunc(parsed);
}

function enrichSlot(slot) {
  const professor = DEMO_USERS.find(user => user.user_id === slot.professor_id);
  const course = DEMO_COURSES.find(item => item.course_id === slot.course_id);

  return {
    ...slot,
    professor_name: professor?.name ?? "Professor",
    professor_email: professor?.email ?? "",
    course_code: course?.course_code ?? "COURSE",
    course_name: course?.course_name ?? "Course"
  };
}

function computeAppointmentStatus(appointment) {
  const slot = DEMO_SLOTS.find(item => item.slot_id === appointment.slot_id);
  if (!slot) return appointment.status;

  if (appointment.status !== "booked") return appointment.status;

  const end = new Date(slot.end_time).getTime();
  if (Date.now() > end) return "completed";
  return "booked";
}

export function bookAppointment(req, res) {
  const slotId = parsePositiveInt(req.body?.slot_id);
  const studentId = parsePositiveInt(req.body?.student_id);
  const notes = String(req.body?.notes || "").trim();

  if (!slotId || !studentId) {
    return res.status(400).json({ ok: false, message: "Missing slot_id or student_id" });
  }

  const student = DEMO_USERS.find(user => user.user_id === studentId && user.role === "student");
  if (!student) {
    return res.status(404).json({ ok: false, message: "Student not found" });
  }

  const slot = DEMO_SLOTS.find(item => item.slot_id === slotId);
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

  slot.booked_by = studentId;

  const appointment = {
    appointment_id: nextAppointmentId(),
    slot_id: slot.slot_id,
    student_id: studentId,
    status: "booked",
    notes,
    created_at: new Date().toISOString()
  };

  DEMO_APPOINTMENTS.push(appointment);

  return res.status(201).json({
    ok: true,
    appointment: { ...appointment, status: computeAppointmentStatus(appointment) },
    slot: enrichSlot(slot),
    notifications: [
      { to: "student", message: "Booking confirmed." },
      { to: "professor", message: "A student booked one of your slots." }
    ]
  });
}

export function listMyBookings(req, res) {
  const studentId = parsePositiveInt(req.params.studentId);
  if (!studentId) {
    return res.status(400).json({ ok: false, message: "Invalid student id" });
  }

  const bookings = DEMO_APPOINTMENTS
    .filter(appointment => appointment.student_id === studentId)
    .map(appointment => {
      const slot = DEMO_SLOTS.find(item => item.slot_id === appointment.slot_id);
      return {
        ...appointment,
        status: computeAppointmentStatus(appointment),
        slot: slot ? enrichSlot(slot) : null
      };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return res.json({ ok: true, bookings });
}

export function getAppointmentDetails(req, res) {
  const appointmentId = parsePositiveInt(req.params.appointmentId);
  if (!appointmentId) {
    return res.status(400).json({ ok: false, message: "Invalid appointment id" });
  }

  const appointment = DEMO_APPOINTMENTS.find(item => item.appointment_id === appointmentId);
  if (!appointment) {
    return res.status(404).json({ ok: false, message: "Appointment not found" });
  }

  const slot = DEMO_SLOTS.find(item => item.slot_id === appointment.slot_id);
  if (!slot) {
    return res.status(404).json({ ok: false, message: "Slot not found for this appointment" });
  }

  const student = DEMO_USERS.find(user => user.user_id === appointment.student_id);

  return res.json({
    ok: true,
    appointment: { ...appointment, status: computeAppointmentStatus(appointment) },
    slot: enrichSlot(slot),
    student: student
      ? {
          user_id: student.user_id,
          name: student.name,
          email: student.email
        }
      : null
  });
}

export function cancelAppointment(req, res) {
  const appointmentId = parsePositiveInt(req.params.appointmentId);
  if (!appointmentId) {
    return res.status(400).json({ ok: false, message: "Invalid appointment id" });
  }

  const appointment = DEMO_APPOINTMENTS.find(item => item.appointment_id === appointmentId);
  if (!appointment) {
    return res.status(404).json({ ok: false, message: "Appointment not found" });
  }

  const slot = DEMO_SLOTS.find(item => item.slot_id === appointment.slot_id);
  if (!slot) {
    return res.status(404).json({ ok: false, message: "Slot not found for this appointment" });
  }

  if (Date.now() >= new Date(slot.start_time).getTime()) {
    return res.status(409).json({ ok: false, message: "Cannot cancel after the session has started." });
  }

  if (appointment.status !== "booked") {
    return res.status(409).json({ ok: false, message: "Appointment is not in booked state" });
  }

  appointment.status = "cancelled";
  if (slot.booked_by === appointment.student_id) {
    slot.booked_by = null;
  }

  return res.json({
    ok: true,
    appointment: { ...appointment, status: computeAppointmentStatus(appointment) },
    slot: enrichSlot(slot),
    notifications: [
      { to: "student", message: "Your appointment was cancelled." },
      { to: "professor", message: "An appointment was cancelled." }
    ]
  });
}

export function rescheduleAppointment(req, res) {
  const appointmentId = parsePositiveInt(req.params.appointmentId);
  const newSlotId = parsePositiveInt(req.body?.new_slot_id);

  if (!appointmentId || !newSlotId) {
    return res.status(400).json({ ok: false, message: "Missing appointment id or new_slot_id" });
  }

  const appointment = DEMO_APPOINTMENTS.find(item => item.appointment_id === appointmentId);
  if (!appointment) {
    return res.status(404).json({ ok: false, message: "Appointment not found" });
  }

  if (appointment.status !== "booked") {
    return res.status(409).json({ ok: false, message: "Only booked appointments can be rescheduled." });
  }

  const oldSlot = DEMO_SLOTS.find(item => item.slot_id === appointment.slot_id);
  if (!oldSlot) {
    return res.status(404).json({ ok: false, message: "Current slot not found" });
  }

  if (Date.now() >= new Date(oldSlot.start_time).getTime()) {
    return res.status(409).json({ ok: false, message: "Cannot reschedule after the session has started." });
  }

  const newSlot = DEMO_SLOTS.find(item => item.slot_id === newSlotId);
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

  if (oldSlot.booked_by === appointment.student_id) {
    oldSlot.booked_by = null;
  }

  newSlot.booked_by = appointment.student_id;
  appointment.slot_id = newSlot.slot_id;

  return res.json({
    ok: true,
    appointment: { ...appointment, status: computeAppointmentStatus(appointment) },
    old_slot: enrichSlot(oldSlot),
    new_slot: enrichSlot(newSlot),
    notifications: [
      { to: "student", message: "Reschedule confirmed." },
      { to: "professor", message: "An appointment was rescheduled." }
    ]
  });
}
