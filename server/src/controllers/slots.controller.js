import { DEMO_APPOINTMENTS, DEMO_COURSES, DEMO_SLOTS, DEMO_USERS, nextSlotId } from "../data/demo.data.js";

const SLOT_STATUSES = new Set(["draft", "posted", "cancelled"]);
const SLOT_VISIBILITY = new Set(["public", "private"]);
const SLOT_MODES = new Set(["in_person", "virtual"]);

function enrichSlot(slot) {
  const professor = DEMO_USERS.find(user => user.user_id === slot.professor_id);
  const course = DEMO_COURSES.find(item => item.course_id === slot.course_id);

  return {
    ...slot,
    professor_name: professor?.name ?? "Professor",
    professor_email: professor?.email ?? "",
    course_code: course?.course_code ?? "COURSE",
    course_name: course?.course_name ?? "Course",
    is_booked: slot.booked_by != null
  };
}

function normalizeDateTimeInput(value) {
  if (!value) return null;
  if (typeof value !== "string") return null;

  // Accept datetime-local style and normalize to seconds precision.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return `${value}:00`;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  const hh = String(parsed.getHours()).padStart(2, "0");
  const min = String(parsed.getMinutes()).padStart(2, "0");
  const sec = String(parsed.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${sec}`;
}

function parsePositiveInt(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.trunc(parsed);
}

function updateLinkedAppointmentIfCancelled(slot) {
  if (slot.booked_by == null) return;
  const appointment = DEMO_APPOINTMENTS.find(
    item => item.slot_id === slot.slot_id && item.status === "booked"
  );
  if (appointment) {
    appointment.status = "cancelled";
  }
  slot.booked_by = null;
}

export function listSlots(req, res) {
  const courseId = parsePositiveInt(req.query.courseId);
  const professorId = parsePositiveInt(req.query.professorId);
  const date = typeof req.query.date === "string" ? req.query.date : "";
  const includeBooked = req.query.includeBooked === "true";
  const includePrivate = req.query.includePrivate === "true";
  const statusFilter = typeof req.query.status === "string" && req.query.status.trim() !== ""
    ? req.query.status.trim()
    : null;

  let slots = [...DEMO_SLOTS];

  if (courseId) slots = slots.filter(slot => slot.course_id === courseId);
  if (professorId) slots = slots.filter(slot => slot.professor_id === professorId);

  if (date) {
    slots = slots.filter(slot => String(slot.start_time).startsWith(date));
  }

  if (statusFilter && statusFilter !== "all") {
    slots = slots.filter(slot => slot.status === statusFilter);
  } else if (!professorId && !includePrivate) {
    // Student browse defaults to public posted slots.
    slots = slots.filter(slot => slot.status === "posted");
  }

  if (!includePrivate) {
    slots = slots.filter(slot => slot.visibility === "public");
  }

  if (!includeBooked) {
    slots = slots.filter(slot => slot.booked_by == null);
  }

  slots.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  return res.json({ ok: true, slots: slots.map(enrichSlot) });
}

export function getSlotById(req, res) {
  const id = parsePositiveInt(req.params.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: "Invalid slot id" });
  }

  const slot = DEMO_SLOTS.find(item => item.slot_id === id);
  if (!slot) {
    return res.status(404).json({ ok: false, message: "Slot not found" });
  }

  const booking = DEMO_APPOINTMENTS.find(item => item.slot_id === id && item.status === "booked");

  return res.json({
    ok: true,
    slot: enrichSlot(slot),
    booking: booking ?? null
  });
}

export function createSlot(req, res) {
  const professorId = parsePositiveInt(req.body?.professor_id);
  const courseId = parsePositiveInt(req.body?.course_id);
  const startTime = normalizeDateTimeInput(req.body?.start_time);
  const endTime = normalizeDateTimeInput(req.body?.end_time);
  const mode = String(req.body?.mode || "in_person");
  const visibility = String(req.body?.visibility || "public");
  const status = String(req.body?.status || "draft");
  const locationOrLink = String(req.body?.location_or_link || "").trim();
  const notes = String(req.body?.notes || "").trim();

  if (!professorId || !courseId || !startTime || !endTime) {
    return res
      .status(400)
      .json({ ok: false, message: "professor_id, course_id, start_time, and end_time are required" });
  }

  if (!SLOT_MODES.has(mode)) {
    return res.status(400).json({ ok: false, message: "mode must be in_person or virtual" });
  }

  if (!SLOT_VISIBILITY.has(visibility)) {
    return res.status(400).json({ ok: false, message: "visibility must be public or private" });
  }

  if (!SLOT_STATUSES.has(status)) {
    return res.status(400).json({ ok: false, message: "status must be draft, posted, or cancelled" });
  }

  const professor = DEMO_USERS.find(user => user.user_id === professorId && user.role === "professor");
  if (!professor) {
    return res.status(404).json({ ok: false, message: "Professor not found" });
  }

  const course = DEMO_COURSES.find(item => item.course_id === courseId);
  if (!course) {
    return res.status(404).json({ ok: false, message: "Course not found" });
  }

  const startMillis = new Date(startTime).getTime();
  const endMillis = new Date(endTime).getTime();
  if (!Number.isFinite(startMillis) || !Number.isFinite(endMillis) || startMillis >= endMillis) {
    return res.status(400).json({ ok: false, message: "start_time must be before end_time" });
  }

  const slot = {
    slot_id: nextSlotId(),
    professor_id: professorId,
    course_id: courseId,
    start_time: startTime,
    end_time: endTime,
    mode,
    location_or_link: locationOrLink,
    visibility,
    status,
    notes,
    booked_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  DEMO_SLOTS.push(slot);

  return res.status(201).json({ ok: true, slot: enrichSlot(slot) });
}

export function updateSlot(req, res) {
  const slotId = parsePositiveInt(req.params.id);
  if (!slotId) {
    return res.status(400).json({ ok: false, message: "Invalid slot id" });
  }

  const slot = DEMO_SLOTS.find(item => item.slot_id === slotId);
  if (!slot) {
    return res.status(404).json({ ok: false, message: "Slot not found" });
  }

  const nextStart = req.body?.start_time ? normalizeDateTimeInput(req.body.start_time) : slot.start_time;
  const nextEnd = req.body?.end_time ? normalizeDateTimeInput(req.body.end_time) : slot.end_time;

  if (!nextStart || !nextEnd) {
    return res.status(400).json({ ok: false, message: "Invalid start_time or end_time" });
  }

  if (new Date(nextStart).getTime() >= new Date(nextEnd).getTime()) {
    return res.status(400).json({ ok: false, message: "start_time must be before end_time" });
  }

  if (slot.booked_by != null && (nextStart !== slot.start_time || nextEnd !== slot.end_time)) {
    return res
      .status(409)
      .json({ ok: false, message: "Cannot change times for a slot that already has a booking" });
  }

  if (req.body?.course_id != null) {
    const courseId = parsePositiveInt(req.body.course_id);
    const exists = DEMO_COURSES.some(course => course.course_id === courseId);
    if (!courseId || !exists) {
      return res.status(400).json({ ok: false, message: "Invalid course_id" });
    }
    slot.course_id = courseId;
  }

  if (req.body?.mode != null) {
    const mode = String(req.body.mode);
    if (!SLOT_MODES.has(mode)) {
      return res.status(400).json({ ok: false, message: "mode must be in_person or virtual" });
    }
    slot.mode = mode;
  }

  if (req.body?.visibility != null) {
    const visibility = String(req.body.visibility);
    if (!SLOT_VISIBILITY.has(visibility)) {
      return res.status(400).json({ ok: false, message: "visibility must be public or private" });
    }
    slot.visibility = visibility;
  }

  if (req.body?.status != null) {
    const status = String(req.body.status);
    if (!SLOT_STATUSES.has(status)) {
      return res.status(400).json({ ok: false, message: "status must be draft, posted, or cancelled" });
    }
    slot.status = status;
    if (status === "cancelled") {
      updateLinkedAppointmentIfCancelled(slot);
    }
  }

  if (req.body?.location_or_link != null) {
    slot.location_or_link = String(req.body.location_or_link).trim();
  }

  if (req.body?.notes != null) {
    slot.notes = String(req.body.notes).trim();
  }

  slot.start_time = nextStart;
  slot.end_time = nextEnd;
  slot.updated_at = new Date().toISOString();

  return res.json({ ok: true, slot: enrichSlot(slot) });
}

export function updateSlotStatus(req, res) {
  const slotId = parsePositiveInt(req.params.id);
  const nextStatus = String(req.body?.status || "").trim();

  if (!slotId) {
    return res.status(400).json({ ok: false, message: "Invalid slot id" });
  }

  if (!SLOT_STATUSES.has(nextStatus)) {
    return res.status(400).json({ ok: false, message: "status must be draft, posted, or cancelled" });
  }

  const slot = DEMO_SLOTS.find(item => item.slot_id === slotId);
  if (!slot) {
    return res.status(404).json({ ok: false, message: "Slot not found" });
  }

  slot.status = nextStatus;
  slot.updated_at = new Date().toISOString();

  if (nextStatus === "cancelled") {
    updateLinkedAppointmentIfCancelled(slot);
  }

  return res.json({ ok: true, slot: enrichSlot(slot) });
}
