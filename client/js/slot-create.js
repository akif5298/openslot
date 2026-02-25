import { apiGet, apiPost, setMessage } from "./api.js";
import { logout, requireAuth } from "./auth.js";

const session = requireAuth();
if (!session) {
  throw new Error("Missing auth session");
}

if (session.user.role !== "professor") {
  window.location.href = "student-dashboard.html";
}

const form = document.getElementById("slot-form");
const courseSelect = document.getElementById("course_id");
const dateInput = document.getElementById("date");
const startInput = document.getElementById("start_time");
const endInput = document.getElementById("end_time");
const modeInput = document.getElementById("mode");
const locationInput = document.getElementById("location_or_link");
const visibilityInput = document.getElementById("visibility");
const statusInput = document.getElementById("status");
const messageNode = document.getElementById("message");

document.querySelector("[data-logout]")?.addEventListener("click", event => {
  event.preventDefault();
  logout();
});

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
    option.textContent = `${course.course_code} — ${course.course_name}`;
    courseSelect.appendChild(option);
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  const start_time = `${dateInput.value}T${startInput.value}`;
  const end_time = `${dateInput.value}T${endInput.value}`;

  setMessage(messageNode, "Creating slot...", "info");
  const result = await apiPost("/slots", {
    professor_id: session.user.user_id,
    course_id: Number(courseSelect.value),
    start_time,
    end_time,
    mode: modeInput.value,
    location_or_link: locationInput.value,
    visibility: visibilityInput.value,
    status: statusInput.value
  });

  if (!result.ok) {
    setMessage(messageNode, result.message || "Failed to create slot.", "error");
    return;
  }

  setMessage(messageNode, `Slot #${result.slot.slot_id} created.`, "success");
  form.reset();
});

await loadCourses();
