import { DEMO_COURSES, DEMO_SLOTS, DEMO_USERS } from "../data/demo.data.js";

function enrichSlot(slot) {
  const prof = DEMO_USERS.find(u => u.user_id === slot.professor_id);
  const course = DEMO_COURSES.find(c => c.course_id === slot.course_id);
  return {
    ...slot,
    professor_name: prof?.name ?? "Professor",
    course_code: course?.course_code ?? "COURSE",
    course_name: course?.course_name ?? "Course"
  };
}

export function listSlots(req, res) {
  const { courseId, date, professorId, includeBooked } = req.query;

  let results = DEMO_SLOTS.map(enrichSlot);

  // hide cancelled by default
  results = results.filter(s => s.status !== "cancelled");

  if (courseId) results = results.filter(s => String(s.course_id) === String(courseId));
  if (professorId) results = results.filter(s => String(s.professor_id) === String(professorId));
  if (date) results = results.filter(s => String(s.start_time).startsWith(date)); // YYYY-MM-DD

  // default: show only open slots
  if (!includeBooked || includeBooked === "false") {
    results = results.filter(s => s.booked_by == null && s.status === "posted");
  }

  results.sort((a, b) => a.start_time.localeCompare(b.start_time));
  res.json({ ok: true, slots: results });
}

export function getSlotById(req, res) {
  const id = Number(req.params.id);
  const slot = DEMO_SLOTS.find(s => s.slot_id === id);
  if (!slot) return res.status(404).json({ ok: false, message: "Slot not found" });
  res.json({ ok: true, slot: enrichSlot(slot) });
}

export function createSlot(req, res) {
  const payload = req.body || {};
  const required = ["professor_id", "course_id", "start_time", "end_time", "mode", "location_or_link"];

  for (const key of required) {
    if (!payload[key]) return res.status(400).json({ ok: false, message: `Missing ${key}` });
  }

  const nextId = DEMO_SLOTS.length ? Math.max(...DEMO_SLOTS.map(s => s.slot_id)) + 1 : 100;
  const newSlot = {
    slot_id: nextId,
    professor_id: Number(payload.professor_id),
    course_id: Number(payload.course_id),
    start_time: payload.start_time,
    end_time: payload.end_time,
    mode: payload.mode,
    location_or_link: payload.location_or_link,
    visibility: payload.visibility || "public",
    status: payload.status || "draft",
    booked_by: null
  };

  DEMO_SLOTS.push(newSlot);
  res.status(201).json({ ok: true, slot: enrichSlot(newSlot) });
}

export function updateSlotStatus(req, res) {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  const slot = DEMO_SLOTS.find(s => s.slot_id === id);
  if (!slot) return res.status(404).json({ ok: false, message: "Slot not found" });

  const allowed = new Set(["draft", "posted", "cancelled"]);
  if (!allowed.has(status)) return res.status(400).json({ ok: false, message: "Invalid status" });

  slot.status = status;
  res.json({ ok: true, slot: enrichSlot(slot) });
}