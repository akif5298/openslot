import { apiGet, fmtDT } from "./api.js";
import { requireAuth, logout } from "./auth.js";

const session = requireAuth();
document.getElementById("who").textContent = `${session.user.name} (${session.user.role})`;
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("backBtn").addEventListener("click", () => history.back());

const params = new URLSearchParams(window.location.search);
const appointmentId = params.get("id");

const notice = document.getElementById("notice");
const details = document.getElementById("details");

if (!appointmentId) {
  notice.className = "notice error";
  notice.textContent = "Missing appointment id.";
} else {
  const data = await apiGet(`/appointments/${appointmentId}`);
  if (!data.ok) {
    notice.className = "notice error";
    notice.textContent = data.message || "Failed to load details.";
  } else {
    const a = data.appointment;
    const s = data.slot;

    details.innerHTML = `
      <p><b>Status:</b> <span class="badge ${a.status}">${a.status}</span></p>
      <p><b>Course:</b> ${s.course_code} — ${s.course_name}</p>
      <p><b>Professor:</b> ${s.professor_name}</p>
      <p><b>Date/Time:</b> ${fmtDT(s.start_time)} → ${fmtDT(s.end_time)}</p>
      <p><b>Mode:</b> ${s.mode}</p>
      <p><b>Location/Link:</b> ${s.location_or_link}</p>
      <p><b>Notes:</b><br/>${(a.notes || "").replaceAll("<","&lt;")}</p>
    `;
  }
}