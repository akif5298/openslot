import { apiGet, escapeHtml, initials } from "./api.js";
import { logout, requireAuth } from "./auth.js";

const session = requireAuth("professor");
if (!session) throw new Error("No active session");

const avatarNode = document.getElementById("user-avatar");
const logoutBtn = document.getElementById("logout-btn");
const courseCountNode = document.getElementById("course-count");
const coursesGrid = document.getElementById("courses-grid");

avatarNode.textContent = initials(session.user.name);
logoutBtn?.addEventListener("click", logout);

function formatSchedule(slots) {
  if (!slots.length) return "No schedule yet";
  const first = new Date(slots[0].start_time);
  const weekdays = new Set(
    slots.map(slot =>
      new Date(slot.start_time).toLocaleDateString([], {
        weekday: "short"
      })
    )
  );
  const start = first.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const end = new Date(slots[0].end_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${Array.from(weekdays).join(", ")} · ${start} - ${end}`;
}

function renderCourses(courses, slots) {
  const slotsByCourse = new Map();
  for (const slot of slots) {
    const list = slotsByCourse.get(slot.course_id) || [];
    list.push(slot);
    slotsByCourse.set(slot.course_id, list);
  }

  const visibleCourses = courses.filter(course => slotsByCourse.has(course.course_id));
  courseCountNode.textContent = `Managing ${visibleCourses.length} active course${
    visibleCourses.length === 1 ? "" : "s"
  } this semester.`;

  if (!visibleCourses.length) {
    coursesGrid.innerHTML = '<article class="card card-flat">No courses assigned to this professor yet.</article>';
    return;
  }

  coursesGrid.innerHTML = visibleCourses
    .map(course => {
      const courseSlots = slotsByCourse.get(course.course_id) || [];
      const activeSlots = courseSlots.filter(slot => slot.status === "posted").length;
      const bookedSessions = courseSlots.filter(slot => slot.booked_by != null).length;

      return `
        <article class="card">
          <div class="section-title">
            <h3>${escapeHtml(course.course_code)}: ${escapeHtml(course.course_name)}</h3>
            <span class="badge completed">active</span>
          </div>
          <p class="subhead">${escapeHtml(formatSchedule(courseSlots))}</p>
          <p class="meta" style="margin-top: 12px; color: var(--text-soft); font-weight: 700;">${activeSlots} active office-hour slots</p>
          <p class="meta" style="color: var(--text-soft); font-weight: 700;">${bookedSessions} booked sessions</p>
          <div style="display:flex; gap:8px; margin-top:12px;">
            <a class="btn-outline" href="professor-schedule.html">View Schedule</a>
            <button class="btn-ghost" type="button" disabled>Manage Students</button>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadPage() {
  const [coursesRes, slotsRes] = await Promise.all([
    apiGet("/courses"),
    apiGet(
      `/slots?${new URLSearchParams({
        professorId: String(session.user.user_id),
        includeBooked: "true",
        includePrivate: "true"
      }).toString()}`
    )
  ]);

  if (!coursesRes.ok || !slotsRes.ok) {
    const message = coursesRes.message || slotsRes.message || "Unable to load course data.";
    courseCountNode.textContent = message;
    coursesGrid.innerHTML = '<article class="card card-flat">Unable to load course cards.</article>';
    return;
  }

  renderCourses(coursesRes.courses || [], slotsRes.slots || []);
}

await loadPage();
