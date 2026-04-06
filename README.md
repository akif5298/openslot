# OpenSlot

OpenSlot is a role-based university office-hours scheduling application built for **CP476 Internet Computing (Winter 2026)**.

The Milestone 3 version now includes:
- a multi-page student and professor front-end
- a Node.js + Express backend
- a persistent SQLite relational database
- server-side validation and lightweight token-based authorization
- end-to-end booking, rescheduling, cancellation, slot creation, publishing, and profile update workflows

Team:
- Benjamin Okojie
- Dharmik Patel
- Akif Rahman

Quick links:
- [ER Diagram](ER-DIAGRAM.md)
- [Milestone 02 Database Design](docs/milestone-02/database-design.md)
- [Milestone 03 Testing Summary](docs/milestone-03/testing-summary-report.md)
- [Milestone 03 Demo Outline](docs/milestone-03/final-demo-outline.md)
- [Milestone 03 Presentation One-Pager](docs/milestone-03/presentation-one-pager.md)
- [Milestone 03 Visual Overview](docs/milestone-03/visual-overview.html)
- [Milestone 03 Submission Checklist](docs/milestone-03/submission-checklist.md)

## Milestone 03 Deliverables Mapping

| Required Deliverable | Implemented In Repo |
|---|---|
| Fully functional full-stack application | `client/`, `server/`, `db/schema.sql` |
| CRUD-style workflow for core data objects | student booking/cancel/reschedule + professor create/publish/cancel/profile update |
| Database-backed integration | `server/src/db/database.js`, `server/src/db/repository.js`, `db/schema.sql` |
| Input validation and security hygiene | protected API routes, request validation, role checks, slot ownership checks |
| Testing summary report | `docs/milestone-03/testing-summary-report.md` |
| Deployment/execution instructions | this README |
| Demo video structure support | `docs/milestone-03/final-demo-outline.md` |
| Presentation artifact source | `docs/milestone-03/presentation-one-pager.md` |

## Implemented User Workflow

Student flow:
1. Sign in with a demo student account.
2. Browse posted office-hour slots.
3. Open the confirmation screen and submit booking notes.
4. View appointment details.
5. Reschedule or cancel upcoming bookings.
6. Review upcoming and past sessions from My Bookings.

Professor flow:
1. Sign in with a demo professor account.
2. View booked sessions and open slots from the dashboard.
3. Create new office-hour slots.
4. Publish or cancel draft slots from the schedule page.
5. Review active course cards.
6. Update public profile settings.

## Tech Stack

- Front-end: HTML, CSS, vanilla JavaScript modules
- Back-end: Node.js, Express
- Database: SQLite using the built-in Node `node:sqlite` module

## Deployment / Execution Instructions

These instructions are intended for a clean machine setup.

### Prerequisites

- Node.js 23 or newer
- npm 10 or newer
- A modern browser such as Chrome, Edge, Firefox, or Safari

No separate database server is required because the project uses a local SQLite database file.

### 1. Clone or download the project

Open a terminal and move into the project folder:

```bash
cd openslot
```

### 2. Install server dependencies

```bash
cd server
npm install
```

### 3. Start the application server

```bash
npm run start
```

This starts:
- the Express API
- the static front-end pages
- the SQLite-backed application logic

Application URLs:

```text
Frontend: http://localhost:3001
API:      http://localhost:3001/api
Health:   http://localhost:3001/health
```

### 4. Open the front-end

Open `http://localhost:3001` in your browser.

- Do not open `client/login.html` using a `file:///...` URL in the browser.
- Use the server URL above so the browser loads the app over HTTP.

Demo logins:
- `student@demo.com`
- `student2@demo.com`
- `prof@demo.com`
- `prof2@demo.com`
- `prof3@demo.com`

### 5. Run the automated smoke test

```bash
cd server
npm run verify
```

This verification script:
- starts the API against a temporary SQLite database
- logs in as both student and professor
- verifies auth protection
- creates professor slots
- books, reschedules, and cancels an appointment
- updates a professor profile

## Environment / Configuration Notes

- Default application port: `3001`
- Default database path: `db/openslot.sqlite`
- The SQLite database file is created automatically on first run.
- Demo seed data is inserted automatically when the database is empty.
- No `.env` file is required for the default local setup.

Optional environment variables:

- `PORT`
  Starts the server on a different port.
- `OPENSLOT_DB_PATH`
  Uses a different SQLite database file location.
- `OPENSLOT_RESET_DB=1`
  Deletes the current SQLite database file before startup and recreates it with seed data.

## Database Summary

Core tables:
- `users`
- `courses`
- `office_hour_slots`
- `appointments`

Key relationships:
- each slot belongs to one professor and one course
- an appointment links one student to one slot
- a slot can be unbooked or booked by one student at a time

## Security / Validation Highlights

- All non-login API routes require an auth token.
- Students can only manage their own appointments.
- Professors can only manage their own slots and schedule.
- Server-side validation checks dates, IDs, statuses, visibility, and required fields.
- Slot creation blocks overlapping professor times and past-dated slots.

## Known Limitations

- Authentication is demo-token based and does not include passwords.
- Notifications and calendar sync are simulated in the UI/API responses only.
- The client is served as static HTML pages rather than through a bundled framework.

## Milestone 03 Contribution Summary

- **Benjamin Okojie**: student workflow polish, booking/dashboard UI, demo/presentation support.
- **Dharmik Patel**: persistent backend integration, database setup, API protection, testing workflow.
- **Akif Rahman**: professor workflow UI, settings/course screens, milestone documentation support.
