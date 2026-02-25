export const DEMO_USERS = [
  { user_id: 1, name: "Demo Student", email: "student@demo.com", role: "student" },
  { user_id: 2, name: "Demo Professor", email: "prof@demo.com", role: "professor" }
];

export const DEMO_COURSES = [
  { course_id: 1, course_code: "CP476", course_name: "Internet Computing", term: "W26" },
  { course_id: 2, course_code: "CP317", course_name: "Software Development", term: "W26" }
];

// Slots: booked_by is null if free, else student_id
export let DEMO_SLOTS = [
  {
    slot_id: 101,
    professor_id: 2,
    course_id: 1,
    start_time: "2026-03-01T14:00",
    end_time: "2026-03-01T14:30",
    mode: "virtual",
    location_or_link: "https://meet.example/demo",
    visibility: "public",
    status: "posted",
    booked_by: null
  },
  {
    slot_id: 102,
    professor_id: 2,
    course_id: 1,
    start_time: "2026-03-02T11:00",
    end_time: "2026-03-02T11:30",
    mode: "in_person",
    location_or_link: "Lazaridis Hall, Room 2-101",
    visibility: "public",
    status: "posted",
    booked_by: null
  }
];

export let DEMO_APPOINTMENTS = [
  // example past appointment (completed)
  {
    appointment_id: 9001,
    slot_id: 102,
    student_id: 1,
    status: "completed",
    notes: "Wanted to ask about Assignment 2.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
  }
];

let nextAppointmentValue =
  DEMO_APPOINTMENTS.length > 0
    ? Math.max(...DEMO_APPOINTMENTS.map(item => Number(item.appointment_id) || 0)) + 1
    : 1;

export function nextAppointmentId() {
  const value = nextAppointmentValue;
  nextAppointmentValue += 1;
  return value;
}
