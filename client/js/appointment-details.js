import {
  apiRequest,
  attachLogoutButtons,
  escapeHtml,
  requireSession,
  setMessage,
  toDisplayDateTime
} from "./api.js";

const session = requireSession();

const headingNode = document.getElementById("heading");
const detailsNode = document.getElementById("details");
const messageNode = document.getElementById("message");

function getAppointmentId() {
  const params = new URLSearchParams(window.location.search);
  const value = Number(params.get("appointmentId"));
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.trunc(value);
}

function statusBadge(status) {
  const key = (status || "").toLowerCase();
  const klass = key === "booked" ? "badge-upcoming" : `badge-${key}`;
  return `<span class="badge ${klass}">${escapeHtml(status)}</span>`;
}

function render(payload) {
  const { appointment, slot, student } = payload;

  headingNode.textContent = `Appointment #${appointment.appointment_id}`;

  detailsNode.innerHTML = `
    <div class="info-grid">
      <div class="kv">
        <p>Status</p>
        <h4>${statusBadge(appointment.status)}</h4>
      </div>
      <div class="kv">
        <p>Student</p>
        <h4>${escapeHtml(student?.name || "Unknown")}</h4>
      </div>
      <div class="kv">
        <p>Course</p>
        <h4>${escapeHtml(slot.course_code)} · ${escapeHtml(slot.course_name)}</h4>
      </div>
      <div class="kv">
        <p>Professor</p>
        <h4>${escapeHtml(slot.professor_name)}</h4>
      </div>
      <div class="kv">
        <p>Starts</p>
        <h4>${escapeHtml(toDisplayDateTime(slot.start_time))}</h4>
      </div>
      <div class="kv">
        <p>Ends</p>
        <h4>${escapeHtml(toDisplayDateTime(slot.end_time))}</h4>
      </div>
      <div class="kv">
        <p>Mode</p>
        <h4>${escapeHtml(slot.mode)}</h4>
      </div>
      <div class="kv">
        <p>Location / Link</p>
        <h4>${escapeHtml(slot.location_or_link || "TBA")}</h4>
      </div>
    </div>
    <hr />
    <p><strong>Booking Note:</strong> ${escapeHtml(appointment.notes || "No note provided")}</p>
  `;
}

async function init() {
  if (!session) return;
  attachLogoutButtons();

  const appointmentId = getAppointmentId();
  if (!appointmentId) {
    setMessage(messageNode, "Missing appointmentId in URL.", "error");
    return;
  }

  try {
    setMessage(messageNode, "Loading appointment details...", "info");
    const payload = await apiRequest(`/appointments/${appointmentId}`);
    render(payload);
    setMessage(messageNode, "", "info");
  } catch (error) {
    setMessage(messageNode, error.message, "error");
  }
}

init();
