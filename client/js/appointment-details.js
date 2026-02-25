import { apiGet, fmtDT, setMessage } from "./api.js";
import { logout, requireAuth } from "./auth.js";

const session = requireAuth();
if (!session) {
  throw new Error("Missing auth session");
}

const headingNode = document.getElementById("heading");
const detailsNode = document.getElementById("details");
const messageNode = document.getElementById("message");

document.querySelector("[data-logout]")?.addEventListener("click", event => {
  event.preventDefault();
  logout();
});

const params = new URLSearchParams(window.location.search);
const appointmentId = params.get("id") || params.get("appointmentId");

if (!appointmentId) {
  setMessage(messageNode, "Missing appointment id in URL.", "error");
} else {
  setMessage(messageNode, "Loading appointment details...", "info");
  const result = await apiGet(`/appointments/${appointmentId}`);

  if (!result.ok) {
    setMessage(messageNode, result.message || "Failed to load appointment.", "error");
  } else {
    setMessage(messageNode, "", "info");

    const appointment = result.appointment;
    const slot = result.slot;

    headingNode.textContent = `Appointment #${appointment.appointment_id}`;
    detailsNode.innerHTML = `
      <p><strong>Status:</strong> <span class="badge ${appointment.status}">${appointment.status}</span></p>
      <p><strong>Course:</strong> ${slot.course_code} — ${slot.course_name}</p>
      <p><strong>Professor:</strong> ${slot.professor_name}</p>
      <p><strong>Time:</strong> ${fmtDT(slot.start_time)} → ${fmtDT(slot.end_time)}</p>
      <p><strong>Mode:</strong> ${slot.mode}</p>
      <p><strong>Location/Link:</strong> ${slot.location_or_link}</p>
      <p><strong>Notes:</strong><br/>${(appointment.notes || "").replaceAll("<", "&lt;")}</p>
    `;
  }
}
