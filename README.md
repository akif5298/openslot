# OpenSlot

A centralized scheduling platform for academic office hours. Professors publish available slots; students browse, book, and manage appointments.

**CP476: Internet Computing – Winter 2026** · Dr. Mustafa Daraghmeh  
Benjamin Okojie, Dharmik Patel, Akif Rahman

---

## Project structure

```
openslot/
├── client/           # Frontend
│   ├── assets/
│   ├── css/
│   ├── js/
│   └── index.html
├── server/           # Backend
│   ├── lib/
│   ├── routes/
│   └── index.js
├── package.json
└── README.md
```

---

## Setup

```bash
# Install root dependencies
npm install

# Install server dependencies (if any)
cd server && npm install && cd ..
```

---

## Running the app

```bash
# Start the server (from project root)
npm start

# Or start the server directly
npm run start:server
```

The client is static: open `client/index.html` in a browser, or serve the `client/` folder (e.g. with a static server or through the backend) when integrated.


# OpenSlot (Milestone 2)

OpenSlot is a lightweight office-hours booking prototype with two roles:
- Students can browse and book posted office hour slots.
- Professors can create slots and publish/cancel them.
- Students can view session details, cancel, and reschedule (before session start).
- Professors can view schedule (day/week) and clearly see booked vs open.

## Tech
- Front-end: HTML/CSS/Vanilla JS
- Back-end: Node.js + Express (Milestone 2 demo data in memory)
- DB Design: SQL schema provided in /db/schema.sql (for Milestone 3 integration)

## Run
### Server
cd server
npm install
npm run dev
Server: http://localhost:3001

### Client
Open client/login.html in a browser.

Demo logins:
- student@demo.com
- prof@demo.com

## API (Milestone 2)
- POST /api/auth/login { email }
- GET /api/courses
- GET /api/slots?courseId=&date=&professorId=&includeBooked=
- GET /api/slots/:id
- POST /api/slots
- PATCH /api/slots/:id/status
- POST /api/appointments
- GET /api/appointments/mine/:studentId
- GET /api/appointments/:appointmentId
- PATCH /api/appointments/:appointmentId/cancel
- PATCH /api/appointments/:appointmentId/reschedule { new_slot_id }
- GET /api/schedule/professor/:professorId?view=day|week&date=YYYY-MM-DD