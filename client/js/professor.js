import { apiGet, escapeHtml, fmtDate, fmtRange, initials, setMessage } from "./api.js";
import { logout, requireAuth } from "./auth.js";

const session = requireAuth("professor");
if (!session) throw new Error("No active session");

const avatarNode = document.getElementById("user-avatar");
const logoutBtn = document.getElementById("logout-btn");
const helloTitle = document.getElementById("hello-title");
const bookedCount = document.getElementById("booked-count");
const upcomingSessionsNode = document.getElementById("upcoming-sessions");
const openSlotsNode = document.getElementById("open-slots");
const noticeNode = document.getElementById("notice");

avatarNode.textContent = initials(session.user.name);
helloTitle.textContent = `Hello, ${session.user.name}`;
logoutBtn?.addEventListener("click", logout);

function isSameDate(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function renderUpcomingBooked(slots) {
  if (!slots.length) {
    upcomingSessionsNode.innerHTML = '<article class="card card-flat">No booked sessions coming up.</article>';
    return;
  }

  upcomingSessionsNode.innerHTML = slots
    .map(
      slot => `
        <article class="session-item">
          <div class="avatar avatar-blue">${escapeHtml(initials(slot.booked_student_name || "S"))}</div>
          <div class="session-main">
            <div class="line-1"><strong>${escapeHtml(slot.booked_student_name || "Student")}</strong></div>
            <div class="line-2">${escapeHtml(slot.topic || slot.course_name || "Office Hours")}</div>
            <div class="line-3">${fmtDate(slot.start_time)} · ${fmtRange(slot.start_time, slot.end_time)}</div>
          </div>
          <div><a class="btn-outline" href="professor-schedule.html">View Schedule</a></div>
        </article>
      `
    )
    .join("");
}

function renderOpenSlots(slots) {
  if (!slots.length) {
    openSlotsNode.innerHTML = '<article class="card card-flat">No open slots currently posted.</article>';
    return;
  }

  openSlotsNode.innerHTML = slots
    .map(
      slot => `
        <article class="slot-card">
          <div class="section-title">
            <strong>${escapeHtml(fmtDate(slot.start_time))}</strong>
            <span class="badge posted">${escapeHtml(slot.course_code || "COURSE")}</span>
          </div>
          <p class="meta">${escapeHtml(fmtRange(slot.start_time, slot.end_time))}</p>
          <p class="meta">${escapeHtml(slot.topic || slot.course_name || "Office Hours")}</p>
          <p class="meta">${slot.mode === "virtual" ? "Virtual meeting" : escapeHtml(slot.location_or_link)}</p>
          <div class="slot-footer"><small class="subhead">1 slot remaining</small></div>
        </article>
      `
    )
    .join("");
}

async function loadDashboard() {
  setMessage(noticeNode, "Loading dashboard...", "info");
  const result = await apiGet(
    `/slots?${new URLSearchParams({
      professorId: String(session.user.user_id),
      includeBooked: "true",
      includePrivate: "true"
    }).toString()}`
  );

  if (!result.ok) {
    setMessage(noticeNode, result.message || "Unable to load dashboard data.", "error");
    return;
  }

  setMessage(noticeNode, "", "info");
  const now = Date.now();
  const slots = result.slots || [];

  const upcomingBooked = slots
    .filter(slot => slot.booked_by != null && new Date(slot.start_time).getTime() > now && slot.status === "posted")
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const openSlots = slots
    .filter(slot => slot.booked_by == null && slot.status === "posted" && new Date(slot.start_time).getTime() > now)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .slice(0, 3);

  const todayBooked = upcomingBooked.filter(slot => isSameDate(slot.start_time, new Date())).length;
  bookedCount.textContent = `You have ${todayBooked} session${todayBooked === 1 ? "" : "s"} booked for today.`;

  renderUpcomingBooked(upcomingBooked.slice(0, 5));
  renderOpenSlots(openSlots);
}

await loadDashboard();
