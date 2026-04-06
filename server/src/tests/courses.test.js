import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("Courses API", () => {
  describe("GET /api/courses", () => {
    it("TC-CRS-01: returns ok: true with an array of courses", async () => {
      const res = await request(app).get("/api/courses");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.courses)).toBe(true);
    });

    it("TC-CRS-02: returns all 5 demo courses", async () => {
      const res = await request(app).get("/api/courses");

      expect(res.body.courses).toHaveLength(5);
    });

    it("TC-CRS-03: each course has required fields", async () => {
      const res = await request(app).get("/api/courses");
      const course = res.body.courses[0];

      expect(course).toHaveProperty("course_id");
      expect(course).toHaveProperty("course_code");
      expect(course).toHaveProperty("course_name");
      expect(course).toHaveProperty("term");
    });

    it("TC-CRS-04: includes expected course codes", async () => {
      const res = await request(app).get("/api/courses");
      const codes = res.body.courses.map(c => c.course_code);

      expect(codes).toContain("CS302");
      expect(codes).toContain("AI101");
      expect(codes).toContain("MATH202");
    });
  });
});
