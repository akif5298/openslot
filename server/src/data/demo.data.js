const now = new Date();

function atOffset(daysFromNow, hour, minute = 0) {
  const d = new Date(now);
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
}

export const DEMO_USERS = [
  {
    user_id: 1,
    name: "Ava Student",
    email: "student@demo.com",
    role: "student",
    created_at: "2026-01-15T09:00:00"
  },
  {
    user_id: 2,
    name: "Noah Student",
    email: "student2@demo.com",
    role: "student",
    created_at: "2026-01-15T09:05:00"
  },
  {
    user_id: 101,
    name: "Dr. Maya Chen",
    email: "prof@demo.com",
    role: "professor",
    created_at: "2026-01-12T09:00:00"
  },
  {
    user_id: 102,
    name: "Dr. Omar Khan",
    email: "prof2@demo.com",
    role: "professor",
    created_at: "2026-01-12T09:05:00"
  }
];

export const DEMO_COURSES = [
  {
    course_id: 476,
    course_code: "CP476",
    course_name: "Internet Computing",
    term: "Winter 2026"
  },
  {
    course_id: 317,
    course_code: "CP317",
    course_name: "Software Engineering",
    term: "Winter 2026"
  },
  {
    course_id: 220,
    course_code: "CP220",
    course_name: "Data Structures II",
    term: "Winter 2026"
  }
];

export const DEMO_SLOTS = [
  {
    slot_id: 1001,
    professor_id: 101,
    course_id: 476,
    start_time: atOffset(1, 10, 0),
    end_time: atOffset(1, 10, 30),
    mode: "in_person",
    location_or_link: "Lazaridis Hall LH3008",
    visibility: "public",
    status: "posted",
    notes: "Bring milestone questions.",
    booked_by: null,
    created_at: "2026-01-30T09:00:00",
    updated_at: "2026-01-30T09:00:00"
  },
  {
    slot_id: 1002,
    professor_id: 101,
    course_id: 476,
    start_time: atOffset(1, 11, 0),
    end_time: atOffset(1, 11, 30),
    mode: "virtual",
    location_or_link: "https://meet.google.com/demo-slot-1002",
    visibility: "public",
    status: "posted",
    notes: "Project architecture review.",
    booked_by: 1,
    created_at: "2026-01-30T09:05:00",
    updated_at: "2026-01-30T09:05:00"
  },
  {
    slot_id: 1003,
    professor_id: 101,
    course_id: 317,
    start_time: atOffset(2, 14, 0),
    end_time: atOffset(2, 14, 45),
    mode: "in_person",
    location_or_link: "Lazaridis Hall LH3010",
    visibility: "private",
    status: "draft",
    notes: "Reserved for project team check-ins.",
    booked_by: null,
    created_at: "2026-01-30T09:10:00",
    updated_at: "2026-01-30T09:10:00"
  },
  {
    slot_id: 1004,
    professor_id: 102,
    course_id: 220,
    start_time: atOffset(3, 9, 0),
    end_time: atOffset(3, 9, 30),
    mode: "virtual",
    location_or_link: "https://zoom.us/j/2200900",
    visibility: "public",
    status: "posted",
    notes: "Algorithm walkthrough.",
    booked_by: null,
    created_at: "2026-01-30T09:12:00",
    updated_at: "2026-01-30T09:12:00"
  },
  {
    slot_id: 1005,
    professor_id: 101,
    course_id: 476,
    start_time: atOffset(-1, 13, 0),
    end_time: atOffset(-1, 13, 30),
    mode: "in_person",
    location_or_link: "Lazaridis Hall LH3008",
    visibility: "public",
    status: "posted",
    notes: "Completed demo meeting.",
    booked_by: 2,
    created_at: "2026-01-25T11:00:00",
    updated_at: "2026-01-25T11:00:00"
  }
];

export const DEMO_APPOINTMENTS = [
  {
    appointment_id: 5001,
    slot_id: 1002,
    student_id: 1,
    status: "booked",
    notes: "Need help with API routing.",
    created_at: "2026-02-01T10:15:00"
  },
  {
    appointment_id: 5002,
    slot_id: 1005,
    student_id: 2,
    status: "booked",
    notes: "Reviewed recursion assignment.",
    created_at: "2026-01-28T13:15:00"
  }
];

let nextSlotValue = Math.max(0, ...DEMO_SLOTS.map(slot => Number(slot.slot_id) || 0)) + 1;
let nextAppointmentValue =
  Math.max(0, ...DEMO_APPOINTMENTS.map(appointment => Number(appointment.appointment_id) || 0)) + 1;

export function nextSlotId() {
  const value = nextSlotValue;
  nextSlotValue += 1;
  return value;
}

export function nextAppointmentId() {
  const value = nextAppointmentValue;
  nextAppointmentValue += 1;
  return value;
}
