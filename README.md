# OpenSlot

OpenSlot is a role-based office-hours scheduling system for academic use.
- Professors create availability slots (draft/post/cancel, public/private).
- Students browse open slots, book appointments, and manage bookings.

Course: **CP476 Internet Computing (Winter 2026)**

Team:
- Benjamin Okojie
- Dharmik Patel
- Akif Rahman

## Milestone 02 Deliverables Mapping

| Required Deliverable | Implemented In Repo |
|---|---|
| Working front-end + core screens + primary workflow | `client/*.html`, `client/js/*.js`, `client/css/styles.css` |
| Database package PDF (diagram + SQL) | `docs/milestone-02/database-design-package.pdf` |
| Database design source files | `docs/milestone-02/database-design.md`, `docs/milestone-02/database-design-package.txt`, `db/schema.sql` |
| Back-end runnable setup + route/controller structure | `server/src/app.js`, `server/src/routes/*.js`, `server/src/controllers/*.js` |
| Kanban tracking evidence | `docs/milestone-02/kanban-evidence.md` |
| Activity blog/wiki updates (2+ entries) | `docs/milestone-02/activity-blog.md` |
| Rubric self-audit checklist | `docs/milestone-02/rubric-checklist.md` |
| Updated run instructions + contribution summary | This README |

## Front-End Workflow Implemented

Student flow:
1. Login (`client/login.html`)
2. Browse/filter available slots (`client/student-dashboard.html`)
3. Book slot
4. View bookings (`client/my-bookings.html`)
5. View details (`client/appointment-details.html`)
6. Cancel/reschedule before start time

Professor flow:
1. Login (`client/login.html`)
2. Manage slots (`client/professor-dashboard.html`)
3. Create/edit slots (`client/slot-create.html`)
4. Publish/cancel slots
5. View day/week schedule (`client/professor-schedule.html`)

## Back-End Setup

API root: `http://localhost:3001/api`

Implemented route groups:
- `POST /api/auth/login`
- `GET /api/courses`
- `GET/POST/PATCH /api/slots...`
- `POST/GET/PATCH /api/appointments...`
- `GET /api/schedule/professor/:professorId`

## Run Locally

### 1) Start the server
```bash
cd server
npm install
npm run start
```

### 2) Open the front-end
Open `client/login.html` in your browser.

Demo logins:
- `student@demo.com`
- `student2@demo.com`
- `prof@demo.com`
- `prof2@demo.com`

### 3) Run Milestone 02 verification (optional but recommended)
```bash
./scripts/verify-milestone-02.sh
```
This script validates:
- required Milestone 02 artifacts exist
- JS syntax across client/server
- SQL schema execution + constraints in sqlite
- API smoke flows (auth/courses/slots/booking/reschedule/cancel/schedule)

## Database Design Notes

- SQL schema is in `db/schema.sql`.
- Includes PK/FK constraints, CHECK constraints, UNIQUE constraints, and indexes.
- Relational model covers users, courses, office-hour slots, and appointments.

## Team Contributions (Milestone 02)

- **Benjamin Okojie**: student-facing workflow UI, schedule rendering support.
- **Dharmik Patel**: backend route/controller implementation, database schema design, integration testing.
- **Akif Rahman**: professor dashboard/slot forms, appointment detail UX, documentation support.

## Submission Notes

For Milestone 02 Dropbox submission, include:
- Repository link/commit
- `docs/milestone-02/database-design-package.pdf`
- Any required screenshots of GitHub Projects board/wiki entries if requested by instructor.
