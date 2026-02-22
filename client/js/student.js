import {
  apiRequest,
  attachLogoutButtons,
  escapeHtml,
  requireSession,
  setMessage,
  toDateInputValue,
  toDisplayDateTime
} from "./api.js";

const session = requireSession("student");

const welcomeNode = document.getElementById("welcome");
const courseSelect = document.getElementById("course-filter");
const dateInput = document.getElementById("date-filter");
const refreshButton = document.getElementById("refresh-button");
const slotsNode = document.getElementById("slots");
const messageNode = document.getElementById("message");

let slotsCache = [];

function renderSlots(slots) {
  if (!slots.length) {
    slotsNode.innerHTML = '<div class="card"><p class="subtle">No open slots match the selected filters.</p></div>';
    return;
  }

  slotsNode.innerHTML = slots
    .map(
      slot => `
      <article class="slot-card" data-slot-id="${slot.slot_id}">
        <h3 class="slot-title">${escapeHtml(slot.course_code)} · ${escapeHtml(slot.course_name)}</h3>
        <p class="meta"><strong>Professor:</strong> ${escapeHtml(slot.professor_name)}</p>
        <p class="meta"><strong>When:</strong> ${escapeHtml(toDisplayDateTime(slot.start_time))} - ${escapeHtml(
        toDisplayDateTime(slot.end_time)
      )}</p>
        <p class="meta"><strong>Mode:</strong> ${escapeHtml(slot.mode)} | <strong>Location/Link:</strong> ${escapeHtml(
        slot.location_or_link || "TBA"
      )}</p>
        <p class="meta"><strong>Status:</strong> <span class="badge badge-open">${escapeHtml(slot.status)}</span></p>
        <div class="inline-actions">
          <button class="btn-primary" data-book="${slot.slot_id}">Book Slot</button>
        </div>
      </article>
    `
    )
    .join("");
}

async function loadCourses() {
  const payload = await apiRequest("/courses");
  const options = ['<option value="">All courses</option>']
    .concat(
      payload.courses.map(
        course =>
          `<option value="${course.course_id}">${escapeHtml(course.course_code)} · ${escapeHtml(
            course.course_name
          )}</option>`
      )
    )
    .join("");

  courseSelect.innerHTML = options;
}

async function loadSlots() {
  const params = new URLSearchParams();
  params.set("includeBooked", "false");

  const courseId = courseSelect.value;
  const date = dateInput.value;

  if (courseId) params.set("courseId", courseId);
  if (date) params.set("date", date);

  setMessage(messageNode, "Loading slots...", "info");
  const payload = await apiRequest(`/slots?${params.toString()}`);
  slotsCache = payload.slots;
  renderSlots(slotsCache);
  setMessage(messageNode, "", "info");
}

async function bookSlot(slotId) {
  try {
    setMessage(messageNode, "Creating booking...", "info");

    const note = window.prompt("Optional booking note (leave blank if none):", "") ?? "";

    await apiRequest("/appointments", {
      method: "POST",
      body: {
        slot_id: Number(slotId),
        student_id: session.user.user_id,
        notes: note.trim()
      }
    });

    await loadSlots();
    setMessage(messageNode, "Booking confirmed and added to My Bookings.", "success");
  } catch (error) {
    setMessage(messageNode, error.message, "error");
  }
}

function attachEvents() {
  refreshButton.addEventListener("click", async () => {
    try {
      await loadSlots();
    } catch (error) {
      setMessage(messageNode, error.message, "error");
    }
  });

  slotsNode.addEventListener("click", async event => {
    const button = event.target.closest("button[data-book]");
    if (!button) return;

    const slotId = button.getAttribute("data-book");
    if (!slotId) return;

    const confirmed = window.confirm("Confirm booking this slot?");
    if (!confirmed) return;

    await bookSlot(slotId);
  });
}

async function init() {
  if (!session) return;
  attachLogoutButtons();
  welcomeNode.textContent = `Signed in as ${session.user.name} (${session.user.email})`;
  dateInput.value = toDateInputValue();

  try {
    await loadCourses();
    await loadSlots();
    attachEvents();
  } catch (error) {
    setMessage(messageNode, error.message, "error");
  }
}

init();
