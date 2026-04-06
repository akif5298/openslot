import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("Auth API", () => {
  // ── Login ──────────────────────────────────────────────────────────────────
  describe("POST /api/auth/login", () => {
    it("TC-AUTH-01: logs in a valid student account", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "student@demo.com" });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.user.role).toBe("student");
      expect(res.body.user.email).toBe("student@demo.com");
      expect(res.body.token).toBe("demo-token-1");
    });

    it("TC-AUTH-02: logs in a valid professor account", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "prof@demo.com" });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.user.role).toBe("professor");
      expect(res.body.token).toBe("demo-token-101");
    });

    it("TC-AUTH-03: rejects an unknown email with 401", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nobody@example.com" });

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    });

    it("TC-AUTH-04: rejects a missing email with 401", async () => {
      const res = await request(app).post("/api/auth/login").send({});

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    });

    it("TC-AUTH-05: email matching is case-insensitive", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "STUDENT@DEMO.COM" });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  // ── Logout ─────────────────────────────────────────────────────────────────
  describe("POST /api/auth/logout", () => {
    it("TC-AUTH-06: always returns ok: true", async () => {
      const res = await request(app).post("/api/auth/logout");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  // ── Update Profile ─────────────────────────────────────────────────────────
  describe("PATCH /api/auth/profile/:userId", () => {
    it("TC-AUTH-07: updates an existing user profile", async () => {
      const res = await request(app)
        .patch("/api/auth/profile/101")
        .send({ name: "Prof. Robert Smith Updated", bio: "Updated bio." });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.user.name).toBe("Prof. Robert Smith Updated");
      expect(res.body.user.bio).toBe("Updated bio.");
    });

    it("TC-AUTH-08: returns 404 for a non-existent user", async () => {
      const res = await request(app)
        .patch("/api/auth/profile/99999")
        .send({ name: "Ghost" });

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
    });

    it("TC-AUTH-09: returns 400 for an invalid user id", async () => {
      const res = await request(app)
        .patch("/api/auth/profile/abc")
        .send({ name: "Test" });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it("TC-AUTH-10: returns 400 when name is empty string", async () => {
      const res = await request(app)
        .patch("/api/auth/profile/101")
        .send({ name: "   " });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it("TC-AUTH-11: returns 409 when email is already taken by another user", async () => {
      const res = await request(app)
        .patch("/api/auth/profile/101")
        .send({ email: "student@demo.com" });

      expect(res.status).toBe(409);
      expect(res.body.ok).toBe(false);
    });
  });
});
