import { DEMO_COURSES } from "../data/demo.data.js";

export function listCourses(req, res) {
  res.json({ ok: true, courses: DEMO_COURSES });
}