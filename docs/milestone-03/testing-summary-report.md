# OpenSlot Milestone 03 Testing Summary Report

Course: CP476 Internet Computing  
Project: OpenSlot  
Milestone: 03  
Report Date: April 5, 2026

## 1. Overview

This report summarizes the testing completed for the final Milestone 03 release of OpenSlot. The goal of testing was to confirm that the application works end-to-end across the three required layers:

- front-end user workflow
- server-side processing
- relational database persistence

The testing focused on the core scenarios required by the project rubric:

- authentication and role-based access
- professor slot creation and management
- student browsing and booking
- appointment detail retrieval
- rescheduling and cancellation
- profile updates
- validation and basic security hygiene

## 2. Test Environment

- Front-end: static HTML, CSS, and JavaScript pages in `client/`
- Back-end: Node.js + Express in `server/`
- Database: SQLite initialized from `db/schema.sql`
- Test data: seeded demo accounts, courses, slots, and appointments
- Automated test script: `scripts/verify-milestone-03.mjs`
- Execution date of latest automated run: April 5, 2026

## 3. Test Strategy

Two testing approaches were used:

### 3.1 Functional end-to-end verification

The main workflow was tested from login through booking management to ensure that the application behaves correctly as a complete system rather than as isolated pages.

### 3.2 Automated smoke testing

An automated script was added to quickly validate the most important Milestone 03 features after code changes. The smoke test starts the API on a temporary SQLite database, runs a sequence of real HTTP requests, checks the responses, and confirms that data is saved and updated correctly.

## 4. Test Plan

| ID | Feature | Test Case | Expected Result |
|---|---|---|---|
| T01 | Authentication | Login with valid demo student email | Student session is created successfully |
| T02 | Authentication | Login with valid demo professor email | Professor session is created successfully |
| T03 | Authorization | Student attempts to create a professor slot | Request is rejected with `403` |
| T04 | Slot creation | Professor creates future office-hour slots with valid data | Slots are saved to the database and returned by the API |
| T05 | Validation | Professor tries to create an overlapping slot | Request is rejected with a conflict response |
| T06 | Browse slots | Student requests the available slots list | Public posted slots are returned correctly |
| T07 | Booking | Student books a public posted slot | Appointment is created and slot becomes booked |
| T08 | Appointment details | Student opens My Bookings and Session Details | Appointment and slot information load correctly |
| T09 | Reschedule | Student reschedules to a different future slot | Old slot becomes available and new slot becomes booked |
| T10 | Cancel | Student cancels an upcoming appointment | Appointment becomes cancelled and slot becomes available |
| T11 | Profile update | Professor updates office location and bio | Profile changes are saved and returned by the API |
| T12 | Schedule view | Professor requests week schedule | Schedule endpoint returns correct slot data for that professor |

## 5. Test Results

The latest automated run completed successfully. All primary tests in the smoke-test scope passed.

### 5.1 Results Table

| ID | Status | Method | Notes |
|---|---|---|---|
| T01 | Pass | Automated | Student login using `student@demo.com` returned a valid token and user object. |
| T02 | Pass | Automated | Professor login using `prof@demo.com` returned a valid token and user object. |
| T03 | Pass | Automated | Student role was correctly blocked from professor-only slot creation with `403 Forbidden`. |
| T04 | Pass | Automated | Two valid future slots were created successfully and stored in the SQLite database. |
| T05 | Pass | Automated | Overlapping slot creation attempt returned `409 Conflict`, confirming schedule validation. |
| T06 | Pass | Automated | Student browse request returned available slots, including newly created public slots. |
| T07 | Pass | Automated | Booking request created a new appointment and marked the selected slot as booked. |
| T08 | Pass | Automated | My Bookings and appointment detail endpoints returned the correct appointment and slot data. |
| T09 | Pass | Automated | Reschedule request moved the appointment to a new slot and released the original slot. |
| T10 | Pass | Automated | Cancel request changed the appointment status to `cancelled` and cleared the slot booking. |
| T11 | Pass | Automated | Professor profile update saved new office location and bio fields successfully. |
| T12 | Pass | Automated | Professor schedule endpoint returned slot data for the selected date range. |

### 5.2 Summary of Results

- All core Milestone 03 workflows in the automated smoke-test scope passed.
- Database-backed persistence is working correctly.
- Authorization checks are working for the main student/professor role boundaries.
- Server-side validation correctly rejects overlapping slots and unauthorized actions.
- No blocking defects were found in the tested end-to-end workflow.

## 6. Automated Tests

The project includes an automated smoke test script for Milestone 03.

### 6.1 How to run the automated test

From the project:

```bash
cd server
npm install
npm run verify
```

### 6.2 What the automated test does

The script:

- starts the Express server on a temporary port
- creates and uses a temporary SQLite database
- logs in as both student and professor
- verifies role protection on professor-only actions
- creates valid professor slots
- verifies overlap validation
- checks the student browse-slots endpoint
- books a slot
- fetches bookings and appointment details
- reschedules the appointment
- cancels the appointment
- updates professor profile information
- verifies the professor schedule endpoint

### 6.3 Latest automated run

Latest confirmed run:

- Date: April 5, 2026
- Result: Pass

## 7. Known Issues / Limitations

The tested build is functional for Milestone 03, but a few limitations remain:

- Authentication is demo-token based and does not use passwords or hashed credentials.
- Notification delivery is simulated through API responses and is not connected to email or SMS services.
- Calendar sync is not implemented as a live external integration.
- The client uses static HTML pages rather than a larger front-end framework, which keeps the project simple but limits scalability.

These limitations do not prevent the required Milestone 03 workflow from working locally.

## 8. Conclusion

Based on the completed testing, OpenSlot satisfies the main Milestone 03 expectations for a full-stack web application:

- the application supports an end-to-end workflow
- the workflow is backed by a relational database
- CRUD-related actions are implemented for the main scheduling data
- server-side validation and basic security checks are present
- automated testing support is included

Overall, the final system is ready for Milestone 03 submission, with the remaining gaps being enhancement-level limitations rather than blocking functional defects.
