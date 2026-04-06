# OpenSlot Presentation One-Pager

## Project Goal

OpenSlot is a university scheduling system that lets students book office-hour sessions with professors while giving professors tools to create, publish, and manage availability.

## Architecture

- Client:
  - static HTML pages
  - shared CSS design system
  - vanilla JavaScript modules calling REST endpoints
- Server:
  - Express API organized by route/controller groups
  - role-aware request validation and authorization checks
- Database:
  - SQLite database initialized from `db/schema.sql`
  - seeded demo data for repeatable testing and demos

## Core Features

- Student:
  - browse available slots
  - confirm booking with notes
  - view appointment details
  - reschedule and cancel appointments
- Professor:
  - create slots
  - publish/cancel draft slots
  - view weekly schedule
  - update public profile

## Main Data Entities

- `users`
- `courses`
- `office_hour_slots`
- `appointments`

## Validation / Security

- auth token required for all protected API routes
- students can only manage their own appointments
- professors can only manage their own slots and profile
- overlapping slots and invalid time ranges are rejected server-side

## Team Responsibilities

- Benjamin Okojie: student-facing workflow and presentation support
- Dharmik Patel: backend/database integration and testing
- Akif Rahman: professor-facing workflow and documentation support
