import {
  apiRequest,
  attachLogoutButtons,
  escapeHtml,
  requireSession,
  setMessage,
  toDisplayDateTime
} from "./api.js";

const session = requireSession("student");

const welcomeNode = document.getElementById("welcome");
const bookingsNode = document.getElementById("bookings");
const messageNode = document.getElementById("message");

function canChange(slotStart, status) {
  if (status !== "booked") return false;
  return Date.now() < new Date(slotStart).getTime();
}

function toStatusBadge(status) {
  const key = (status || "").toLowerCase();
  const klass = `badge-${key === "booked" ? "upcoming" : key}`;
  return `<span class="badge ${klass}">${escapeHtml(status)}</span>`;
}

function renderBookings(bookings) {
  if (!bookings.length) {
    bookingsNode.innerHTML = '<div class="card"><p class="subtle">No bookings yet.</p></div>';
    return;
  }

  bookingsNode.innerHTML = bookings
    .map(booking => {
      const slot = booking.slot || {};
      const changeAllowed = canChange(slot.start_time, booking.status);

      return `
      <article class="slot-card">
        <h3 class="slot-title">${escapeHtml(slot.course_code || "Course")} · ${escapeHtml(slot.course_name || "")}</h3>
        <p class="meta"><strong>Professor:</strong> ${escapeHtml(slot.professor_name || "")}</p>
        <p class="meta"><strong>When:</strong> ${escapeHtml(toDisplayDateTime(slot.start_time || ""))} - ${escapeHtml(
        toDisplayDateTime(slot.end_time || "")
      )}</p>
        <p class="meta"><strong>Mode:</strong> ${escapeHtml(slot.mode || "")}</p>
        <p class="meta"><strong>Location/Link:</strong> ${escapeHtml(slot.location_or_link || "TBA")}</p>
        <p class="meta"><strong>Status:</strong> ${toStatusBadge(booking.status)}</p>
        <div class="inline-actions">
          <a class="btn btn-link" href="appointment-details.html?appointmentId=${booking.appointment_id}">View Details</a>
          <button class="btn-danger" data-cancel="${booking.appointment_id}" ${
        changeAllowed ? "" : "disabled"
      }>Cancel</button>
          <button class="btn-secondary" data-reschedule="${booking.appointment_id}" data-course="${
        slot.course_id || ""
      }" ${changeAllowed ? "" : "disabled"}>Reschedule</button>
        </div>
      </article>
    `;
    })
    .join("");
}

async function loadBookings() {
  setMessage(messageNode, "Loading bookings...", "info");
  const payload = await apiRequest(`/appointments/mine/${session.user.user_id}`);
  renderBookings(payload.bookings);
  setMessage(messageNode, "", "info");
}

async function cancelBooking(appointmentId) {
  await apiRequest(`/appointments/${appointmentId}/cancel`, { method: "PATCH" });
}

async function rescheduleBooking(appointmentId, courseId) {
  const params = new URLSearchParams({ includeBooked: "false" });
  if (courseId) params.set("courseId", String(courseId));

  const openSlotsPayload = await apiRequest(`/slots?${params.toString()}`);
  const slots = openSlotsPayload.slots;

  if (!slots.length) {
    throw new Error("No open slots available to reschedule right now.");
  }

  const choicePrompt = slots
    .slice(0, 8)
    .map(
      slot =>
        `${slot.slot_id}: ${slot.course_code} ${toDisplayDateTime(slot.start_time)} (${slot.professor_name})`
    )
    .join("\n");

  const userInput = window.prompt(
    `Enter new slot ID:\n\n${choicePrompt}\n\n(Only first 8 options shown)`,
    String(slots[0].slot_id)
  );

  if (!userInput) return;
  const newSlotId = Number(userInput);
  if (!Number.isFinite(newSlotId)) {
    throw new Error("Invalid slot ID for reschedule.");
  }

  await apiRequest(`/appointments/${appointmentId}/reschedule`, {
    method: "PATCH",
    body: { new_slot_id: newSlotId }
  });
}

function attachEvents() {
  bookingsNode.addEventListener("click", async event => {
    const cancelButton = event.target.closest("button[data-cancel]");
    const rescheduleButton = event.target.closest("button[data-reschedule]");

    try {
      if (cancelButton) {
        const appointmentId = cancelButton.getAttribute("data-cancel");
        if (!appointmentId) return;

        const confirmed = window.confirm("Cancel this appointment?");
        if (!confirmed) return;

        setMessage(messageNode, "Cancelling appointment...", "info");
        await cancelBooking(appointmentId);
        await loadBookings();
        setMessage(messageNode, "Appointment cancelled.", "success");
        return;
      }

      if (rescheduleButton) {
        const appointmentId = rescheduleButton.getAttribute("data-reschedule");
        const courseId = rescheduleButton.getAttribute("data-course");
        if (!appointmentId) return;

        setMessage(messageNode, "Loading open slots for reschedule...", "info");
        await rescheduleBooking(appointmentId, courseId);
        await loadBookings();
        setMessage(messageNode, "Appointment rescheduled.", "success");
      }
    } catch (error) {
      setMessage(messageNode, error.message, "error");
    }
  });
}

async function init() {
  if (!session) return;

  attachLogoutButtons();
  welcomeNode.textContent = `Signed in as ${session.user.name} (${session.user.email})`;
  attachEvents();

  try {
    await loadBookings();
  } catch (error) {
    setMessage(messageNode, error.message, "error");
  }
}

init();
