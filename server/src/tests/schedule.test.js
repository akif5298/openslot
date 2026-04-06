import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("Schedule API", () => {
  describe("GET /api/schedule/professor/:professorId", () => {
    it("TC-SCH-01: returns ok: true with slots array for a valid professor", async () => {
      const today = new Date().toISOString().slice(0, 10);
      const res = await request(app).get(`/api/schedule/professor/101?date=${today}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.slots)).toBe(true);
    });

    it("TC-SCH-02: week view returns slots within the 7-day window", async () => {
      const today = new Date().toISOString().slice(0, 10);
      const res = await request(app)
        .get(`/api/schedule/professor/101?view=week&date=${today}`);

      expect(res.status).toBe(200);
      expect(res.body.view).toBe("week");
      expect(res.body.range).toHaveProperty("start");
      expect(res.body.range).toHaveProperty("end");

      const rangeStart = new Date(res.body.range.start).getTime();
      const rangeEnd = new Date(res.body.range.end).getTime();

      for (const slot of res.body.slots) {
        const t = new Date(slot.start_time).getTime();
        expect(t).toBeGreaterThanOrEqual(rangeStart);
        expect(t).toBeLessThan(rangeEnd);
      }
    });

    it("TC-SCH-03: day view returns only slots for the specified day", async () => {
      const today = new Date().toISOString().slice(0, 10);
      const res = await request(app)
        .get(`/api/schedule/professor/101?view=day&date=${today}`);

      expect(res.status).toBe(200);
      expect(res.body.view).toBe("day");
    });

    it("TC-SCH-04: slots include course_code and booked flag", async () => {
      const today = new Date().toISOString().slice(0, 10);
      const res = await request(app)
        .get(`/api/schedule/professor/101?view=week&date=${today}`);

      if (res.body.slots.length > 0) {
        const slot = res.body.slots[0];
        expect(slot).toHaveProperty("course_code");
        expect(slot).toHaveProperty("booked");
      }
    });

    it("TC-SCH-05: only returns slots belonging to the requested professor", async () => {
      const today = new Date().toISOString().slice(0, 10);
      const res = await request(app)
        .get(`/api/schedule/professor/103?view=week&date=${today}`);

      expect(res.status).toBe(200);
      for (const slot of res.body.slots) {
        expect(slot.professor_id).toBe(103);
      }
    });

    it("TC-SCH-06: returns 400 for an invalid date format", async () => {
      const res = await request(app)
        .get("/api/schedule/professor/101?date=not-a-date");

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.message).toMatch(/invalid date/i);
    });

    it("TC-SCH-07: returns empty slots array for a professor with no slots in range", async () => {
      const res = await request(app)
        .get("/api/schedule/professor/999?view=week&date=2020-01-01");

      expect(res.status).toBe(200);
      expect(res.body.slots).toHaveLength(0);
    });
  });
});
