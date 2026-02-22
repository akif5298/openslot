import { DEMO_COURSES } from "../data/demo.data.js";

export function listCourses(req, res) {
  const courses = [...DEMO_COURSES].sort((a, b) => a.course_code.localeCompare(b.course_code));
  return res.json({ ok: true, courses });
}
