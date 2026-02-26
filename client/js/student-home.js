import { apiGet, escapeHtml, fmtDate, fmtRange, initials } from "./api.js";
import { logout, requireAuth } from "./auth.js";

const session = requireAuth("student");
if (!session) throw new Error("No active session");

const avatarNode = document.getElementById("user-avatar");
const welcomeTitle = document.getElementById("welcome-title");
const nextAppointmentNode = document.getElementById("next-appointment");
const recentCoursesNode = document.getElementById("recent-courses");
const quickSearchInput = document.getElementById("quick-search");

avatarNode.textContent = initials(session.user.name);
welcomeTitle.textContent = `Welcome back, ${session.user.name.split(" ")[0]}`;
document.getElementById("logout-btn")?.addEventListener("click", logout);

quickSearchInput?.addEventListener("keydown", event => {
  if (event.key !== "Enter") return;
  const query = quickSearchInput.value.trim();
  window.location.href = `browse-slots.html${query ? `?q=${encodeURIComponent(query)}` : ""}`;
});

function renderNoAppointment() {
  nextAppointmentNode.innerHTML = `
    <div class="session-item card-flat">
      <div class="session-main">
        <div class="line-1"><strong>No upcoming appointment</strong></div>
        <div class="line-2">Book an available slot to see your next session here.</div>
      </div>
      <div><a class="btn-primary" href="browse-slots.html">Browse Slots</a></div>
    </div>
  `;
}

function renderNextAppointment(booking) {
  const slot = booking.slot;
  if (!slot) {
    renderNoAppointment();
    return;
  }

  const isVirtual = String(slot.mode).toLowerCase() === "virtual";
  nextAppointmentNode.innerHTML = `
    <article class="session-item">
      <div class="avatar avatar-teal">${initials(slot.course_code || "OS")}</div>
      <div class="session-main">
        <div class="line-1">
          <strong>${escapeHtml(slot.topic || slot.course_name || "Office Hours")}</strong>
          <span class="badge confirmed">${escapeHtml(booking.status)}</span>
        </div>
        <div class="line-2">${escapeHtml(slot.professor_name || "Professor")} · ${escapeHtml(slot.course_name || "Course")}</div>
        <div class="line-3">${fmtDate(slot.start_time)} · ${fmtRange(slot.start_time, slot.end_time)} (${escapeHtml(slot.mode)})</div>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
        <button id="join-btn" class="btn-primary" type="button">${isVirtual ? "Join Meeting" : "View Details"}</button>
        <a class="btn-ghost" href="my-bookings.html">Reschedule</a>
      </div>
    </article>
  `;

  document.getElementById("join-btn")?.addEventListener("click", () => {
    if (isVirtual && slot.location_or_link) {
      window.open(slot.location_or_link, "_blank", "noopener,noreferrer");
      return;
    }
    window.location.href = `appointment-details.html?id=${booking.appointment_id}`;
  });
}

function renderRecentCourses(courses, bookings) {
  const byCourse = new Map((courses || []).map(item => [item.course_id, item]));
  const seen = new Set();
  const recent = [];

  for (const booking of bookings) {
    const slot = booking.slot;
    if (!slot || seen.has(slot.course_id)) continue;
    seen.add(slot.course_id);
    recent.push(slot);
  }

  if (!recent.length) {
    recentCoursesNode.innerHTML = '<div class="card card-flat">No recent courses yet.</div>';
    return;
  }

  recentCoursesNode.innerHTML = recent
    .slice(0, 3)
    .map(slot => {
      const course = byCourse.get(slot.course_id) || {};
      const code = course.course_code || slot.course_code || "COURSE";
      const name = course.course_name || slot.course_name || "Course";

      return `
        <article class="card card-flat">
          <div class="avatar avatar-purple" style="width:36px; height:36px;">${escapeHtml(initials(code))}</div>
          <h3 style="margin-top:12px;">${escapeHtml(code)}: ${escapeHtml(name)}</h3>
          <p class="subhead" style="margin-top:6px;">${escapeHtml(slot.professor_name || "Professor")}</p>
        </article>
      `;
    })
    .join("");
}

async function loadPage() {
  const [bookingsRes, coursesRes] = await Promise.all([
    apiGet(`/appointments/mine/${session.user.user_id}`),
    apiGet("/courses")
  ]);

  if (!bookingsRes.ok || !coursesRes.ok) {
    renderNoAppointment();
    recentCoursesNode.innerHTML = '<div class="card card-flat">Unable to load course activity.</div>';
    return;
  }

  const bookings = (bookingsRes.bookings || []).filter(item => item.slot);
  const upcoming = bookings
    .filter(item => item.status === "booked" && new Date(item.slot.start_time).getTime() > Date.now())
    .sort((a, b) => new Date(a.slot.start_time) - new Date(b.slot.start_time));

  if (!upcoming.length) {
    renderNoAppointment();
  } else {
    renderNextAppointment(upcoming[0]);
  }

  const recentSorted = [...bookings].sort((a, b) => new Date(b.slot.start_time) - new Date(a.slot.start_time));
  renderRecentCourses(coursesRes.courses, recentSorted);
}

await loadPage();
