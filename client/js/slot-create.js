import { apiGet, apiPost, setMessage } from "./api.js";
import { requireAuth } from "./auth.js";

const session = requireAuth("professor");
if (!session) throw new Error("No active session");

const form = document.getElementById("slot-form");
const courseSelect = document.getElementById("course_id");
const dateInput = document.getElementById("date");
const startInput = document.getElementById("start_time");
const endInput = document.getElementById("end_time");
const modeInput = document.getElementById("mode");
const locationInput = document.getElementById("location_or_link");
const visibilityInput = document.getElementById("visibility");
const statusInput = document.getElementById("status");
const topicInput = document.getElementById("topic");
const messageNode = document.getElementById("message");

function toYmd(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function loadCourses() {
  const result = await apiGet("/courses");
  if (!result.ok) {
    setMessage(messageNode, result.message || "Failed to load courses.", "error");
    return;
  }

  courseSelect.innerHTML = "";
  for (const course of result.courses) {
    const option = document.createElement("option");
    option.value = String(course.course_id);
    option.textContent = `${course.course_code} - ${course.course_name}`;
    courseSelect.appendChild(option);
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  if (!dateInput.value || !startInput.value || !endInput.value) {
    setMessage(messageNode, "Date and time are required.", "error");
    return;
  }

  const start_time = `${dateInput.value}T${startInput.value}`;
  const end_time = `${dateInput.value}T${endInput.value}`;
  if (new Date(start_time).getTime() >= new Date(end_time).getTime()) {
    setMessage(messageNode, "End time must be after start time.", "error");
    return;
  }

  setMessage(messageNode, "Creating slot...", "info");
  const result = await apiPost("/slots", {
    professor_id: session.user.user_id,
    course_id: Number(courseSelect.value),
    start_time,
    end_time,
    mode: modeInput.value,
    location_or_link: locationInput.value,
    visibility: visibilityInput.value,
    status: statusInput.value,
    topic: topicInput.value.trim()
  });

  if (!result.ok) {
    setMessage(messageNode, result.message || "Failed to create slot.", "error");
    return;
  }

  setMessage(messageNode, `Slot #${result.slot.slot_id} created successfully. Redirecting...`, "success");
  window.setTimeout(() => {
    window.location.href = "professor-schedule.html";
  }, 600);
});

dateInput.value = toYmd(new Date(Date.now() + 24 * 60 * 60 * 1000));
startInput.value = "09:00";
endInput.value = "10:00";

await loadCourses();
