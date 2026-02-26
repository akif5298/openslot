import { apiGet, apiPatch, apiPost, escapeHtml, fmtDate, fmtRange, initials, setMessage } from "./api.js";
import { logout, requireAuth } from "./auth.js";

const session = requireAuth("student");
if (!session) throw new Error("No active session");

const avatarNode = document.getElementById("user-avatar");
const logoutBtn = document.getElementById("logout-btn");
const searchInput = document.getElementById("search-input");
const courseFilter = document.getElementById("course-filter");
const dateFilter = document.getElementById("date-filter");
const applyFiltersBtn = document.getElementById("apply-filters");
const slotsGrid = document.getElementById("slots-grid");
const noticeNode = document.getElementById("notice");

avatarNode.textContent = initials(session.user.name);
logoutBtn?.addEventListener("click", logout);

const params = new URLSearchParams(window.location.search);
const rescheduleAppointmentId = Number(params.get("reschedule") || 0);
const initialQuery = params.get("q") || "";
if (initialQuery) searchInput.value = initialQuery;

let allCourses = [];
let currentSlots = [];

function noResults(message) {
  slotsGrid.innerHTML = `<article class="card card-flat">${escapeHtml(message)}</article>`;
}

function normalize(text) {
  return String(text || "").trim().toLowerCase();
}

function filterSlots(slots) {
  const query = normalize(searchInput.value);
  if (!query) return slots;

  return slots.filter(slot => {
    const haystack = [
      slot.course_code,
      slot.course_name,
      slot.topic,
      slot.professor_name,
      slot.professor_department,
      slot.location_or_link
    ]
      .map(normalize)
      .join(" ");

    return haystack.includes(query);
  });
}

function renderSlots(slots) {
  if (!slots.length) {
    noResults("No available slots match your filters.");
    return;
  }

  slotsGrid.innerHTML = slots
    .map(
      slot => `
        <article class="slot-card">
          <div class="section-title">
            <h3>${escapeHtml(slot.professor_name || "Professor")}</h3>
            <span class="badge posted">${escapeHtml(slot.course_code || "COURSE")}</span>
          </div>
          <p class="meta">${escapeHtml(slot.course_name || "Course")}</p>
          <p class="meta">Date: ${fmtDate(slot.start_time)}</p>
          <p class="meta">Time: ${fmtRange(slot.start_time, slot.end_time)}</p>
          <p class="meta">Location: ${escapeHtml(slot.location_or_link || "TBA")}</p>
          <div class="slot-footer">
            <small class="subhead">${escapeHtml(slot.mode || "in_person")}</small>
            <button class="btn-primary" data-book-slot="${slot.slot_id}" type="button">
              ${rescheduleAppointmentId ? "Reschedule To This Slot" : "Book Slot"}
            </button>
          </div>
        </article>
      `
    )
    .join("");

  slotsGrid.querySelectorAll("button[data-book-slot]").forEach(button => {
    button.addEventListener("click", async () => {
      const slotId = Number(button.getAttribute("data-book-slot"));
      if (!slotId) return;

      if (rescheduleAppointmentId) {
        setMessage(noticeNode, "Rescheduling appointment...", "info");
        const result = await apiPatch(`/appointments/${rescheduleAppointmentId}/reschedule`, {
          new_slot_id: slotId
        });
        if (!result.ok) {
          setMessage(noticeNode, result.message || "Reschedule failed.", "error");
          return;
        }
        setMessage(noticeNode, "Rescheduled. Redirecting to My Bookings...", "success");
        window.setTimeout(() => {
          window.location.href = "my-bookings.html";
        }, 700);
        return;
      }

      const notes = window.prompt("Optional note for professor:", "") ?? "";
      setMessage(noticeNode, "Booking slot...", "info");
      const result = await apiPost("/appointments", {
        slot_id: slotId,
        student_id: session.user.user_id,
        notes
      });

      if (!result.ok) {
        setMessage(noticeNode, result.message || "Booking failed.", "error");
        return;
      }

      setMessage(noticeNode, "Booking confirmed. Check My Bookings.", "success");
      await loadSlots();
    });
  });
}

async function loadCourses() {
  const result = await apiGet("/courses");
  if (!result.ok) {
    setMessage(noticeNode, result.message || "Unable to load courses.", "error");
    return;
  }

  allCourses = result.courses || [];
  courseFilter.innerHTML = '<option value="">All Courses</option>';
  for (const course of allCourses) {
    const option = document.createElement("option");
    option.value = String(course.course_id);
    option.textContent = `${course.course_code} - ${course.course_name}`;
    courseFilter.appendChild(option);
  }
}

async function loadSlots() {
  const query = new URLSearchParams();
  if (courseFilter.value) query.set("courseId", courseFilter.value);
  if (dateFilter.value) query.set("date", dateFilter.value);

  setMessage(noticeNode, "Loading slots...", "info");
  const result = await apiGet(`/slots?${query.toString()}`);
  if (!result.ok) {
    setMessage(noticeNode, result.message || "Unable to load slots.", "error");
    noResults("Could not load slots.");
    return;
  }

  setMessage(
    noticeNode,
    rescheduleAppointmentId
      ? `Select a new slot to reschedule appointment #${rescheduleAppointmentId}.`
      : "",
    "info"
  );

  currentSlots = result.slots || [];
  renderSlots(filterSlots(currentSlots));
}

applyFiltersBtn?.addEventListener("click", loadSlots);
searchInput?.addEventListener("input", () => {
  renderSlots(filterSlots(currentSlots));
});
searchInput?.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    renderSlots(filterSlots(currentSlots));
  }
});

await loadCourses();
await loadSlots();
