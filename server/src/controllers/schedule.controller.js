import { DEMO_APPOINTMENTS, DEMO_COURSES, DEMO_SLOTS, DEMO_USERS } from "../data/demo.data.js";

function parsePositiveInt(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.trunc(parsed);
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(date) {
  const d = startOfDay(date);
  const day = d.getDay();
  // Monday as start of week.
  const shift = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + shift);
  return d;
}

function endOfWeek(date) {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function enrich(slot) {
  const course = DEMO_COURSES.find(item => item.course_id === slot.course_id);
  const professor = DEMO_USERS.find(item => item.user_id === slot.professor_id);
  const appointment = DEMO_APPOINTMENTS.find(item => item.slot_id === slot.slot_id && item.status === "booked");

  return {
    ...slot,
    course_code: course?.course_code ?? "COURSE",
    course_name: course?.course_name ?? "Course",
    professor_name: professor?.name ?? "Professor",
    appointment: appointment ?? null,
    is_booked: slot.booked_by != null
  };
}

export function getProfessorSchedule(req, res) {
  const professorId = parsePositiveInt(req.params.professorId);
  const view = String(req.query.view || "day").toLowerCase() === "week" ? "week" : "day";
  const dateSeed = req.query.date ? new Date(String(req.query.date)) : new Date();

  if (!professorId) {
    return res.status(400).json({ ok: false, message: "Invalid professor id" });
  }

  const professor = DEMO_USERS.find(item => item.user_id === professorId && item.role === "professor");
  if (!professor) {
    return res.status(404).json({ ok: false, message: "Professor not found" });
  }

  const validDate = Number.isNaN(dateSeed.getTime()) ? new Date() : dateSeed;
  const rangeStart = view === "week" ? startOfWeek(validDate) : startOfDay(validDate);
  const rangeEnd = view === "week" ? endOfWeek(validDate) : endOfDay(validDate);

  const slots = DEMO_SLOTS.filter(slot => {
    if (slot.professor_id !== professorId) return false;
    const start = new Date(slot.start_time);
    return start >= rangeStart && start <= rangeEnd;
  })
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .map(enrich);

  const summary = {
    total: slots.length,
    booked: slots.filter(slot => slot.is_booked).length,
    open: slots.filter(slot => slot.status === "posted" && !slot.is_booked).length,
    draft: slots.filter(slot => slot.status === "draft").length,
    cancelled: slots.filter(slot => slot.status === "cancelled").length
  };

  return res.json({
    ok: true,
    professor: {
      user_id: professor.user_id,
      name: professor.name,
      email: professor.email
    },
    view,
    range: {
      start: rangeStart.toISOString(),
      end: rangeEnd.toISOString()
    },
    summary,
    slots
  });
}
