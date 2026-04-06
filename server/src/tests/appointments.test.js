import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

/**
 * Demo state (fresh per file in Vitest):
 *   Slot 1201 – posted, public, unbooked  (prof 103, CS302)
 *   Slot 1202 – posted, public, unbooked  (prof 102, MATH202)
 *   Slot 1301 – posted, public, booked_by=1 → appt 5001 (student 1)
 *   Slot 1302 – posted, public, booked_by=2 → appt 5002 (student 2)
 *   Slot 1307 – PAST slot, booked_by=1    → appt 5003 (student 1)
 *   Appt 5004 – status: cancelled
 *
 * Tests are ordered so that earlier mutations are inputs to later tests.
 */
describe("Appointments API", () => {
  // ── Book Appointment ───────────────────────────────────────────────────────
  describe("POST /api/appointments", () => {
    it("TC-APT-01: books an available public slot successfully", async () => {
      const res = await request(app).post("/api/appointments").send({
        slot_id: 1201,
        student_id: 1,
        notes: "Looking forward to the session."
      });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.appointment.status).toBe("booked");
      expect(res.body.appointment.slot_id).toBe(1201);
      expect(res.body.notifications).toHaveLength(2);
    });

    it("TC-APT-02: returns 409 when the same slot is booked again", async () => {
      // slot 1201 is now booked from TC-APT-01
      const res = await request(app).post("/api/appointments").send({
        slot_id: 1201,
        student_id: 2,
        notes: "Trying to double-book."
      });

      expect(res.status).toBe(409);
      expect(res.body.ok).toBe(false);
      expect(res.body.message).toMatch(/already booked/i);
    });

    it("TC-APT-03: returns 400 when slot_id is missing", async () => {
      const res = await request(app).post("/api/appointments").send({
        student_id: 1
      });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it("TC-APT-04: returns 404 for a non-existent student", async () => {
      const res = await request(app).post("/api/appointments").send({
        slot_id: 1202,
        student_id: 99999
      });

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
    });

    it("TC-APT-05: returns 404 for a non-existent slot", async () => {
      const res = await request(app).post("/api/appointments").send({
        slot_id: 99999,
        student_id: 1
      });

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
    });

    it("TC-APT-06: returns 409 when the slot is not posted (draft)", async () => {
      const res = await request(app).post("/api/appointments").send({
        slot_id: 1304,
        student_id: 1
      });

      expect(res.status).toBe(409);
      expect(res.body.ok).toBe(false);
      expect(res.body.message).toMatch(/not posted/i);
    });
  });

  // ── List My Bookings ───────────────────────────────────────────────────────
  describe("GET /api/appointments/mine/:studentId", () => {
    it("TC-APT-07: returns all bookings for a student", async () => {
      const res = await request(app).get("/api/appointments/mine/1");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.bookings)).toBe(true);
      // student 1 has appts 5001, 5003, 5004 + TC-APT-01 booking
      expect(res.body.bookings.length).toBeGreaterThanOrEqual(3);
    });

    it("TC-APT-08: each booking includes the enriched slot", async () => {
      const res = await request(app).get("/api/appointments/mine/1");
      const booking = res.body.bookings[0];

      expect(booking).toHaveProperty("slot");
      expect(booking.slot).toHaveProperty("professor_name");
      expect(booking.slot).toHaveProperty("course_code");
    });

    it("TC-APT-09: returns 400 for an invalid student id", async () => {
      const res = await request(app).get("/api/appointments/mine/abc");

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it("TC-APT-10: returns empty list for a student with no bookings", async () => {
      const res = await request(app).get("/api/appointments/mine/2");

      expect(res.status).toBe(200);
      // student 2 only has appt 5002 (booked)
      expect(res.body.bookings.length).toBeGreaterThanOrEqual(1);
    });

    it("TC-APT-11: past appointments are auto-computed as completed", async () => {
      const res = await request(app).get("/api/appointments/mine/1");
      // appt 5003 is linked to slot 1307 which is in the past
      const pastAppt = res.body.bookings.find(b => b.slot_id === 1307);

      expect(pastAppt).toBeDefined();
      expect(pastAppt.status).toBe("completed");
    });
  });

  // ── Get Appointment Details ────────────────────────────────────────────────
  describe("GET /api/appointments/:appointmentId", () => {
    it("TC-APT-12: returns details for a valid appointment", async () => {
      const res = await request(app).get("/api/appointments/5001");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.appointment.appointment_id).toBe(5001);
      expect(res.body.slot).toBeDefined();
      expect(res.body.student).toBeDefined();
    });

    it("TC-APT-13: returns the student's name and email in details", async () => {
      const res = await request(app).get("/api/appointments/5001");

      expect(res.body.student.name).toBe("Alice Johnson");
      expect(res.body.student.email).toBe("student@demo.com");
    });

    it("TC-APT-14: returns 404 for a non-existent appointment", async () => {
      const res = await request(app).get("/api/appointments/99999");

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
    });

    it("TC-APT-15: returns 400 for an invalid appointment id", async () => {
      const res = await request(app).get("/api/appointments/abc");

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });

  // ── Cancel Appointment ─────────────────────────────────────────────────────
  describe("PATCH /api/appointments/:appointmentId/cancel", () => {
    it("TC-APT-16: cancels a booked future appointment", async () => {
      // appt 5002, slot 1302 (future, booked by student 2)
      const res = await request(app).patch("/api/appointments/5002/cancel");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.appointment.status).toBe("cancelled");
      expect(res.body.slot.booked_by).toBeNull();
    });

    it("TC-APT-17: returns 409 when cancelling an already-cancelled appointment", async () => {
      // appt 5002 is now cancelled from TC-APT-16
      const res = await request(app).patch("/api/appointments/5002/cancel");

      expect(res.status).toBe(409);
      expect(res.body.ok).toBe(false);
      expect(res.body.message).toMatch(/not in booked state/i);
    });

    it("TC-APT-18: returns 409 when trying to cancel a past appointment", async () => {
      // appt 5003, slot 1307 is in the past
      const res = await request(app).patch("/api/appointments/5003/cancel");

      expect(res.status).toBe(409);
      expect(res.body.ok).toBe(false);
      expect(res.body.message).toMatch(/started/i);
    });

    it("TC-APT-19: returns 404 for a non-existent appointment", async () => {
      const res = await request(app).patch("/api/appointments/99999/cancel");

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
    });
  });

  // ── Reschedule Appointment ─────────────────────────────────────────────────
  describe("PATCH /api/appointments/:appointmentId/reschedule", () => {
    it("TC-APT-20: reschedules a booked appointment to a new available slot", async () => {
      // appt 5001 (student 1, slot 1301 booked) → move to slot 1202 (unbooked)
      const res = await request(app)
        .patch("/api/appointments/5001/reschedule")
        .send({ new_slot_id: 1202 });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.new_slot.slot_id).toBe(1202);
      expect(res.body.old_slot.booked_by).toBeNull();
    });

    it("TC-APT-21: returns 400 when rescheduling to the same slot", async () => {
      // appt 5001 is now on slot 1202 after TC-APT-20
      const res = await request(app)
        .patch("/api/appointments/5001/reschedule")
        .send({ new_slot_id: 1202 });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.message).toMatch(/different slot/i);
    });

    it("TC-APT-22: returns 409 when rescheduling to an already-booked slot", async () => {
      // appt 5001 → try to move to slot 1201 (now booked by student 1 from TC-APT-01)
      const res = await request(app)
        .patch("/api/appointments/5001/reschedule")
        .send({ new_slot_id: 1201 });

      expect(res.status).toBe(409);
      expect(res.body.ok).toBe(false);
      expect(res.body.message).toMatch(/already booked/i);
    });

    it("TC-APT-23: returns 400 when new_slot_id is missing", async () => {
      const res = await request(app)
        .patch("/api/appointments/5001/reschedule")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it("TC-APT-24: returns 404 for a non-existent new slot", async () => {
      const res = await request(app)
        .patch("/api/appointments/5001/reschedule")
        .send({ new_slot_id: 99999 });

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
    });

    it("TC-APT-25: returns 409 when rescheduling a cancelled appointment", async () => {
      // appt 5004 is already cancelled in demo data
      const res = await request(app)
        .patch("/api/appointments/5004/reschedule")
        .send({ new_slot_id: 1204 });

      expect(res.status).toBe(409);
      expect(res.body.ok).toBe(false);
      expect(res.body.message).toMatch(/booked appointments/i);
    });
  });
});
