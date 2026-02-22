const API_BASE = "http://localhost:3001/api";
const SESSION_KEY = "openslot_session";

export async function apiRequest(path, options = {}) {
  const requestOptions = { ...options };
  requestOptions.method = requestOptions.method || "GET";
  requestOptions.headers = {
    "Content-Type": "application/json",
    ...(requestOptions.headers || {})
  };

  if (requestOptions.body != null && typeof requestOptions.body !== "string") {
    requestOptions.body = JSON.stringify(requestOptions.body);
  }

  const response = await fetch(`${API_BASE}${path}`, requestOptions);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.ok === false) {
    const message = payload?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

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

export function requireSession(expectedRole) {
  const session = getSession();
  if (!session?.user) {
    window.location.href = "login.html";
    return null;
  }

  if (expectedRole && session.user.role !== expectedRole) {
    window.location.href = session.user.role === "professor" ? "professor-dashboard.html" : "student-dashboard.html";
    return null;
  }

  return session;
}

export function toDisplayDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function toDateInputValue(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function toDateTimeLocalPair(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { date: "", time: "" };
  }
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
}

export function buildLocalDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;
  return `${dateValue}T${timeValue}:00`;
}

export function setMessage(node, message, tone = "info") {
  if (!node) return;
  node.textContent = message || "";
  node.className = `message message-${tone}`;
}

export function escapeHtml(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function logout() {
  clearSession();
  window.location.href = "login.html";
}

export function attachLogoutButtons() {
  document.querySelectorAll("[data-logout]").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      logout();
    });
  });
}
