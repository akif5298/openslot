import {
  apiRequest,
  attachLogoutButtons,
  buildLocalDateTime,
  escapeHtml,
  requireSession,
  setMessage,
  toDateTimeLocalPair
} from "./api.js";

const session = requireSession("professor");

const form = document.getElementById("slot-form");
const pageTitleNode = document.getElementById("page-title");
const submitButton = document.getElementById("submit-button");
const courseSelect = document.getElementById("course_id");
const dateInput = document.getElementById("date");
const startInput = document.getElementById("start_time");
const endInput = document.getElementById("end_time");
const modeInput = document.getElementById("mode");
const locationInput = document.getElementById("location_or_link");
const visibilityInput = document.getElementById("visibility");
const statusInput = document.getElementById("status");
const notesInput = document.getElementById("notes");
const messageNode = document.getElementById("message");

const params = new URLSearchParams(window.location.search);
const editingSlotId = Number(params.get("slotId"));
const isEditing = Number.isFinite(editingSlotId) && editingSlotId > 0;

function slotPayload() {
  const start = buildLocalDateTime(dateInput.value, startInput.value);
  const end = buildLocalDateTime(dateInput.value, endInput.value);

  return {
    professor_id: session.user.user_id,
    course_id: Number(courseSelect.value),
    start_time: start,
    end_time: end,
    mode: modeInput.value,
    location_or_link: locationInput.value.trim(),
    visibility: visibilityInput.value,
    status: statusInput.value,
    notes: notesInput.value.trim()
  };
}

async function loadCourses() {
  const payload = await apiRequest("/courses");
  courseSelect.innerHTML = payload.courses
    .map(course => `<option value="${course.course_id}">${escapeHtml(course.course_code)} · ${escapeHtml(course.course_name)}</option>`)
    .join("");
}

async function loadSlot(slotId) {
  const payload = await apiRequest(`/slots/${slotId}`);
  const slot = payload.slot;

  if (slot.professor_id !== session.user.user_id) {
    throw new Error("You can only edit your own slots.");
  }

  const start = toDateTimeLocalPair(slot.start_time);
  const end = toDateTimeLocalPair(slot.end_time);

  courseSelect.value = String(slot.course_id);
  dateInput.value = start.date;
  startInput.value = start.time;
  endInput.value = end.time;
  modeInput.value = slot.mode;
  locationInput.value = slot.location_or_link || "";
  visibilityInput.value = slot.visibility;
  statusInput.value = slot.status;
  notesInput.value = slot.notes || "";
}

async function submitForm(event) {
  event.preventDefault();
  try {
    const payload = slotPayload();

    if (!payload.course_id || !payload.start_time || !payload.end_time) {
      throw new Error("Course, date, start time, and end time are required.");
    }

    if (new Date(payload.start_time) >= new Date(payload.end_time)) {
      throw new Error("End time must be later than start time.");
    }

    setMessage(messageNode, isEditing ? "Updating slot..." : "Creating slot...", "info");

    if (isEditing) {
      await apiRequest(`/slots/${editingSlotId}`, {
        method: "PATCH",
        body: payload
      });
      setMessage(messageNode, "Slot updated.", "success");
    } else {
      await apiRequest("/slots", {
        method: "POST",
        body: payload
      });
      form.reset();
      setMessage(messageNode, "Slot created.", "success");
    }

    window.setTimeout(() => {
      window.location.href = "professor-dashboard.html";
    }, 650);
  } catch (error) {
    setMessage(messageNode, error.message, "error");
  }
}

async function init() {
  if (!session) return;

  attachLogoutButtons();
  form.addEventListener("submit", submitForm);

  try {
    await loadCourses();

    if (isEditing) {
      pageTitleNode.textContent = `Edit Slot #${editingSlotId}`;
      submitButton.textContent = "Save Changes";
      await loadSlot(editingSlotId);
    }
  } catch (error) {
    setMessage(messageNode, error.message, "error");
  }
}

init();
