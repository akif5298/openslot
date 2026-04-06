# OpenSlot Final Demo Outline

Target length: under 7 minutes

## 1. Project Introduction (10-20 seconds)

- Project name: OpenSlot
- Goal: help university students find, book, and manage professor office-hour sessions
- Target users: students and professors

## 2. Architecture Overview (30-60 seconds)

- Front-end: multi-page HTML/CSS/JavaScript
- Back-end: Node.js + Express REST API
- Database: SQLite with four core relational tables
- Mention role-based flows:
  - students browse and book
  - professors create and manage availability

## 3. Student Workflow Walkthrough

- Login as `student@demo.com`
- Open dashboard
- Browse slots
- Open the confirm-booking page
- Submit notes and confirm appointment
- Open My Bookings
- Show appointment details
- Reschedule or cancel the session

## 4. Professor Workflow Walkthrough

- Login as `prof@demo.com`
- Open professor dashboard
- Create a new slot
- Open schedule page
- Publish or review draft slots
- Open settings page and show profile update

## 5. Testing Highlight

- Show `npm run verify` in the server folder
- Explain that the script checks booking, rescheduling, cancellation, authorization, and profile update behavior

## 6. Closing

- Limitations:
  - demo-token auth
  - no real calendar sync or email notifications
- Next steps:
  - stronger auth
  - calendar integration
  - notification delivery
