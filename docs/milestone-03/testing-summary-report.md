# OpenSlot Milestone 03 Testing Summary

## 1. Scope

This report summarizes the final testing completed for the Milestone 03 release of OpenSlot.

Primary workflows tested:
- professor slot creation and schedule management
- student browsing and booking flow
- appointment detail retrieval
- reschedule and cancellation
- professor profile updates
- API authorization and validation behavior

## 2. Test Environment

- Front-end: static HTML/CSS/JS pages in `client/`
- Back-end: Node.js + Express in `server/`
- Database: SQLite generated from `db/schema.sql`
- Browser target: modern Chromium/Safari/Firefox
- Automated smoke test: `scripts/verify-milestone-03.mjs`

## 3. Test Plan

| ID | Feature | Test Case | Expected Result |
|---|---|---|---|
| T01 | Authentication | Login with valid demo student email | Student session is created and redirected to student dashboard |
| T02 | Authentication | Login with valid demo professor email | Professor session is created and redirected to professor dashboard |
| T03 | Authorization | Student attempts professor slot creation | API rejects request with `403` |
| T04 | Slot creation | Professor creates a future slot with valid data | Slot is saved in SQLite and returned by API |
| T05 | Validation | Professor submits overlapping slot time | API rejects request with conflict message |
| T06 | Browse slots | Student loads available slots list | Public posted unbooked slots are returned |
| T07 | Booking | Student books a public posted slot | Appointment is created and slot becomes booked |
| T08 | Booking details | Student opens appointment details page | Appointment + slot + professor data loads correctly |
| T09 | Reschedule | Student moves booking to a different future slot | Old slot becomes available and new slot becomes booked |
| T10 | Cancel | Student cancels an upcoming appointment | Appointment status becomes cancelled and slot becomes available |
| T11 | Professor schedule | Professor loads week/day schedule | Schedule returns the professor’s slots for the selected range |
| T12 | Profile update | Professor updates office location and bio | User record is updated and returned by API |

## 4. Automated Smoke Test Coverage

The repository includes:

```bash
cd server
npm run verify
```

The smoke test performs the following sequence automatically:
- login as student and professor
- confirm protected routes reject unauthorized role usage
- create two professor slots
- book one slot as a student
- retrieve booking details
- reschedule to the second slot
- cancel the rescheduled appointment
- update professor profile data
- confirm the professor schedule endpoint responds successfully

## 5. Results Summary

Automated smoke test status:
- `npm run verify` passed on April 5, 2026

Verified outcomes:
- core student and professor workflows pass
- database persistence works through SQLite instead of in-memory demo arrays
- server-side validation blocks invalid IDs, invalid dates, unauthorized actions, and slot conflicts

## 6. Known Issues / Limitations

- Authentication is demo-token based and does not include passwords or hashed credentials.
- Calendar sync and real notification delivery are not implemented yet.
- The client is static HTML and not bundled; pages are intended to be opened directly in a browser while the API runs separately.

## 7. Conclusion

OpenSlot satisfies the Milestone 03 requirement for an end-to-end full-stack workflow backed by a relational database, with working CRUD-related flows, server-side validation, and testing support.
