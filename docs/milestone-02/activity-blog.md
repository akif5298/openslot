# OpenSlot Activity Blog (Milestone 02)

## Entry 1 - February 20, 2026
### Work Completed
- Implemented base student and professor front-end pages:
  - login
  - student dashboard
  - professor dashboard
- Created shared client API helper for fetch requests and session handling.
- Established Express server skeleton with route modules for auth/courses/slots/appointments/schedule.

### Decisions Made
- Use vanilla JS modules instead of framework to keep milestone scope focused.
- Keep demo data in memory for Milestone 02 to prioritize workflow completion.
- Standardize API under `/api/*` namespace.

### Blockers and Resolution
- **Blocker:** Several core files became empty during refactor.
- **Resolution:** Rebuilt missing controllers/routes/pages and revalidated all workflow endpoints.

---

## Entry 2 - February 22, 2026
### Work Completed
- Completed end-to-end primary workflow:
  - student login -> browse slots -> book -> view details -> cancel/reschedule
  - professor login -> create/edit slot -> publish/cancel -> view day/week schedule
- Finalized relational schema in `db/schema.sql` with keys, constraints, and indexes.
- Added Milestone 02 documentation package in `docs/milestone-02/`.

### Decisions Made
- Enforced domain constraints at both DB level (CHECK constraints) and API level (controller validation).
- Kept slot visibility and slot status separate to avoid ambiguous business logic.
- Mark completed appointments dynamically based on slot end-time while preserving stored status history.

### Blockers and Resolution
- **Blocker:** Local sandbox blocked server bind on port 3001.
- **Resolution:** Ran verification with approved elevated execution for API smoke testing.
