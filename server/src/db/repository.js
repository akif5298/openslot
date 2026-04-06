import { getDb } from "./database.js";

const SLOT_SELECT = `
  SELECT
    s.slot_id,
    s.professor_id,
    s.course_id,
    s.start_time,
    s.end_time,
    s.mode,
    s.location_or_link,
    s.visibility,
    s.status,
    s.booked_by,
    s.topic,
    s.created_at,
    s.updated_at,
    professor.name AS professor_name,
    professor.email AS professor_email,
    professor.department AS professor_department,
    professor.office_location AS professor_office_location,
    professor.bio AS professor_bio,
    course.course_code,
    course.course_name,
    course.term AS course_term,
    booked_student.name AS booked_student_name,
    CASE WHEN s.booked_by IS NULL THEN 0 ELSE 1 END AS is_booked
  FROM office_hour_slots s
  JOIN users professor ON professor.user_id = s.professor_id
  JOIN courses course ON course.course_id = s.course_id
  LEFT JOIN users booked_student ON booked_student.user_id = s.booked_by
`;

function toPlainRow(row) {
  return row ? { ...row } : null;
}

function mapSlot(row) {
  return row
    ? {
        ...row,
        is_booked: Boolean(row.is_booked)
      }
    : null;
}

function runInTransaction(callback) {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const result = callback(db);
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function getUserById(userId) {
  return toPlainRow(
    getDb()
      .prepare(
        `
          SELECT
            user_id,
            name,
            email,
            department,
            role,
            office_location,
            bio,
            created_at
          FROM users
          WHERE user_id = :userId
        `
      )
      .get({ userId })
  );
}

export function getUserByEmail(email) {
  return toPlainRow(
    getDb()
      .prepare(
        `
          SELECT
            user_id,
            name,
            email,
            department,
            role,
            office_location,
            bio,
            created_at
          FROM users
          WHERE lower(email) = lower(:email)
        `
      )
      .get({ email })
  );
}

export function getCourseById(courseId) {
  return toPlainRow(
    getDb()
      .prepare(
        `
          SELECT course_id, course_code, course_name, term
          FROM courses
          WHERE course_id = :courseId
        `
      )
      .get({ courseId })
  );
}

export function listCourses() {
  return getDb()
    .prepare(
      `
        SELECT course_id, course_code, course_name, term
        FROM courses
        ORDER BY course_code, course_name
      `
    )
    .all()
    .map(toPlainRow);
}

export function updateUserProfile(userId, updates) {
  getDb()
    .prepare(
      `
        UPDATE users
        SET
          name = :name,
          email = :email,
          office_location = :office_location,
          bio = :bio
        WHERE user_id = :userId
      `
    )
    .run({
      userId,
      name: updates.name,
      email: updates.email,
      office_location: updates.office_location || null,
      bio: updates.bio || null
    });

  return getUserById(userId);
}

export function listSlots(filters = {}) {
  const conditions = [];
  const params = {};

  if (filters.courseId != null) {
    conditions.push("s.course_id = :courseId");
    params.courseId = filters.courseId;
  }

  if (filters.professorId != null) {
    conditions.push("s.professor_id = :professorId");
    params.professorId = filters.professorId;
  }

  if (filters.date) {
    conditions.push("substr(s.start_time, 1, 10) = :slotDate");
    params.slotDate = filters.date;
  }

  if (filters.status && filters.status !== "all") {
    conditions.push("s.status = :status");
    params.status = filters.status;
  } else {
    conditions.push("s.status != 'cancelled'");
  }

  if (!filters.includePrivate) {
    conditions.push("s.visibility = 'public'");
  }

  if (!filters.includeBooked) {
    conditions.push("s.booked_by IS NULL");
    conditions.push("s.status = 'posted'");
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  return getDb()
    .prepare(`${SLOT_SELECT} ${whereClause} ORDER BY s.start_time ASC`)
    .all(params)
    .map(mapSlot);
}

export function getSlotById(slotId) {
  return mapSlot(
    getDb()
      .prepare(`${SLOT_SELECT} WHERE s.slot_id = :slotId`)
      .get({ slotId })
  );
}

export function findConflictingSlot({ professorId, startTime, endTime, excludeSlotId = null }) {
  return toPlainRow(
    getDb()
      .prepare(
        `
          SELECT slot_id, start_time, end_time
          FROM office_hour_slots
          WHERE professor_id = :professorId
            AND status != 'cancelled'
            AND (:excludeSlotId IS NULL OR slot_id != :excludeSlotId)
            AND NOT (end_time <= :startTime OR start_time >= :endTime)
          LIMIT 1
        `
      )
      .get({
        professorId,
        startTime,
        endTime,
        excludeSlotId
      })
  );
}

export function createSlot(payload) {
  const result = getDb()
    .prepare(
      `
        INSERT INTO office_hour_slots (
          professor_id,
          course_id,
          start_time,
          end_time,
          mode,
          location_or_link,
          visibility,
          status,
          topic
        )
        VALUES (
          :professor_id,
          :course_id,
          :start_time,
          :end_time,
          :mode,
          :location_or_link,
          :visibility,
          :status,
          :topic
        )
      `
    )
    .run({
      professor_id: payload.professor_id,
      course_id: payload.course_id,
      start_time: payload.start_time,
      end_time: payload.end_time,
      mode: payload.mode,
      location_or_link: payload.location_or_link,
      visibility: payload.visibility,
      status: payload.status,
      topic: payload.topic
    });

  return getSlotById(Number(result.lastInsertRowid));
}

export function updateSlotStatus(slotId, status) {
  getDb()
    .prepare(
      `
        UPDATE office_hour_slots
        SET
          status = :status,
          updated_at = CURRENT_TIMESTAMP
        WHERE slot_id = :slotId
      `
    )
    .run({ slotId, status });

  return getSlotById(slotId);
}

export function clearSlotBooking(slotId) {
  getDb()
    .prepare(
      `
        UPDATE office_hour_slots
        SET
          booked_by = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE slot_id = :slotId
      `
    )
    .run({ slotId });
}

export function setSlotBooking(slotId, studentId) {
  getDb()
    .prepare(
      `
        UPDATE office_hour_slots
        SET
          booked_by = :studentId,
          updated_at = CURRENT_TIMESTAMP
        WHERE slot_id = :slotId
      `
    )
    .run({ slotId, studentId });
}

export function listAppointmentsByStudent(studentId) {
  return getDb()
    .prepare(
      `
        SELECT appointment_id, slot_id, student_id, status, notes, created_at
        FROM appointments
        WHERE student_id = :studentId
        ORDER BY datetime(created_at) DESC, appointment_id DESC
      `
    )
    .all({ studentId })
    .map(toPlainRow);
}

export function getAppointmentById(appointmentId) {
  return toPlainRow(
    getDb()
      .prepare(
        `
          SELECT
            a.appointment_id,
            a.slot_id,
            a.student_id,
            a.status,
            a.notes,
            a.created_at,
            student.name AS student_name,
            student.email AS student_email
          FROM appointments a
          JOIN users student ON student.user_id = a.student_id
          WHERE a.appointment_id = :appointmentId
        `
      )
      .get({ appointmentId })
  );
}

export function getActiveAppointmentBySlotId(slotId) {
  return toPlainRow(
    getDb()
      .prepare(
        `
          SELECT appointment_id, slot_id, student_id, status, notes, created_at
          FROM appointments
          WHERE slot_id = :slotId AND status = 'booked'
          LIMIT 1
        `
      )
      .get({ slotId })
  );
}

export function createAppointment({ slotId, studentId, notes }) {
  const db = getDb();
  const result = db
    .prepare(
      `
        INSERT INTO appointments (slot_id, student_id, status, notes)
        VALUES (:slotId, :studentId, 'booked', :notes)
      `
    )
    .run({
      slotId,
      studentId,
      notes: notes || null
    });

  return getAppointmentById(Number(result.lastInsertRowid));
}

export function updateAppointmentStatus(appointmentId, status) {
  getDb()
    .prepare(
      `
        UPDATE appointments
        SET status = :status
        WHERE appointment_id = :appointmentId
      `
    )
    .run({ appointmentId, status });

  return getAppointmentById(appointmentId);
}

export function moveAppointmentToSlot(appointmentId, newSlotId) {
  getDb()
    .prepare(
      `
        UPDATE appointments
        SET slot_id = :newSlotId
        WHERE appointment_id = :appointmentId
      `
    )
    .run({ appointmentId, newSlotId });

  return getAppointmentById(appointmentId);
}

export function bookAppointment({ slotId, studentId, notes }) {
  return runInTransaction(() => {
    setSlotBooking(slotId, studentId);
    return createAppointment({ slotId, studentId, notes });
  });
}

export function cancelAppointment({ appointmentId, slotId }) {
  return runInTransaction(() => {
    clearSlotBooking(slotId);
    return updateAppointmentStatus(appointmentId, "cancelled");
  });
}

export function cancelSlotAndAppointment(slotId) {
  return runInTransaction(() => {
    const appointment = getActiveAppointmentBySlotId(slotId);
    if (appointment) {
      updateAppointmentStatus(appointment.appointment_id, "cancelled");
    }
    clearSlotBooking(slotId);
    return updateSlotStatus(slotId, "cancelled");
  });
}

export function rescheduleAppointment({ appointmentId, oldSlotId, newSlotId, studentId }) {
  return runInTransaction(() => {
    clearSlotBooking(oldSlotId);
    setSlotBooking(newSlotId, studentId);
    return moveAppointmentToSlot(appointmentId, newSlotId);
  });
}
