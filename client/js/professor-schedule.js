import { apiGet, fmtDT } from "./api.js";
import { requireAuth, logout } from "./auth.js";

const session = requireAuth();
if (session.user.role !== "professor") window.location.href = "student-dashboard.html";

document.getElementById("who").textContent = `${session.user.name} (Professor)`;
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "professor-dashboard.html";
});

const dateSel = document.getElementById("dateSel");
dateSel.value = new Date().toISOString().slice(0, 10);

async function load() {
  const view = document.getElementById("viewSel").value;
  const date = dateSel.value;

  const notice = document.getElementById("notice");
  notice.className = "notice";
  notice.textContent = "Loading...";

  const q = new URLSearchParams({ view, date });
  const data = await apiGet(`/schedule/professor/${session.user.user_id}?${q.toString()}`);

  if (!data.ok) {
    notice.className = "notice error";
    notice.textContent = data.message || "Failed to load.";
    return;
  }

  notice.className = "notice success";
  notice.textContent = `Loaded ${data.slots.length} slot(s).`;

  const body = document.getElementById("body");
  body.innerHTML = "";

  if (!data.slots.length) {
    body.innerHTML = `<tr><td colspan="4"><small>No slots in this range.</small></td></tr>`;
    return;
  }

  data.slots.forEach(s => {
    const bookedBadge = s.booked ? `<span class="badge posted">Booked</span>` : `<span class="badge">Open</span>`;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.course_code}</td>
      <td>${fmtDT(s.start_time)} → ${fmtDT(s.end_time)}</td>
      <td><span class="badge ${s.status}">${s.status}</span></td>
      <td>${bookedBadge}</td>
    `;
    body.appendChild(tr);
  });
}

document.getElementById("loadBtn").addEventListener("click", load);
await load();