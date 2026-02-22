# Milestone 02 Rubric Checklist (Self-Audit)

## Front-end completeness & workflow (30 pts)
Status: Exceeds baseline

Evidence:
- Core screens implemented:
  - `client/login.html`
  - `client/student-dashboard.html`
  - `client/my-bookings.html`
  - `client/appointment-details.html`
  - `client/professor-dashboard.html`
  - `client/slot-create.html`
  - `client/professor-schedule.html`
- End-to-end student/professor workflows implemented and connected to API.
- Includes booking, cancellation, and rescheduling behavior with constraints.

## Front-end quality (10 pts)
Status: Meets/Exceeds

Evidence:
- Shared API/session/util helpers in `client/js/api.js`.
- Consistent CSS design system in `client/css/styles.css`.
- Form validation and message handling across pages.

## Database schema quality & normalization (25 pts)
Status: Meets/Exceeds

Evidence:
- `db/schema.sql` includes normalized entities for users/courses/slots/appointments.
- PK/FK/CHECK/UNIQUE constraints and indexes present.
- Normalization notes included in `docs/milestone-02/database-design.md`.

## SQL correctness & clarity (10 pts)
Status: Exceeds baseline

Evidence:
- Automated sqlite schema verification in `scripts/verify-milestone-02.sh`.
- Constraint enforcement checks included in verification script.

## Back-end setup progress (10 pts)
Status: Exceeds baseline

Evidence:
- Runnable server entry point: `server/src/app.js`.
- Organized route/controller modules under `server/src/routes` and `server/src/controllers`.
- APIs are functional, not only stubs.

## Kanban usage & project tracking (10 pts)
Status: Documented locally; requires GitHub board sync for grading visibility

Evidence:
- `docs/milestone-02/kanban-evidence.md`

## Activity blog/wiki quality (5 pts)
Status: Meets/Exceeds

Evidence:
- `docs/milestone-02/activity-blog.md` with two dated progress entries since Milestone 01.

## Extra Beyond Requirement
- End-to-end automated milestone verification script:
  - `scripts/verify-milestone-02.sh`
- API smoke tests integrated into verification flow.
- Database package delivered as both source and PDF.
