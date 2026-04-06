import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("Slots API", () => {
  // ── List Slots ─────────────────────────────────────────────────────────────
  describe("GET /api/slots", () => {
    it("TC-SLT-01: returns ok: true with a slots array", async () => {
      const res = await request(app).get("/api/slots");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.slots)).toBe(true);
    });

    it("TC-SLT-02: default response only includes public, posted, unbooked slots", async () => {
      const res = await request(app).get("/api/slots");

      for (const slot of res.body.slots) {
        expect(slot.status).toBe("posted");
        expect(slot.visibility).not.toBe("private");
        expect(slot.booked_by).toBeNull();
      }
    });

    it("TC-SLT-03: includeBooked=true returns booked slots as well", async () => {
      const res = await request(app).get("/api/slots?includeBooked=true");
      const hasBooked = res.body.slots.some(s => s.booked_by !== null);

      expect(hasBooked).toBe(true);
    });

    it("TC-SLT-04: filters slots by courseId", async () => {
      const res = await request(app).get("/api/slots?courseId=304&includeBooked=true");

      expect(res.status).toBe(200);
      for (const slot of res.body.slots) {
        expect(slot.course_id).toBe(304);
      }
    });

    it("TC-SLT-05: filters slots by professorId", async () => {
      const res = await request(app).get("/api/slots?professorId=103&includeBooked=true");

      expect(res.status).toBe(200);
      for (const slot of res.body.slots) {
        expect(slot.professor_id).toBe(103);
      }
    });

    it("TC-SLT-06: status=draft only returns draft slots", async () => {
      const res = await request(app).get("/api/slots?status=draft&professorId=101&includeBooked=true");

      expect(res.status).toBe(200);
      expect(res.body.slots.length).toBeGreaterThan(0);
      for (const slot of res.body.slots) {
        expect(slot.status).toBe("draft");
      }
    });

    it("TC-SLT-07: enriched slots include professor_name and course_code", async () => {
      const res = await request(app).get("/api/slots?includeBooked=true");
      const slot = res.body.slots[0];

      expect(slot).toHaveProperty("professor_name");
      expect(slot).toHaveProperty("course_code");
      expect(slot).toHaveProperty("is_booked");
    });

    it("TC-SLT-08: slots are sorted by start_time ascending", async () => {
      const res = await request(app).get("/api/slots?includeBooked=true");
      const times = res.body.slots.map(s => new Date(s.start_time).getTime());

      for (let i = 1; i < times.length; i++) {
        expect(times[i]).toBeGreaterThanOrEqual(times[i - 1]);
      }
    });
  });

  // ── Get Slot By ID ─────────────────────────────────────────────────────────
  describe("GET /api/slots/:id", () => {
    it("TC-SLT-09: returns a single slot by valid id", async () => {
      const res = await request(app).get("/api/slots/1201");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.slot.slot_id).toBe(1201);
    });

    it("TC-SLT-10: returns 404 for a non-existent slot id", async () => {
      const res = await request(app).get("/api/slots/99999");

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
    });

    it("TC-SLT-11: returned slot includes enriched fields", async () => {
      const res = await request(app).get("/api/slots/1202");
      const slot = res.body.slot;

      expect(slot).toHaveProperty("professor_name");
      expect(slot).toHaveProperty("professor_email");
      expect(slot).toHaveProperty("course_name");
      expect(slot).toHaveProperty("is_booked");
    });
  });

  // ── Create Slot ────────────────────────────────────────────────────────────
  describe("POST /api/slots", () => {
    const validSlot = {
      professor_id: 101,
      course_id: 302,
      start_time: "2026-12-01T10:00",
      end_time: "2026-12-01T10:30",
      mode: "in_person",
      location_or_link: "Office 402",
      topic: "Test Slot",
      visibility: "public",
      status: "posted"
    };

    it("TC-SLT-12: creates a new slot with all required fields", async () => {
      const res = await request(app).post("/api/slots").send(validSlot);

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.slot.professor_id).toBe(101);
      expect(res.body.slot.topic).toBe("Test Slot");
    });

    it("TC-SLT-13: new slot defaults to draft status when not specified", async () => {
      const { status, ...withoutStatus } = validSlot;
      const res = await request(app).post("/api/slots").send(withoutStatus);

      expect(res.status).toBe(201);
      expect(res.body.slot.status).toBe("draft");
    });

    it("TC-SLT-14: returns 400 when professor_id is missing", async () => {
      const { professor_id, ...missing } = validSlot;
      const res = await request(app).post("/api/slots").send(missing);

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it("TC-SLT-15: returns 400 when start_time is missing", async () => {
      const { start_time, ...missing } = validSlot;
      const res = await request(app).post("/api/slots").send(missing);

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it("TC-SLT-16: returns 400 when location_or_link is missing", async () => {
      const { location_or_link, ...missing } = validSlot;
      const res = await request(app).post("/api/slots").send(missing);

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });

  // ── Update Slot Status ─────────────────────────────────────────────────────
  describe("PATCH /api/slots/:id/status", () => {
    it("TC-SLT-17: updates a draft slot to posted", async () => {
      // slot 1304 is draft by default in demo data
      const res = await request(app)
        .patch("/api/slots/1304/status")
        .send({ status: "posted" });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.slot.status).toBe("posted");
    });

    it("TC-SLT-18: updates a slot to cancelled", async () => {
      const res = await request(app)
        .patch("/api/slots/1203/status")
        .send({ status: "cancelled" });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.slot.status).toBe("cancelled");
    });

    it("TC-SLT-19: cancelling a booked slot cascades to clear booked_by", async () => {
      // slot 1301 is booked_by student 1
      const res = await request(app)
        .patch("/api/slots/1301/status")
        .send({ status: "cancelled" });

      expect(res.status).toBe(200);
      expect(res.body.slot.booked_by).toBeNull();
    });

    it("TC-SLT-20: returns 400 for an invalid status value", async () => {
      const res = await request(app)
        .patch("/api/slots/1201/status")
        .send({ status: "deleted" });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it("TC-SLT-21: returns 404 for a non-existent slot", async () => {
      const res = await request(app)
        .patch("/api/slots/99999/status")
        .send({ status: "posted" });

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
    });
  });
});
