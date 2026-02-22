# Milestone 02 Kanban Evidence

This file mirrors the active task movement used in GitHub Projects for Milestone 02.

## Column Definitions
- **Backlog**: scoped but not started
- **In Progress**: currently being implemented
- **Review/Test**: implemented, pending verification
- **Done**: completed and verified

## Recent Task Movement (Since Milestone 01)

| Task | Owner | Movement | Status Date | Notes |
|---|---|---|---|---|
| Student slot browsing UI | Benjamin | Backlog -> In Progress -> Review/Test -> Done | 2026-02-21 | Course/date filtering working |
| Appointment booking API | Dharmik | Backlog -> In Progress -> Review/Test -> Done | 2026-02-22 | Booking state + conflict checks |
| Professor slot create/edit UI | Akif | Backlog -> In Progress -> Review/Test -> Done | 2026-02-22 | Draft/post/cancel flows |
| Database schema draft | Dharmik | Backlog -> In Progress -> Review/Test -> Done | 2026-02-22 | PK/FK/CHECK/INDEX complete |
| Professor schedule day/week view | Benjamin | Backlog -> In Progress -> Review/Test -> Done | 2026-02-22 | Open vs booked visually distinct |
| Appointment detail page | Akif | Backlog -> In Progress -> Done | 2026-02-22 | Mode/location/status shown |
| README and docs package | Team | Backlog -> In Progress -> Done | 2026-02-22 | Submission guidance updated |

## Current Ownership Snapshot
- **Benjamin Okojie**: student UI flows, schedule visualization
- **Dharmik Patel**: backend APIs, database design, integration fixes
- **Akif Rahman**: professor-side UI, detail pages, documentation support

## Verification Notes
- Routes and controllers are organized and runnable from `server/src/app.js`.
- Core workflow is executable through UI starting at `client/login.html`.
- API smoke tests cover login, course list, slot lifecycle, booking, cancellation, and rescheduling.
