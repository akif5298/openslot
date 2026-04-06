# OpenSlot — Testing Summary Report

**Project:** OpenSlot — Academic Office Hours Scheduling  
**Milestone:** 3
**Date:** April 5, 2026  
**Prepared by:** OpenSlot Team  

---

## 1. Overview

OpenSlot is a full-stack web application that allows professors to create office-hour slots and students to browse and book appointments. The backend is a Node.js/Express REST API using in-memory demo data. This report documents the automated test suite written for Milestone 2.

**Test framework:** [Vitest](https://vitest.dev/) (Jest-compatible, native ESM support)  
**HTTP testing:** [Supertest](https://github.com/ladjs/supertest)  
**Total test cases:** 68  
**Result:** 68 / 68 passed

---

## 2. Test Plan

### 2.1 Features Under Test

| Feature Area | Endpoints Covered | # Test Cases |
|---|---|---|
| Authentication | Login, Logout, Update Profile | 11 |
| Courses | List Courses | 4 |
| Slots | List, Get by ID, Create, Update Status | 21 |
| Appointments | Book, List, Details, Cancel, Reschedule | 25 |
| Schedule | Professor Schedule (day/week) | 7 |
| **Total** | | **68** |

### 2.2 Test Case Inventory

#### Auth (`src/tests/auth.test.js`)

| ID | Description | Type |
|---|---|---|
| TC-AUTH-01 | Login with valid student email → 200, role: student | Happy path |
| TC-AUTH-02 | Login with valid professor email → 200, role: professor | Happy path |
| TC-AUTH-03 | Login with unknown email → 401 | Error handling |
| TC-AUTH-04 | Login with missing email → 401 | Validation |
| TC-AUTH-05 | Email matching is case-insensitive | Edge case |
| TC-AUTH-06 | Logout always returns ok: true | Happy path |
| TC-AUTH-07 | Update profile with valid fields → 200, updated user | Happy path |
| TC-AUTH-08 | Update profile with non-existent userId → 404 | Error handling |
| TC-AUTH-09 | Update profile with invalid userId (string) → 400 | Validation |
| TC-AUTH-10 | Update profile with blank name → 400 | Validation |
| TC-AUTH-11 | Update profile with already-taken email → 409 | Business rule |

#### Courses (`src/tests/courses.test.js`)

| ID | Description | Type |
|---|---|---|
| TC-CRS-01 | GET /api/courses returns ok: true with array | Happy path |
| TC-CRS-02 | Returns exactly 5 demo courses | Data integrity |
| TC-CRS-03 | Each course has required fields | Schema |
| TC-CRS-04 | Expected course codes present (CS302, AI101, MATH202) | Data integrity |

#### Slots (`src/tests/slots.test.js`)

| ID | Description | Type |
|---|---|---|
| TC-SLT-01 | GET /api/slots returns ok: true with slots array | Happy path |
| TC-SLT-02 | Default response only includes public, posted, unbooked slots | Business rule |
| TC-SLT-03 | includeBooked=true includes booked slots | Filtering |
| TC-SLT-04 | Filter by courseId returns only matching slots | Filtering |
| TC-SLT-05 | Filter by professorId returns only matching slots | Filtering |
| TC-SLT-06 | status=draft returns only draft slots | Filtering |
| TC-SLT-07 | Enriched slots include professor_name and course_code | Data enrichment |
| TC-SLT-08 | Slots sorted by start_time ascending | Ordering |
| TC-SLT-09 | GET /api/slots/:id returns single slot by valid id | Happy path |
| TC-SLT-10 | GET /api/slots/99999 → 404 | Error handling |
| TC-SLT-11 | Returned slot includes enriched fields | Data enrichment |
| TC-SLT-12 | POST /api/slots creates slot with all required fields → 201 | Happy path |
| TC-SLT-13 | New slot defaults to draft when status not provided | Defaults |
| TC-SLT-14 | Create slot missing professor_id → 400 | Validation |
| TC-SLT-15 | Create slot missing start_time → 400 | Validation |
| TC-SLT-16 | Create slot missing location_or_link → 400 | Validation |
| TC-SLT-17 | PATCH status: draft slot → posted → 200 | Happy path |
| TC-SLT-18 | PATCH status: slot → cancelled → 200 | Happy path |
| TC-SLT-19 | Cancelling a booked slot clears booked_by (cascade) | Business rule |
| TC-SLT-20 | PATCH status with invalid value (e.g. "deleted") → 400 | Validation |
| TC-SLT-21 | PATCH status on non-existent slot → 404 | Error handling |

#### Appointments (`src/tests/appointments.test.js`)

| ID | Description | Type |
|---|---|---|
| TC-APT-01 | Book an available public slot → 201, notifications returned | Happy path |
| TC-APT-02 | Double-booking the same slot → 409 "already booked" | Business rule |
| TC-APT-03 | Book with missing slot_id → 400 | Validation |
| TC-APT-04 | Book with non-existent student → 404 | Validation |
| TC-APT-05 | Book with non-existent slot → 404 | Validation |
| TC-APT-06 | Book a draft (non-posted) slot → 409 "not posted" | Business rule |
| TC-APT-07 | GET /mine/:studentId returns all student bookings | Happy path |
| TC-APT-08 | Each booking includes enriched slot data | Data enrichment |
| TC-APT-09 | GET /mine/abc (invalid id) → 400 | Validation |
| TC-APT-10 | Student with one booking returns at least one result | Happy path |
| TC-APT-11 | Past appointment status auto-computed as "completed" | Business rule |
| TC-APT-12 | GET /api/appointments/:id returns details + slot + student | Happy path |
| TC-APT-13 | Student details (name, email) included in response | Data integrity |
| TC-APT-14 | GET /api/appointments/99999 → 404 | Error handling |
| TC-APT-15 | GET /api/appointments/abc → 400 | Validation |
| TC-APT-16 | Cancel a booked future appointment → 200, slot freed | Happy path |
| TC-APT-17 | Cancel an already-cancelled appointment → 409 | Business rule |
| TC-APT-18 | Cancel a past appointment → 409 "session has started" | Business rule |
| TC-APT-19 | Cancel non-existent appointment → 404 | Error handling |
| TC-APT-20 | Reschedule to a new available slot → 200, old slot freed | Happy path |
| TC-APT-21 | Reschedule to the same slot → 400 "different slot" | Business rule |
| TC-APT-22 | Reschedule to an already-booked slot → 409 | Business rule |
| TC-APT-23 | Reschedule with missing new_slot_id → 400 | Validation |
| TC-APT-24 | Reschedule to non-existent slot → 404 | Error handling |
| TC-APT-25 | Reschedule a cancelled appointment → 409 | Business rule |

#### Schedule (`src/tests/schedule.test.js`)

| ID | Description | Type |
|---|---|---|
| TC-SCH-01 | GET /schedule/professor/:id returns ok: true and slots array | Happy path |
| TC-SCH-02 | Week view returns slots within the 7-day range window | Range logic |
| TC-SCH-03 | Day view returns view: "day" | Happy path |
| TC-SCH-04 | Slot objects include course_code and booked flag | Data enrichment |
| TC-SCH-05 | Only returns slots belonging to the requested professor | Filtering |
| TC-SCH-06 | Invalid date format → 400 "invalid date" | Validation |
| TC-SCH-07 | Professor with no slots in range returns empty array | Edge case |

---

## 3. Results

All tests were executed on **April 5, 2026** using `npm test` from the `/server` directory.

```
Test Files   5 passed (5)
Tests        68 passed (68)
Duration     3.26s
```

### Results by Feature

| Feature | Tests | Passed | Failed | Pass Rate |
|---|---|---|---|---|
| Authentication | 11 | 11 | 0 | 100% |
| Courses | 4 | 4 | 0 | 100% |
| Slots | 21 | 21 | 0 | 100% |
| Appointments | 25 | 25 | 0 | 100% |
| Schedule | 7 | 7 | 0 | 100% |
| **Total** | **68** | **68** | **0** | **100%** |

All 68 test cases passed with no failures or errors.

---

## 4. How to Run the Automated Tests

### Prerequisites

- Node.js 18+ installed
- Dependencies installed

### Setup

```bash
# From the project root
cd server
npm install
```

### Run Tests

```bash
# Run all tests once (CI mode)
npm test

# Run in watch mode (re-runs on file save)
npm run test:watch
```

### Expected Output

```
✓ src/tests/courses.test.js      (4 tests)
✓ src/tests/schedule.test.js     (7 tests)
✓ src/tests/slots.test.js        (21 tests)
✓ src/tests/auth.test.js         (11 tests)
✓ src/tests/appointments.test.js (25 tests)

Test Files  5 passed (5)
Tests       68 passed (68)
```

### Test File Locations

| File | Coverage |
|---|---|
| `server/src/tests/auth.test.js` | Login, logout, profile update |
| `server/src/tests/courses.test.js` | Course listing |
| `server/src/tests/slots.test.js` | Slot CRUD and filtering |
| `server/src/tests/appointments.test.js` | Booking lifecycle |
| `server/src/tests/schedule.test.js` | Professor schedule view |

---

## 5. Known Issues and Limitations

### 5.1 In-Memory Data (No Persistence)
The server uses in-memory demo arrays (`DEMO_SLOTS`, `DEMO_APPOINTMENTS`, etc.) instead of a real database. All state is lost on server restart. Tests are isolated per file by Vitest's worker threads, so tests do not interfere with each other across files.

### 5.2 No Authentication Middleware
API endpoints do not enforce token validation. Any client can call any endpoint without a valid token. The `demo-token-{userId}` tokens are returned at login but never verified on subsequent requests. Authentication enforcement is deferred to a future milestone.

### 5.3 Past-Slot Booking Not Fully Blocked at the API Level for Pre-seeded Data
The booking endpoint correctly blocks booking a slot that has already started. However, the demo data includes pre-seeded appointments on past slots (e.g., appointment 5003 on slot 1307) that would not be creatable through the API. These exist only to demonstrate the "completed" status computation.

### 5.4 No Frontend Automated Tests
The client-side (`/client`) HTML/JavaScript pages are not covered by automated tests. Testing of the frontend was performed manually through browser interaction.

### 5.5 No Input Sanitisation Beyond Trimming
The API trims string inputs but does not enforce length limits or deeper validation (e.g., maximum bio length, valid datetime format for slot start/end). Malformed datetime strings will be stored as-is.

---

## 6. Manual Testing Performed

In addition to the automated test suite, the following flows were verified manually in the browser:

| Flow | Result |
|---|---|
| Student login and redirect to dashboard | Pass |
| Browse and filter available slots by course | Pass |
| Book a slot and see confirmation | Pass |
| View "My Bookings" and appointment detail page | Pass |
| Cancel a booked appointment | Pass |
| Professor login and redirect to dashboard | Pass |
| Create a new office-hour slot (draft) | Pass |
| Publish a draft slot (post to students) | Pass |
| View professor schedule in week/day view | Pass |
| Update professor profile settings | Pass |
| Role-based redirect (student trying prof page) | Pass |
