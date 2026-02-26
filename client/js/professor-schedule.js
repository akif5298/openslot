import { apiGet, apiPatch, escapeHtml, fmtDate, fmtRange, initials, setMessage } from "./api.js";
import { logout, requireAuth } from "./auth.js";

const session = requireAuth("professor");
if (!session) throw new Error("No active session");

const avatarNode = document.getElementById("user-avatar");
const logoutBtn = document.getElementById("logout-btn");
const dateInput = document.getElementById("date");
const viewSelect = document.getElementById("view");
const refreshBtn = document.getElementById("refresh");
const publishAllBtn = document.getElementById("publish-all");
const draftListNode = document.getElementById("draft-list");
const rangeLabelNode = document.getElementById("range-label");
const weekGridNode = document.getElementById("week-grid");
const noticeNode = document.getElementById("notice");

avatarNode.textContent = initials(session.user.name);
logoutBtn?.addEventListener("click", logout);

function toYmd(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isSameDate(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function dayLabel(date) {
  return new Date(date).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function getDays(baseDate, view) {
  const base = new Date(`${baseDate}T00:00:00`);
  if (view === "day") return [base];

  const start = new Date(base);
  const day = start.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday);

  const days = [];
  for (let i = 0; i < 5; i += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    days.push(current);
  }
  return days;
}

function renderDrafts(drafts) {
  if (!drafts.length) {
    draftListNode.innerHTML = '<article class="card card-flat">No draft slots.</article>';
    return;
  }

  draftListNode.innerHTML = drafts
    .map(
      slot => `
        <article class="card card-flat">
          <strong>${escapeHtml(dayLabel(slot.start_time))}</strong>
          <p class="subhead">${escapeHtml(fmtRange(slot.start_time, slot.end_time))} · ${escapeHtml(slot.course_code || "COURSE")}</p>
          <div style="display:flex; gap:8px; margin-top:8px;">
            <button class="btn-primary" data-publish="${slot.slot_id}" type="button">Publish</button>
            <button class="btn-danger" data-cancel="${slot.slot_id}" type="button">Cancel</button>
          </div>
        </article>
      `
    )
    .join("");

  draftListNode.querySelectorAll("button[data-publish]").forEach(button => {
    button.addEventListener("click", async () => {
      const slotId = Number(button.getAttribute("data-publish"));
      if (!slotId) return;
      await updateSlotStatus(slotId, "posted");
      await loadPage();
    });
  });

  draftListNode.querySelectorAll("button[data-cancel]").forEach(button => {
    button.addEventListener("click", async () => {
      const slotId = Number(button.getAttribute("data-cancel"));
      if (!slotId) return;
      await updateSlotStatus(slotId, "cancelled");
      await loadPage();
    });
  });
}

function renderSchedule(days, slots) {
  const timeMarks = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM"];
  const timeColumn = `
    <div class="col time-col">
      <div class="day-title">Time</div>
      ${timeMarks.map(mark => `<div class="time-mark">${mark}</div>`).join("")}
    </div>
  `;

  const dayColumns = days
    .map(day => {
      const daySlots = slots
        .filter(slot => isSameDate(slot.start_time, day))
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

      return `
        <div class="col">
          <div class="day-title">${escapeHtml(dayLabel(day))}</div>
          ${
            daySlots.length
              ? daySlots
                  .map(
                    slot => `
                      <div class="event-chip ${slot.booked_by != null ? "booked" : ""}">
                        ${escapeHtml(fmtRange(slot.start_time, slot.end_time))}
                        <br />
                        ${escapeHtml(slot.topic || slot.course_code || "Office Hours")}
                      </div>
                    `
                  )
                  .join("")
              : '<div class="event-chip" style="opacity:.65;">No slots</div>'
          }
        </div>
      `;
    })
    .join("");

  weekGridNode.innerHTML = `${timeColumn}${dayColumns}`;
}

async function updateSlotStatus(slotId, status) {
  setMessage(noticeNode, "Updating slot...", "info");
  const result = await apiPatch(`/slots/${slotId}/status`, { status });
  if (!result.ok) {
    setMessage(noticeNode, result.message || "Failed to update slot.", "error");
    return false;
  }
  setMessage(noticeNode, "Slot updated.", "success");
  return true;
}

async function loadDrafts() {
  const query = new URLSearchParams({
    professorId: String(session.user.user_id),
    includeBooked: "true",
    includePrivate: "true",
    status: "draft"
  });

  const result = await apiGet(`/slots?${query.toString()}`);
  if (!result.ok) {
    setMessage(noticeNode, result.message || "Unable to load drafts.", "error");
    renderDrafts([]);
    return [];
  }

  const drafts = result.slots || [];
  renderDrafts(drafts);
  return drafts;
}

async function loadSchedule() {
  const query = new URLSearchParams({
    view: viewSelect.value,
    date: dateInput.value
  });

  const result = await apiGet(`/schedule/professor/${session.user.user_id}?${query.toString()}`);
  if (!result.ok) {
    setMessage(noticeNode, result.message || "Unable to load schedule.", "error");
    weekGridNode.innerHTML = "";
    return;
  }

  const days = getDays(dateInput.value, viewSelect.value);
  const slots = result.slots || [];
  rangeLabelNode.textContent =
    viewSelect.value === "day"
      ? `Day View · ${fmtDate(days[0])}`
      : `${fmtDate(days[0])} - ${fmtDate(days[days.length - 1])}`;
  renderSchedule(days, slots);
}

async function loadPage() {
  setMessage(noticeNode, "Loading schedule...", "info");
  await Promise.all([loadSchedule(), loadDrafts()]);
  if (noticeNode.textContent === "Loading schedule...") {
    setMessage(noticeNode, "", "info");
  }
}

dateInput.value = toYmd(new Date());

refreshBtn?.addEventListener("click", loadPage);
viewSelect?.addEventListener("change", loadPage);
publishAllBtn?.addEventListener("click", async () => {
  const drafts = await loadDrafts();
  if (!drafts.length) {
    setMessage(noticeNode, "No draft slots to publish.", "info");
    return;
  }

  setMessage(noticeNode, "Publishing all draft slots...", "info");
  for (const slot of drafts) {
    // sequential updates keep status messages deterministic
    // and avoid race conditions in demo in-memory data.
    // eslint-disable-next-line no-await-in-loop
    await apiPatch(`/slots/${slot.slot_id}/status`, { status: "posted" });
  }
  setMessage(noticeNode, "All draft slots were published.", "success");
  await loadPage();
});

await loadPage();
