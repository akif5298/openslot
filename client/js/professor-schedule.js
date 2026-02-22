import {
  apiRequest,
  attachLogoutButtons,
  escapeHtml,
  requireSession,
  setMessage,
  toDateInputValue,
  toDisplayDateTime
} from "./api.js";

const session = requireSession("professor");

const viewSelect = document.getElementById("view");
const dateInput = document.getElementById("date");
const refreshButton = document.getElementById("refresh");
const summaryNode = document.getElementById("summary");
const scheduleNode = document.getElementById("schedule");
const messageNode = document.getElementById("message");

function badge(slot) {
  if (slot.is_booked) return '<span class="badge badge-booked">booked</span>';
  return `<span class="badge badge-${escapeHtml(slot.status)}">${escapeHtml(slot.status)}</span>`;
}

function renderSummary(summary) {
  summaryNode.innerHTML = `
    <div class="kv"><p>Total Slots</p><h4>${summary.total}</h4></div>
    <div class="kv"><p>Open</p><h4>${summary.open}</h4></div>
    <div class="kv"><p>Booked</p><h4>${summary.booked}</h4></div>
    <div class="kv"><p>Draft</p><h4>${summary.draft}</h4></div>
    <div class="kv"><p>Cancelled</p><h4>${summary.cancelled}</h4></div>
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
        <h3 class="slot-title">${escapeHtml(slot.course_code)} · ${escapeHtml(slot.course_name)}</h3>
        <p class="meta"><strong>When:</strong> ${escapeHtml(toDisplayDateTime(slot.start_time))} - ${escapeHtml(
        toDisplayDateTime(slot.end_time)
      )}</p>
        <p class="meta"><strong>Mode:</strong> ${escapeHtml(slot.mode)} | <strong>Location/Link:</strong> ${escapeHtml(
        slot.location_or_link || "TBA"
      )}</p>
        <p class="meta"><strong>Status:</strong> ${badge(slot)}</p>
      </article>
    `
    )
    .join("");
}

async function loadSchedule() {
  const params = new URLSearchParams({
    view: viewSelect.value,
    date: dateInput.value
  });

  setMessage(messageNode, "Loading schedule...", "info");
  const payload = await apiRequest(`/schedule/professor/${session.user.user_id}?${params.toString()}`);

  renderSummary(payload.summary);
  renderSchedule(payload.slots);
  setMessage(messageNode, "", "info");
}

function attachEvents() {
  refreshButton.addEventListener("click", async () => {
    try {
      await loadSchedule();
    } catch (error) {
      setMessage(messageNode, error.message, "error");
    }
  });

  viewSelect.addEventListener("change", async () => {
    try {
      await loadSchedule();
    } catch (error) {
      setMessage(messageNode, error.message, "error");
    }
  });
}

async function init() {
  if (!session) return;

  attachLogoutButtons();
  dateInput.value = toDateInputValue(new Date());
  attachEvents();

  try {
    await loadSchedule();
  } catch (error) {
    setMessage(messageNode, error.message, "error");
  }
}

init();
