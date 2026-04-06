import {
  apiGet,
  apiPost,
  escapeHtml,
  fmtDate,
  fmtRange,
  initials,
  setMessage
} from "./api.js";
import { logout, requireAuth } from "./auth.js";

const session = requireAuth("student");
if (!session) throw new Error("No active session");

const avatarNode = document.getElementById("user-avatar");
const logoutBtn = document.getElementById("logout-btn");
const summaryNode = document.getElementById("booking-summary-body");
const form = document.getElementById("confirm-form");
const notesInput = document.getElementById("booking-notes");
const noticeNode = document.getElementById("notice");
const confirmBtn = document.getElementById("confirm-btn");

avatarNode.textContent = initials(session.user.name);
logoutBtn?.addEventListener("click", logout);

const params = new URLSearchParams(window.location.search);
const slotId = Number(params.get("slotId") || 0);
let activeSlot = null;

function renderMissingSlot(message) {
  summaryNode.innerHTML = `<div class="card card-flat">${escapeHtml(message)}</div>`;
  confirmBtn.disabled = true;
}

function renderSlot(slot) {
  summaryNode.innerHTML = `
    <div class="section-title">
      <div>
        <p class="subhead" style="margin: 0;">Upcoming Meeting</p>
        <h2 style="margin-top: 8px;">${escapeHtml(slot.topic || "Office Hours Session")}</h2>
      </div>
      <span class="badge posted">${escapeHtml(slot.course_code || "COURSE")}</span>
    </div>
    <p class="subhead">${escapeHtml(slot.professor_name || "Professor")} · ${escapeHtml(slot.professor_department || "Department")}</p>
    <div class="grid grid-2" style="margin-top: 12px;">
      <div class="card card-flat">
        <strong>Date</strong>
        <p class="subhead">${escapeHtml(fmtDate(slot.start_time))}</p>
      </div>
      <div class="card card-flat">
        <strong>Time</strong>
        <p class="subhead">${escapeHtml(fmtRange(slot.start_time, slot.end_time))}</p>
      </div>
      <div class="card card-flat">
        <strong>Mode</strong>
        <p class="subhead">${escapeHtml(slot.mode === "virtual" ? "Virtual Meeting" : "In Person")}</p>
      </div>
      <div class="card card-flat">
        <strong>Location</strong>
        <p class="subhead">${escapeHtml(slot.location_or_link || "TBA")}</p>
      </div>
    </div>
  `;
}

async function loadSlot() {
  if (!slotId) {
    renderMissingSlot("Missing slot id in the page URL.");
    setMessage(noticeNode, "Select a slot from Browse Slots first.", "error");
    return;
  }

  setMessage(noticeNode, "Loading slot details...", "info");
  const result = await apiGet(`/slots/${slotId}`);
  if (!result.ok) {
    renderMissingSlot("This slot is unavailable.");
    setMessage(noticeNode, result.message || "Unable to load slot details.", "error");
    return;
  }

  activeSlot = result.slot;
  renderSlot(activeSlot);
  setMessage(noticeNode, "", "info");
}

form?.addEventListener("submit", async event => {
  event.preventDefault();

  if (!activeSlot) {
    setMessage(noticeNode, "This slot is no longer available.", "error");
    return;
  }

  confirmBtn.disabled = true;
  setMessage(noticeNode, "Confirming booking...", "info");
  const result = await apiPost("/appointments", {
    slot_id: activeSlot.slot_id,
    student_id: session.user.user_id,
    notes: notesInput.value.trim()
  });

  confirmBtn.disabled = false;
  if (!result.ok) {
    setMessage(noticeNode, result.message || "Booking failed.", "error");
    return;
  }

  setMessage(noticeNode, "Booking confirmed. Redirecting to session details...", "success");
  window.setTimeout(() => {
    window.location.href = `appointment-details.html?id=${result.appointment.appointment_id}`;
  }, 700);
});

await loadSlot();
