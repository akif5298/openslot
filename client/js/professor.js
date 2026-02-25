import { apiGet, apiPatch, fmtDT, setMessage } from "./api.js";
import { logout, requireAuth } from "./auth.js";

const session = requireAuth();
if (!session) {
  throw new Error("Missing auth session");
}

if (session.user.role !== "professor") {
  window.location.href = "student-dashboard.html";
}

const welcomeNode = document.getElementById("welcome");
const statusSelect = document.getElementById("status-filter");
const refreshButton = document.getElementById("refresh-button");
const slotsNode = document.getElementById("slots");
const messageNode = document.getElementById("message");

document.querySelector("[data-logout]")?.addEventListener("click", event => {
  event.preventDefault();
  logout();
});

welcomeNode.textContent = `${session.user.name} (${session.user.email})`;

function renderSlots(slots) {
  if (!Array.isArray(slots) || slots.length === 0) {
    slotsNode.innerHTML = '<div class="card"><p class="subtle">No slots found.</p></div>';
    return;
  }

  slotsNode.innerHTML = slots
    .map(slot => {
      const bookedText = slot.booked_by ? `Booked by student #${slot.booked_by}` : "Open";
      return `
      <article class="slot-card">
        <h3 class="slot-title">${slot.course_code} · ${slot.course_name}</h3>
        <p class="meta"><strong>Time:</strong> ${fmtDT(slot.start_time)} → ${fmtDT(slot.end_time)}</p>
        <p class="meta"><strong>Mode:</strong> ${slot.mode}</p>
        <p class="meta"><strong>Status:</strong> <span class="badge ${slot.status}">${slot.status}</span></p>
        <p class="meta"><strong>Booking:</strong> ${bookedText}</p>
        <div class="inline-actions">
          <button class="btn-secondary" data-action="post" data-slot-id="${slot.slot_id}">Post</button>
          <button class="btn-secondary" data-action="draft" data-slot-id="${slot.slot_id}">Draft</button>
          <button class="btn-danger" data-action="cancelled" data-slot-id="${slot.slot_id}">Cancel</button>
        </div>
      </article>
    `;
    })
    .join("");

  slotsNode.querySelectorAll("button[data-slot-id]").forEach(button => {
    button.addEventListener("click", async () => {
      const slotId = Number(button.getAttribute("data-slot-id"));
      const nextStatus = button.getAttribute("data-action");

      setMessage(messageNode, `Updating slot #${slotId}...`, "info");
      const result = await apiPatch(`/slots/${slotId}/status`, { status: nextStatus });

      if (!result.ok) {
        setMessage(messageNode, result.message || "Failed to update slot.", "error");
        return;
      }

      setMessage(messageNode, `Slot #${slotId} updated to ${nextStatus}.`, "success");
      await refreshSlots();
    });
  });
}

async function refreshSlots() {
  const query = new URLSearchParams();
  query.set("professorId", String(session.user.user_id));
  query.set("includeBooked", "true");

  setMessage(messageNode, "Loading slots...", "info");
  const result = await apiGet(`/slots?${query.toString()}`);

  if (!result.ok) {
    setMessage(messageNode, result.message || "Failed to load slots.", "error");
    return;
  }

  let slots = result.slots || [];
  if (statusSelect.value && statusSelect.value !== "all") {
    slots = slots.filter(slot => slot.status === statusSelect.value);
  }

  setMessage(messageNode, "", "info");
  renderSlots(slots);
}

refreshButton?.addEventListener("click", refreshSlots);
statusSelect?.addEventListener("change", refreshSlots);

await refreshSlots();
