# OpenSlot

**Project Milestone 1**

A centralized scheduling platform for academic office hours and appointments.

---

## Team & Course

| | |
|---|---|
| **Prepared by** | Benjamin Okojie (169075607), Dharmik Patel (169033371), Akif Rahman (210290530) |
| **Date** | Friday, January 30th, 2026 |
| **Course** | CP476: Internet Computing – Winter 2026 |
| **Instructor** | Dr. Mustafa Daraghmeh |

---

## Table of Contents

1. [Project Proposal](#1-project-proposal)
2. [Requirements (User Stories)](#2-requirements-user-stories)
3. [Wireframes](#3-wireframes)
4. [Data Planning](#4-data-planning)
5. [Team Plan](#5-team-plan)
6. [GitHub Setup Evidence](#6-github-setup-evidence)
7. [Activity Blog / Wiki](#7-activity-blog--wiki-initialised)

---

## 1. Project Proposal

### 1.1 Problem Statement

In many university courses, student–professor appointments (office hours, advising, project reviews) are managed using inefficient and fragmented tools such as email threads, static calendars, or course board announcements. These methods create recurring problems:

- Students struggle to discover available office hours across multiple courses.
- Professors spend excessive time coordinating schedules and handling rescheduling.
- Double bookings, missed appointments, and unclear meeting expectations are common.
- There is no centralized system that supports both in-person and virtual academic meetings.

As class sizes grow and academic workloads increase, these issues reduce accessibility to academic support and increase administrative overhead for faculty.

### 1.2 Motivation

The motivation for OpenSlot is to provide a centralized, purpose-built scheduling platform designed specifically for academic environments. OpenSlot aims to:

- Improve student access to academic support.
- Reduce scheduling friction for professors.
- Encourage proactive student engagement.
- Provide clear visibility into availability, bookings, and session details.

By replacing ad-hoc scheduling with a structured workflow, OpenSlot improves efficiency, clarity, and reliability for both students and instructors.

### 1.3 Target Users

**Primary Users**

- **Students:** Undergraduate and graduate students booking academic appointments.
- **Professors / Instructors:** Faculty members managing availability and meetings.

**Secondary / Future Users**

- Teaching Assistants
- Academic advisors or departmental staff

### 1.4 App Concept and Scope

OpenSlot is a role-based web application where professors publish available time slots and students browse, book, and manage academic appointments.

**In Scope**

- Role-based dashboards (student vs professor)
- Professor-created availability slots
- Student discovery and booking of slots
- Course-based filtering
- Appointment confirmation and session details
- In-person and virtual meeting support
- Cancellation and rescheduling

**Out of Scope**

- Payments or monetization
- LMS grading or assignment management
- AI-based scheduling optimization
- Messaging/chat beyond booking notes
- Non-academic event scheduling

### 1.5 Feature List

**Must Have (Essential)**

- User authentication (Student / Professor roles)
- Professors can create, edit, and publish open slots
- Students can browse and book available slots
- Course and date filtering
- Appointment confirmation and details page
- View upcoming and past bookings
- Cancel or reschedule appointments
- Meeting location or video link display

**Should Have (High Value)**

- Calendar integration (e.g., Google Calendar)
- Automated reminders
- Optional meeting preparation notes
- Professor daily/weekly schedule view
- Public vs private slots

**Could Have (Nice to Have)**

- Waitlists for fully booked slots
- Appointment analytics
- Department-level browsing
- Custom appointment types
- UI personalization (e.g., dark mode)

---

## 2. Requirements (User Stories)

### US-1: Browse Available Slots

| | |
|---|---|
| **Role** | Student |
| **Goal** | View available appointment slots by course |
| **Value** | Quickly find relevant academic support without emailing |

**Acceptance Criteria:**

- Student can view a list of open slots
- Slots can be filtered by course and date
- Each slot shows professor, time, and location
- Only unbooked slots are shown

---

### US-2: Book an Appointment

| | |
|---|---|
| **Role** | Student |
| **Goal** | Book a selected time slot |
| **Value** | Secure a confirmed meeting time |

**Acceptance Criteria:**

- Student can select an available slot
- Booking requires confirmation
- Slot becomes unavailable after booking
- Booking appears in “My Bookings”

---

### US-3: Create Availability Slot

| | |
|---|---|
| **Role** | Professor |
| **Goal** | Create office hour availability |
| **Value** | Control schedule and reduce coordination effort |

**Acceptance Criteria:**

- Professor can select date and time range
- Slot can be marked as open or private
- Slot remains draft until posted
- Posted slot is visible to students

---

### US-4: View Schedule

| | |
|---|---|
| **Role** | Professor |
| **Goal** | View daily and weekly schedule |
| **Value** | Avoid conflicts and manage workload |

**Acceptance Criteria:**

- Schedule can be viewed by day and week
- Booked sessions and open slots are visually distinct
- Schedule updates in real time

---

### US-5: View Session Details

| | |
|---|---|
| **Role** | Student |
| **Goal** | Review appointment details |
| **Value** | Be prepared and avoid missed meetings |

**Acceptance Criteria:**

- Session details page shows date, time, professor
- Location or video link is clearly displayed
- Appointment status is visible (upcoming, completed, cancelled)

---

### US-6: Cancel or Reschedule Appointment

| | |
|---|---|
| **Role** | Student / Professor |
| **Goal** | Modify an existing booking |
| **Value** | Flexibility while keeping information accurate |

**Acceptance Criteria:**

- User can cancel or reschedule before session start
- Slot availability updates automatically
- Other party is notified of the change

---

## 3. Wireframes

**Figma:** [OpenSlot Wireframes](https://www.figma.com/design/itjkNx25BoGHqEpgBwfRFG/Untitled?node-id=6-2&t=DwItDsxxrTNhGb8f-1)

---

## 4. Data Planning

### 4.1 Key Data Entities

| Entity | Purpose | Key Fields (Expected) |
|--------|---------|------------------------|
| **Users** | Stores all platform users (students and professors) | `user_id` (PK), `name`, `email` (unique), `role` (student/professor), `created_at` |
| **Courses** | Represents academic courses used for filtering office hours | `course_id` (PK), `course_code`, `course_name`, `term` |
| **OfficeHourSlots** | Represents professor-created availability slots | `slot_id` (PK), `professor_id` (FK → Users), `course_id` (FK → Courses), `start_time`, `end_time`, `mode`, `location_or_link`, `status` |
| **Appointments** | Represents a student booking a specific slot | `appointment_id` (PK), `slot_id` (FK → OfficeHourSlots), `student_id` (FK → Users), `status`, `created_at` |

### 4.2 Key Relationships

| From Entity | To Entity | Relationship | Description |
|-------------|-----------|--------------|-------------|
| Users (Professors) | OfficeHourSlots | One-to-Many | A professor can create multiple office hour slots |
| Courses | OfficeHourSlots | One-to-Many | A course can have multiple office hour slots |
| OfficeHourSlots | Appointments | One-to-Zero/One | A slot may be unbooked or booked once |
| Users (Students) | Appointments | One-to-Many | A student can book multiple appointments |

---

## 5. Team Plan

### 5.1 Team Roles and Task Rotation

Our team uses a flexible role structure where responsibilities rotate throughout the term. Work is divided by task categories (**Front-End**, **Back-End**, **Database**, **Integration**, **Documentation / Reporting**) so that every team member gains experience across the full-stack workflow.

Each task on the GitHub Kanban board is labeled by type. At the beginning of each week, team members select tasks based on availability and workload. This approach maintains fairness, accountability, and broad technical involvement.

### 5.2 Communication Method

- **Discord** – Daily updates, quick questions, and coordination
- **Phone group chat** – Urgent issues or last-minute milestone emergencies
- **GitHub Projects + Issues** – Official task tracking, ownership, and progress visibility

### 5.3 Meeting Cadence

- One scheduled meeting per week
- Agenda: review completed tasks, identify blockers, assign/select tasks for the upcoming week, confirm milestone priorities and deadlines
- Additional check-ins as needed closer to submission dates

### 5.4 Definition of “Done”

A task is complete only when:

- The feature or work item is fully implemented
- Changes are committed and pushed to GitHub
- The task matches the planned milestone requirements
- Basic testing or validation has been performed
- Any necessary documentation or notes are updated

### 5.5 Execution Readiness

With structured weekly coordination, rotating responsibilities, labeled task splitting, and active communication, the team is organized and prepared to begin development efficiently after Milestone 01.

---

## 6. GitHub Setup Evidence

*(To be completed)*

---

## 7. Activity Blog / Wiki Initialised

An activity blog/wiki has been created in the GitHub repository to document project planning and progress. The initial entry includes meeting minutes from the team’s first planning session, outlining the project idea, agreed-upon scope, and key decisions. Initial task assignments have been recorded, with responsibilities distributed among team members to prepare for development in the next milestone.
