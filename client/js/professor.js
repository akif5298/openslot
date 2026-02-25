import { apiGet, apiPatch } from "./api.js";
import { requireAuth, logout } from "./auth.js";
import { fmtDT } from "./api.js";

const session = requireAuth();
if (session.user.role !== "professor") window.location.href = "student-dashboard.html";

document.getElementById("who").textContent = `${session.user.name} (Professor)`;
document.getElementById("logoutBtn").addEventListener("click", logout);

document.getElementById("createBtn").addEventListener("click", () => {
  window.location.href = "slot-create.html";
});

async function refresh() {
  const q = new URLSearchParams();
  q.set("professorId", session.user.user_id);
  q.set("includeBooked", "true");

  const data = await apiGet(`/slots?${q.toString()}`);
  const tbody = document.getElementById("slotsBody");
  tbody.innerHTML = "";

  if (!data.slots?.length) {
    tbody.innerHTML = `<tr><td colspan="7"><small>No slots yet. Create one!</small></td></tr>`;
    return;
  }

  data.slots.forEach(s => {
    const bookedText = s.booked_by ? `Booked (student #${s.booked_by})` : "Open";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.course_code}</td>
      <td>${fmtDT(s.start_time)}</td>
      <td>${fmtDT(s.end_time)}</td>
      <td><span class="badge">${s.mode}</span></td>
      <td><span class="badge ${s.status}">${s.status}</span></td>
      <td><small>${bookedText}</small></td>
      <td class="row">
        <button class="btn primary" data-action="post" data-id="${s.slot_id}">Post</button>
        <button class="btn" data-action="draft" data-id="${s.slot_id}">Draft</button>
        <button class="btn danger" data-action="cancel" data-id="${s.slot_id}">Cancel</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("button[data-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.id);
      const action = btn.dataset.action;
      const status = action === "post" ? "posted" : action === "draft" ? "draft" : "cancelled";

      const res = await apiPatch(`/slots/${id}/status`, { status });
      const box = document.getElementById("notice");
      if (!res.ok) {
        box.className = "notice error";
        box.textContent = res.message || "Update failed.";
      } else {
        box.className = "notice success";
        box.textContent = `Updated slot #${id} → ${status}`;
        await refresh();
      }
    });
  });
}

await refresh();