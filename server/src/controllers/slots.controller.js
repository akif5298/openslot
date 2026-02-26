import { DEMO_APPOINTMENTS, DEMO_COURSES, DEMO_SLOTS, DEMO_USERS } from "../data/demo.data.js";

function enrichSlot(slot) {
  const professor = DEMO_USERS.find(user => user.user_id === slot.professor_id);
  const course = DEMO_COURSES.find(item => item.course_id === slot.course_id);
  const bookedStudent = DEMO_USERS.find(user => user.user_id === slot.booked_by);

  return {
    ...slot,
    professor_name: professor?.name ?? "Professor",
    professor_email: professor?.email ?? "",
    professor_department: professor?.department ?? "",
    course_code: course?.course_code ?? "COURSE",
    course_name: course?.course_name ?? "Course",
    course_term: course?.term ?? "",
    booked_student_name: bookedStudent?.name ?? null,
    is_booked: slot.booked_by != null
  };
}

function parseMaybeInt(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

function unbookIfCancelled(slot) {
  if (slot.booked_by == null) return;
  const appointment = DEMO_APPOINTMENTS.find(item => item.slot_id === slot.slot_id && item.status === "booked");
  if (appointment) appointment.status = "cancelled";
  slot.booked_by = null;
}

export function listSlots(req, res) {
  const courseId = parseMaybeInt(req.query.courseId);
  const professorId = parseMaybeInt(req.query.professorId);
  const includeBooked = String(req.query.includeBooked || "false") === "true";
  const includePrivate = String(req.query.includePrivate || "false") === "true";
  const date = typeof req.query.date === "string" ? req.query.date : "";
  const statusFilter = typeof req.query.status === "string" ? req.query.status : "";

  let slots = DEMO_SLOTS.map(enrichSlot);

  if (courseId != null) slots = slots.filter(slot => slot.course_id === courseId);
  if (professorId != null) slots = slots.filter(slot => slot.professor_id === professorId);
  if (date) slots = slots.filter(slot => String(slot.start_time).startsWith(date));

  if (statusFilter && statusFilter !== "all") {
    slots = slots.filter(slot => slot.status === statusFilter);
  } else {
    slots = slots.filter(slot => slot.status !== "cancelled");
  }

  if (!includePrivate) {
    slots = slots.filter(slot => slot.visibility !== "private");
  }

  if (!includeBooked) {
    slots = slots.filter(slot => slot.booked_by == null && slot.status === "posted");
  }

  slots.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  return res.json({ ok: true, slots });
}

export function getSlotById(req, res) {
  const id = Number(req.params.id);
  const slot = DEMO_SLOTS.find(item => item.slot_id === id);
  if (!slot) {
    return res.status(404).json({ ok: false, message: "Slot not found" });
  }

  return res.json({ ok: true, slot: enrichSlot(slot) });
}

export function createSlot(req, res) {
  const payload = req.body || {};
  const required = ["professor_id", "course_id", "start_time", "end_time", "mode", "location_or_link"];

  for (const key of required) {
    if (!payload[key]) {
      return res.status(400).json({ ok: false, message: `Missing ${key}` });
    }
  }

  const nextId = DEMO_SLOTS.length ? Math.max(...DEMO_SLOTS.map(slot => slot.slot_id)) + 1 : 100;

  const slot = {
    slot_id: nextId,
    professor_id: Number(payload.professor_id),
    course_id: Number(payload.course_id),
    start_time: String(payload.start_time),
    end_time: String(payload.end_time),
    mode: payload.mode,
    location_or_link: payload.location_or_link,
    visibility: payload.visibility || "public",
    status: payload.status || "draft",
    booked_by: null,
    topic: payload.topic || "Office Hours"
  };

  DEMO_SLOTS.push(slot);
  return res.status(201).json({ ok: true, slot: enrichSlot(slot) });
}

export function updateSlotStatus(req, res) {
  const id = Number(req.params.id);
  const status = String(req.body?.status || "").toLowerCase();

  const slot = DEMO_SLOTS.find(item => item.slot_id === id);
  if (!slot) {
    return res.status(404).json({ ok: false, message: "Slot not found" });
  }

  const allowedStatuses = new Set(["draft", "posted", "cancelled"]);
  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ ok: false, message: "Invalid status" });
  }

  slot.status = status;
  if (status === "cancelled") {
    unbookIfCancelled(slot);
  }

  return res.json({ ok: true, slot: enrichSlot(slot) });
}
