import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import {
  DEMO_APPOINTMENTS,
  DEMO_COURSES,
  DEMO_SLOTS,
  DEMO_USERS
} from "../data/demo.data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const DEFAULT_DB_PATH = path.join(PROJECT_ROOT, "db", "openslot.sqlite");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "db", "schema.sql");

let databaseInstance;

function databasePath() {
  return process.env.OPENSLOT_DB_PATH || DEFAULT_DB_PATH;
}

function seedUsers(db) {
  const statement = db.prepare(`
    INSERT INTO users (user_id, name, email, department, role, office_location, bio)
    VALUES (:user_id, :name, :email, :department, :role, :office_location, :bio)
  `);

  for (const user of DEMO_USERS) {
    statement.run({
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      department: user.department || "General Studies",
      role: user.role,
      office_location: user.office_location || null,
      bio: user.bio || null
    });
  }
}

function seedCourses(db) {
  const statement = db.prepare(`
    INSERT INTO courses (course_id, course_code, course_name, term)
    VALUES (:course_id, :course_code, :course_name, :term)
  `);

  for (const course of DEMO_COURSES) {
    statement.run(course);
  }
}

function seedSlots(db) {
  const statement = db.prepare(`
    INSERT INTO office_hour_slots (
      slot_id,
      professor_id,
      course_id,
      start_time,
      end_time,
      mode,
      location_or_link,
      visibility,
      status,
      booked_by,
      topic
    )
    VALUES (
      :slot_id,
      :professor_id,
      :course_id,
      :start_time,
      :end_time,
      :mode,
      :location_or_link,
      :visibility,
      :status,
      :booked_by,
      :topic
    )
  `);

  for (const slot of DEMO_SLOTS) {
    statement.run({
      ...slot,
      topic: slot.topic || "Office Hours"
    });
  }
}

function seedAppointments(db) {
  const statement = db.prepare(`
    INSERT INTO appointments (appointment_id, slot_id, student_id, status, notes, created_at)
    VALUES (:appointment_id, :slot_id, :student_id, :status, :notes, :created_at)
  `);

  for (const appointment of DEMO_APPOINTMENTS) {
    statement.run(appointment);
  }
}

function seedDatabase(db) {
  const userCount = Number(db.prepare("SELECT COUNT(*) AS count FROM users").get().count || 0);
  if (userCount > 0) return;

  db.exec("BEGIN");
  try {
    seedUsers(db);
    seedCourses(db);
    seedSlots(db);
    seedAppointments(db);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function initializeDatabase() {
  if (databaseInstance) return databaseInstance;

  const dbPath = databasePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  if (process.env.OPENSLOT_RESET_DB === "1" && fs.existsSync(dbPath)) {
    fs.rmSync(dbPath, { force: true });
  }

  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(fs.readFileSync(SCHEMA_PATH, "utf8"));
  seedDatabase(db);

  databaseInstance = db;
  return databaseInstance;
}

export function getDb() {
  return initializeDatabase();
}

export function closeDatabase() {
  if (!databaseInstance) return;
  databaseInstance.close();
  databaseInstance = undefined;
}

export function getDatabaseMeta() {
  return {
    path: databasePath()
  };
}
