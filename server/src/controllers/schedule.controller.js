import { listSlots } from "../db/repository.js";

function ymd(value) {
  return value.toISOString().slice(0, 10);
}

export function getProfessorSchedule(req, res) {
  const professorId = Number(req.params.professorId);
  const view = String(req.query.view || "week").toLowerCase();
  const dateStr = String(req.query.date || ymd(new Date()));

  if (req.user.role !== "professor" || req.user.user_id !== professorId) {
    return res.status(403).json({ ok: false, message: "You can only view your own schedule." });
  }

  const base = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(base.getTime())) {
    return res.status(400).json({ ok: false, message: "Invalid date (use YYYY-MM-DD)" });
  }

  let start = new Date(base);
  let end = new Date(base);

  if (view === "day") {
    end.setDate(end.getDate() + 1);
  } else {
    const day = start.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diffToMon);
    end = new Date(start);
    end.setDate(end.getDate() + 7);
  }

  const slots = listSlots({
    professorId,
    includeBooked: true,
    includePrivate: true,
    status: "all"
  }).filter(slot => {
    const time = new Date(slot.start_time).getTime();
    return time >= start.getTime() && time < end.getTime();
  });

  return res.json({
    ok: true,
    view,
    range: { start: start.toISOString(), end: end.toISOString() },
    slots
  });
}
