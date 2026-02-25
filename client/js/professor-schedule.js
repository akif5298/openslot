import { apiGet, fmtDT, setMessage } from "./api.js";
import { logout, requireAuth } from "./auth.js";

const session = requireAuth();
if (!session) {
  throw new Error("Missing auth session");
}

if (session.user.role !== "professor") {
  window.location.href = "student-dashboard.html";
}

const viewSelect = document.getElementById("view");
const dateInput = document.getElementById("date");
const refreshButton = document.getElementById("refresh");
const summaryNode = document.getElementById("summary");
const scheduleNode = document.getElementById("schedule");
const messageNode = document.getElementById("message");

document.querySelector("[data-logout]")?.addEventListener("click", event => {
  event.preventDefault();
  logout();
});

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

function renderSummary(slots) {
  const total = slots.length;
  const booked = slots.filter(slot => slot.booked).length;
  const open = slots.filter(slot => !slot.booked && slot.status === "posted").length;
  const draft = slots.filter(slot => slot.status === "draft").length;
  const cancelled = slots.filter(slot => slot.status === "cancelled").length;

  summaryNode.innerHTML = `
    <div class="kv"><p>Total</p><h4>${total}</h4></div>
    <div class="kv"><p>Booked</p><h4>${booked}</h4></div>
    <div class="kv"><p>Open</p><h4>${open}</h4></div>
    <div class="kv"><p>Draft</p><h4>${draft}</h4></div>
    <div class="kv"><p>Cancelled</p><h4>${cancelled}</h4></div>
  `;
}

function renderSchedule(slots) {
  if (!slots.length) {
    scheduleNode.innerHTML = '<div class="card"><p class="subtle">No slots in this date range.</p></div>';
    return;
  }

  scheduleNode.innerHTML = slots
    .map(
      slot => `
      <article class="slot-card">
        <h3 class="slot-title">${slot.course_code || "COURSE"}</h3>
        <p class="meta"><strong>Time:</strong> ${fmtDT(slot.start_time)} → ${fmtDT(slot.end_time)}</p>
        <p class="meta"><strong>Status:</strong> <span class="badge ${slot.status}">${slot.status}</span></p>
        <p class="meta"><strong>Booked:</strong> ${slot.booked ? "Yes" : "No"}</p>
      </article>
    `
    )
    .join("");
}

async function loadSchedule() {
  const query = new URLSearchParams({
    view: viewSelect.value,
    date: dateInput.value
  });

  setMessage(messageNode, "Loading schedule...", "info");
  const result = await apiGet(`/schedule/professor/${session.user.user_id}?${query.toString()}`);

  if (!result.ok) {
    setMessage(messageNode, result.message || "Failed to load schedule.", "error");
    return;
  }

  setMessage(messageNode, "", "info");
  const slots = result.slots || [];
  renderSummary(slots);
  renderSchedule(slots);
}

dateInput.value = todayYmd();
refreshButton?.addEventListener("click", loadSchedule);
viewSelect?.addEventListener("change", loadSchedule);

await loadSchedule();
