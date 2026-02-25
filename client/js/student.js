import { apiGet, apiPost, fmtDT } from "./api.js";
import { requireAuth, logout } from "./auth.js";

const session = requireAuth();
if (session.user.role !== "student") window.location.href = "professor-dashboard.html";

document.getElementById("who").textContent = `${session.user.name} (Student)`;
document.getElementById("logoutBtn").addEventListener("click", logout);

async function loadCourses() {
  const data = await apiGet("/courses");
  const sel = document.getElementById("courseSel");
  sel.innerHTML = `<option value="">All courses</option>`;
  data.courses.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.course_id;
    opt.textContent = `${c.course_code} — ${c.course_name} (${c.term})`;
    sel.appendChild(opt);
  });
}

function renderSlots(slots) {
  const tbody = document.getElementById("slotsBody");
  tbody.innerHTML = "";
  if (!slots.length) {
    tbody.innerHTML = `<tr><td colspan="6"><small>No available slots match your filters.</small></td></tr>`;
    return;
  }

  slots.forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.course_code}</td>
      <td>${s.professor_name}</td>
      <td>${fmtDT(s.start_time)}</td>
      <td>${fmtDT(s.end_time)}</td>
      <td><span class="badge ${s.status}">${s.status}</span> <span class="badge">${s.mode}</span></td>
      <td><button class="btn ok" data-id="${s.slot_id}">Book</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("button[data-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const slotId = Number(btn.dataset.id);
      const notes = prompt("Optional notes for professor (or leave blank):") ?? "";
      const res = await apiPost("/appointments", { slot_id: slotId, student_id: session.user.user_id, notes });
      const box = document.getElementById("notice");

      if (!res.ok) {
        box.className = "notice error";
        box.textContent = res.message || "Booking failed.";
      } else {
        box.className = "notice success";
        box.textContent = "Booked! You can view it in My Bookings.";
        await refresh();
      }
    });
  });
}

async function refresh() {
  const courseId = document.getElementById("courseSel").value;
  const date = document.getElementById("dateSel").value; // YYYY-MM-DD
  const q = new URLSearchParams();
  if (courseId) q.set("courseId", courseId);
  if (date) q.set("date", date);

  const data = await apiGet(`/slots?${q.toString()}`);
  renderSlots(data.slots || []);
}

document.getElementById("filtersBtn").addEventListener("click", refresh);
document.getElementById("bookingsBtn").addEventListener("click", () => {
  window.location.href = "my-bookings.html";
});

await loadCourses();
await refresh();