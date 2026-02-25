import { apiGet, apiPatch, fmtDT } from "./api.js";
import { requireAuth, logout } from "./auth.js";

const session = requireAuth();
if (session.user.role !== "student") window.location.href = "professor-dashboard.html";

document.getElementById("who").textContent = `${session.user.name} (Student)`;
document.getElementById("logoutBtn").addEventListener("click", logout);

async function refresh() {
  const data = await apiGet(`/appointments/mine/${session.user.user_id}`);
  const tbody = document.getElementById("bookingsBody");
  tbody.innerHTML = "";

  if (!data.bookings?.length) {
    tbody.innerHTML = `<tr><td colspan="6"><small>No bookings yet.</small></td></tr>`;
    return;
  }

  for (const b of data.bookings) {
    const slotRes = await apiGet(`/slots/${b.slot_id}`);
    const s = slotRes.slot;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.course_code}</td>
      <td>${s.professor_name}</td>
      <td>${fmtDT(s.start_time)} → ${fmtDT(s.end_time)}</td>
      <td><span class="badge ${b.status}">${b.status}</span></td>
      <td>
        <button class="btn" data-action="details" data-id="${b.appointment_id}">Details</button>
      </td>
      <td class="row">
        ${b.status === "booked" ? `<button class="btn" data-action="reschedule" data-id="${b.appointment_id}">Reschedule</button>` : ""}
        ${b.status === "booked" ? `<button class="btn danger" data-action="cancel" data-id="${b.appointment_id}">Cancel</button>` : ""}
      </td>
    `;
    tbody.appendChild(tr);
  }

  tbody.querySelectorAll("button[data-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.id);
      const action = btn.dataset.action;
      const box = document.getElementById("notice");

      if (action === "details") {
        window.location.href = `appointment-details.html?id=${id}`;
        return;
      }

      if (action === "cancel") {
        const res = await apiPatch(`/appointments/${id}/cancel`, {});
        if (!res.ok) {
          box.className = "notice error";
          box.textContent = res.message || "Cancel failed.";
        } else {
          box.className = "notice success";
          box.textContent = "Cancelled.";
          await refresh();
        }
        return;
      }

      if (action === "reschedule") {
        const newSlotId = prompt("Enter the NEW slot ID you want (from the Student dashboard list):");
        if (!newSlotId) return;

        const res = await apiPatch(`/appointments/${id}/reschedule`, { new_slot_id: Number(newSlotId) });
        if (!res.ok) {
          box.className = "notice error";
          box.textContent = res.message || "Reschedule failed.";
        } else {
          box.className = "notice success";
          box.textContent = "Rescheduled.";
          await refresh();
        }
      }
    });
  });
}

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "student-dashboard.html";
});

await refresh();