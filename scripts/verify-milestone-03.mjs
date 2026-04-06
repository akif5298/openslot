import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tempDbPath = path.join(os.tmpdir(), `openslot-verify-${Date.now()}.sqlite`);

process.env.OPENSLOT_DB_PATH = tempDbPath;
process.env.OPENSLOT_RESET_DB = "1";

function createLocalSlot(dayOffset, hour, minute = 0, durationMinutes = 30) {
  const start = new Date();
  start.setSeconds(0, 0);
  start.setDate(start.getDate() + dayOffset);
  start.setHours(hour, minute, 0, 0);

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + durationMinutes);

  const format = value => {
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const dd = String(value.getDate()).padStart(2, "0");
    const hh = String(value.getHours()).padStart(2, "0");
    const min = String(value.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  return {
    start: format(start),
    end: format(end)
  };
}

async function request(baseUrl, method, route, { token, body } = {}) {
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body == null ? undefined : JSON.stringify(body)
  });

  const payload = await response.json().catch(() => ({}));
  return {
    status: response.status,
    ok: response.ok,
    payload
  };
}

function cleanupDatabaseArtifacts(dbPath) {
  for (const suffix of ["", "-shm", "-wal"]) {
    const file = `${dbPath}${suffix}`;
    if (fs.existsSync(file)) {
      fs.rmSync(file, { force: true });
    }
  }
}

let server;

try {
  const { startServer } = await import("../server/src/app.js");
  server = await startServer(0);
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 3001;
  const apiBase = `http://127.0.0.1:${port}/api`;

  console.log("1. Logging in with demo accounts");
  const studentLogin = await request(apiBase, "POST", "/auth/login", {
    body: { email: "student@demo.com" }
  });
  const professorLogin = await request(apiBase, "POST", "/auth/login", {
    body: { email: "prof@demo.com" }
  });

  assert.equal(studentLogin.status, 200);
  assert.equal(professorLogin.status, 200);

  const studentToken = studentLogin.payload.token;
  const professorToken = professorLogin.payload.token;
  const student = studentLogin.payload.user;
  const professor = professorLogin.payload.user;

  console.log("2. Verifying protected professor action is blocked for students");
  const studentCreateAttempt = await request(apiBase, "POST", "/slots", {
    token: studentToken,
    body: {
      professor_id: professor.user_id,
      course_id: 301,
      ...createLocalSlot(7, 10, 0),
      mode: "in_person",
      location_or_link: "Office 402",
      visibility: "public",
      status: "posted",
      topic: "Unauthorized test"
    }
  });
  assert.equal(studentCreateAttempt.status, 403);

  console.log("3. Creating professor slots");
  const slotOneTimes = createLocalSlot(7, 10, 0);
  const slotTwoTimes = createLocalSlot(7, 11, 0);

  const createdSlotOne = await request(apiBase, "POST", "/slots", {
    token: professorToken,
    body: {
      professor_id: professor.user_id,
      course_id: 301,
      start_time: slotOneTimes.start,
      end_time: slotOneTimes.end,
      mode: "in_person",
      location_or_link: "Office 402",
      visibility: "public",
      status: "posted",
      topic: "Milestone 3 Smoke Test"
    }
  });
  const createdSlotTwo = await request(apiBase, "POST", "/slots", {
    token: professorToken,
    body: {
      professor_id: professor.user_id,
      course_id: 301,
      start_time: slotTwoTimes.start,
      end_time: slotTwoTimes.end,
      mode: "virtual",
      location_or_link: "https://meet.google.com/test-openslot",
      visibility: "public",
      status: "posted",
      topic: "Milestone 3 Reschedule Target"
    }
  });

  assert.equal(createdSlotOne.status, 201);
  assert.equal(createdSlotTwo.status, 201);

  const slotOneId = createdSlotOne.payload.slot.slot_id;
  const slotTwoId = createdSlotTwo.payload.slot.slot_id;

  console.log("4. Verifying overlapping slot validation");
  const overlappingSlot = await request(apiBase, "POST", "/slots", {
    token: professorToken,
    body: {
      professor_id: professor.user_id,
      course_id: 301,
      start_time: createLocalSlot(7, 10, 15).start,
      end_time: createLocalSlot(7, 10, 45).end,
      mode: "in_person",
      location_or_link: "Office 402",
      visibility: "public",
      status: "posted",
      topic: "Overlap Validation"
    }
  });
  assert.equal(overlappingSlot.status, 409);

  console.log("5. Verifying browse-slots listing for students");
  const browseSlots = await request(apiBase, "GET", "/slots", {
    token: studentToken
  });
  assert.equal(browseSlots.status, 200);
  assert.ok(browseSlots.payload.slots.some(slot => slot.slot_id === slotOneId));

  console.log("6. Booking an appointment as a student");
  const booking = await request(apiBase, "POST", "/appointments", {
    token: studentToken,
    body: {
      slot_id: slotOneId,
      student_id: student.user_id,
      notes: "Please review our milestone integration."
    }
  });

  assert.equal(booking.status, 201);
  assert.equal(booking.payload.appointment.student_id, student.user_id);
  const appointmentId = booking.payload.appointment.appointment_id;

  console.log("7. Fetching My Bookings and appointment details");
  const bookings = await request(apiBase, "GET", `/appointments/mine/${student.user_id}`, {
    token: studentToken
  });
  const details = await request(apiBase, "GET", `/appointments/${appointmentId}`, {
    token: studentToken
  });

  assert.equal(bookings.status, 200);
  assert.equal(details.status, 200);
  assert.ok(bookings.payload.bookings.some(item => item.appointment_id === appointmentId));
  assert.equal(details.payload.slot.slot_id, slotOneId);

  console.log("8. Rescheduling to a second slot");
  const reschedule = await request(apiBase, "PATCH", `/appointments/${appointmentId}/reschedule`, {
    token: studentToken,
    body: { new_slot_id: slotTwoId }
  });
  assert.equal(reschedule.status, 200);
  assert.equal(reschedule.payload.new_slot.slot_id, slotTwoId);

  console.log("9. Cancelling the rescheduled appointment");
  const cancel = await request(apiBase, "PATCH", `/appointments/${appointmentId}/cancel`, {
    token: studentToken,
    body: {}
  });
  assert.equal(cancel.status, 200);
  assert.equal(cancel.payload.appointment.status, "cancelled");

  console.log("10. Updating professor profile");
  const profileUpdate = await request(apiBase, "PATCH", `/auth/profile/${professor.user_id}`, {
    token: professorToken,
    body: {
      name: professor.name,
      email: professor.email,
      office_location: "Updated Office 402B",
      bio: "Updated through the milestone 3 smoke test."
    }
  });
  assert.equal(profileUpdate.status, 200);
  assert.equal(profileUpdate.payload.user.office_location, "Updated Office 402B");

  console.log("11. Verifying schedule endpoint");
  const schedule = await request(
    apiBase,
    "GET",
    `/schedule/professor/${professor.user_id}?view=week&date=${slotOneTimes.start.slice(0, 10)}`,
    { token: professorToken }
  );
  assert.equal(schedule.status, 200);
  assert.ok(schedule.payload.slots.length >= 2);

  console.log("Milestone 3 smoke test passed.");
} finally {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
  cleanupDatabaseArtifacts(tempDbPath);
}
