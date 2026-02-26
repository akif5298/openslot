import { apiGet, apiPatch, escapeHtml, fmtDate, fmtRange, initials, setMessage } from "./api.js";
import { logout, requireAuth } from "./auth.js";

const session = requireAuth("student");
if (!session) throw new Error("No active session");

const avatarNode = document.getElementById("user-avatar");
const logoutBtn = document.getElementById("logout-btn");
const upcomingList = document.getElementById("upcoming-list");
const pastList = document.getElementById("past-list");
const noticeNode = document.getElementById("notice");

avatarNode.textContent = initials(session.user.name);
logoutBtn?.addEventListener("click", logout);

function renderSection(node, bookings, past = false) {
  if (!bookings.length) {
    node.innerHTML = `<article class="card card-flat">${past ? "No past sessions yet." : "No upcoming sessions yet."}</article>`;
    return;
  }

  node.innerHTML = bookings
    .map(booking => {
      const slot = booking.slot || {};
      const canEdit = booking.status === "booked" && new Date(slot.start_time).getTime() > Date.now();
      const course = `${slot.course_code || "COURSE"} ${slot.course_name ? `· ${slot.course_name}` : ""}`;
      return `
        <article class="session-item">
          <div class="avatar">${escapeHtml(initials(slot.professor_name || "P"))}</div>
          <div class="session-main">
            <div class="line-1">
              <strong>${escapeHtml(slot.professor_name || "Professor")}</strong>
              <span class="badge ${escapeHtml(booking.status)}">${escapeHtml(booking.status)}</span>
            </div>
            <div class="line-2">${escapeHtml(course)}</div>
            <div class="line-3">${fmtDate(slot.start_time)} · ${fmtRange(slot.start_time, slot.end_time)}</div>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
            <a class="btn-outline" href="appointment-details.html?id=${booking.appointment_id}">View Details</a>
            ${
              canEdit
                ? `<button class="btn-ghost" data-action="reschedule" data-id="${booking.appointment_id}" type="button">Reschedule</button>
                   <button class="btn-danger" data-action="cancel" data-id="${booking.appointment_id}" type="button">Cancel</button>`
                : ""
            }
          </div>
        </article>
      `;
    })
    .join("");

  node.querySelectorAll("button[data-action='cancel']").forEach(button => {
    button.addEventListener("click", async () => {
      const appointmentId = Number(button.getAttribute("data-id"));
      if (!appointmentId) return;

      const confirmed = window.confirm("Cancel this session?");
      if (!confirmed) return;

      setMessage(noticeNode, "Cancelling appointment...", "info");
      const result = await apiPatch(`/appointments/${appointmentId}/cancel`, {});
      if (!result.ok) {
        setMessage(noticeNode, result.message || "Cancel failed.", "error");
        return;
      }
      setMessage(noticeNode, "Appointment cancelled.", "success");
      await loadBookings();
    });
  });

  node.querySelectorAll("button[data-action='reschedule']").forEach(button => {
    button.addEventListener("click", () => {
      const appointmentId = Number(button.getAttribute("data-id"));
      if (!appointmentId) return;
      window.location.href = `browse-slots.html?reschedule=${appointmentId}`;
    });
  });
}

async function loadBookings() {
  setMessage(noticeNode, "Loading bookings...", "info");
  const result = await apiGet(`/appointments/mine/${session.user.user_id}`);
  if (!result.ok) {
    setMessage(noticeNode, result.message || "Unable to load bookings.", "error");
    return;
  }

  setMessage(noticeNode, "", "info");
  const bookings = (result.bookings || []).filter(item => item.slot);
  const now = Date.now();

  const upcoming = bookings
    .filter(item => item.status === "booked" && new Date(item.slot.start_time).getTime() > now)
    .sort((a, b) => new Date(a.slot.start_time) - new Date(b.slot.start_time));

  const past = bookings
    .filter(item => item.status !== "booked" || new Date(item.slot.start_time).getTime() <= now)
    .sort((a, b) => new Date(b.slot.start_time) - new Date(a.slot.start_time));

  renderSection(upcomingList, upcoming, false);
  renderSection(pastList, past, true);
}

await loadBookings();
