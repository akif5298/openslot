-- OpenSlot relational schema (Milestone 03)

CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  department VARCHAR(120) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'professor')),
  office_location VARCHAR(160),
  bio TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  course_id INTEGER PRIMARY KEY,
  course_code VARCHAR(20) NOT NULL,
  course_name VARCHAR(160) NOT NULL,
  term VARCHAR(40) NOT NULL,
  UNIQUE (course_code, term)
);

CREATE TABLE IF NOT EXISTS office_hour_slots (
  slot_id INTEGER PRIMARY KEY,
  professor_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('in_person', 'virtual')),
  location_or_link VARCHAR(300),
  visibility VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
  booked_by INTEGER,
  topic VARCHAR(160) NOT NULL DEFAULT 'Office Hours',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (professor_id) REFERENCES users (user_id),
  FOREIGN KEY (course_id) REFERENCES courses (course_id),
  FOREIGN KEY (booked_by) REFERENCES users (user_id),
    CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS appointments (
  appointment_id INTEGER PRIMARY KEY,
  slot_id INTEGER NOT NULL UNIQUE,
  student_id INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (slot_id) REFERENCES office_hour_slots (slot_id),
  FOREIGN KEY (student_id) REFERENCES users (user_id)
);

CREATE INDEX IF NOT EXISTS idx_slots_professor_time
ON office_hour_slots (professor_id, start_time);

CREATE INDEX IF NOT EXISTS idx_slots_course_time
ON office_hour_slots (course_id, start_time);

CREATE INDEX IF NOT EXISTS idx_appointments_student
ON appointments (student_id);
