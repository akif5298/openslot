import { listCourses as fetchCourses } from "../db/repository.js";

export function listCourses(req, res) {
  return res.json({ ok: true, courses: fetchCourses() });
}
