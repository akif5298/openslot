import { apiGet, apiPost, fmtDT, setMessage } from "./api.js";
import { logout, requireAuth } from "./auth.js";

const session = requireAuth();
if (!session) {
  // Redirect is handled in requireAuth.
  throw new Error("Missing auth session");
}

if (session.user.role !== "student") {
  window.location.href = "professor-dashboard.html";
}

const welcomeNode = document.getElementById("welcome");
const courseSelect = document.getElementById("course-filter");
const dateInput = document.getElementById("date-filter");
const refreshButton = document.getElementById("refresh-button");
const slotsNode = document.getElementById("slots");
const messageNode = document.getElementById("message");

document.querySelector("[data-logout]")?.addEventListener("click", event => {
  event.preventDefault();
  logout();
});

welcomeNode.textContent = `${session.user.name} (${session.user.email})`;

function renderSlots(slots) {
  if (!Array.isArray(slots) || slots.length === 0) {
    slotsNode.innerHTML = '<div class="card"><p class="subtle">No available slots for the selected filters.</p></div>';
    return;
  }

  slotsNode.innerHTML = slots
    .map(
      slot => `
      <article class="slot-card">
        <h3 class="slot-title">${slot.course_code} · ${slot.course_name}</h3>
        <p class="meta"><strong>Professor:</strong> ${slot.professor_name}</p>
        <p class="meta"><strong>Time:</strong> ${fmtDT(slot.start_time)} → ${fmtDT(slot.end_time)}</p>
        <p class="meta"><strong>Mode:</strong> ${slot.mode}</p>
        <p class="meta"><strong>Location/Link:</strong> ${slot.location_or_link}</p>
        <div class="inline-actions">
          <button class="btn-primary" data-slot-id="${slot.slot_id}">Book</button>
        </div>
      </article>
    `
    )
    .join("");

  slotsNode.querySelectorAll("button[data-slot-id]").forEach(button => {
    button.addEventListener("click", async () => {
      const slotId = Number(button.getAttribute("data-slot-id"));
      const notes = window.prompt("Optional notes for professor:", "") ?? "";

      setMessage(messageNode, "Booking slot...", "info");
      const result = await apiPost("/appointments", {
        slot_id: slotId,
        student_id: session.user.user_id,
        notes
      });

      if (!result.ok) {
        setMessage(messageNode, result.message || "Booking failed.", "error");
        return;
      }

      setMessage(messageNode, "Booking successful. Check My Bookings.", "success");
      await refreshSlots();
    });
  });
}

async function loadCourses() {
  const result = await apiGet("/courses");
  if (!result.ok) {
    setMessage(messageNode, result.message || "Failed to load courses.", "error");
    return;
  }

  courseSelect.innerHTML = '<option value="">All courses</option>';
  for (const course of result.courses) {
    const option = document.createElement("option");
    option.value = String(course.course_id);
    option.textContent = `${course.course_code} — ${course.course_name}`;
    courseSelect.appendChild(option);
  }
}

async function refreshSlots() {
  const query = new URLSearchParams();
  if (courseSelect.value) query.set("courseId", courseSelect.value);
  if (dateInput.value) query.set("date", dateInput.value);

  setMessage(messageNode, "Loading slots...", "info");
  const result = await apiGet(`/slots?${query.toString()}`);

  if (!result.ok) {
    setMessage(messageNode, result.message || "Failed to load slots.", "error");
    return;
  }

  setMessage(messageNode, "", "info");
  renderSlots(result.slots || []);
}

refreshButton?.addEventListener("click", refreshSlots);

await loadCourses();
await refreshSlots();
