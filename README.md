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