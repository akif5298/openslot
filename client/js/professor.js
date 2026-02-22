import {
  apiRequest,
  attachLogoutButtons,
  escapeHtml,
  requireSession,
  setMessage,
  toDisplayDateTime
} from "./api.js";

const session = requireSession("professor");

const welcomeNode = document.getElementById("welcome");
const statusSelect = document.getElementById("status-filter");
const refreshButton = document.getElementById("refresh-button");
const slotsNode = document.getElementById("slots");
const messageNode = document.getElementById("message");

function badge(status, isBooked) {
  if (isBooked && status === "posted") return '<span class="badge badge-booked">booked</span>';
  const key = String(status || "").toLowerCase();
  return `<span class="badge badge-${escapeHtml(key)}">${escapeHtml(status)}</span>`;
}

function renderSlots(slots) {
  if (!slots.length) {
    slotsNode.innerHTML = '<div class="card"><p class="subtle">No slots found for this filter.</p></div>';
    return;
  }

  slotsNode.innerHTML = slots
    .map(
      slot => `
      <article class="slot-card" data-slot="${slot.slot_id}">
        <h3 class="slot-title">${escapeHtml(slot.course_code)} · ${escapeHtml(slot.course_name)}</h3>
        <p class="meta"><strong>When:</strong> ${escapeHtml(toDisplayDateTime(slot.start_time))} - ${escapeHtml(
        toDisplayDateTime(slot.end_time)
      )}</p>
        <p class="meta"><strong>Mode:</strong> ${escapeHtml(slot.mode)} | <strong>Visibility:</strong> ${escapeHtml(
        slot.visibility
      )}</p>
        <p class="meta"><strong>Location/Link:</strong> ${escapeHtml(slot.location_or_link || "TBA")}</p>
        <p class="meta"><strong>Status:</strong> ${badge(slot.status, slot.is_booked)}</p>
        <p class="meta"><strong>Booked By:</strong> ${slot.booked_by ? `Student #${escapeHtml(slot.booked_by)}` : "Open"}</p>
        <div class="inline-actions">
          <a class="btn btn-link" href="slot-create.html?slotId=${slot.slot_id}">Edit</a>
          <button class="btn-secondary" data-post="${slot.slot_id}" ${
        slot.status === "posted" ? "disabled" : ""
      }>Post</button>
          <button class="btn-secondary" data-draft="${slot.slot_id}" ${
        slot.status === "draft" ? "disabled" : ""
      }>Move to Draft</button>
          <button class="btn-danger" data-cancel="${slot.slot_id}" ${
        slot.status === "cancelled" ? "disabled" : ""
      }>Cancel Slot</button>
        </div>
      </article>
    `
    )
    .join("");
}

async function loadSlots() {
  const params = new URLSearchParams({
    professorId: String(session.user.user_id),
    includeBooked: "true",
    includePrivate: "true"
  });

  if (statusSelect.value !== "all") {
    params.set("status", statusSelect.value);
  }

  setMessage(messageNode, "Loading slots...", "info");
  const payload = await apiRequest(`/slots?${params.toString()}`);
  renderSlots(payload.slots);
  setMessage(messageNode, "", "info");
}

async function updateSlotStatus(slotId, status) {
  await apiRequest(`/slots/${slotId}/status`, {
    method: "PATCH",
    body: { status }
  });
}

function attachEvents() {
  refreshButton.addEventListener("click", async () => {
    try {
      await loadSlots();
    } catch (error) {
      setMessage(messageNode, error.message, "error");
    }
  });

  statusSelect.addEventListener("change", async () => {
    try {
      await loadSlots();
    } catch (error) {
      setMessage(messageNode, error.message, "error");
    }
  });

  slotsNode.addEventListener("click", async event => {
    const postButton = event.target.closest("button[data-post]");
    const draftButton = event.target.closest("button[data-draft]");
    const cancelButton = event.target.closest("button[data-cancel]");

    try {
      if (postButton) {
        const slotId = postButton.getAttribute("data-post");
        await updateSlotStatus(slotId, "posted");
        await loadSlots();
        setMessage(messageNode, "Slot posted.", "success");
      }

      if (draftButton) {
        const slotId = draftButton.getAttribute("data-draft");
        await updateSlotStatus(slotId, "draft");
        await loadSlots();
        setMessage(messageNode, "Slot moved to draft.", "success");
      }

      if (cancelButton) {
        const slotId = cancelButton.getAttribute("data-cancel");
        if (!window.confirm("Cancel this slot? If booked, the booking will be cancelled.")) return;
        await updateSlotStatus(slotId, "cancelled");
        await loadSlots();
        setMessage(messageNode, "Slot cancelled.", "success");
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
    await loadSlots();
  } catch (error) {
    setMessage(messageNode, error.message, "error");
  }
}

init();
