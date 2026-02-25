import { DEMO_SLOTS, DEMO_COURSES } from "../data/demo.data.js";

function ymd(d) {
  return d.toISOString().slice(0, 10);
}

export function getProfessorSchedule(req, res) {
  const professorId = Number(req.params.professorId);
  const view = (req.query.view || "week").toLowerCase(); // day | week
  const dateStr = req.query.date || ymd(new Date());

  const base = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(base.getTime())) {
    return res.status(400).json({ ok: false, message: "Invalid date (use YYYY-MM-DD)" });
  }

  let start = new Date(base);
  let end = new Date(base);

  if (view === "day") {
    end.setDate(end.getDate() + 1);
  } else {
    // week starting Monday
    const day = start.getDay(); // 0 Sun .. 6 Sat
    const diffToMon = (day === 0 ? -6 : 1 - day);
    start.setDate(start.getDate() + diffToMon);
    end = new Date(start);
    end.setDate(end.getDate() + 7);
  }

  const slots = DEMO_SLOTS
    .filter(s => s.professor_id === professorId)
    .filter(s => {
      const t = new Date(s.start_time).getTime();
      return t >= start.getTime() && t < end.getTime();
    })
    .map(s => {
      const course = DEMO_COURSES.find(c => c.course_id === s.course_id);
      return {
        ...s,
        course_code: course?.course_code ?? "COURSE",
        booked: s.booked_by != null
      };
    })
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  res.json({
    ok: true,
    view,
    range: { start: start.toISOString(), end: end.toISOString() },
    slots
  });
}