function pad(value) {
  return String(value).padStart(2, "0");
}

function toLocalIso(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function createSlotTime(dayOffset, hour, minute, durationMinutes = 30) {
  const start = new Date();
  start.setSeconds(0, 0);
  start.setDate(start.getDate() + dayOffset);
  start.setHours(hour, minute, 0, 0);

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + durationMinutes);

  return {
    start: toLocalIso(start),
    end: toLocalIso(end)
  };
}

const s1 = createSlotTime(1, 10, 0, 30);
const s2 = createSlotTime(1, 14, 0, 30);
const s3 = createSlotTime(2, 11, 0, 30);
const s4 = createSlotTime(2, 16, 30, 30);
const s5 = createSlotTime(1, 9, 0, 30);
const s6 = createSlotTime(1, 11, 30, 30);
const s7 = createSlotTime(1, 14, 0, 30);
const s8 = createSlotTime(3, 10, 0, 30);
const s9 = createSlotTime(4, 15, 0, 30);
const s10 = createSlotTime(5, 9, 0, 30);
const past1 = createSlotTime(-2, 13, 0, 30);
const past2 = createSlotTime(-5, 10, 0, 30);

export const DEMO_USERS = [
  {
    user_id: 1,
    name: "Alice Johnson",
    email: "student@demo.com",
    role: "student",
    department: "Computer Science"
  },
  {
    user_id: 2,
    name: "Marcus Chen",
    email: "student2@demo.com",
    role: "student",
    department: "Mathematics"
  },
  {
    user_id: 101,
    name: "Prof. Robert Smith",
    email: "prof@demo.com",
    role: "professor",
    department: "Computer Science",
    office_location: "Office 402",
    bio: "Office hours for project feedback, exam prep, and research guidance."
  },
  {
    user_id: 102,
    name: "Dr. Emily Chen",
    email: "prof2@demo.com",
    role: "professor",
    department: "Mathematics",
    office_location: "Virtual Office",
    bio: "Focused on conceptual understanding and problem-solving strategies."
  },
  {
    user_id: 103,
    name: "Prof. Sarah Miller",
    email: "prof3@demo.com",
    role: "professor",
    department: "Computer Science",
    office_location: "Engineering Hall 304",
    bio: "Available for algorithm design, complexity analysis, and paper reviews."
  }
];

export const DEMO_COURSES = [
  {
    course_id: 301,
    course_code: "CS302",
    course_name: "Algorithms",
    term: "Fall 2026"
  },
  {
    course_id: 302,
    course_code: "AI101",
    course_name: "Intro to AI",
    term: "Fall 2026"
  },
  {
    course_id: 303,
    course_code: "DS204",
    course_name: "Data Science",
    term: "Fall 2026"
  },
  {
    course_id: 304,
    course_code: "MATH202",
    course_name: "Linear Algebra",
    term: "Fall 2026"
  },
  {
    course_id: 305,
    course_code: "ENG105",
    course_name: "English Composition",
    term: "Fall 2026"
  }
];

export const DEMO_SLOTS = [
  {
    slot_id: 1201,
    professor_id: 103,
    course_id: 301,
    start_time: s1.start,
    end_time: s1.end,
    mode: "in_person",
    location_or_link: "Engineering Hall, Room 304",
    visibility: "public",
    status: "posted",
    booked_by: null,
    topic: "Research Project Review"
  },
  {
    slot_id: 1202,
    professor_id: 102,
    course_id: 304,
    start_time: s2.start,
    end_time: s2.end,
    mode: "virtual",
    location_or_link: "https://zoom.us/j/demo-math202",
    visibility: "public",
    status: "posted",
    booked_by: null,
    topic: "Linear Algebra Problem Clinic"
  },
  {
    slot_id: 1203,
    professor_id: 101,
    course_id: 303,
    start_time: s3.start,
    end_time: s3.end,
    mode: "in_person",
    location_or_link: "Humanities Tower, Office 502",
    visibility: "public",
    status: "posted",
    booked_by: null,
    topic: "Data Pipeline Q&A"
  },
  {
    slot_id: 1204,
    professor_id: 103,
    course_id: 305,
    start_time: s4.start,
    end_time: s4.end,
    mode: "in_person",
    location_or_link: "Library, Study Room A",
    visibility: "public",
    status: "posted",
    booked_by: null,
    topic: "Essay Feedback"
  },
  {
    slot_id: 1301,
    professor_id: 101,
    course_id: 301,
    start_time: s5.start,
    end_time: s5.end,
    mode: "virtual",
    location_or_link: "https://meet.google.com/cs302-office-hours",
    visibility: "public",
    status: "posted",
    booked_by: 1,
    topic: "Project Milestone Review"
  },
  {
    slot_id: 1302,
    professor_id: 101,
    course_id: 301,
    start_time: s6.start,
    end_time: s6.end,
    mode: "in_person",
    location_or_link: "Office 402",
    visibility: "public",
    status: "posted",
    booked_by: 2,
    topic: "Lab Report Feedback"
  },
  {
    slot_id: 1303,
    professor_id: 101,
    course_id: 302,
    start_time: s7.start,
    end_time: s7.end,
    mode: "in_person",
    location_or_link: "Office 402",
    visibility: "public",
    status: "posted",
    booked_by: null,
    topic: "Thesis Discussion"
  },
  {
    slot_id: 1304,
    professor_id: 101,
    course_id: 301,
    start_time: s8.start,
    end_time: s8.end,
    mode: "in_person",
    location_or_link: "Office 402",
    visibility: "public",
    status: "draft",
    booked_by: null,
    topic: "Draft Slot"
  },
  {
    slot_id: 1305,
    professor_id: 101,
    course_id: 303,
    start_time: s9.start,
    end_time: s9.end,
    mode: "virtual",
    location_or_link: "https://meet.google.com/ds204-session",
    visibility: "public",
    status: "posted",
    booked_by: null,
    topic: "Data Visualization"
  },
  {
    slot_id: 1306,
    professor_id: 101,
    course_id: 305,
    start_time: s10.start,
    end_time: s10.end,
    mode: "in_person",
    location_or_link: "Office 402",
    visibility: "public",
    status: "posted",
    booked_by: null,
    topic: "Writing Review"
  },
  {
    slot_id: 1307,
    professor_id: 103,
    course_id: 301,
    start_time: past1.start,
    end_time: past1.end,
    mode: "in_person",
    location_or_link: "Engineering Hall, Room 304",
    visibility: "public",
    status: "posted",
    booked_by: 1,
    topic: "Complexity Proofs"
  },
  {
    slot_id: 1308,
    professor_id: 102,
    course_id: 304,
    start_time: past2.start,
    end_time: past2.end,
    mode: "virtual",
    location_or_link: "https://zoom.us/j/demo-old",
    visibility: "public",
    status: "posted",
    booked_by: null,
    topic: "Cancelled Session"
  }
];

export const DEMO_APPOINTMENTS = [
  {
    appointment_id: 5001,
    slot_id: 1301,
    student_id: 1,
    status: "booked",
    notes: "Need feedback on milestone architecture.",
    created_at: new Date().toISOString()
  },
  {
    appointment_id: 5002,
    slot_id: 1302,
    student_id: 2,
    status: "booked",
    notes: "Questions on lab report assumptions.",
    created_at: new Date().toISOString()
  },
  {
    appointment_id: 5003,
    slot_id: 1307,
    student_id: 1,
    status: "booked",
    notes: "Reviewed complexity proofs in section 3.",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    appointment_id: 5004,
    slot_id: 1308,
    student_id: 1,
    status: "cancelled",
    notes: "Rescheduled due to conflict.",
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
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
