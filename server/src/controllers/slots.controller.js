import {
  cancelSlotAndAppointment,
  createSlot as createSlotRecord,
  findConflictingSlot,
  getCourseById,
  getSlotById as findSlotById,
  listSlots as fetchSlots,
  updateSlotStatus as persistSlotStatus
} from "../db/repository.js";

const SLOT_STATUSES = new Set(["draft", "posted", "cancelled"]);
const SLOT_MODES = new Set(["in_person", "virtual"]);
const SLOT_VISIBILITIES = new Set(["public", "private"]);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseMaybeInt(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

function parseDateTime(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  return {
    value: normalized,
    time: date.getTime()
  };
}

function canViewPrivateSlot(req, slot) {
  const isProfessorOwner = req.user.role === "professor" && slot.professor_id === req.user.user_id;
  const isBookedStudent = req.user.role === "student" && slot.booked_by === req.user.user_id;
  return isProfessorOwner || isBookedStudent;
}

export function listSlots(req, res) {
  const courseId = parseMaybeInt(req.query.courseId);
  const professorId = parseMaybeInt(req.query.professorId);
  const requestedIncludeBooked = String(req.query.includeBooked || "false") === "true";
  const requestedIncludePrivate = String(req.query.includePrivate || "false") === "true";
  const date = typeof req.query.date === "string" ? req.query.date.trim() : "";
  const statusFilter = typeof req.query.status === "string" ? req.query.status.trim().toLowerCase() : "";

  if (courseId != null && courseId <= 0) {
    return res.status(400).json({ ok: false, message: "Invalid courseId filter." });
  }

  if (professorId != null && professorId <= 0) {
    return res.status(400).json({ ok: false, message: "Invalid professorId filter." });
  }

  if (date && !DATE_PATTERN.test(date)) {
    return res.status(400).json({ ok: false, message: "Invalid date filter. Use YYYY-MM-DD." });
  }

  if (statusFilter && statusFilter !== "all" && !SLOT_STATUSES.has(statusFilter)) {
    return res.status(400).json({ ok: false, message: "Invalid status filter." });
  }

  const ownerView = req.user.role === "professor" && professorId === req.user.user_id;
  const includeBooked = ownerView && requestedIncludeBooked;
  const includePrivate = ownerView && requestedIncludePrivate;

  const slots = fetchSlots({
    courseId,
    professorId,
    includeBooked,
    includePrivate,
    date,
    status: statusFilter || ""
  });

  return res.json({ ok: true, slots });
}

export function getSlotById(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ ok: false, message: "Invalid slot id" });
  }

  const slot = findSlotById(id);
  if (!slot) {
    return res.status(404).json({ ok: false, message: "Slot not found" });
  }

  const isVisible = slot.visibility === "public" || canViewPrivateSlot(req, slot);
  if (!isVisible) {
    return res.status(403).json({ ok: false, message: "You do not have access to this slot." });
  }

  return res.json({ ok: true, slot });
}

export function createSlot(req, res) {
  if (req.user.role !== "professor") {
    return res.status(403).json({ ok: false, message: "Only professors can create slots." });
  }

  const payload = req.body || {};
  const professorId = parseMaybeInt(payload.professor_id);
  const courseId = parseMaybeInt(payload.course_id);
  const start = parseDateTime(payload.start_time);
  const end = parseDateTime(payload.end_time);
  const mode = String(payload.mode || "").trim().toLowerCase();
  const locationOrLink = String(payload.location_or_link || "").trim();
  const visibility = String(payload.visibility || "public").trim().toLowerCase();
  const status = String(payload.status || "draft").trim().toLowerCase();
  const topic = String(payload.topic || "Office Hours").trim() || "Office Hours";

  if (!professorId || professorId !== req.user.user_id) {
    return res.status(403).json({ ok: false, message: "Professor id must match the signed-in professor." });
  }

  if (!courseId) {
    return res.status(400).json({ ok: false, message: "Missing course_id" });
  }

  if (!start || !end) {
    return res.status(400).json({ ok: false, message: "Valid start_time and end_time are required." });
  }

  if (start.time >= end.time) {
    return res.status(400).json({ ok: false, message: "End time must be after start time." });
  }

  if (start.time <= Date.now()) {
    return res.status(409).json({ ok: false, message: "Create slots for a future date and time." });
  }

  if (!SLOT_MODES.has(mode)) {
    return res.status(400).json({ ok: false, message: "Invalid meeting mode." });
  }

  if (!SLOT_VISIBILITIES.has(visibility)) {
    return res.status(400).json({ ok: false, message: "Invalid slot visibility." });
  }

  if (!SLOT_STATUSES.has(status)) {
    return res.status(400).json({ ok: false, message: "Invalid slot status." });
  }

  if (!locationOrLink) {
    return res.status(400).json({ ok: false, message: "Location or meeting link is required." });
  }

  if (topic.length > 160) {
    return res.status(400).json({ ok: false, message: "Topic must be 160 characters or fewer." });
  }

  const course = getCourseById(courseId);
  if (!course) {
    return res.status(404).json({ ok: false, message: "Course not found." });
  }

  const conflict = findConflictingSlot({
    professorId,
    startTime: start.value,
    endTime: end.value
  });
  if (conflict) {
    return res.status(409).json({ ok: false, message: "This time overlaps with another existing slot." });
  }

  const slot = createSlotRecord({
    professor_id: professorId,
    course_id: courseId,
    start_time: start.value,
    end_time: end.value,
    mode,
    location_or_link: locationOrLink,
    visibility,
    status,
    topic
  });

  return res.status(201).json({ ok: true, slot });
}

export function updateSlotStatus(req, res) {
  if (req.user.role !== "professor") {
    return res.status(403).json({ ok: false, message: "Only professors can update slots." });
  }

  const id = Number(req.params.id);
  const status = String(req.body?.status || "").toLowerCase();

  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ ok: false, message: "Invalid slot id" });
  }

  const slot = findSlotById(id);
  if (!slot) {
    return res.status(404).json({ ok: false, message: "Slot not found" });
  }

  if (slot.professor_id !== req.user.user_id) {
    return res.status(403).json({ ok: false, message: "You can only manage your own slots." });
  }

  if (!SLOT_STATUSES.has(status)) {
    return res.status(400).json({ ok: false, message: "Invalid status" });
  }

  if (status === "posted" && new Date(slot.start_time).getTime() <= Date.now()) {
    return res.status(409).json({ ok: false, message: "Past slots cannot be posted." });
  }

  const nextSlot =
    status === "cancelled" ? cancelSlotAndAppointment(id) : persistSlotStatus(id, status);

  return res.json({ ok: true, slot: nextSlot });
}
