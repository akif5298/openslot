import { apiGet, apiPost } from "./api.js";
import { requireAuth, logout } from "./auth.js";

const session = requireAuth();
if (session.user.role !== "professor") window.location.href = "student-dashboard.html";

document.getElementById("who").textContent = `${session.user.name} (Professor)`;
document.getElementById("logoutBtn").addEventListener("click", logout);

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "professor-dashboard.html";
});

async function loadCourses() {
  const data = await apiGet("/courses");
  const sel = document.getElementById("courseSel");
  sel.innerHTML = "";
  data.courses.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.course_id;
    opt.textContent = `${c.course_code} — ${c.course_name} (${c.term})`;
    sel.appendChild(opt);
  });
}

document.getElementById("createForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const course_id = Number(document.getElementById("courseSel").value);
  const start_time = document.getElementById("startDT").value;
  const end_time = document.getElementById("endDT").value;
  const mode = document.getElementById("modeSel").value;
  const location_or_link = document.getElementById("loc").value.trim();
  const visibility = document.getElementById("visSel").value;
  const status = document.getElementById("statusSel").value;

  const box = document.getElementById("notice");
  box.className = "notice";
  box.textContent = "Creating...";

  const res = await apiPost("/slots", {
    professor_id: session.user.user_id,
    course_id,
    start_time,
    end_time,
    mode,
    location_or_link,
    visibility,
    status
  });

  if (!res.ok) {
    box.className = "notice error";
    box.textContent = res.message || "Create failed.";
    return;
  }

  box.className = "notice success";
  box.textContent = `Created slot #${res.slot.slot_id} (${res.slot.status}).`;
});

await loadCourses();