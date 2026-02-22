# OpenSlot Milestone 02 - Database Design Package

## 1. Scope
This database design supports the Milestone 02 workflow:
- role-based users (students and professors)
- professor-created office hour slots
- student bookings tied to exactly one slot
- appointment lifecycle states (booked/cancelled/completed)

## 2. ER / Relational Diagram
```mermaid
erDiagram
    USERS ||--o{ OFFICE_HOUR_SLOTS : "creates (professor_id)"
    COURSES ||--o{ OFFICE_HOUR_SLOTS : "categorizes (course_id)"
    USERS ||--o{ OFFICE_HOUR_SLOTS : "books optional (booked_by)"
    USERS ||--o{ APPOINTMENTS : "owns bookings (student_id)"
    OFFICE_HOUR_SLOTS ||--o| APPOINTMENTS : "is booked by"

    USERS {
      int user_id PK
      string name
      string email UNIQUE
      string role
      datetime created_at
    }

    COURSES {
      int course_id PK
      string course_code
      string course_name
      string term
    }

    OFFICE_HOUR_SLOTS {
      int slot_id PK
      int professor_id FK
      int course_id FK
      datetime start_time
      datetime end_time
      string mode
      string location_or_link
      string visibility
      string status
      int booked_by FK NULL
      string notes
      datetime created_at
      datetime updated_at
    }

    APPOINTMENTS {
      int appointment_id PK
      int slot_id FK UNIQUE
      int student_id FK
      string status
      string notes
      datetime created_at
    }
```

## 3. SQL CREATE TABLE Statements
The authoritative SQL script is:
- `db/schema.sql`

It includes:
- primary keys on all core entities
- foreign key constraints across user/course/slot/appointment relations
- domain constraints using CHECK clauses (role, mode, visibility, status)
- uniqueness constraints (`users.email`, `appointments.slot_id`, `courses(course_code, term)`)
- performance indexes for schedule and bookings queries

## 4. Normalization Notes
- **1NF**: all fields are atomic; no repeating groups in a row.
- **2NF**: all non-key attributes depend on whole primary keys.
- **3NF**: non-key attributes do not depend on other non-key attributes.
- `appointments` separated from `office_hour_slots` avoids duplicating student booking metadata and supports appointment status tracking cleanly.
