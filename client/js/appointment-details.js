import { apiGet, apiPatch, escapeHtml, fmtDate, fmtRange, initials, setMessage } from "./api.js";
import { logout, requireAuth } from "./auth.js";

const session = requireAuth();
if (!session) throw new Error("No active session");

const avatarNode = document.getElementById("user-avatar");
const logoutBtn = document.getElementById("logout-btn");
const headingNode = document.getElementById("heading");
const statusNode = document.getElementById("status-text");
const tableBody = document.querySelector("#details-table tbody");
const notesNode = document.getElementById("notes-body");
const cancelBtn = document.getElementById("action-cancel");
const joinBtn = document.getElementById("action-join");
const noticeNode = document.getElementById("notice");

avatarNode.textContent = initials(session.user.name);
logoutBtn?.addEventListener("click", logout);

const query = new URLSearchParams(window.location.search);
const appointmentId = Number(query.get("id") || query.get("appointmentId"));

if (!appointmentId) {
  setMessage(noticeNode, "Missing appointment id in URL.", "error");
}

function setRows(rows) {
  tableBody.innerHTML = rows
    .map(
      row => `
        <tr>
          <th>${escapeHtml(row.label)}</th>
          <td>${row.value}</td>
        </tr>
      `
    )
    .join("");
}

async function loadDetails() {
  if (!appointmentId) return;

  setMessage(noticeNode, "Loading appointment details...", "info");
  const result = await apiGet(`/appointments/${appointmentId}`);
  if (!result.ok) {
    setMessage(noticeNode, result.message || "Failed to load appointment.", "error");
    return;
  }

  setMessage(noticeNode, "", "info");
  const appointment = result.appointment || {};
  const slot = result.slot || {};
  const canCancel = appointment.status === "booked" && new Date(slot.start_time).getTime() > Date.now();
  const isVirtual = String(slot.mode || "").toLowerCase() === "virtual";

  headingNode.textContent = `Office Hours with ${slot.professor_name || "Professor"}`;
  statusNode.innerHTML = `<span class="badge ${escapeHtml(appointment.status || "booked")}">${escapeHtml(
    appointment.status || "booked"
  )}</span>`;

  setRows([
    { label: "Date", value: escapeHtml(fmtDate(slot.start_time)) },
    { label: "Time", value: escapeHtml(fmtRange(slot.start_time, slot.end_time)) },
    { label: "Professor", value: escapeHtml(slot.professor_name || "Professor") },
    { label: "Course", value: escapeHtml(`${slot.course_code || "COURSE"} - ${slot.course_name || "Course"}`) },
    { label: "Topic", value: escapeHtml(slot.topic || "Office hours discussion") },
    { label: "Mode", value: escapeHtml(slot.mode || "in_person") },
    { label: "Location", value: escapeHtml(slot.location_or_link || "TBA") }
  ]);

  notesNode.textContent = appointment.notes || "No notes provided.";

  if (session.user.role !== "student" || !canCancel) {
    cancelBtn.style.display = "none";
  } else {
    cancelBtn.style.display = "inline-flex";
    cancelBtn.onclick = async () => {
      const confirmed = window.confirm("Cancel this session?");
      if (!confirmed) return;

      setMessage(noticeNode, "Cancelling appointment...", "info");
      const cancelResult = await apiPatch(`/appointments/${appointmentId}/cancel`, {});
      if (!cancelResult.ok) {
        setMessage(noticeNode, cancelResult.message || "Cancel failed.", "error");
        return;
      }
      setMessage(noticeNode, "Appointment cancelled.", "success");
      await loadDetails();
    };
  }

  joinBtn.textContent = isVirtual ? "Join Video Link" : "View Location";
  joinBtn.onclick = () => {
    if (isVirtual && slot.location_or_link) {
      window.open(slot.location_or_link, "_blank", "noopener,noreferrer");
      return;
    }
    setMessage(noticeNode, `Meet at: ${slot.location_or_link || "No location available."}`, "info");
  };
}

await loadDetails();
