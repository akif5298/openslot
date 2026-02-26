const API_BASE = "http://localhost:3001/api";
const SESSION_KEY = "openslot_session";

async function request(method, path, body) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body == null ? undefined : JSON.stringify(body)
    });

    const payload = await response.json().catch(() => ({}));
    if (typeof payload.ok !== "boolean") payload.ok = response.ok;
    if (!payload.ok && !payload.message) payload.message = `Request failed (${response.status})`;
    return payload;
  } catch {
    return {
      ok: false,
      message: "Unable to reach API. Start server: npm run start (in /server)."
    };
  }
}

export const apiGet = path => request("GET", path);
export const apiPost = (path, body) => request("POST", path, body);
export const apiPatch = (path, body) => request("PATCH", path, body);

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "OS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function fmtDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

export function fmtTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function fmtDT(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function fmtRange(start, end) {
  return `${fmtTime(start)} - ${fmtTime(end)}`;
}

export function setMessage(node, text, tone = "info") {
  if (!node) return;
  node.textContent = text || "";

  if (node.classList.contains("notice") || node.id === "notice") {
    node.className = "notice";
    if (tone === "error") node.classList.add("error");
    if (tone === "success") node.classList.add("success");
    return;
  }

  node.className = `message message-${tone}`;
}

export function ymd(date = new Date()) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function toDateInputValue(dateLike) {
  const date = new Date(dateLike);
  return Number.isNaN(date.getTime()) ? "" : ymd(date);
}

export function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
